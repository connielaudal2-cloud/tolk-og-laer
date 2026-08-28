import AVFoundation
import ExpoModulesCore

public final class TolkNativeAudioModule: Module {
  private let engine = AVAudioEngine()
  private let queue = DispatchQueue(label: "no.tolkoglaer.audio.capture", qos: .userInteractive)
  private var sequence: UInt32 = 0
  private var observingRoute = false

  public func definition() -> ModuleDefinition {
    Name("TolkNativeAudio")
    Events("onAudioFrame", "onAudioRouteChanged")

    OnStartObserving {
      guard !self.observingRoute else { return }
      NotificationCenter.default.addObserver(self, selector: #selector(self.routeChanged), name: AVAudioSession.routeChangeNotification, object: nil)
      self.observingRoute = true
    }
    OnStopObserving {
      NotificationCenter.default.removeObserver(self, name: AVAudioSession.routeChangeNotification, object: nil)
      self.observingRoute = false
    }

    AsyncFunction("requestMicrophonePermission") { () async -> Bool in
      await withCheckedContinuation { continuation in
        AVAudioSession.sharedInstance().requestRecordPermission { granted in continuation.resume(returning: granted) }
      }
    }

    Function("getAudioRoute") { self.routePayload() }

    AsyncFunction("startCapture") { (options: CaptureOptions) in
      try self.start(options: options)
    }

    AsyncFunction("stopCapture") {
      self.stop()
    }

    OnAppEntersBackground { self.stop() }
  }

  private func start(options: CaptureOptions) throws {
    guard !engine.isRunning else { throw AudioError.alreadyCapturing }
    guard AVAudioSession.sharedInstance().recordPermission == .granted else { throw AudioError.permissionDenied }

    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetoothHFP, .defaultToSpeaker])
    try session.setPreferredSampleRate(Double(options.sampleRate))
    try session.setPreferredIOBufferDuration(Double(options.frameDurationMs) / 1000.0)
    try session.setActive(true, options: .notifyOthersOnDeactivation)

    let input = engine.inputNode
    let inputFormat = input.inputFormat(forBus: 0)
    guard let target = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: Double(options.sampleRate), channels: 1, interleaved: true),
          let converter = AVAudioConverter(from: inputFormat, to: target) else { throw AudioError.unsupportedFormat }
    let frames = AVAudioFrameCount(Double(options.sampleRate) * Double(options.frameDurationMs) / 1000.0)
    sequence = 0
    input.installTap(onBus: 0, bufferSize: frames, format: inputFormat) { [weak self] buffer, time in
      self?.queue.async { self?.emit(buffer: buffer, time: time, converter: converter, target: target, capacity: frames) }
    }
    engine.prepare()
    do { try engine.start() } catch { input.removeTap(onBus: 0); throw error }
  }

  private func emit(buffer: AVAudioPCMBuffer, time: AVAudioTime, converter: AVAudioConverter, target: AVAudioFormat, capacity: AVAudioFrameCount) {
    guard let output = AVAudioPCMBuffer(pcmFormat: target, frameCapacity: capacity) else { return }
    var consumed = false
    var error: NSError?
    converter.convert(to: output, error: &error) { _, status in
      if consumed { status.pointee = .noDataNow; return nil }
      consumed = true; status.pointee = .haveData; return buffer
    }
    guard error == nil, output.frameLength > 0, let channel = output.int16ChannelData?[0] else { return }
    let data = Data(bytes: channel, count: Int(output.frameLength) * MemoryLayout<Int16>.size)
    var sum = 0.0
    for index in 0..<Int(output.frameLength) { let value = Double(channel[index]) / 32768.0; sum += value * value }
    let rms = sqrt(sum / Double(output.frameLength))
    let dbfs = rms > 0 ? 20.0 * log10(rms) : -160.0
    sendEvent("onAudioFrame", ["sequence": sequence, "timestampMs": AVAudioTime.seconds(forHostTime: time.hostTime) * 1000.0, "pcmBase64": data.base64EncodedString(), "levelDbfs": dbfs])
    sequence &+= 1
  }

  private func stop() {
    guard engine.isRunning else { return }
    engine.inputNode.removeTap(onBus: 0)
    engine.stop()
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }

  @objc private func routeChanged() { sendEvent("onAudioRouteChanged", routePayload()) }
  private func routePayload() -> [String: Any] {
    let route = AVAudioSession.sharedInstance().currentRoute
    let outputs = route.outputs.map(\.portType.rawValue)
    let bluetooth = route.inputs.contains { [.bluetoothHFP, .bluetoothLE].contains($0.portType) } || route.outputs.contains { [.bluetoothA2DP, .bluetoothLE, .bluetoothHFP].contains($0.portType) }
    return ["input": route.inputs.first?.portType.rawValue ?? "none", "outputs": outputs, "bluetooth": bluetooth]
  }
}

private struct CaptureOptions: Record { @Field var sampleRate: Int = 16000; @Field var frameDurationMs: Int = 20 }
private enum AudioError: Error { case alreadyCapturing, permissionDenied, unsupportedFormat }
