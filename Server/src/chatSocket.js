import { WebSocketServer } from "ws";

const chatWss = new WebSocketServer({
  port: 1235,
});

const rooms = new Map();

chatWss.on("connection", (socket, request) => {
  const url = new URL(request.url, "http://localhost:1235");
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    socket.close();
    return;
  }

  if (!rooms.has(projectId)) {
    rooms.set(projectId, new Set());
  }

  const room = rooms.get(projectId);
  room.add(socket);

  console.log(`Chat client connected to project ${projectId}`);

  socket.on("message", (data) => {
    for (const client of room) {
      if (client !== socket && client.readyState === 1) {
        client.send(data.toString());
      }
    }
  });

  socket.on("close", () => {
    room.delete(socket);

    if (room.size === 0) {
      rooms.delete(projectId);
    }

    console.log(`Chat client disconnected from project ${projectId}`);
  });
});

console.log("Chat WebSocket running on ws://localhost:1235");