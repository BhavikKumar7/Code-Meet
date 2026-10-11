import { db } from "../prisma/db.js";

export const getProjectMessages = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!projectId) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const messages = await db.orm.public.ChatMessage
      .where({ projectId })
      .all();

    const messagesWithUsers = await Promise.all(
      messages.map(async (message) => {
        const user = await db.orm.public.User
          .where({ id: Number(message.userId) })
          .first();

        return {
          ...message,
          user: user
            ? {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
              }
            : null,
        };
      })
    );

    return res.status(200).json({
      messages: messagesWithUsers,
    });
  } catch (error) {
    console.error("Get project messages error:", error);

    return res.status(500).json({
      message: error?.message || "Failed to fetch messages",
    });
  }
};

export const createProjectMessage = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const { message } = req.body;

    if (!projectId) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const newMessage = await db.orm.public.ChatMessage.create({
      projectId,
      userId: req.user.userId,
      message: message.trim(),
    });

    const user = await db.orm.public.User
      .where({ id: Number(newMessage.userId) })
      .first();

    return res.status(201).json({
      message: {
        ...newMessage,
        user: user
          ? {
              id: user.id,
              username: user.username,
              name: user.name,
              email: user.email,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Create project message error:", error);

    return res.status(500).json({
      message: error?.message || "Failed to create message",
    });
  }
};