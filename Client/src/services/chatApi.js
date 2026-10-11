import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const getProjectMessages = async (projectId, token) => {
  const response = await axios.get(
    `${API_URL}/projects/${projectId}/chat`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.messages;
};

export const sendProjectMessage = async (
  projectId,
  message,
  token
) => {
  const response = await axios.post(
    `${API_URL}/projects/${projectId}/chat`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.message;
};