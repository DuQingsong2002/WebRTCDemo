import WebSocket from "ws";

export interface SocketRecordData {
    username: string,
    ws: WebSocket
    data?: string,
}