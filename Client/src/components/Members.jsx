import { useCallback, useEffect, useState } from "react";
import {
Users,
Shield,
User,
UserPlus,
Check,
X,
RefreshCw,
} from "lucide-react";
import {
getProjectMembers,
inviteProjectMember,
getMyInvitations,
respondToInvitation,
} from "../services/memberApi";

const panelStyle = {
background: "#111827",
border: "1px solid #1f2937",
borderRadius: "12px",
};

const buttonStyle = {
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
gap: "7px",
padding: "10px 14px",
border: "none",
borderRadius: "7px",
fontSize: "13px",
fontWeight: "600",
cursor: "pointer",
};

const Members = ({ projectId, token }) => {
const [members, setMembers] = useState([]);
const [invitations, setInvitations] = useState([]);
const [username, setUsername] = useState("");
const [loading, setLoading] = useState(true);
const [inviting, setInviting] = useState(false);
const [respondingId, setRespondingId] = useState(null);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

const loadMembers = useCallback(async () => {
if (!projectId || !token) {
setMembers([]);
setLoading(false);
return;
}

try {
  setLoading(true);
  setError("");

  const data = await getProjectMembers(projectId, token);
  setMembers(Array.isArray(data) ? data : []);
} catch (err) {
  console.error("Failed to load project members:", err);
  setError(
    err.response?.data?.message ||
      "Failed to load project members."
  );
} finally {
  setLoading(false);
}

}, [projectId, token]);

const loadInvitations = useCallback(async () => {
if (!token) return;

try {
  const data = await getMyInvitations(token);
  setInvitations(Array.isArray(data) ? data : []);
} catch (err) {
  console.error("Failed to load invitations:", err);
  setError(
    err.response?.data?.message ||
      "Failed to load invitations."
  );
}

}, [token]);

useEffect(() => {
loadMembers();
}, [loadMembers]);

useEffect(() => {
loadInvitations();
}, [loadInvitations]);

const handleInvite = async (event) => {
event.preventDefault();

const trimmedUsername = username.trim();

if (!trimmedUsername || inviting) return;

try {
  setInviting(true);
  setError("");
  setSuccess("");

  await inviteProjectMember(projectId, trimmedUsername, token);

  setUsername("");
  setSuccess(`Invitation sent to @${trimmedUsername}.`);
} catch (err) {
  console.error("Failed to invite project member:", err);
  setError(
    err.response?.data?.message ||
      "Failed to send invitation."
  );
} finally {
  setInviting(false);
}

};

const handleInvitationResponse = async (invitationId, action) => {
if (respondingId !== null) return;

try {
  setRespondingId(invitationId);
  setError("");
  setSuccess("");

  await respondToInvitation(invitationId, action, token);

  setInvitations((current) =>
    current.filter(
      (invitation) =>
        String(invitation.id) !== String(invitationId)
    )
  );

  if (action === "ACCEPT") {
    setSuccess("Invitation accepted. You are now a project member.");

    // Refresh the members list if this is the invited project.
    await loadMembers();
  } else {
    setSuccess("Invitation rejected.");
  }
} catch (err) {
  console.error("Failed to respond to invitation:", err);
  setError(
    err.response?.data?.message ||
      "Failed to respond to invitation."
  );
} finally {
  setRespondingId(null);
}

};

const currentProjectInvitations = invitations.filter(
(invitation) =>
String(invitation.projectId) === String(projectId)
);

return (
<div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
<div style={{ marginBottom: "28px" }}>
<div
style={{
display: "flex",
alignItems: "center",
gap: "10px",
marginBottom: "8px",
}}
>
<Users size={24} color="#818cf8" />
<h1 style={{ margin: 0, fontSize: "24px", color: "#f8fafc" }}>
Project Members
</h1>
</div>

    <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
      Collaborate with people who have access to this project.
    </p>
  </div>

  {error && (
    <div
      role="alert"
      style={{
        ...panelStyle,
        padding: "12px 14px",
        marginBottom: "16px",
        color: "#fecaca",
        background: "#450a0a",
        borderColor: "#7f1d1d",
        fontSize: "13px",
      }}
    >
      {error}
    </div>
  )}

  {success && (
    <div
      role="status"
      style={{
        ...panelStyle,
        padding: "12px 14px",
        marginBottom: "16px",
        color: "#bbf7d0",
        background: "#052e16",
        borderColor: "#166534",
        fontSize: "13px",
      }}
    >
      {success}
    </div>
  )}

  {/* Invite by username */}
  <section style={{ ...panelStyle, padding: "20px", marginBottom: "24px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        marginBottom: "8px",
      }}
    >
      <UserPlus size={19} color="#818cf8" />
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: "17px" }}>
        Invite a collaborator
      </h2>
    </div>

    <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 16px" }}>
      Enter their unique username. They must accept your invitation
      before they become a project member.
    </p>

    <form
      onSubmit={handleInvite}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 220px", position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#64748b",
          }}
        >
          @
        </span>

        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="username"
          aria-label="Collaborator username"
          required
          style={{
            width: "100%",
            height: "40px",
            boxSizing: "border-box",
            background: "#020617",
            border: "1px solid #334155",
            borderRadius: "7px",
            padding: "0 12px 0 30px",
            color: "#f8fafc",
            outline: "none",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!username.trim() || inviting || !projectId}
        style={{
          ...buttonStyle,
          background: inviting ? "#312e81" : "#6366f1",
          color: "#fff",
          cursor: inviting ? "wait" : "pointer",
          opacity: !username.trim() || inviting ? 0.7 : 1,
        }}
      >
        <UserPlus size={16} />
        {inviting ? "Sending..." : "Send Invitation"}
      </button>
    </form>
  </section>

  {/* Project members */}
  <section style={{ marginBottom: "28px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "14px",
      }}
    >
      <h2 style={{ color: "#f8fafc", fontSize: "18px", margin: 0 }}>
        Members
      </h2>

      <button
        type="button"
        onClick={loadMembers}
        disabled={loading}
        aria-label="Refresh members"
        style={{
          ...buttonStyle,
          background: "#1e293b",
          color: "#cbd5e1",
          padding: "8px 10px",
        }}
      >
        <RefreshCw size={14} />
        Refresh
      </button>
    </div>

    {loading ? (
      <p style={{ color: "#94a3b8" }}>Loading members...</p>
    ) : members.length === 0 ? (
      <div style={{ ...panelStyle, padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        No project members found.
      </div>
    ) : (
      <div style={{ display: "grid", gap: "12px" }}>
        {members.map((member) => {
          const displayName =
            member.user?.name ||
            member.user?.username ||
            `User #${member.userId}`;

          return (
            <div
              key={member.id}
              style={{
                ...panelStyle,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: "#312e81",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={20} color="#c7d2fe" />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: "#e2e8f0",
                      fontWeight: "600",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {displayName}
                  </div>

                  {member.user?.username && (
                    <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                      @{member.user.username}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0,
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: member.role === "OWNER" ? "#312e81" : "#1e293b",
                  color: member.role === "OWNER" ? "#a5b4fc" : "#cbd5e1",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {member.role === "OWNER" && <Shield size={13} />}
                {member.role || "MEMBER"}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </section>

  {/* Pending invitations for this project */}
  <section>
    <h2 style={{ color: "#f8fafc", fontSize: "18px", margin: "0 0 14px" }}>
      Pending invitations
    </h2>

    {currentProjectInvitations.length === 0 ? (
      <div style={{ ...panelStyle, padding: "22px", color: "#94a3b8", fontSize: "13px" }}>
        No pending invitations for this project.
      </div>
    ) : (
      <div style={{ display: "grid", gap: "12px" }}>
        {currentProjectInvitations.map((invitation) => (
          <div
            key={invitation.id}
            style={{
              ...panelStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              padding: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#e2e8f0", fontSize: "13px" }}>
              Invitation #{invitation.id} · {invitation.status}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                disabled={respondingId !== null}
                onClick={() => handleInvitationResponse(invitation.id, "ACCEPT")}
                style={{
                  ...buttonStyle,
                  background: "#166534",
                  color: "#dcfce7",
                }}
              >
                <Check size={15} />
                Accept
              </button>

              <button
                type="button"
                disabled={respondingId !== null}
                onClick={() => handleInvitationResponse(invitation.id, "REJECT")}
                style={{
                  ...buttonStyle,
                  background: "#7f1d1d",
                  color: "#fee2e2",
                }}
              >
                <X size={15} />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
</div>

);
};

export default Members;