import "dotenv/config";
import express from "express";
import cors from "cors";

// Start all three WebSocket servers automatically.
import "./collaborationSocket.js";
import "./chatSocket.js";
import "./notificationSocket.js";

import codeRoutes from "./routes/code.routes.js";
import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import projectRoutes from "./routes/project.routes.js";
import fileRoutes from "./routes/file.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/code", codeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api", projectRoutes);
app.use("/api", fileRoutes);
app.use("/api", chatRoutes);
app.use("/api", interviewRoutes);
app.use("/api", notificationRoutes);
app.use("/api", invitationRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Code Meet API is running 🚀",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
