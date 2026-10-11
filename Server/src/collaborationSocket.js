import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";

const wss = new WebSocketServer({
  port: 1234,
});

wss.on("connection", (socket, request) => {
  setupWSConnection(socket, request);
});

console.log("Yjs WebSocket server running on ws://localhost:1234");
