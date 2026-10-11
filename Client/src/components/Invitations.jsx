import { useCallback, useEffect, useState } from "react";
import { BellRing, Check, Clock3, FolderKanban, RefreshCw, X } from "lucide-react";
import { getMyInvitations, respondToInvitation } from "../services/memberApi";

const getProjectName = (invitation) =>
  invitation.project?.name || invitation.projectName || invitation.project?.title || "Project invitation";

const getInviterName = (invitation) =>
  invitation.invitedBy?.name ||
  invitation.inviter?.name ||
  invitation.sender?.name ||
  invitation.invitedBy?.username ||
  invitation.inviter?.username ||
  "A project owner";

const getStatus = (invitation) =>
  String(invitation.status || invitation.invitationStatus || "PENDING").toUpperCase();

const isPending = (invitation) =>
  ["PENDING", "INVITED"].includes(getStatus(invitation));

export default function Invitations({ token, onInvitationAccepted }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInvitations = useCallback(async () => {
    if (!token) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await getMyInvitations(token);
      setInvitations(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Failed to load invitations:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load invitations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleResponse = async (invitation, action) => {
    if (!invitation?.id || actionId !== null) return;

    setActionId(invitation.id);
    setError("");
    setSuccess("");

    try {
      await respondToInvitation(invitation.id, action, token);

      if (action === "ACCEPT") {
        setSuccess(`You joined ${getProjectName(invitation)}.`);
        // Refresh the parent project's list after the server confirms acceptance.
        await onInvitationAccepted?.();
      } else {
        setSuccess(`Invitation to ${getProjectName(invitation)} declined.`);
      }

      // Reload from the server so the displayed status matches backend state.
      await loadInvitations();
    } catch (err) {
      console.error(`Failed to ${action.toLowerCase()} invitation:`, err);
      setError(
        err.response?.data?.message ||
          err.message ||
          `Unable to ${action === "ACCEPT" ? "accept" : "decline"} this invitation.`
      );
    } finally {
      setActionId(null);
    }
  };

  const pendingCount = invitations.filter(isPending).length;

  return (
    <section style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }}>
            <BellRing size={25} color="#818cf8" />
            <h1 style={{ margin: 0, color: "#f8fafc", fontSize: "28px" }}>Invitations</h1>
            {pendingCount > 0 && (
              <span style={{ background: "#312e81", color: "#c7d2fe", padding: "3px 9px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                {pendingCount} pending
              </span>
            )}
          </div>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
            Review invitations to collaborate on projects.
          </p>
        </div>
        <button
          type="button"
          onClick={loadInvitations}
          disabled={loading || actionId !== null}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", border: "1px solid #334155", borderRadius: "8px", background: "#0f172a", color: "#cbd5e1", cursor: loading ? "wait" : "pointer" }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && (
        <div role="alert" style={{ padding: "12px 14px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #7f1d1d", background: "#450a0a", color: "#fecaca", fontSize: "13px" }}>
          {error}
        </div>
      )}
      {success && (
        <div role="status" style={{ padding: "12px 14px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #166534", background: "#052e16", color: "#bbf7d0", fontSize: "13px" }}>
          {success}
        </div>
      )}

      {loading ? (
        <p style={{ padding: "35px 0", textAlign: "center", color: "#94a3b8" }}>Loading invitations...</p>
      ) : invitations.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed #334155", borderRadius: "12px", background: "#0f172a" }}>
          <BellRing size={34} color="#6366f1" style={{ marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 8px", color: "#f8fafc" }}>No invitations yet</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Project invitations you receive will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {invitations.map((invitation) => {
            const pending = isPending(invitation);
            const status = getStatus(invitation);
            const busy = actionId === invitation.id;

            return (
              <article key={invitation.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", padding: "18px", border: "1px solid #1e293b", borderRadius: "12px", background: "#0f172a" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", minWidth: 0, flex: 1 }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FolderKanban size={21} color="#a5b4fc" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 6px", color: "#f8fafc", fontSize: "16px", overflowWrap: "anywhere" }}>{getProjectName(invitation)}</h3>
                    <p style={{ margin: "0 0 8px", color: "#94a3b8", fontSize: "13px" }}>Invited by {getInviterName(invitation)}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px" }}>
                      <Clock3 size={13} />
                      {invitation.createdAt ? new Date(invitation.createdAt).toLocaleDateString() : "Project collaboration invitation"}
                    </div>
                  </div>
                </div>

                {pending ? (
                  <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                    <button type="button" disabled={actionId !== null} onClick={() => handleResponse(invitation, "REJECT")} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 12px", border: "1px solid #475569", borderRadius: "7px", background: "transparent", color: "#cbd5e1", cursor: actionId !== null ? "wait" : "pointer", opacity: actionId !== null && !busy ? 0.6 : 1 }}>
                      <X size={15} /> Decline
                    </button>
                    <button type="button" disabled={actionId !== null} onClick={() => handleResponse(invitation, "ACCEPT")} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 12px", border: "none", borderRadius: "7px", background: "#4f46e5", color: "#ffffff", cursor: actionId !== null ? "wait" : "pointer", opacity: actionId !== null && !busy ? 0.6 : 1 }}>
                      <Check size={15} /> {busy ? "Please wait..." : "Accept"}
                    </button>
                  </div>
                ) : (
                  <span style={{ padding: "6px 10px", borderRadius: "999px", background: status === "ACCEPTED" ? "#052e16" : status === "REJECTED" || status === "DECLINED" ? "#1f2937" : "#172554", color: status === "ACCEPTED" ? "#86efac" : "#cbd5e1", fontSize: "12px", fontWeight: 600 }}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </span>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
