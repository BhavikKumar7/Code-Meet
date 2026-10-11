import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const createInterview = async (data, token) => {
  const response = await axios.post(
    `${API_URL}/interviews`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.session;
};

export const getInterview = async (sessionId, token) => {
  const response = await axios.get(
    `${API_URL}/interviews/${sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.session;
};

export const updateInterviewStatus = async (
  sessionId,
  status,
  token
) => {
  const response = await axios.put(
    `${API_URL}/interviews/${sessionId}/status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.session;
};

export const createInterviewEvaluation = async (
  sessionId,
  evaluation,
  token
) => {
  const response = await axios.post(
    `${API_URL}/interviews/${sessionId}/evaluation`,
    evaluation,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.evaluation;
};

export const getInterviewEvaluation = async (sessionId, token) => {
  const response = await axios.get(
    `${API_URL}/interviews/${sessionId}/evaluation`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.evaluation;
};