import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Users,
  Send,
  PanelRightClose,
  Circle,
  Shield,
  RefreshCw,
} from "lucide-react";
import {
  getProjectMessages,
  sendProjectMessage,
} from "../services/chatApi";
import {
  getProjectMembers,
} from "../services/memberApi";

const API_URL = "http://localhost:5000/api";

const panelButtonStyle = (active) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  padding: "10px 8px",
  border: "none",
  borderBottom: active ? "2px solid #818cf8" : "2px solid transparent",
  background: active ? "#172033" : "transparent",
  color: active ? "#e0e7ff" : "#94a3b8",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
});

const ProjectCollaborationPanel = ({
  projectId,
  token,
  collaboratorCount = 0,
  activeUsers = [],
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [membersError, setMembersError] = useState("");
  const messagesEndRef = useRef(null);

  const isMemberOnline = (member) => {
    const user = member.user || member.User || {};

    const memberUserId =
      user.id ??
      user.userId ??
      member.userId ??
      ((!member.user && !member.User) ? member.id : null);

    if (memberUserId == null) return false;

    return activeUsers.some(
      (activeUser) => String(activeUser.id) === String(memberUserId)
    );
  };

  const loadMessages = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const result = await getProjectMessages(projectId, token);
      setMessages(Array.isArray(result) ? result : []);
      setChatError("");
    } catch (error) {
      console.error("Failed to load project messages:", error);
      setChatError(
        error.response?.data?.message || "Unable to load project chat."
      );
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  }, [projectId, token]);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    setMembersError("");

    try {
      const result = await getProjectMembers(projectId, token);
      setMembers(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Failed to load project members:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      setMembersError(
        error.response?.data?.message ||
        "Unable to load project members."
      );
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    setMessages([]);
    setMembers([]);
    loadMessages(true);
    loadMembers();

    // Refresh chat history so new messages appear even when a socket event
    // is not available. This is project-scoped and cleaned up on unmount.
    const intervalId = window.setInterval(() => loadMessages(false), 5000);
    return () => window.clearInterval(intervalId);
  }, [loadMessages, loadMembers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending) return;

    setSending(true);
    setChatError("");
    try {
      const created = await sendProjectMessage(projectId, trimmedMessage, token);
      if (created) {
        setMessages((current) => {
          if (created.id && current.some((item) => item.id === created.id)) {
            return current;
          }
          return [...current, created];
        });
      } else {
        await loadMessages(false);
      }
      setMessage("");
    } catch (error) {
      console.error("Failed to send project message:", error);
      setChatError(
        error.response?.data?.message || "Message could not be sent."
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const getMemberName = (member) => {
    const user = member.user || member.User || {};

    return (
      user.username ||
      member.username ||
      user.email ||
      (member.userId
        ? `User #${member.userId}`
        : `Member #${member.id}`)
    );
  };

  return (
    <aside
      aria-label="Project collaboration panel"
      style={{
        width: "320px",
        minWidth: "280px",
        maxWidth: "40vw",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        background: "#0b1120",
        borderLeft: "1px solid #1e293b",
        color: "#e2e8f0",
      }}
    >
      <div
        style={{
          height: "48px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          borderBottom: "1px solid #1e293b",
          background: "#0f172a",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 700 }}>Collaboration</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            title="People currently detected by the editor presence system"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              color: "#86efac",
              fontSize: "11px",
            }}
          >
            <Circle size={7} fill="#22c55e" color="#22c55e" />
            {collaboratorCount} active
          </span>
          <button
            type="button"
            onClick={onClose}
            title="Collapse collaboration panel"
            aria-label="Collapse collaboration panel"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "5px",
            }}
          >
            <PanelRightClose size={17} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexShrink: 0, borderBottom: "1px solid #1e293b" }}>
        <button
          type="button"
          style={panelButtonStyle(activeTab === "chat")}
          onClick={() => setActiveTab("chat")}
          aria-pressed={activeTab === "chat"}
        >
          <MessageSquare size={15} /> Chat
        </button>
        <button
          type="button"
          style={panelButtonStyle(activeTab === "members")}
          onClick={() => setActiveTab("members")}
          aria-pressed={activeTab === "members"}
        >
          <Users size={15} /> Members ({members.length})
        </button>
      </div>

      {activeTab === "chat" ? (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#64748b",
              fontSize: "11px",
              borderBottom: "1px solid #172033",
            }}
          >
            <span>Project messages</span>
            <button
              type="button"
              onClick={() => loadMessages(true)}
              title="Refresh messages"
              aria-label="Refresh messages"
              style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer" }}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px" }}>
            {loadingMessages ? (
              <p style={{ color: "#64748b", fontSize: "12px" }}>Loading messages…</p>
            ) : messages.length === 0 ? (
              <div style={{ padding: "30px 8px", textAlign: "center", color: "#64748b", fontSize: "12px", lineHeight: 1.6 }}>
                No messages yet. Start the conversation.
              </div>
            ) : (
              messages.map((item, index) => {
                const user = item.user || item.User || {};
                const author =
                  user.username ||
                  user.name ||
                  user.fullName ||
                  user.email ||
                  (item.userId ? `User #${item.userId}` : "Project member");
                return (
                  <div key={item.id ?? `${item.createdAt}-${index}`} style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
                    <div style={{ width: "28px", height: "28px", flexShrink: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#312e81", color: "#c7d2fe", fontSize: "11px", fontWeight: 700 }}>
                      {author.slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ color: "#e2e8f0", fontSize: "11px", fontWeight: 700 }}>{author}</span>
                        {item.createdAt && <span style={{ color: "#475569", fontSize: "10px" }}>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                      </div>
                      <div style={{ color: "#cbd5e1", fontSize: "12px", lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.message}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {chatError && <div role="alert" style={{ padding: "8px 12px", color: "#fca5a5", fontSize: "11px" }}>{chatError}</div>}
          <div style={{ padding: "10px", borderTop: "1px solid #1e293b", display: "flex", alignItems: "flex-end", gap: "7px" }}>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message this project…"
              aria-label="Project message"
              rows={2}
              style={{ flex: 1, minWidth: 0, resize: "none", background: "#111827", border: "1px solid #334155", borderRadius: "8px", padding: "9px", color: "#f8fafc", outline: "none", fontSize: "12px", fontFamily: "inherit" }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !message.trim()}
              title="Send message"
              aria-label="Send message"
              style={{ width: "34px", height: "34px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: 0, borderRadius: "8px", background: sending || !message.trim() ? "#312e81" : "#4f46e5", color: "white", cursor: sending || !message.trim() ? "not-allowed" : "pointer", opacity: sending || !message.trim() ? 0.55 : 1 }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: 700 }}>Project members</div>
            <button type="button" onClick={loadMembers} title="Refresh members" aria-label="Refresh members" style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer" }}><RefreshCw size={13} /></button>
          </div>
          <div style={{ padding: "10px", marginBottom: "14px", border: "1px solid #1e293b", borderRadius: "8px", background: "#0f172a" }}>
            <div style={{ color: "#86efac", fontSize: "12px", fontWeight: 700 }}>{collaboratorCount} active in editor</div>
            <div style={{ marginTop: "4px", color: "#64748b", fontSize: "11px", lineHeight: 1.5 }}>This count comes from the editor presence callback. Individual online identities require user-aware presence events from the collaboration server.</div>
          </div>
          {loadingMembers ? (
            <p style={{ color: "#64748b", fontSize: "12px" }}>Loading members…</p>
          ) : membersError ? (
            <div role="alert" style={{ color: "#fca5a5", fontSize: "12px", lineHeight: 1.5 }}>{membersError}</div>
          ) : members.length === 0 ? (
            <div style={{ padding: "20px 8px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>No project members found.</div>
          ) : (
            members.map((member, index) => {
              const name = getMemberName(member);
              const role = member.role || "MEMBER";
              const online = isMemberOnline(member);
              return (
                <div key={member.id ?? member.userId ?? index} style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 2px", borderBottom: "1px solid #172033" }}>
                  <div style={{ position: "relative", width: "32px", height: "32px", flexShrink: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#312e81", color: "#c7d2fe", fontSize: "12px", fontWeight: 700 }}>
                    {name.slice(0, 1).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        color: "#e2e8f0",
                        fontSize: "12px",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        aria-label={online ? "Online" : "Offline"}
                        title={online ? "Online" : "Offline"}
                        style={{
                          width: "8px",
                          height: "8px",
                          flexShrink: 0,
                          borderRadius: "50%",
                          background: online ? "#22c55e" : "#64748b",
                          boxShadow: online ? "0 0 6px #22c55e80" : "none",
                        }}
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {name}
                      </span>
                    </div>

                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "10px",
                        marginTop: "3px",
                      }}
                    >
                      Project member
                    </div>
                  </div>

                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 6px", borderRadius: "6px", background: role === "OWNER" ? "#312e81" : "#1e293b", color: role === "OWNER" ? "#c7d2fe" : "#cbd5e1", fontSize: "9px", fontWeight: 700 }}>
                    {role === "OWNER" && <Shield size={10} />}{role}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </aside>
  );
};

export default ProjectCollaborationPanel;
