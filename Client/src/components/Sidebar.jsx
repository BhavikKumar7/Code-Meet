import {
  Code2,
  LayoutDashboard,
  FolderKanban,
  Video,
  LogOut,
  Mail,
} from "lucide-react";
import { removeToken, getToken } from "../services/authStorage";

const getCurrentUser = () => {
  try {
    const token = getToken();
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

const Sidebar = ({ onNavigate }) => {
  const user = getCurrentUser();
  const displayName = user?.name || "User";
  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || "U";

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("selectedProject");
    window.location.reload();
  };

  return (
    <aside
      style={{
        width: "240px",
        height: "100vh",
        background: "#111827",
        color: "#ffffff",
        padding: "24px 16px",
        boxSizing: "border-box",
        position: "relative",
        overflowY: "auto",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "40px",
        }}
      >
        <Code2 size={30} />
        <div>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Code Meet</h2>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>
            Collaborate & Code
          </span>
        </div>
      </div>
      <nav>
        <SidebarItem
          icon={<LayoutDashboard size={19} />}
          label="Dashboard"
          onClick={() => onNavigate("dashboard")}
        />
        <SidebarItem
          icon={<FolderKanban size={19} />}
          label="Projects"
          onClick={() => onNavigate("projects")}
        />
        <SidebarItem
          icon={<Mail size={19} />}
          label="Invitations"
          onClick={() => onNavigate("invitations")}
        />
        <SidebarItem
          icon={<Video size={19} />}
          label="Interviews"
          onClick={() => onNavigate("interviews")}
        />
      </nav>
      <div
        style={{
          marginTop: "auto",
          paddingTop: "16px",
          borderTop: "1px solid #1f2937",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px",
            marginBottom: "10px",
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
              fontWeight: "700",
              flexShrink: 0,
            }}
          >
            {avatarLetter}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
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
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "11px 12px",
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#f87171",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
};

const SidebarItem = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px",
      marginBottom: "6px",
      borderRadius: "8px",
      color: "#d1d5db",
      cursor: "pointer",
      background: "transparent",
      border: "none",
      textAlign: "left",
    }}
  >
    {icon}
    <span style={{ fontSize: "14px" }}>{label}</span>
  </button>
);

export default Sidebar;