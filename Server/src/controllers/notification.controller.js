import { db } from "../prisma/db.js";
import pg from "pg";

const { Client } = pg;

export const getMyNotifications = async (req, res) => {
  try {
    const allNotifications =
      await db.orm.public.Notification.all();

    const userId = Number(req.user.userId);

    const notifications = allNotifications
      .filter(
        (notification) =>
          Number(notification.userId) === userId
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

    return res.status(200).json({
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
};

export const markNotificationRead = async (req, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const notificationId = Number(req.params.id);
    const userId = Number(req.user.userId);

    await client.connect();

    const result = await client.query(
      `
      UPDATE notification
      SET "isRead" = true
      WHERE id = $1
        AND "userId" = $2
      RETURNING *
      `,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("MARK READ ERROR:", error);

    return res.status(500).json({
      message: "Failed to update notification",
      error: error.message,
    });
  } finally {
    await client.end().catch(() => {});
  }
};