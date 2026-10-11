import { db } from "../prisma/db.js";

export const createProjectFile = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const { name, path, language, content } = req.body;

    if (!projectId) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!name || !path) {
      return res.status(400).json({
        message: "File name and path are required",
      });
    }

    const project = await db.orm.public.Project
      .where({ id: projectId })
      .first();

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const file = await db.orm.public.ProjectFile.create({
      projectId,
      name,
      path,
      language,
      content: content || "",
    });

    return res.status(201).json({
      message: "Project file created successfully",
      file,
    });
  } catch (error) {
    console.error("Create project file error:", error);

    return res.status(500).json({
      message: "Failed to create project file",
    });
  }
};

export const getProjectFiles = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!projectId) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const project = await db.orm.public.Project
      .where({ id: projectId })
      .first();

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const files = await db.orm.public.ProjectFile
      .where({ projectId })
      .all();

    return res.status(200).json({
      files,
    });
  } catch (error) {
    console.error("Get project files error:", error);

    return res.status(500).json({
      message: "Failed to fetch project files",
    });
  }
};

export const getProjectFileById = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const fileId = Number(req.params.fileId);

    if (!projectId || !fileId) {
      return res.status(400).json({
        message: "Invalid project ID or file ID",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const file = await db.orm.public.ProjectFile
      .where({
        id: fileId,
        projectId,
      })
      .first();

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    return res.status(200).json({
      file,
    });
  } catch (error) {
    console.error("Get project file error:", error);

    return res.status(500).json({
      message: "Failed to fetch project file",
    });
  }
};

export const updateProjectFile = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const fileId = Number(req.params.fileId);

    const { name, path, language, content } = req.body;

    if (!projectId || !fileId) {
      return res.status(400).json({
        message: "Invalid project ID or file ID",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const file = await db.orm.public.ProjectFile
      .where({
        id: fileId,
        projectId,
      })
      .first();

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }
    const updatedFile = await db.orm.public.ProjectFile
      .where({ id: fileId })
      .update({
        name,
        path,
        language,
        content,
      });

    return res.status(200).json({
      message: "Project file updated successfully",
      file: updatedFile,
    });
  } catch (error) {
    console.error("Update project file error:", error);

    return res.status(500).json({
      message: "Failed to update project file",
    });
  }
};

export const deleteProjectFile = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const fileId = Number(req.params.fileId);

    if (!projectId || !fileId) {
      return res.status(400).json({
        message: "Invalid project ID or file ID",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const file = await db.orm.public.ProjectFile
      .where({
        id: fileId,
        projectId,
      })
      .first();

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    await db.orm.public.ProjectFile
      .where({ id: fileId })
      .delete();

    return res.status(200).json({
      message: "Project file deleted successfully",
    });
  } catch (error) {
    console.error("Delete project file error:", error);

    return res.status(500).json({
      message: "Failed to delete project file",
    });
  }
};