import { db } from "../prisma/db.js";

export const createInterviewSession = async (req, res) => {
  try {
    const projectId = Number(req.body.projectId);
    const { candidateId, problemTitle, problemDescription, durationMinutes } =
      req.body;

    if (!projectId || !candidateId || !problemTitle || !problemDescription) {
      return res.status(400).json({
        message: "Project, candidate, problem title and description are required",
      });
    }

    const session = await db.orm.public.InterviewSession.create({
      projectId,
      interviewerId: req.user.userId,
      candidateId: Number(candidateId),
      problemTitle,
      problemDescription,
      durationMinutes: Number(durationMinutes) || 30,
      status: "WAITING",
    });

    return res.status(201).json({
      session,
    });
  } catch (error) {
    console.error("Create interview session error:", error?.message);

    return res.status(500).json({
      message: error?.message || "Failed to create interview session",
    });
  }
};

export const getInterviewSession = async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);

    const session = await db.orm.public.InterviewSession
      .where({ id: sessionId })
      .first();

    if (!session) {
      return res.status(404).json({
        message: "Interview session not found",
      });
    }

    return res.status(200).json({
      session,
    });
  } catch (error) {
    console.error("Get interview session error:", error?.message);

    return res.status(500).json({
      message: error?.message || "Failed to fetch interview session",
    });
  }
};

export const updateInterviewStatus = async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    const { status } = req.body;

    const allowedStatuses = ["WAITING", "ACTIVE", "COMPLETED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid interview status",
      });
    }

    const session = await db.orm.public.InterviewSession
      .where({ id: sessionId })
      .update({
        status,
      });

    return res.status(200).json({
      session,
    });
  } catch (error) {
    console.error("Update interview status error:", error?.message);

    return res.status(500).json({
      message: error?.message || "Failed to update interview status",
    });
  }
};


export const createInterviewEvaluation = async (req, res) => {
  try {
    const interviewId = Number(req.params.sessionId);

    const {
      problemSolving,
      codeQuality,
      communication,
      feedback,
    } = req.body;

    if (!interviewId) {
      return res.status(400).json({
        message: "Invalid interview ID",
      });
    }

    const evaluation =
      await db.orm.public.InterviewEvaluation.create({
        interviewId,
        problemSolving: Number(problemSolving),
        codeQuality: Number(codeQuality),
        communication: Number(communication),
        feedback: feedback?.trim() || null,
      });

    return res.status(201).json({
      evaluation,
    });
  } catch (error) {
    console.error(
      "Create interview evaluation error:",
      error?.message
    );

    return res.status(500).json({
      message:
        error?.message || "Failed to save evaluation",
    });
  }
};

export const getInterviewEvaluation = async (req, res) => {
  try {
    const interviewId = Number(req.params.sessionId);

    if (!interviewId) {
      return res.status(400).json({
        message: "Invalid interview ID",
      });
    }

    const evaluation =
      await db.orm.public.InterviewEvaluation
        .where({ interviewId })
        .first();

    if (!evaluation) {
      return res.status(404).json({
        message: "Evaluation not found",
      });
    }

    return res.status(200).json({
      evaluation,
    });
  } catch (error) {
    console.error(
      "Get interview evaluation error:",
      error?.message
    );

    return res.status(500).json({
      message:
        error?.message || "Failed to fetch evaluation",
    });
  }
};