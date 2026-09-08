import { createHash } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';

export type RealtimeSocketMessage =
  | { type: 'text'; data: string }
  | { type: 'binary'; data: Uint8Array };

const protocolName = 'tolk-og-laer.realtime.v1';
const websocketGuid = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

type HeaderValue = string | string[] | undefined;

const headerValues = (value: HeaderValue): string[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

const singleHeader = (value: HeaderValue): string | null => {
  const values = headerValues(value);
  return values.length === 1 ? values[0]! : null;
};

export const extractRealtimeAccessToken = (request: IncomingMessage): string | null => {
  const protocols = headerValues(request.headers['sec-websocket-protocol'])
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  if (!protocols.includes(protocolName)) return null;
  const auth = protocols.find((value) => value.startsWith('auth.'));
  return auth && auth.length > 5 ? auth.slice(5) : null;
};

const frame = (opcode: number, payload: Uint8Array): Buffer => {
  const size = payload.byteLength;
  const header = size < 126 ? 2 : size <= 0xffff ? 4 : 10;
  const output = Buffer.allocUnsafe(header + size);
  output[0] = 0x80 | opcode;
  if (size < 126) output[1] = size;
  else if (size <= 0xffff) {
    output[1] = 126;
    output.writeUInt16BE(size, 2);
  } else {
    output[1] = 127;
    output.writeBigUInt64BE(BigInt(size), 2);
  }
  Buffer.from(payload).copy(output, header);
  return output;
};

const validCloseCode = (code: number): boolean =>
  code >= 1000 && code <= 4999 && ![1004, 1005, 1006, 1015].includes(code);

export class WebSocketConnection {
  private buffer = Buffer.alloc(0);
  private closed = false;
  private readonly messageHandlers = new Set<(message: RealtimeSocketMessage) => void>();
  private readonly closeHandlers = new Set<() => void>();
  private readonly activityHandlers = new Set<() => void>();

  constructor(
    private readonly socket: Duplex,
    head: Buffer,
    private readonly maxPayloadBytes = 512 * 1024,
  ) {
    socket.on('data', (chunk: Buffer) => this.feed(chunk));
    socket.once('close', () => {
      this.closed = true;
      for (const handler of this.closeHandlers) handler();
    });
    socket.once('error', () => this.close(1011, 'transport_error'));
    if (head.byteLength) this.feed(head);
  }

  onMessage(handler: (message: RealtimeSocketMessage) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onClose(handler: () => void) {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  onActivity(handler: () => void) {
    this.activityHandlers.add(handler);
    return () => this.activityHandlers.delete(handler);
  }

  sendText(value: string) {
    if (!this.closed) this.socket.write(frame(0x1, Buffer.from(value, 'utf8')));
  }

  close(code = 1000, reason = '') {
    if (this.closed) return;
    this.closed = true;
    const reasonBytes = Buffer.from(reason, 'utf8').subarray(0, 123);
    const payload = Buffer.allocUnsafe(2 + reasonBytes.byteLength);
    payload.writeUInt16BE(code, 0);
    reasonBytes.copy(payload, 2);
    this.socket.write(frame(0x8, payload));
    this.socket.end();
  }

  private replyClose(payload: Buffer) {
    if (this.closed) return;
    this.closed = true;
    this.socket.write(frame(0x8, payload));
    this.socket.end();
  }

  private fail(code: number, reason: string) {
    this.close(code, reason);
  }

  private feed(chunk: Buffer) {
    if (this.closed) return;
    this.buffer = this.buffer.byteLength ? Buffer.concat([this.buffer, chunk]) : Buffer.from(chunk);
    while (this.parseNext()) {
      if (this.closed) break;
    }
  }

  private parseNext(): boolean {
    if (this.buffer.byteLength < 2) return false;
    const first = this.buffer[0]!;
    const second = this.buffer[1]!;
    const fin = (first & 0x80) !== 0;
    const rsv = first & 0x70;
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let payloadLength = second & 0x7f;
    let offset = 2;

    if (!fin || rsv !== 0 || !masked) {
      this.fail(1002, 'protocol_error');
      return false;
    }
    if (payloadLength === 126) {
      if (this.buffer.byteLength < 4) return false;
      payloadLength = this.buffer.readUInt16BE(2);
      offset = 4;
    } else if (payloadLength === 127) {
      if (this.buffer.byteLength < 10) return false;
      const big = this.buffer.readBigUInt64BE(2);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) {
        this.fail(1009, 'message_too_large');
        return false;
      }
      payloadLength = Number(big);
      offset = 10;
    }
    const isControl = opcode >= 0x8;
    if ((isControl && payloadLength > 125) || payloadLength > this.maxPayloadBytes) {
      this.fail(1009, 'message_too_large');
      return false;
    }
    if (this.buffer.byteLength < offset + 4 + payloadLength) return false;
    const mask = this.buffer.subarray(offset, offset + 4);
    offset += 4;
    const payload = Buffer.from(this.buffer.subarray(offset, offset + payloadLength));
    this.buffer = this.buffer.subarray(offset + payloadLength);
    for (let i = 0; i < payload.byteLength; i++) payload[i] = payload[i]! ^ mask[i & 3]!;

    this.emitActivity();

    if (opcode === 0x8) {
      if (payload.byteLength === 1) {
        this.fail(1002, 'invalid_close_payload');
        return false;
      }
      if (payload.byteLength >= 2) {
        const code = payload.readUInt16BE(0);
        if (!validCloseCode(code)) {
          this.fail(1002, 'invalid_close_code');
          return false;
        }
        try {
          new TextDecoder('utf-8', { fatal: true }).decode(payload.subarray(2));
        } catch {
          this.fail(1007, 'invalid_close_reason');
          return false;
        }
      }
      this.replyClose(payload);
      return true;
    }
    if (opcode === 0x9) {
      this.socket.write(frame(0xa, payload));
      return true;
    }
    if (opcode === 0xa) return true;
    if (opcode === 0x1) {
      try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(payload);
        this.emit({ type: 'text', data: text });
      } catch {
        this.fail(1007, 'invalid_utf8');
      }
      return true;
    }
    if (opcode === 0x2) {
      this.emit({ type: 'binary', data: new Uint8Array(payload) });
      return true;
    }
    this.fail(1002, 'unsupported_opcode');
    return false;
  }

  private emit(message: RealtimeSocketMessage) {
    for (const handler of this.messageHandlers) handler(message);
  }

  private emitActivity() {
    for (const handler of this.activityHandlers) handler();
  }
}

const rejectUpgrade = (socket: Duplex, status: 400 | 401 | 426, message: string) => {
  const statusText = status === 401 ? 'Unauthorized' : status === 426 ? 'Upgrade Required' : 'Bad Request';
  const websocketVersionHeader = status === 426 ? 'Sec-WebSocket-Version: 13\r\n' : '';
  socket.end(
    `HTTP/1.1 ${status} ${statusText}\r\nConnection: close\r\n${websocketVersionHeader}Content-Type: text/plain; charset=utf-8\r\nContent-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`,
  );
};

export const acceptWebSocket = (
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer,
  maxPayloadBytes?: number,
): WebSocketConnection | null => {
  const key = singleHeader(request.headers['sec-websocket-key']);
  const versions = headerValues(request.headers['sec-websocket-version'])
    .flatMap((value) => value.split(','))
    .map((value) => value.trim());
  const token = extractRealtimeAccessToken(request);
  if (!versions.includes('13')) {
    rejectUpgrade(socket, 426, 'WebSocket version 13 is required');
    return null;
  }
  if (!key || !token) {
    rejectUpgrade(socket, token ? 400 : 401, token ? 'Invalid WebSocket handshake' : 'Authentication is required');
    return null;
  }
  const decoded = Buffer.from(key, 'base64');
  if (decoded.byteLength !== 16) {
    rejectUpgrade(socket, 400, 'Invalid WebSocket key');
    return null;
  }
  const accept = createHash('sha1').update(key + websocketGuid).digest('base64');
  socket.write(
    `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\nSec-WebSocket-Protocol: ${protocolName}\r\n\r\n`,
  );
  return new WebSocketConnection(socket, head, maxPayloadBytes);
};
