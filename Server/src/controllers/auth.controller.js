import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../prisma/db.js";

export const register = async (req, res) => {
  try {
    const { email, username, name, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        message: "Email, username and password are required",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.orm.public.User.create({
      email,
      username,
      name,
      passwordHash,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await db.orm.public.User
      .where({ email })
      .first();

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};