import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const getProjectFiles = async (projectId, token) => {
  const response = await axios.get(
    `${API_URL}/projects/${projectId}/files`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.files;
};

export const createProjectFile = async (
  projectId,
  fileData,
  token
) => {
  const response = await axios.post(
    `${API_URL}/projects/${projectId}/files`,
    fileData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.file;
};

export const updateProjectFile = async (
  projectId,
  fileId,
  fileData,
  token
) => {
  const response = await axios.put(
    `${API_URL}/projects/${projectId}/files/${fileId}`,
    fileData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.file;
};