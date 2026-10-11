import {
  FolderKanban,
  Plus,
  ArrowRight,
  Code2,
  Users,
  Clock3,
} from "lucide-react";

const Dashboard = ({
  projects = [],
  onNavigate,
  onSelectProject,
}) => {
  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
    )
    .slice(0, 4);

  const handleOpenProjects = () => {
    onNavigate?.("projects");
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        color: "#f8fafc",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "28px",
              fontWeight: "700",
            }}
          >
            Dashboard
          </h1>

          <p
            style={{
              margin: 0,
              color: "#94a3b8",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Your workspace for coding, collaboration, and interviews.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenProjects}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#6366f1",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "11px 16px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <Plus size={17} />
          New Project
        </button>
      </div>

      {/* Overview cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
          marginBottom: "34px",
        }}
      >
        <StatCard
          icon={<FolderKanban size={21} color="#818cf8" />}
          label="Accessible Projects"
          value={projects.length}
          description="Projects you can access"
        />

        <StatCard
          icon={<Code2 size={21} color="#38bdf8" />}
          label="Recently Updated"
          value={
            projects.filter((project) => {
              const timestamp = new Date(
                project.updatedAt || project.createdAt || 0
              ).getTime();

              return (
                Number.isFinite(timestamp) &&
                timestamp > 0 &&
                Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000
              );
            }).length
          }
          description="Updated in the last 7 days"
        />

        <StatCard
          icon={<Users size={21} color="#34d399" />}
          label="Collaboration"
          value="Projects"
          description="Open a project to manage members"
        />
      </div>

      {/* Recent projects */}
      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 6px",
                fontSize: "19px",
                fontWeight: "650",
              }}
            >
              Recent Projects
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              Quickly return to a project you have been working on.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenProjects}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              background: "transparent",
              border: "1px solid #334155",
              color: "#cbd5e1",
              borderRadius: "7px",
              padding: "9px 12px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            View all projects
            <ArrowRight size={15} />
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <div
            style={{
              background: "#0f172a",
              border: "1px dashed #334155",
              borderRadius: "12px",
              padding: "52px 20px",
              textAlign: "center",
            }}
          >
            <FolderKanban
              size={38}
              color="#818cf8"
              style={{ marginBottom: "14px" }}
            />

            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "17px",
              }}
            >
              No projects yet
            </h3>

            <p
              style={{
                margin: "0 auto 20px",
                maxWidth: "360px",
                color: "#94a3b8",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              Create your first project to start coding and collaborating
              with your team.
            </p>

            <button
              type="button"
              onClick={handleOpenProjects}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#6366f1",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 15px",
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              Create your first project
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {recentProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelectProject?.(project)}
                style={{
                  display: "block",
                  width: "100%",
                  minWidth: 0,
                  textAlign: "left",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "20px",
                  color: "#f8fafc",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  font: "inherit",
                  transition: "border-color 0.2s, transform 0.2s",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.borderColor = "#6366f1";
                  event.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.borderColor = "#1e293b";
                  event.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#1e1b4b",
                    borderRadius: "9px",
                    marginBottom: "16px",
                  }}
                >
                  <Code2 size={21} color="#818cf8" />
                </div>

                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: "16px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {project.name}
                </h3>

                <p
                  style={{
                    margin: "0 0 18px",
                    minHeight: "40px",
                    color: "#94a3b8",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    overflowWrap: "anywhere",
                  }}
                >
                  {project.description || "No description provided."}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    paddingTop: "14px",
                    borderTop: "1px solid #1e293b",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    <Clock3 size={14} />
                    Project #{project.id}
                  </span>

                  <ArrowRight size={17} color="#818cf8" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const StatCard = ({ icon, label, value, description }) => (
  <div
    style={{
      minWidth: 0,
      background: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: "12px",
      padding: "20px",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        marginBottom: "18px",
      }}
    >
      <span style={{ color: "#94a3b8", fontSize: "13px" }}>
        {label}
      </span>
      {icon}
    </div>

    <div
      style={{
        fontSize: typeof value === "number" ? "30px" : "20px",
        fontWeight: "700",
        marginBottom: "7px",
        overflowWrap: "anywhere",
      }}
    >
      {value}
    </div>

    <div style={{ color: "#64748b", fontSize: "12px" }}>
      {description}
    </div>
  </div>
);

export default Dashboard;