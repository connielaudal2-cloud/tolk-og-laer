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
>;
export type RealtimeTransportOptions = {
  url: string;
  accessToken: string;
  createSocket?: (url: string, protocols: string[]) => SocketLike;
  onEvent: (event: ServerControlEvent) => void;
  onStatus?: (status: RealtimeTransportStatus) => void;
  maxReconnectAttempts?: number;
};

export class RealtimeTransport {
  private socket?: SocketLike;
  private lastServerSequence = -1;
  private reconnectAttempts = 0;
  private intentionallyClosed = false;
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
    };
    socket.onmessage = (message) => this.receive(message.data);
    socket.onerror = () => this.setStatus('reconnecting');
    socket.onclose = () => {
      if (!this.intentionallyClosed) this.scheduleReconnect();
    };
    this.socket = socket;
  }

  sendControl(event: ClientControlEvent) {
    this.assertConnected();
    this.socket!.send(JSON.stringify(event));
  }
  sendAudio(sequence: number, pcm: Uint8Array) {
    this.assertConnected();
    this.socket!.send(encodeAudioFrame(sequence, pcm));
  }
  close() {
    this.intentionallyClosed = true;
    this.socket?.close(1000, 'client_closed');
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
  private setStatus(status: RealtimeTransportStatus) {
    this.options.onStatus?.(status);
  }
}
