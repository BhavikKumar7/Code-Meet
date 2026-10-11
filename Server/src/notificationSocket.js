import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";

const PORT = 1236;

const notificationWss = new WebSocketServer({ port: PORT });

// Map: authenticated user ID -> their connected WebSocket clients
const userSockets = new Map();

notificationWss.on("connection", (socket) => {
  let authenticatedUserId = null;

  socket.on("message", (rawMessage) => {
    let message;

    try {
      message = JSON.parse(rawMessage.toString());
    } catch {
      socket.close(1008, "Invalid message");
      return;
    }

    // Authenticate the connection using the existing JWT.
    if (!authenticatedUserId) {
      if (message.type !== "AUTH" || !message.token) {
        socket.close(1008, "Authentication required");
        return;
      }

      try {
        const decoded = jwt.verify(
          message.token,
          process.env.JWT_SECRET
        );

        const userId = Number(decoded.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
          socket.close(1008, "Invalid user");
          return;
        }

        authenticatedUserId = userId;

        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }

        userSockets.get(userId).add(socket);

        socket.send(
          JSON.stringify({ type: "AUTHENTICATED" })
        );

        console.log(`Notification WebSocket connected: user ${userId}`);
      } catch {
        socket.close(1008, "Invalid or expired token");
      }

      return;
    }

    // Clients cannot use this socket to send notifications to other users.
  });

  socket.on("close", () => {
    if (authenticatedUserId === null) return;

    const sockets = userSockets.get(authenticatedUserId);

    if (sockets) {
      sockets.delete(socket);

      if (sockets.size === 0) {
        userSockets.delete(authenticatedUserId);
      }
    }

    console.log(
      `Notification WebSocket disconnected: user ${authenticatedUserId}`
    );
  });

  socket.on("error", (error) => {
    console.error("Notification WebSocket error:", error.message);
  });
});

// Call this function after saving a notification in the database.
export const broadcastNotification = (userId, notification) => {
  const sockets = userSockets.get(Number(userId));

  if (!sockets || !notification) return;

  const payload = JSON.stringify({
    type: "NOTIFICATION",
    notification,
  });

  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
};

console.log(`Notification WebSocket running on port ${PORT}`);
