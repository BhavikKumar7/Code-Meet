import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { executeJava } from "../services/codeExecutor.service.js";

const router = Router();

router.post("/run", authenticate, async (req, res) => {
  try {
const { code, language, fileName, stdin } = req.body;
console.log("STDIN RECEIVED:", JSON.stringify(stdin));
    if (!code) {
      return res.status(400).json({
        message: "Code is required",
      });
    }

    if (!language) {
      return res.status(400).json({
        message: "Language is required",
      });
    }

    if (language !== "java") {
      return res.status(400).json({
        message: "Currently only Java execution is supported",
      });
    }

const result = await executeJava(
  code,
  stdin || "",
  fileName || "Main.java"
);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Code execution error:", error);

    return res.status(500).json({
      output: "",
      error: "Code execution failed",
      executionTime: 0,
    });
  }
});

export default router;