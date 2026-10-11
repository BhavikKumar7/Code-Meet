import axios from "axios";

const API_URL = "http://localhost:5000/api";

const authConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Get members of a project.
export const getProjectMembers = async (projectId, token) => {
  const response = await axios.get(
    `${API_URL}/projects/${projectId}/members`,
    authConfig(token)
  );

  return response.data.members;
};

// Invite a user to a project by username.
export const inviteProjectMember = async (
  projectId,
  username,
  token
) => {
  const response = await axios.post(
    `${API_URL}/projects/${projectId}/invitations`,
    { username },
    authConfig(token)
  );

  return response.data;
};

// Get invitations received by the authenticated user.
export const getMyInvitations = async (token) => {
  const response = await axios.get(
    `${API_URL}/invitations`,
    authConfig(token)
  );

  return response.data.invitations;
};

// Accept or reject an invitation.
export const respondToInvitation = async (
  invitationId,
  action,
  token
) => {
  if (!["ACCEPT", "REJECT"].includes(action)) {
    throw new Error('Action must be "ACCEPT" or "REJECT".');
  }

  const response = await axios.put(
    `${API_URL}/invitations/${invitationId}/respond`,
    { action },
    authConfig(token)
  );

  return response.data;
};