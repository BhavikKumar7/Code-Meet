import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const getMyProjects = async (token) => {
  const response = await axios.get(`${API_URL}/projects`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.projects;
};

export const createProject = async (projectData, token) => {
  const response = await axios.post(
    `${API_URL}/projects`,
    projectData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.project;
};

export const getProjectById = async (projectId, token) => {
  const response = await axios.get(
    `${API_URL}/projects/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.project;
};

export const updateProject = async (projectId, projectData, token) => {
  const response = await axios.put(
    `${API_URL}/projects/${projectId}`,
    projectData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.project;
};

export const deleteProject = async (projectId, token) => {
  const response = await axios.delete(
    `${API_URL}/projects/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};