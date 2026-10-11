import { useEffect, useState } from "react";
import {
    FileCode2,
    FilePlus,
    Play,
    Save,
    Terminal,
    X,
    Users,
    PanelRightOpen,
    Circle,
    ArrowLeft,
} from "lucide-react";
import {
    getProjectFiles,
    createProjectFile,
    updateProjectFile,
} from "../services/fileApi";
import CodeEditor from "./CodeEditor";
import ProjectCollaborationPanel from "./ProjectCollaborationPanel";
import axios from "axios";
const getLanguageFromFileName = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const languages = {
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        java: "java",
        py: "python",
        cpp: "cpp",
        c: "c",
        html: "html",
        css: "css",
        json: "json",
    };
    return languages[extension] || "plaintext";
};
const FileExplorer = ({ projectId, token }) => {
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [fileName, setFileName] = useState("");
    const [output, setOutput] = useState("");
    const [input, setInput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");
    const [activeUsers, setActiveUsers] = useState([]);
    const collaboratorCount = activeUsers.length;
    const [isCollaborationOpen, setIsCollaborationOpen] = useState(true);
    useEffect(() => {
        const loadFiles = async () => {
            try {
                const projectFiles = await getProjectFiles(projectId, token);
                setFiles(projectFiles);
                if (projectFiles.length > 0) {
                    setSelectedFile(projectFiles[0]);
                }
            } catch (error) {
                console.error("Failed to load project files:", error);
            }
        };
        loadFiles();
    }, [projectId, token]);
    const handleCreateFile = async () => {
        if (!fileName.trim()) {
            return;
        }
        try {
            const newFile = await createProjectFile(
                projectId,
                {
                    name: fileName,
                    path: fileName,
                    language: getLanguageFromFileName(fileName),
                    content: "",
                },
                token,
            );
            setFiles((currentFiles) => [...currentFiles, newFile]);
            setSelectedFile(newFile);
            setFileName("");
            setShowForm(false);
        } catch (error) {
            console.error("Failed to create file:", error);
        }
    };
    const handleSaveFile = async () => {
        if (!selectedFile) {
            return;
        }
        setIsSaving(true);
        setSaveStatus("Saving...");
        try {
            const updatedFile = await updateProjectFile(
                projectId,
                selectedFile.id,
                {
                    name: selectedFile.name,
                    path: selectedFile.path,
                    language: selectedFile.language,
                    content: selectedFile.content,
                },
                token,
            );
            setSelectedFile(updatedFile);
            setFiles((currentFiles) =>
                currentFiles.map((file) =>
                    file.id === updatedFile.id ? updatedFile : file,
                ),
            );
            setSaveStatus("Saved");
            setTimeout(() => {
                setSaveStatus("");
            }, 2000);
        } catch (error) {
            console.error("Failed to save file:", error);
            setSaveStatus("Save failed");
        } finally {
            setIsSaving(false);
        }
    };
    const handleRunCode = async () => {
        if (!selectedFile) {
            return;
        }
        setIsRunning(true);
        setOutput("");
        try {
            const response = await axios.post(
                "http://localhost:5000/api/code/run",
                {
                    code: selectedFile.content,
                    language: selectedFile.language || "java",
                    fileName: selectedFile.name,
                    stdin: input,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const result = response.data;
            if (result.error) {
                setOutput(result.error);
            } else {
                setOutput(
                    `${result.output || "(no output)"}\n\nExecution time: ${result.executionTime
                    } ms`,
                );
            }
        } catch (error) {
            console.error("Failed to run code:", error);
            setOutput("Failed to execute code.");
        } finally {
            setIsRunning(false);
        }
    };
    return (
        <div
            style={{
                height: "calc(100vh - 126px)",
                minHeight: "650px",
                display: "flex",
                flexDirection: "column",
                background: "#020617",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                overflow: "hidden",
            }}
        >
            {/* Workspace Header */}
            <div
                style={{
                    height: "58px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 18px",
                    borderBottom: "1px solid #1e293b",
                    background: "#0f172a",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <button
                        onClick={() => window.history.back()}
                        style={{
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#111827",
                            border: "1px solid #1e293b",
                            borderRadius: "7px",
                            color: "#94a3b8",
                            cursor: "pointer",
                        }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div
                            style={{
                                color: "#f8fafc",
                                fontSize: "14px",
                                fontWeight: "600",
                            }}
                        >
                            Code Workspace
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#64748b",
                                fontSize: "11px",
                            }}
                        >
                            <Circle size={7} fill="#22c55e" color="#22c55e" />
                            Live collaboration
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            color: "#94a3b8",
                            fontSize: "12px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={{
                                    width: "7px",
                                    height: "7px",
                                    borderRadius: "50%",
                                    background: "#22c55e",
                                    boxShadow: "0 0 8px #22c55e",
                                }}
                            />
                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>Live</span>
                            <Users size={15} color="#94a3b8" />
                            <span style={{ color: "#cbd5e1", fontSize: "12px" }}>
                                {collaboratorCount}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Main Coding Area */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                }}
            >
                {/* Explorer */}
                <aside
                    style={{
                        width: "220px",
                        flexShrink: 0,
                        background: "#0b1120",
                        borderRight: "1px solid #1e293b",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Explorer header */}
                    <div
                        style={{
                            height: "48px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 14px",
                            borderBottom: "1px solid #1e293b",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "7px",
                            }}
                        >
                            <span
                                style={{
                                    color: "#94a3b8",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    letterSpacing: "0.08em",
                                }}
                            >
                                EXPLORER
                            </span>
                            <span
                                style={{
                                    color: "#475569",
                                    fontSize: "10px",
                                }}
                            >
                                {files.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            title="New file"
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#64748b",
                                cursor: "pointer",
                            }}
                        >
                            <FilePlus size={16} />
                        </button>
                    </div>
                    {/* Files */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "10px 8px",
                        }}
                    >
                        {files.length === 0 ? (
                            <div
                                style={{
                                    padding: "30px 12px",
                                    textAlign: "center",
                                    color: "#475569",
                                    fontSize: "11px",
                                }}
                            >
                                <FileCode2
                                    size={24}
                                    style={{
                                        marginBottom: "8px",
                                        opacity: 0.6,
                                    }}
                                />
                                <div>No files yet</div>
                                <div
                                    style={{
                                        marginTop: "4px",
                                        color: "#334155",
                                    }}
                                >
                                    Create a file to start coding
                                </div>
                            </div>
                        ) : (
                            files.map((file) => {
                                const active = selectedFile?.id === file.id;
                                return (
                                    <div
                                        key={file.id}
                                        onClick={() => setSelectedFile(file)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "9px",
                                            padding: "9px 10px",
                                            marginBottom: "3px",
                                            borderRadius: "6px",
                                            background: active ? "#1e293b" : "transparent",
                                            color: active ? "#f8fafc" : "#94a3b8",
                                            cursor: "pointer",
                                            fontSize: "13px",
                                        }}
                                    >
                                        <FileCode2
                                            size={15}
                                            color={active ? "#818cf8" : "#64748b"}
                                        />
                                        <span
                                            style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {file.name}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {/* New file */}
                    <div
                        style={{
                            padding: "12px",
                            borderTop: "1px solid #1e293b",
                        }}
                    >
                        <button
                            onClick={() => setShowForm(true)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#1e293b";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#111827";
                            }}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "7px",
                                background: "#111827",
                                border: "1px solid #1e293b",
                                borderRadius: "7px",
                                color: "#cbd5e1",
                                padding: "9px",
                                cursor: "pointer",
                                fontSize: "12px",
                            }}
                        >
                            <FilePlus size={15} />
                            New File
                        </button>
                    </div>
                </aside>
                {/* Editor */}
                <section
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {selectedFile ? (
                        <>
                            {/* Editor tab */}
                            <div
                                style={{
                                    height: "48px",
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    background: "#0f172a",
                                    borderBottom: "1px solid #1e293b",
                                    padding: "0 14px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        color: "#e2e8f0",
                                        fontSize: "13px",
                                    }}
                                >
                                    <FileCode2 size={15} color="#818cf8" />
                                    <span
                                        style={{
                                            padding: "3px 7px",
                                            borderRadius: "5px",
                                            background: "#1e293b",
                                            color: "#818cf8",
                                            fontSize: "10px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {getLanguageFromFileName(selectedFile.name).toUpperCase()}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        color: saveStatus === "Save failed" ? "#ef4444" : "#64748b",
                                        fontSize: "11px",
                                    }}
                                >
                                    <Circle
                                        size={7}
                                        fill={saveStatus === "Save failed" ? "#ef4444" : "#22c55e"}
                                        color={saveStatus === "Save failed" ? "#ef4444" : "#22c55e"}
                                    />
                                    {saveStatus || "Synced"}
                                </div>
                            </div>
                            {/* Monaco */}
                            <div
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    background: "#1e1e1e",
                                }}
                            >
                                <CodeEditor
                                    projectId={projectId}
                                    fileId={selectedFile.id}
                                    token={token}
                                    value={selectedFile.content}
                                    language={selectedFile.language || "plaintext"}
                                    onChange={(value) => {
                                        const newContent = value || "";

                                        setSelectedFile((current) => ({
                                            ...current,
                                            content: newContent,
                                        }));
                                    }}
                                    onPresenceChange={setActiveUsers}
                                />
                            </div>
                            {/* Bottom panel */}
                            <div
                                style={{
                                    height: "190px",
                                    flexShrink: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    background: "#0b1120",
                                    borderTop: "1px solid #1e293b",
                                }}
                            >
                                {/* Bottom header */}
                                <div
                                    style={{
                                        height: "42px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "0 14px",
                                        borderBottom: "1px solid #1e293b",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "7px",
                                            color: "#94a3b8",
                                            fontSize: "11px",
                                            fontWeight: "700",
                                        }}
                                    >
                                        <Terminal size={15} />
                                        <span>TERMINAL</span>
                                        <span
                                            style={{
                                                color: isRunning ? "#f59e0b" : "#64748b",
                                                fontSize: "10px",
                                                fontWeight: "500",
                                            }}
                                        >
                                            {isRunning ? "Running..." : "Ready"}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "8px",
                                        }}
                                    >
                                        <button
                                            onClick={handleSaveFile}
                                            disabled={isSaving}
                                            onMouseEnter={(e) => {
                                                if (!isSaving) {
                                                    e.currentTarget.style.background = "#1e293b";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "#111827";
                                            }}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                background: "#111827",
                                                border: "1px solid #334155",
                                                color: "#cbd5e1",
                                                borderRadius: "6px",
                                                padding: "6px 10px",
                                                cursor: "pointer",
                                                fontSize: "11px",
                                            }}
                                        >
                                            <Save size={14} />
                                            {isSaving ? "Saving..." : "Save"}
                                        </button>
                                        <button
                                            onClick={handleRunCode}
                                            disabled={isRunning}
                                            onMouseEnter={(e) => {
                                                if (!isRunning) {
                                                    e.currentTarget.style.background = "#4f46e5";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = isRunning
                                                    ? "#3730a3"
                                                    : "#6366f1";
                                            }}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                background: isRunning ? "#3730a3" : "#6366f1",
                                                border: "none",
                                                color: "#ffffff",
                                                borderRadius: "6px",
                                                padding: "6px 12px",
                                                cursor: isRunning ? "not-allowed" : "pointer",
                                                fontSize: "11px",
                                                fontWeight: "600",
                                            }}
                                        >
                                            <Play size={13} fill="currentColor" />
                                            {isRunning ? "Running..." : "Run"}
                                        </button>
                                    </div>
                                </div>
                                {/* Input/output */}
                                <div
                                    style={{
                                        flex: 1,
                                        minHeight: 0,
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                    }}
                                >
                                    {/* Input */}
                                    <div
                                        style={{
                                            padding: "10px 14px",
                                            borderRight: "1px solid #1e293b",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                color: "#64748b",
                                                fontSize: "10px",
                                                marginBottom: "6px",
                                            }}
                                        >
                                            <span>INPUT</span>
                                            <span
                                                style={{
                                                    color: "#475569",
                                                    fontSize: "9px",
                                                }}
                                            >
                                                stdin
                                            </span>
                                        </div>
                                        <textarea
                                            value={input}
                                            onInput={(e) => {
                                                setInput(e.currentTarget.value);
                                            }}
                                            placeholder="Enter program input..."
                                            style={{
                                                width: "100%",
                                                height: "95px",
                                                resize: "none",
                                                boxSizing: "border-box",
                                                background: "#020617",
                                                border: "1px solid #1e293b",
                                                borderRadius: "6px",
                                                padding: "8px",
                                                color: "#cbd5e1",
                                                outline: "none",
                                                fontFamily: "monospace",
                                                fontSize: "12px",
                                            }}
                                        />
                                    </div>
                                    {/* Output */}
                                    <div
                                        style={{
                                            padding: "10px 14px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                color: "#64748b",
                                                fontSize: "10px",
                                                marginBottom: "6px",
                                            }}
                                        >
                                            <span>OUTPUT</span>
                                            <span
                                                style={{
                                                    color: "#475569",
                                                    fontSize: "9px",
                                                }}
                                            >
                                                stdout
                                            </span>
                                        </div>
                                        <pre
                                            style={{
                                                margin: 0,
                                                height: "95px",
                                                overflow: "auto",
                                                boxSizing: "border-box",
                                                background: "#020617",
                                                border: "1px solid #1e293b",
                                                borderRadius: "6px",
                                                padding: "8px",
                                                color: "#94a3b8",
                                                fontFamily: "monospace",
                                                fontSize: "12px",
                                                whiteSpace: "pre-wrap",
                                            }}
                                        >
                                            {output || "Run your code to see output..."}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#64748b",
                            }}
                        >
                            <div style={{ textAlign: "center" }}>
                                <FileCode2 size={42} style={{ marginBottom: "12px" }} />
                                <div style={{ fontSize: "14px" }}>
                                    Select a file to start coding
                                </div>
                            </div>
                        </div>
                    )}
                </section>
                {isCollaborationOpen ? (
                    <ProjectCollaborationPanel
                        projectId={projectId}
                        token={token}
                        collaboratorCount={collaboratorCount}
                        activeUsers={activeUsers}
                        onClose={() => setIsCollaborationOpen(false)}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsCollaborationOpen(true)}
                        title="Open project collaboration"
                        aria-label="Open project collaboration"
                        style={{
                            width: "42px",
                            flexShrink: 0,
                            background: "#0f172a",
                            border: "none",
                            borderLeft: "1px solid #1e293b",
                            color: "#cbd5e1",
                            cursor: "pointer",
                        }}
                    >
                        <PanelRightOpen size={18} />
                    </button>
                )}
            </div>
            {/* Create File Modal */}
            {
                showForm && (
                    <div
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(2, 6, 23, 0.75)",
                            backdropFilter: "blur(5px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 200,
                        }}
                    >
                        <div
                            style={{
                                width: "400px",
                                background: "#0f172a",
                                border: "1px solid #334155",
                                borderRadius: "12px",
                                padding: "22px",
                                boxSizing: "border-box",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "20px",
                                }}
                            >
                                <div>
                                    <h3
                                        style={{
                                            margin: "0 0 5px",
                                            color: "#f8fafc",
                                        }}
                                    >
                                        Create New File
                                    </h3>
                                    <p
                                        style={{
                                            margin: 0,
                                            color: "#64748b",
                                            fontSize: "12px",
                                        }}
                                    >
                                        Add a file to this project.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowForm(false)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#64748b",
                                        cursor: "pointer",
                                    }}
                                >
                                    <X size={19} />
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="e.g. Main.java"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "#6366f1";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "#334155";
                                }}
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
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "8px",
                                }}
                            >
                                <button
                                    onClick={() => setShowForm(false)}
                                    style={{
                                        background: "#1e293b",
                                        border: "none",
                                        color: "#cbd5e1",
                                        borderRadius: "7px",
                                        padding: "9px 14px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateFile}
                                    disabled={!fileName.trim()}
                                    onMouseEnter={(e) => {
                                        if (fileName.trim()) {
                                            e.currentTarget.style.background = "#4f46e5";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = fileName.trim()
                                            ? "#6366f1"
                                            : "#312e81";
                                    }}
                                    style={{
                                        background: fileName.trim() ? "#6366f1" : "#312e81",
                                        border: "none",
                                        color: "#ffffff",
                                        borderRadius: "7px",
                                        padding: "9px 14px",
                                        cursor: fileName.trim() ? "pointer" : "not-allowed",
                                    }}
                                >
                                    Create File
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
export default FileExplorer;