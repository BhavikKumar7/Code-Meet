import { useCallback, useEffect, useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ProjectList from "./components/ProjectList";
import FileExplorer from "./components/FileExplorer";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Members from "./components/Members";
import Chat from "./components/Chat";
import Interview from "./components/Interview";
import Invitations from "./components/Invitations";
import { getToken } from "./services/authStorage";
import { getMyProjects } from "./services/projectApi";

const getSavedProject = () => {
  try {
    const savedProject = localStorage.getItem("selectedProject");
    return savedProject ? JSON.parse(savedProject) : null;
  } catch {
    localStorage.removeItem("selectedProject");
    return null;
  }
};

function App() {
  const token = getToken();

  const [activePage, setActivePage] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState("");

  const [selectedProject, setSelectedProject] = useState(getSavedProject);

  const refreshProjects = useCallback(async () => {
    const data = await getMyProjects(token);
    const accessibleProjects = Array.isArray(data) ? data : [];

    setProjects(accessibleProjects);

    setSelectedProject((current) => {
      if (!current) return null;

      const matchingProject = accessibleProjects.find(
        (project) => String(project.id) === String(current.id)
      );

      if (!matchingProject) {
        localStorage.removeItem("selectedProject");
        return null;
      }

      localStorage.setItem(
        "selectedProject",
        JSON.stringify(matchingProject)
      );

      return matchingProject;
    });
  }, [token]);

  const handleSelectProject = useCallback((project) => {
    if (!project?.id) {
      console.error("Cannot select project: invalid project data", project);
      return;
    }

    setSelectedProject(project);
    localStorage.setItem("selectedProject", JSON.stringify(project));
    setActivePage("files");
  }, []);

  const handleBackToProjects = useCallback(() => {
    setSelectedProject(null);
    localStorage.removeItem("selectedProject");
    setActivePage("projects");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      if (!token) {
        setProjects([]);
        setSelectedProject(null);
        localStorage.removeItem("selectedProject");
        setIsLoadingProjects(false);
        return;
      }

      setIsLoadingProjects(true);
      setProjectError("");

      try {
        const data = await getMyProjects(token);
        if (cancelled) return;

        const accessibleProjects = Array.isArray(data) ? data : [];
        setProjects(accessibleProjects);

        setSelectedProject((current) => {
          if (!current) return null;

          const matchingProject = accessibleProjects.find(
            (project) => String(project.id) === String(current.id)
          );

          if (!matchingProject) {
            localStorage.removeItem("selectedProject");
            return null;
          }

          localStorage.setItem(
            "selectedProject",
            JSON.stringify(matchingProject)
          );

          return matchingProject;
        });
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load projects:", error);
        setProjectError(
          error.response?.data?.message ||
          "Unable to load your projects. Please try again."
        );
      } finally {
        if (!cancelled) {
          setIsLoadingProjects(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleProjectsChange = useCallback((nextProjects) => {
    setProjects(nextProjects);

    setSelectedProject((current) => {
      if (!current) return null;

      const matchingProject = nextProjects.find(
        (project) => String(project.id) === String(current.id)
      );

      if (!matchingProject) {
        localStorage.removeItem("selectedProject");
        return null;
      }

      localStorage.setItem(
        "selectedProject",
        JSON.stringify(matchingProject)
      );

      return matchingProject;
    });
  }, []);

  if (!token) {
    return <Login />;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#020617",
        color: "#ffffff",
        display: "flex",
        overflow: "hidden",
      }}
    >
      <Sidebar onNavigate={setActivePage} />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Topbar
          projects={projects}
          onSelectProject={handleSelectProject}
        />

        <main
          style={{
            padding: "28px",
            boxSizing: "border-box",
          }}
        >
          {isLoadingProjects ? (
            <p style={{ color: "#94a3b8" }}>Loading projects...</p>
          ) : projectError ? (
            <div>
              <p style={{ color: "#f87171" }}>{projectError}</p>
              <button onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          ) : activePage === "dashboard" ? (
            <Dashboard
              projects={projects}
              onNavigate={setActivePage}
              onSelectProject={handleSelectProject}
            />
          ) : activePage === "projects" ? (
            <ProjectList
              token={token}
              projects={projects}
              onProjectsChange={handleProjectsChange}
              onSelectProject={handleSelectProject}
            />
          ) : activePage === "invitations" ? (
            <Invitations
              token={token}
              onInvitationAccepted={refreshProjects}
            />
          ) : selectedProject ? (
            <>
              <button
                onClick={handleBackToProjects}
                style={{
                  background: "transparent",
                  border: "1px solid #334155",
                  color: "#cbd5e1",
                  padding: "8px 14px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  marginBottom: "20px",
                }}
              >
                ← Back to Projects
              </button>

              <h2 style={{ marginBottom: "20px" }}>
                {selectedProject.name}
              </h2>

              {activePage === "members" ? (
                <Members
                  projectId={selectedProject.id}
                  token={token}
                />
              ) : activePage === "chat" ? (
                <Chat
                  projectId={selectedProject.id}
                  token={token}
                />
              ) : activePage === "interviews" ? (
                <Interview
                  projectId={selectedProject.id}
                  token={token}
                />
              ) : (
                <FileExplorer
                  projectId={selectedProject.id}
                  token={token}
                />
              )}
            </>
          ) : (
            <div>
              <p style={{ color: "#94a3b8", marginBottom: "16px" }}>
                Select a project before opening {activePage}.
              </p>

              <button
                onClick={() => setActivePage("projects")}
                style={{
                  background: "#2563eb",
                  border: "none",
                  color: "#ffffff",
                  padding: "10px 16px",
                  borderRadius: "7px",
                  cursor: "pointer",
                }}
              >
                Go to Projects
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;