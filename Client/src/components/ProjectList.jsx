import { useEffect, useMemo, useState } from "react";

import {

  FolderKanban,

  Plus,

  Search,

  X,

  ArrowRight,

  Code2,

  CalendarDays,

  MoreVertical,

  UserPlus,

  Pencil,

  Trash2,


} from "lucide-react";



import {

  getMyProjects,

  createProject,

  updateProject,

  deleteProject,

} from "../services/projectApi";



import { inviteProjectMember } from "../services/memberApi";


const getUserIdFromToken = (token) => {
  try {
    if (!token) return null;

    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = JSON.parse(
      decodeURIComponent(
        Array.from(atob(normalized))
          .map((char) =>
            `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
          )
          .join("")
      )
    );

    return decoded.userId ?? decoded.id ?? decoded.sub ?? null;
  } catch (error) {
    console.error("Unable to decode user ID:", error);
    return null;
  }
};

const isProjectOwner = (project, currentUserId) => {
  if (!project || currentUserId == null) {
    return false;
  }

  const role = String(
    project.currentUserRole ??
    project.membershipRole ??
    project.role ??
    ""
  ).toUpperCase();

  if (role === "OWNER") {
    return true;
  }

  const ownerId =
    project.ownerId ??
    project.owner?.id ??
    project.createdById ??
    project.createdBy?.id ??
    project.createdBy ??
    project.creatorId ??
    project.creator?.id;

  return (
    ownerId != null &&
    String(ownerId) === String(currentUserId)
  );
};


const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  padding: "10px",
  border: "none",
  borderRadius: "6px",
  background: "transparent",
  color: "#e2e8f0",
  fontSize: "13px",
  textAlign: "left",
  cursor: "pointer",
};

const actionInputStyle = {
  width: "100%",
  height: "42px",
  padding: "0 12px",
  boxSizing: "border-box",
  border: "1px solid #334155",
  borderRadius: "7px",
  background: "#020617",
  color: "#f8fafc",
  outline: "none",
};

const cancelButtonStyle = {
  padding: "10px 14px",
  border: "none",
  borderRadius: "7px",
  background: "#1e293b",
  color: "#cbd5e1",
  cursor: "pointer",
};

const ProjectList = ({

  token,

  projects: initialProjects = [],

  onProjectsChange,

  onSelectProject,

}) => {

  const [openMenuProjectId, setOpenMenuProjectId] = useState(null);

  const [actionType, setActionType] = useState("");

  const [activeProject, setActiveProject] = useState(null);

  const [actionName, setActionName] = useState("");

  const [actionDescription, setActionDescription] = useState("");

  const [inviteUsername, setInviteUsername] = useState("");

  const [actionLoading, setActionLoading] = useState(false);





  const currentUserId = getUserIdFromToken(token);



  const [projects, setProjects] = useState(initialProjects);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);



  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [searchText, setSearchText] = useState("");



  // Keep the component synchronized with App.jsx.

  useEffect(() => {

    setProjects(initialProjects);

  }, [initialProjects]);



  const publishProjects = (nextProjects) => {

    setProjects(nextProjects);

    onProjectsChange?.(nextProjects);

  };



  // Load projects belonging to the authenticated user.

  useEffect(() => {

    let cancelled = false;



    const loadProjects = async () => {

      if (!token) {

        setProjects([]);

        setLoading(false);

        return;

      }



      try {

        setLoading(true);

        setError("");



        const data = await getMyProjects(token);



        if (!cancelled) {

          publishProjects(Array.isArray(data) ? data : []);

        }

      } catch (err) {

        console.error("Failed to load projects:", err);



        if (!cancelled) {

          setError(

            err.response?.data?.message ||

            "Failed to load projects. Please try again."

          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    };



    loadProjects();



    return () => {

      cancelled = true;

    };



  }, [token]);



  const handleCreateProject = async (event) => {

    event?.preventDefault();



    const trimmedName = name.trim();

    const trimmedDescription = description.trim();



    if (!trimmedName || creating) {

      return;

    }



    try {

      setCreating(true);

      setError("");



      const newProject = await createProject(

        {

          name: trimmedName,

          description: trimmedDescription || undefined,

        },

        token

      );



      if (!newProject?.id) {

        throw new Error("The server did not return the created project.");

      }



      // Avoid duplicates if the server returns a project already in the list.

      const nextProjects = [

        newProject,

        ...projects.filter(

          (project) => String(project.id) !== String(newProject.id)

        ),

      ];



      publishProjects(nextProjects);



      setName("");

      setDescription("");

      setShowForm(false);

    } catch (err) {

      console.error("Failed to create project:", err);



      setError(

        err.response?.data?.message ||

        err.message ||

        "Failed to create project. Please try again."

      );

    } finally {

      setCreating(false);

    }



  };



  const openProjectAction = (type, project) => {

    setError("");

    setOpenMenuProjectId(null);

    setActiveProject(project);

    setActionType(type);

    setActionName(project.name || "");

    setActionDescription(project.description || "");

    setInviteUsername("");

  };



  const closeProjectAction = () => {

    if (actionLoading) return;

    setActionType("");

    setActiveProject(null);

    setInviteUsername("");

  };



  const handleInviteMember = async (event) => {

    event.preventDefault();



    const username = inviteUsername.trim();

    if (!username || !activeProject || actionLoading) return;



    try {

      setActionLoading(true);

      setError("");



      await inviteProjectMember(activeProject.id, username, token);



      setActionType("");

      setActiveProject(null);

      setInviteUsername("");

    } catch (err) {

      setError(

        err.response?.data?.message ||

        err.message ||

        "Failed to send invitation."

      );

    } finally {

      setActionLoading(false);

    }

  };



  const handleEditProject = async (event) => {

    event.preventDefault();



    const trimmedName = actionName.trim();

    if (!trimmedName || !activeProject || actionLoading) return;



    try {

      setActionLoading(true);

      setError("");



      const updatedProject = await updateProject(

        activeProject.id,

        {

          name: trimmedName,

          description: actionDescription.trim(),

        },

        token

      );



      const projectData = updatedProject?.project || updatedProject;



      const nextProjects = projects.map((project) =>

        String(project.id) === String(activeProject.id)

          ? { ...project, ...projectData }

          : project

      );



      publishProjects(nextProjects);

      setActionType("");

      setActiveProject(null);

    } catch (err) {

      setError(

        err.response?.data?.message ||

        err.message ||

        "Failed to update project."

      );

    } finally {

      setActionLoading(false);

    }

  };



  const handleDeleteProject = async () => {

    if (!activeProject || actionLoading) return;




    try {

      setActionLoading(true);

      setError("");



      await deleteProject(activeProject.id, token);



      const nextProjects = projects.filter(

        (project) =>

          String(project.id) !== String(activeProject.id)

      );



      publishProjects(nextProjects);

      setActionType("");

      setActiveProject(null);

    } catch (err) {

      setError(

        err.response?.data?.message ||

        err.message ||

        "Failed to delete project."

      );

    } finally {

      setActionLoading(false);

    }

  };



  const filteredProjects = useMemo(() => {

    const search = searchText.trim().toLowerCase();



    if (!search) {

      return projects;

    }



    return projects.filter(

      (project) =>

        project.name?.toLowerCase().includes(search) ||

        project.description?.toLowerCase().includes(search)

    );



  }, [projects, searchText]);



  if (loading) {

    return (

      <div

        style={{

          color: "#94a3b8",

          padding: "40px 0",

          fontSize: "14px",

        }}

      >

        Loading projects...

      </div>

    );

  }



  return (

    <div

      style={{

        width: "100%",

        maxWidth: "1200px",

        margin: "0 auto",

        boxSizing: "border-box",

      }}

    >

      {/* Header */}

      <div

        style={{

          display: "flex",

          justifyContent: "space-between",

          alignItems: "flex-start",

          marginBottom: "28px",

          gap: "20px",

          flexWrap: "wrap",

        }}

      >

        <div>

          <div

            style={{

              display: "flex",

              alignItems: "center",

              gap: "10px",

              marginBottom: "8px",

            }}

          >

            <FolderKanban size={25} color="#818cf8" />



            <h1

              style={{

                margin: 0,

                fontSize: "28px",

                fontWeight: "700",

                color: "#f8fafc",

              }}

            >

              Projects

            </h1>

          </div>



          <p

            style={{

              margin: 0,

              color: "#94a3b8",

              fontSize: "14px",

            }}

          >

            Build, collaborate and ship together.

          </p>

        </div>



        <button

          type="button"

          onClick={() => {

            setError("");

            setShowForm(true);

          }}

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

            flexShrink: 0,

          }}

        >

          <Plus size={18} />

          New Project

        </button>

      </div>



      {/* Error message */}

      {error && (

        <div

          role="alert"

          style={{

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            gap: "12px",

            background: "#450a0a",

            border: "1px solid #7f1d1d",

            color: "#fecaca",

            borderRadius: "8px",

            padding: "12px 14px",

            marginBottom: "20px",

            fontSize: "13px",

          }}

        >

          <span>{error}</span>



          <button

            type="button"

            onClick={() => setError("")}

            aria-label="Dismiss error"

            style={{

              background: "transparent",

              border: "none",

              color: "inherit",

              cursor: "pointer",

            }}

          >

            <X size={16} />

          </button>

        </div>

      )}



      {/* Project statistics */}

      <div

        style={{

          width: "100%",

          display: "flex",

          gap: "16px",

          marginBottom: "28px",

          boxSizing: "border-box",

        }}

      >

        <div

          style={{

            flex: 1,

            minWidth: 0,

            minHeight: "105px",

            background: "#0f172a",

            border: "1px solid #1e293b",

            borderRadius: "12px",

            padding: "18px 22px",

            boxSizing: "border-box",

          }}

        >

          <div

            style={{

              color: "#94a3b8",

              fontSize: "13px",

              marginBottom: "10px",

            }}

          >

            Total Projects

          </div>



          <div

            style={{

              fontSize: "28px",

              fontWeight: "700",

              color: "#f8fafc",

            }}

          >

            {projects.length}

          </div>

        </div>

      </div>



      {/* Search and count */}

      <div

        style={{

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          gap: "20px",

          marginBottom: "20px",

          flexWrap: "wrap",

        }}

      >

        <div

          style={{

            display: "flex",

            alignItems: "center",

            gap: "10px",

            width: "320px",

            maxWidth: "100%",

            height: "40px",

            background: "#0f172a",

            border: "1px solid #1e293b",

            borderRadius: "8px",

            padding: "0 12px",

            boxSizing: "border-box",

          }}

        >

          <Search size={17} color="#64748b" />



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

              color: "#e2e8f0",

              fontSize: "13px",

            }}

          />

        </div>



        <span

          style={{

            color: "#64748b",

            fontSize: "13px",

            whiteSpace: "nowrap",

          }}

        >

          {filteredProjects.length}{" "}

          {filteredProjects.length === 1 ? "project" : "projects"}

        </span>

      </div>



      {/* Project cards */}

      {filteredProjects.length === 0 ? (

        <div

          style={{

            border: "1px dashed #334155",

            borderRadius: "12px",

            padding: "70px 20px",

            textAlign: "center",

            background: "#0f172a",

          }}

        >

          <Code2

            size={42}

            color="#6366f1"

            style={{ marginBottom: "15px" }}

          />



          <h3

            style={{

              margin: "0 0 8px",

              color: "#f8fafc",

            }}

          >

            {searchText.trim()

              ? "No projects found"

              : "No projects yet"}

          </h3>



          <p

            style={{

              margin: "0 0 20px",

              color: "#64748b",

              fontSize: "14px",

            }}

          >

            {searchText.trim()

              ? "Try a different project name."

              : "Create your first project and start coding."}

          </p>



          {!searchText.trim() && (

            <button

              type="button"

              onClick={() => setShowForm(true)}

              style={{

                background: "#6366f1",

                color: "#ffffff",

                border: "none",

                borderRadius: "7px",

                padding: "10px 16px",

                cursor: "pointer",

              }}

            >

              Create Project

            </button>

          )}

        </div>

      ) : (

        <div

          style={{

            display: "grid",

            gridTemplateColumns:

              "repeat(auto-fit, minmax(280px, 1fr))",

            gap: "18px",

          }}

        >

          {filteredProjects.map((project) => (

            <div

              key={project.id}

              role="button"

              tabIndex={0}

              onClick={() => onSelectProject?.(project)}

              onKeyDown={(event) => {

                if (

                  event.target === event.currentTarget &&

                  (event.key === "Enter" || event.key === " ")

                ) {

                  event.preventDefault();

                  onSelectProject?.(project);

                }

              }}

              style={{

                position: "relative",

                textAlign: "left",

                background: "#0f172a",

                border: "1px solid #1e293b",

                borderRadius: "12px",

                padding: "20px",

                cursor: "pointer",

                transition: "all 0.2s ease",

                minHeight: "190px",

                boxSizing: "border-box",

                color: "inherit",

                font: "inherit",

              }}

              onMouseEnter={(event) => {

                event.currentTarget.style.borderColor = "#4f46e5";

              }}

              onMouseLeave={(event) => {

                event.currentTarget.style.borderColor = "#1e293b";

              }}

            >

              {/* Project actions menu */}

              {/* Owner-only project actions menu */}
              {isProjectOwner(project, currentUserId) && (
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    zIndex: 10,
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label={`Actions for ${project.name}`}
                    aria-expanded={openMenuProjectId === project.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuProjectId((current) =>
                        current === project.id ? null : project.id
                      );
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "34px",
                      height: "34px",
                      borderRadius: "7px",
                      border: "1px solid #334155",
                      background: "#1e293b",
                      color: "#cbd5e1",
                      cursor: "pointer",
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openMenuProjectId === project.id && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "40px",
                        width: "190px",
                        padding: "5px",
                        background: "#111827",
                        border: "1px solid #334155",
                        borderRadius: "9px",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openProjectAction("invite", project)}
                        style={menuItemStyle}
                      >
                        <UserPlus size={16} />
                        Invite members
                      </button>

                      <button
                        type="button"
                        onClick={() => openProjectAction("edit", project)}
                        style={menuItemStyle}
                      >
                        <Pencil size={16} />
                        Update project name
                      </button>

                      <button
                        type="button"
                        onClick={() => openProjectAction("delete", project)}
                        style={{ ...menuItemStyle, color: "#f87171" }}
                      >
                        <Trash2 size={16} />
                        Delete project
                      </button>
                    </div>
                  )}
                </div>
              )}


              <div

                style={{

                  width: "42px",

                  height: "42px",

                  borderRadius: "9px",

                  background: "#1e1b4b",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  marginBottom: "18px",

                }}

              >

                <Code2 size={21} color="#818cf8" />

              </div>



              <div

                style={{

                  display: "flex",

                  alignItems: "center",

                  gap: "10px",

                  marginBottom: "8px",

                }}

              >

                <FolderKanban size={20} color="#818cf8" />



                <h3

                  style={{

                    margin: 0,

                    color: "#f8fafc",

                    fontSize: "17px",

                    fontWeight: "600",

                    overflowWrap: "anywhere",

                  }}

                >

                  {project.name}

                </h3>

              </div>



              <p

                style={{

                  margin: "0 0 20px",

                  color: "#94a3b8",

                  fontSize: "13px",

                  lineHeight: "1.5",

                  minHeight: "40px",

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

                  paddingTop: "14px",

                  borderTop: "1px solid #1e293b",

                }}

              >

                <div

                  style={{

                    display: "flex",

                    alignItems: "center",

                    gap: "6px",

                    color: "#64748b",

                    fontSize: "11px",

                  }}

                >

                  <CalendarDays size={13} />

                  Project #{project.id}

                </div>



                <ArrowRight size={17} color="#64748b" />

              </div>

            </div>

          ))}

        </div>

      )}



      {/* Create project modal */}

      {showForm && (

        <div

          onMouseDown={(event) => {

            if (event.target === event.currentTarget && !creating) {

              setShowForm(false);

            }

          }}

          style={{

            position: "fixed",

            inset: 0,

            background: "rgba(2, 6, 23, 0.75)",

            backdropFilter: "blur(5px)",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            padding: "16px",

            zIndex: 100,

          }}

        >

          <form

            onSubmit={handleCreateProject}

            style={{

              width: "420px",

              maxWidth: "100%",

              background: "#0f172a",

              border: "1px solid #334155",

              borderRadius: "14px",

              padding: "24px",

              boxSizing: "border-box",

              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",

            }}

          >

            <div

              style={{

                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

                marginBottom: "24px",

              }}

            >

              <div>

                <h2

                  style={{

                    margin: "0 0 5px",

                    color: "#f8fafc",

                    fontSize: "20px",

                  }}

                >

                  Create Project

                </h2>



                <p

                  style={{

                    margin: 0,

                    color: "#64748b",

                    fontSize: "12px",

                  }}

                >

                  Create a project and start collaborating.

                </p>

              </div>



              <button

                type="button"

                onClick={() => setShowForm(false)}

                disabled={creating}

                aria-label="Close dialog"

                style={{

                  background: "transparent",

                  border: "none",

                  color: "#64748b",

                  cursor: creating ? "not-allowed" : "pointer",

                }}

              >

                <X size={20} />

              </button>

            </div>



            <label

              htmlFor="project-name"

              style={{

                display: "block",

                color: "#cbd5e1",

                fontSize: "13px",

                marginBottom: "7px",

              }}

            >

              Project name

            </label>



            <input

              id="project-name"

              type="text"

              placeholder="e.g. Code Interview Platform"

              value={name}

              onChange={(event) => setName(event.target.value)}

              maxLength={100}

              required

              autoFocus

              style={{

                width: "100%",

                height: "42px",

                background: "#020617",

                border: "1px solid #334155",

                borderRadius: "7px",

                padding: "0 12px",

                color: "#f8fafc",

                outline: "none",

                boxSizing: "border-box",

                marginBottom: "18px",

              }}

            />



            <label

              htmlFor="project-description"

              style={{

                display: "block",

                color: "#cbd5e1",

                fontSize: "13px",

                marginBottom: "7px",

              }}

            >

              Description

            </label>



            <textarea

              id="project-description"

              placeholder="What are you building?"

              value={description}

              onChange={(event) => setDescription(event.target.value)}

              maxLength={1000}

              rows={4}

              style={{

                width: "100%",

                background: "#020617",

                border: "1px solid #334155",

                borderRadius: "7px",

                padding: "10px 12px",

                color: "#f8fafc",

                outline: "none",

                resize: "vertical",

                boxSizing: "border-box",

                marginBottom: "22px",

                fontFamily: "inherit",

              }}

            />



            <div

              style={{

                display: "flex",

                justifyContent: "flex-end",

                gap: "10px",

              }}

            >

              <button

                type="button"

                onClick={() => setShowForm(false)}

                disabled={creating}

                style={{

                  background: "#1e293b",

                  color: "#cbd5e1",

                  border: "none",

                  borderRadius: "7px",

                  padding: "10px 16px",

                  cursor: creating ? "not-allowed" : "pointer",

                }}

              >

                Cancel

              </button>



              <button

                type="submit"

                disabled={!name.trim() || creating}

                style={{

                  display: "flex",

                  alignItems: "center",

                  gap: "7px",

                  background:

                    name.trim() && !creating ? "#6366f1" : "#312e81",

                  color: "#ffffff",

                  border: "none",

                  borderRadius: "7px",

                  padding: "10px 16px",

                  cursor:

                    name.trim() && !creating

                      ? "pointer"

                      : "not-allowed",

                  opacity: creating ? 0.7 : 1,

                }}

              >

                <Plus size={16} />

                {creating ? "Creating..." : "Create Project"}

              </button>

            </div>

          </form>

        </div>

      )}

      {/* Invite, edit, and delete project dialogs */}
      {activeProject && actionType && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) closeProjectAction();
          }}
          style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(2, 6, 23, 0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        >
          <form
            onSubmit={actionType === "invite" ? handleInviteMember : actionType === "edit" ? handleEditProject : (event) => event.preventDefault()}
            style={{ width: "420px", maxWidth: "100%", padding: "24px", borderRadius: "14px", border: "1px solid #334155", background: "#0f172a", boxSizing: "border-box" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "#f8fafc", fontSize: "19px" }}>
                {actionType === "invite" ? "Invite members" : actionType === "edit" ? "Update project name" : "Delete project"}
              </h2>
              <button type="button" disabled={actionLoading} onClick={closeProjectAction} aria-label="Close dialog" style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>
            </div>
            {error && (
              <p role="alert" style={{ color: "#fca5a5", fontSize: "13px", marginBottom: "16px" }}>
                {error}
              </p>
            )}

            {actionType === "invite" && (
              <>
                <p style={{ color: "#94a3b8", fontSize: "13px" }}>Invite a user to collaborate on <strong>{activeProject.name}</strong>.</p>
                <label htmlFor="invite-username" style={{ display: "block", color: "#cbd5e1", marginBottom: "8px" }}>Username</label>
                <input id="invite-username" value={inviteUsername} onChange={(event) => setInviteUsername(event.target.value)} placeholder="Enter username" required style={actionInputStyle} />
              </>
            )}
            {actionType === "edit" && (
              <>
                <label htmlFor="updated-project-name" style={{ display: "block", color: "#cbd5e1", marginBottom: "8px" }}>Project name</label>
                <input id="updated-project-name" value={actionName} onChange={(event) => setActionName(event.target.value)} maxLength={100} required style={actionInputStyle} />
              </>
            )}
            {actionType === "delete" && (
              <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>Are you sure you want to delete <strong>{activeProject.name}</strong>? This action cannot be undone.</p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button type="button" disabled={actionLoading} onClick={closeProjectAction} style={cancelButtonStyle}>Cancel</button>
              <button
                type={actionType === "delete" ? "button" : "submit"}
                disabled={actionLoading || (actionType === "invite" && !inviteUsername.trim()) || (actionType === "edit" && !actionName.trim())}
                onClick={actionType === "delete" ? handleDeleteProject : undefined}
                style={{ ...cancelButtonStyle, background: actionType === "delete" ? "#dc2626" : "#4f46e5", color: "#ffffff", opacity: actionLoading ? 0.7 : 1 }}
              >
                {actionLoading ? "Please wait..." : actionType === "invite" ? "Send invitation" : actionType === "edit" ? "Save changes" : "Delete project"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>



  );

};



export default ProjectList;