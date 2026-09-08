import {
  encodeAudioFrame,
  serverControlEvent,
  type ClientControlEvent,
  type ServerControlEvent,
} from '@tolk-og-laer/contracts';

export type RealtimeTransportStatus =
  'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'closed';
type SocketLike = Pick<
  WebSocket,
  'readyState' | 'binaryType' | 'send' | 'close' | 'onopen' | 'onmessage' | 'onerror' | 'onclose'
> & { bufferedAmount?: number };
type ConnectionWaiter = {
  resolve: () => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};
export type RealtimeTransportOptions = {
  url: string;
  accessToken: string;
  createSocket?: (url: string, protocols: string[]) => SocketLike;
  onEvent: (event: ServerControlEvent) => void;
  onStatus?: (status: RealtimeTransportStatus) => void;
  onBackpressure?: (bufferedBytes: number, limitBytes: number) => void;
  maxReconnectAttempts?: number;
  maxBufferedAudioBytes?: number;
};

export class RealtimeTransport {
  private socket?: SocketLike;
  private lastServerSequence = -1;
  private reconnectAttempts = 0;
  private intentionallyClosed = false;
  private readonly connectionWaiters = new Set<ConnectionWaiter>();
  constructor(private readonly options: RealtimeTransportOptions) {}

  connect() {
    if (!this.options.url.startsWith('wss://') && !this.options.url.startsWith('ws://localhost'))
      throw new Error('Realtime URL must use wss:// outside local development');
    this.intentionallyClosed = false;
    this.setStatus(this.reconnectAttempts ? 'reconnecting' : 'connecting');
    const createSocket =
      this.options.createSocket ??
      ((url: string, protocols: string[]) => new WebSocket(url, protocols));
    const socket = createSocket(this.options.url, [
      'tolk-og-laer.realtime.v1',
      `auth.${this.options.accessToken}`,
    ]);
    socket.binaryType = 'arraybuffer';
    socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus('connected');
      this.resolveConnectionWaiters();
    };
    socket.onmessage = (message) => this.receive(message.data);
    socket.onerror = () => this.setStatus('reconnecting');
    socket.onclose = () => {
      if (!this.intentionallyClosed) this.scheduleReconnect();
    };
    this.socket = socket;
  }

  async connectAndWait(timeoutMs = 10_000): Promise<void> {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
      throw new RangeError('Connection timeout must be positive');
    this.connect();
    if (this.socket?.readyState === WebSocket.OPEN) return;
    await new Promise<void>((resolve, reject) => {
      const waiter: ConnectionWaiter = {
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.connectionWaiters.delete(waiter);
          reject(new Error('Realtime connection timed out'));
        }, timeoutMs),
      };
      this.connectionWaiters.add(waiter);
    });
  }

  sendControl(event: ClientControlEvent) {
    this.assertConnected();
    this.socket!.send(JSON.stringify(event));
  }

  sendAudio(sequence: number, pcm: Uint8Array): boolean {
    this.assertConnected();
    const buffered = this.socket!.bufferedAmount ?? 0;
    const limit = this.options.maxBufferedAudioBytes ?? 256 * 1024;
    if (buffered > limit) {
      this.options.onBackpressure?.(buffered, limit);
      return false;
    }
    this.socket!.send(encodeAudioFrame(sequence, pcm));
    return true;
  }

  close() {
    this.intentionallyClosed = true;
    this.socket?.close(1000, 'client_closed');
    this.rejectConnectionWaiters(new Error('Realtime transport closed'));
    this.setStatus('closed');
  }

  private receive(data: unknown) {
    if (typeof data !== 'string') return;
    const event = serverControlEvent.parse(JSON.parse(data));
    if (event.sequence <= this.lastServerSequence) return;
    this.lastServerSequence = event.sequence;
    this.options.onEvent(event);
  }

  private scheduleReconnect() {
    const max = this.options.maxReconnectAttempts ?? 6;
    if (++this.reconnectAttempts > max) {
      this.rejectConnectionWaiters(new Error('Realtime reconnect attempts exhausted'));
      this.setStatus('disconnected');
      return;
    }
    this.setStatus('reconnecting');
    setTimeout(() => this.connect(), Math.min(15_000, 500 * 2 ** (this.reconnectAttempts - 1)));
  }

  private assertConnected() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN)
      throw new Error('Realtime transport is not connected');
  }

  private resolveConnectionWaiters() {
    for (const waiter of this.connectionWaiters) {
      clearTimeout(waiter.timeout);
      waiter.resolve();
    }
    this.connectionWaiters.clear();
  }

  private rejectConnectionWaiters(error: Error) {
    for (const waiter of this.connectionWaiters) {
      clearTimeout(waiter.timeout);
      waiter.reject(error);
    }
    this.connectionWaiters.clear();
  }

  private setStatus(status: RealtimeTransportStatus) {
    this.options.onStatus?.(status);
  }
}
