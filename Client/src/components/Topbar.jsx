import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  FolderKanban,
} from "lucide-react";
import axios from "axios";
import { getToken, removeToken } from "../services/authStorage";
import { markNotificationRead } from "../services/notificationApi";

const API_URL = "http://localhost:5000/api";

const getCurrentUser = (token) => {
  try {
    if (!token) return null;

    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = JSON.parse(
      decodeURIComponent(
        Array.from(atob(normalizedPayload))
          .map((char) =>
            `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
          )
          .join("")
      )
    );

    return {
      name: decoded.name || decoded.username || decoded.email || "User",
      username: decoded.username || "",
      email: decoded.email || "",
    };
  } catch {
    return null;
  }
};

const Topbar = ({ projects = [], onSelectProject }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const token = getToken();
  const user = getCurrentUser(token);

  const displayName = user?.name || "User";
  const avatarLetter =
    displayName.trim().charAt(0).toUpperCase() || "U";

  const filteredProjects = projects.filter((project) =>
    project.name
      ?.toLowerCase()
      .includes(searchText.trim().toLowerCase())
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;


  useEffect(() => {
    const currentToken = getToken();

    if (!currentToken) {
      return;
    }

    let socket;
    let reconnectTimer;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      socket = new WebSocket("ws://localhost:1236");

      socket.onopen = () => {
        console.log("Notification WebSocket connected");

        socket.send(
          JSON.stringify({
            type: "AUTH",
            token: currentToken,
          })
        );
      };

      socket.onmessage = async (event) => {
        try {
          const payload = JSON.parse(event.data);

          // After authentication, refresh the list to recover
          // notifications that may have arrived while disconnected.
          if (payload.type === "AUTHENTICATED") {
            const response = await axios.get(
              `${API_URL}/notifications`,
              {
                headers: {
                  Authorization: `Bearer ${currentToken}`,
                },
              }
            );

            if (!cancelled) {
              const data = response.data?.notifications;
              setNotifications(Array.isArray(data) ? data : []);
            }

            return;
          }

          if (
            payload.type === "NOTIFICATION" &&
            payload.notification
          ) {
            const newNotification = payload.notification;

            setNotifications((previous) => {
              // Avoid duplicate entries if an event is delivered twice.
              const withoutDuplicate = previous.filter(
                (item) =>
                  String(item.id) !== String(newNotification.id)
              );

              return [newNotification, ...withoutDuplicate].sort(
                (a, b) =>
                  new Date(b.createdAt || 0).getTime() -
                  new Date(a.createdAt || 0).getTime()
              );
            });
          }
        } catch (error) {
          console.error(
            "Failed to process notification WebSocket message:",
            error
          );
        }
      };

      socket.onerror = (error) => {
        console.error("Notification WebSocket error:", error);
      };

      socket.onclose = () => {
        if (!cancelled) {
          console.log(
            "Notification WebSocket disconnected. Reconnecting..."
          );

          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);


  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("selectedProject");
    window.location.reload();
  };

  const handleProjectClick = (project) => {
    if (typeof onSelectProject === "function") {
      onSelectProject(project);
    } else {
      // Fallback if the parent has not yet passed the callback.
      localStorage.setItem("selectedProject", JSON.stringify(project));
      window.location.reload();
    }

    setSearchText("");
  };

  const handleMarkNotificationRead = async (notification) => {
    if (notification.isRead) return;

    try {
      await markNotificationRead(notification.id, token);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  };

  return (
    <header
      style={{
        height: "70px",
        background: "#0f172a",
        borderBottom: "1px solid #1f2937",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        padding: "0 28px",
        boxSizing: "border-box",
        color: "#ffffff",
      }}
    >
      {/* Search projects */}
      <div
        style={{
          position: "relative",
          width: "360px",
          maxWidth: "100%",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "40px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "8px",
            padding: "0 12px",
            boxSizing: "border-box",
          }}
        >
          <Search size={18} color="#9ca3af" />

          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#ffffff",
              fontSize: "14px",
            }}
          />

          <span
            style={{
              fontSize: "11px",
              color: "#6b7280",
              border: "1px solid #374151",
              padding: "3px 6px",
              borderRadius: "5px",
              whiteSpace: "nowrap",
            }}
          >
            Ctrl K
          </span>
        </div>

        {searchText.trim() !== "" && (
          <div
            style={{
              position: "absolute",
              top: "48px",
              left: 0,
              width: "100%",
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: "10px",
              padding: "8px",
              boxSizing: "border-box",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              zIndex: 1000,
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {filteredProjects.length > 0 ? (
              <>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    padding: "6px 10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Projects
                </div>

                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleProjectClick(project)}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = "#1f2937";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = "transparent";
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px",
                      borderRadius: "7px",
                      cursor: "pointer",
                      color: "#e5e7eb",
                      background: "transparent",
                      border: "none",
                      textAlign: "left",
                    }}
                  >
                    <FolderKanban size={17} color="#818cf8" />

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "500",
                        }}
                      >
                        {project.name}
                      </div>

                      {project.description && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            marginTop: "2px",
                          }}
                        >
                          {project.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              >
                No projects found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexShrink: 0,
        }}
      >
        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() =>
              setNotificationOpen((current) => !current)
            }
            aria-label="Notifications"
            aria-expanded={notificationOpen}
            style={{
              position: "relative",
              background: "transparent",
              border: "none",
              color: "#d1d5db",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
            }}
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  minWidth: "17px",
                  height: "17px",
                  padding: "0 4px",
                  borderRadius: "999px",
                  background: "#6366f1",
                  color: "#ffffff",
                  fontSize: "9px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0f172a",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div
              style={{
                position: "absolute",
                top: "42px",
                right: 0,
                width: "300px",
                maxHeight: "380px",
                overflowY: "auto",
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "10px",
                boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #1e293b",
                  color: "#f8fafc",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Notifications
              </div>

              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: "22px 16px",
                    color: "#64748b",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  <Bell
                    size={22}
                    style={{ marginBottom: "8px", opacity: 0.6 }}
                  />
                  <div>No notifications</div>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      handleMarkNotificationRead(notification)
                    }
                    style={{
                      width: "100%",
                      display: "block",
                      padding: "12px 16px",
                      border: "none",
                      borderBottom: "1px solid #1e293b",
                      color: "#cbd5e1",
                      fontSize: "12px",
                      textAlign: "left",
                      cursor: notification.isRead
                        ? "default"
                        : "pointer",
                      background: notification.isRead
                        ? "transparent"
                        : "rgba(99, 102, 241, 0.08)",
                    }}
                  >
                    <div
                      style={{
                        color: "#f8fafc",
                        marginBottom: "4px",
                        fontWeight: "600",
                      }}
                    >
                      {notification.title}
                    </div>

                    <div style={{ color: "#94a3b8" }}>
                      {notification.message}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* User profile */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() =>
              setProfileOpen((current) => !current)
            }
            aria-label="User profile menu"
            aria-expanded={profileOpen}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              padding: "6px 8px",
              borderRadius: "8px",
              background: "transparent",
              border: "none",
              color: "#ffffff",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "600",
                flexShrink: 0,
              }}
            >
              {avatarLetter}
            </div>

            <div style={{ minWidth: 0, maxWidth: "150px" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.email || user?.username || "Signed in"}
              </div>
            </div>

            <ChevronDown
              size={16}
              color="#9ca3af"
              style={{
                transform: profileOpen
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                transition: "0.2s",
              }}
            />
          </button>

          {profileOpen && (
            <div
              style={{
                position: "absolute",
                top: "52px",
                right: 0,
                width: "200px",
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: "10px",
                padding: "8px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid #1f2937",
                  marginBottom: "6px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    overflowWrap: "anywhere",
                  }}
                >
                  {displayName}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginTop: "3px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {user?.email || user?.username || ""}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "#1f2937";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "transparent";
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "7px",
                  color: "#fca5a5",
                  cursor: "pointer",
                  fontSize: "13px",
                  textAlign: "left",
                }}
              >
                <LogOut size={17} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;