import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const markNotificationRead = async (notificationId, token) => {
  const response = await axios.put(
    `${API_URL}/notifications/${notificationId}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};