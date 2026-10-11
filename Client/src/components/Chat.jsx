import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { getProjectMessages, sendProjectMessage } from "../services/chatApi";

const Chat = ({ projectId, token }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const socketRef = useRef(null);

  const loadMessages = async () => {
    try {
      const data = await getProjectMessages(projectId, token);
      setMessages(data);
    } catch (error) {
      console.error("Failed to load chat:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const socket = new WebSocket(
    `ws://localhost:1235/?projectId=${projectId}`
  );

  socketRef.current = socket;

  socket.onopen = () => {
    console.log("Chat WebSocket connected");
  };

  socket.onmessage = (event) => {
    const incomingMessage = JSON.parse(event.data);

    setMessages((current) => [...current, incomingMessage]);
  };

  socket.onerror = (error) => {
    console.error("Chat WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("Chat WebSocket disconnected");
  };

  return () => {
    socket.close();
    socketRef.current = null;
  };
}, [projectId]);


  useEffect(() => {
    loadMessages();
  }, [projectId, token]);

const handleSend = async () => {
  if (!message.trim() || sending) return;

  try {
    setSending(true);

    const newMessage = await sendProjectMessage(
      projectId,
      message,
      token
    );

    setMessages((current) => [...current, newMessage]);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(newMessage));
    }

    setMessage("");
  } catch (error) {
    console.error("Failed to send message:", error);
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

  return (
    <div
      style={{
        height: "calc(100vh - 126px)",
        minHeight: "600px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "22px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "6px",
          }}
        >
          <MessageSquare size={24} color="#818cf8" />

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              color: "#f8fafc",
            }}
          >
            Workspace Chat
          </h1>
        </div>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Communicate with your workspace members.
        </p>
      </div>

      {/* Chat container */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
          }}
        >
          {loading ? (
            <div style={{ color: "#64748b" }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              No messages yet. Start the conversation.
            </div>
          ) : (
            messages.map((item) => (
              <div
                key={item.id}
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: "#312e81",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#c7d2fe",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  U
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        color: "#e2e8f0",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      User #{item.userId}
                    </span>

                    <span
                      style={{
                        color: "#475569",
                        fontSize: "11px",
                      }}
                    >
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div
                    style={{
                      color: "#cbd5e1",
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div
          style={{
            padding: "14px",
            borderTop: "1px solid #1e293b",
            display: "flex",
            gap: "10px",
          }}
        >
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              background: "#111827",
              border: "1px solid #334155",
              borderRadius: "9px",
              padding: "11px 13px",
              color: "#f8fafc",
              outline: "none",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          />

          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            style={{
              width: "44px",
              border: "none",
              borderRadius: "9px",
              background: "#4f46e5",
              color: "#ffffff",
              cursor: sending || !message.trim() ? "not-allowed" : "pointer",
              opacity: sending || !message.trim() ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
