import { useEffect, useState } from "react";
import { Play, Clock3, User, Code2 } from "lucide-react";
import CodeEditor from "./CodeEditor";
import {
  createInterview,
  updateInterviewStatus,
  createInterviewEvaluation,
  getInterviewEvaluation,
} from "../services/interviewApi";
import axios from "axios";

const Interview = ({ projectId, token }) => {
  const [problemTitle, setProblemTitle] = useState("Two Sum");

  const [problemDescription, setProblemDescription] = useState(
    "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target."
  );

  const [durationMinutes, setDurationMinutes] = useState(30);
  const [candidateId, setCandidateId] = useState(3);

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [code, setCode] = useState(`public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}`);

  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [evaluation, setEvaluation] = useState({
    problemSolving: 0,
    codeQuality: 0,
    communication: 0,
    feedback: "",
  });

  const [savedEvaluation, setSavedEvaluation] = useState(null);

  // TIMER
  useEffect(() => {
    if (!session || session.status !== "ACTIVE") {
      return;
    }

    setTimeLeft(session.durationMinutes * 60);

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  // LOAD SAVED EVALUATION
  useEffect(() => {
    if (!session || session.status !== "COMPLETED") {
      return;
    }

    const loadEvaluation = async () => {
      try {
        const data = await getInterviewEvaluation(session.id, token);

        setSavedEvaluation(data);
      } catch (error) {
        console.log("No saved evaluation yet.");
        setSavedEvaluation(null);
      }
    };

    loadEvaluation();
  }, [session, token]);

  // CREATE INTERVIEW
  const handleCreateInterview = async () => {
    try {
      setLoading(true);

      const newSession = await createInterview(
        {
          projectId,
          candidateId,
          problemTitle,
          problemDescription,
          durationMinutes,
        },
        token
      );

      setSession(newSession);

      console.log("Interview created:", newSession);
    } catch (error) {
      console.error("Create interview error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to create interview"
      );
    } finally {
      setLoading(false);
    }
  };

  // START INTERVIEW
  const handleStartInterview = async () => {
    if (!session) return;

    try {
      const updatedSession = await updateInterviewStatus(
        session.id,
        "ACTIVE",
        token
      );

      setSession(updatedSession);
    } catch (error) {
      console.error("Start interview error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to start interview"
      );
    }
  };

  // COMPLETE INTERVIEW
  const handleCompleteInterview = async () => {
    if (!session) return;

    try {
      const updatedSession = await updateInterviewStatus(
        session.id,
        "COMPLETED",
        token
      );

      setSession(updatedSession);
    } catch (error) {
      console.error("Complete interview error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to complete interview"
      );
    }
  };

  // RUN CODE
  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setOutput("");

      const response = await axios.post(
        "http://localhost:5000/api/code/run",
        {
          code,
          language: "java",
          fileName: "Main.java",
          stdin: "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.error) {
        setOutput(response.data.error);
      } else {
        setOutput(
          response.data.output ||
            "Program finished with no output."
        );
      }
    } catch (error) {
      console.error(
        "Interview code execution error:",
        error
      );

      setOutput(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Code execution failed"
      );
    } finally {
      setIsRunning(false);
    }
  };

  // SAVE EVALUATION
  const handleSaveEvaluation = async () => {
    try {
      if (
        !evaluation.problemSolving ||
        !evaluation.codeQuality ||
        !evaluation.communication
      ) {
        alert("Please select all evaluation scores.");
        return;
      }

      const saved = await createInterviewEvaluation(
        session.id,
        evaluation,
        token
      );

      console.log("Evaluation saved:", saved);

      setSavedEvaluation(saved);

      alert("Evaluation saved successfully!");
    } catch (error) {
      console.error(
        "Save evaluation error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to save evaluation"
      );
    }
  };

  return (
    <div
      style={{
        padding: "32px",
        color: "#ffffff",
        minHeight: "100%",
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <Code2 size={26} color="#6366f1" />

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
            }}
          >
            Interview
          </h1>
        </div>

        <p
          style={{
            margin: 0,
            color: "#94a3b8",
          }}
        >
          Conduct a structured coding interview.
        </p>
      </div>

      {/* CREATE INTERVIEW */}
      {!session ? (
        <div
          style={{
            maxWidth: "700px",
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "14px",
            padding: "24px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Create Interview Session
          </h2>

          {/* PROBLEM TITLE */}
          <div style={{ marginBottom: "18px" }}>
            <label>Problem Title</label>

            <input
              value={problemTitle}
              onChange={(e) =>
                setProblemTitle(e.target.value)
              }
              style={inputStyle}
            />
          </div>

          {/* PROBLEM DESCRIPTION */}
          <div style={{ marginBottom: "18px" }}>
            <label>Problem Description</label>

            <textarea
              value={problemDescription}
              onChange={(e) =>
                setProblemDescription(e.target.value)
              }
              rows={5}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

          {/* CANDIDATE */}
          <div style={{ marginBottom: "18px" }}>
            <label>Candidate ID</label>

            <input
              type="number"
              value={candidateId}
              onChange={(e) =>
                setCandidateId(Number(e.target.value))
              }
              style={inputStyle}
            />
          </div>

          {/* DURATION */}
          <div style={{ marginBottom: "22px" }}>
            <label>Duration (minutes)</label>

            <input
              type="number"
              value={durationMinutes}
              onChange={(e) =>
                setDurationMinutes(
                  Number(e.target.value)
                )
              }
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleCreateInterview}
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Play size={17} />

            {loading
              ? "Creating..."
              : "Create Interview"}
          </button>
        </div>
      ) : (
        /* INTERVIEW SESSION */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "20px",
          }}
        >
          {/* LEFT SIDE */}
          <div
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: "14px",
              padding: "28px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {session.problemTitle}
            </h2>

            <p
              style={{
                color: "#cbd5e1",
                lineHeight: 1.7,
              }}
            >
              {session.problemDescription}
            </p>

            {/* CODE EDITOR */}
            <div
              style={{
                marginTop: "28px",
                height: "400px",
                border: "1px solid #1f2937",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <CodeEditor
                projectId={projectId}
                fileId={`interview-${session.id}`}
                value={code}
                language="java"
                onChange={setCode}
              />
            </div>

            {/* RUN BUTTON */}
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              style={{
                ...buttonStyle,
                marginTop: "12px",
                opacity: isRunning ? 0.6 : 1,
              }}
            >
              <Play size={16} />

              {isRunning
                ? "Running..."
                : "Run Code"}
            </button>

            {/* OUTPUT */}
            <div
              style={{
                marginTop: "12px",
                background: "#020617",
                borderRadius: "8px",
                padding: "14px",
                minHeight: "80px",
                color: "#cbd5e1",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
              }}
            >
              <div
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                  marginBottom: "8px",
                }}
              >
                OUTPUT
              </div>

              {output ||
                "Run your code to see the output here."}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: "14px",
              padding: "22px",
              height: "fit-content",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Interview Details
            </h3>

            {/* DURATION */}
            <InfoRow
              icon={<Clock3 size={17} />}
              label="Duration"
              value={`${session.durationMinutes} minutes`}
            />

            {/* CANDIDATE */}
            <InfoRow
              icon={<User size={17} />}
              label="Candidate"
              value={`User #${session.candidateId}`}
            />

            {/* STATUS */}
            <InfoRow
              icon={<Code2 size={17} />}
              label="Status"
              value={session.status}
            />

            {/* TIMER */}
            {session.status === "ACTIVE" && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  background: "#0f172a",
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginBottom: "6px",
                  }}
                >
                  Time Remaining
                </div>

                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color:
                      timeLeft <= 60
                        ? "#ef4444"
                        : "#ffffff",
                  }}
                >
                  {Math.floor(timeLeft / 60)
                    .toString()
                    .padStart(2, "0")}
                  :
                  {(timeLeft % 60)
                    .toString()
                    .padStart(2, "0")}
                </div>
              </div>
            )}

            {/* START INTERVIEW */}
            {session.status === "WAITING" && (
              <button
                onClick={handleStartInterview}
                style={{
                  ...buttonStyle,
                  width: "100%",
                  marginTop: "20px",
                }}
              >
                <Play size={17} />

                Start Interview
              </button>
            )}

            {/* COMPLETE INTERVIEW */}
            {session.status === "ACTIVE" && (
              <button
                onClick={handleCompleteInterview}
                style={{
                  ...buttonStyle,
                  width: "100%",
                  marginTop: "12px",
                  background: "#dc2626",
                }}
              >
                Complete Interview
              </button>
            )}

            {/* COMPLETED INTERVIEW */}
            {session.status === "COMPLETED" && (
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "20px",
                  borderTop: "1px solid #1f2937",
                }}
              >
                {savedEvaluation ? (
                  /* REPORT */
                  <>
                    <h3 style={{ marginTop: 0 }}>
                      Interview Report
                    </h3>

                    <InfoRow
                      label="Problem Solving"
                      value={`${savedEvaluation.problemSolving} / 5`}
                    />

                    <InfoRow
                      label="Code Quality"
                      value={`${savedEvaluation.codeQuality} / 5`}
                    />

                    <InfoRow
                      label="Communication"
                      value={`${savedEvaluation.communication} / 5`}
                    />

                    <div
                      style={{
                        marginTop: "18px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginBottom: "8px",
                        }}
                      >
                        Feedback
                      </div>

                      <div
                        style={{
                          color: "#cbd5e1",
                          background: "#0f172a",
                          padding: "12px",
                          borderRadius: "8px",
                        }}
                      >
                        {savedEvaluation.feedback ||
                          "No feedback provided."}
                      </div>
                    </div>
                  </>
                ) : (
                  /* EVALUATION FORM */
                  <>
                    <h3 style={{ marginTop: 0 }}>
                      Evaluation
                    </h3>

                    {/* PROBLEM SOLVING */}
                    <label>
                      Problem Solving
                    </label>

                    <select
                      value={
                        evaluation.problemSolving
                      }
                      onChange={(e) =>
                        setEvaluation({
                          ...evaluation,
                          problemSolving:
                            Number(
                              e.target.value
                            ),
                        })
                      }
                      style={inputStyle}
                    >
                      <option value={0}>
                        Select score
                      </option>

                      <option value={1}>
                        1 - Poor
                      </option>

                      <option value={2}>
                        2 - Needs Improvement
                      </option>

                      <option value={3}>
                        3 - Average
                      </option>

                      <option value={4}>
                        4 - Good
                      </option>

                      <option value={5}>
                        5 - Excellent
                      </option>
                    </select>

                    {/* CODE QUALITY */}
                    <label
                      style={{
                        display: "block",
                        marginTop: "16px",
                      }}
                    >
                      Code Quality
                    </label>

                    <select
                      value={
                        evaluation.codeQuality
                      }
                      onChange={(e) =>
                        setEvaluation({
                          ...evaluation,
                          codeQuality:
                            Number(
                              e.target.value
                            ),
                        })
                      }
                      style={inputStyle}
                    >
                      <option value={0}>
                        Select score
                      </option>

                      <option value={1}>
                        1 - Poor
                      </option>

                      <option value={2}>
                        2 - Needs Improvement
                      </option>

                      <option value={3}>
                        3 - Average
                      </option>

                      <option value={4}>
                        4 - Good
                      </option>

                      <option value={5}>
                        5 - Excellent
                      </option>
                    </select>

                    {/* COMMUNICATION */}
                    <label
                      style={{
                        display: "block",
                        marginTop: "16px",
                      }}
                    >
                      Communication
                    </label>

                    <select
                      value={
                        evaluation.communication
                      }
                      onChange={(e) =>
                        setEvaluation({
                          ...evaluation,
                          communication:
                            Number(
                              e.target.value
                            ),
                        })
                      }
                      style={inputStyle}
                    >
                      <option value={0}>
                        Select score
                      </option>

                      <option value={1}>
                        1 - Poor
                      </option>

                      <option value={2}>
                        2 - Needs Improvement
                      </option>

                      <option value={3}>
                        3 - Average
                      </option>

                      <option value={4}>
                        4 - Good
                      </option>

                      <option value={5}>
                        5 - Excellent
                      </option>
                    </select>

                    {/* FEEDBACK */}
                    <label
                      style={{
                        display: "block",
                        marginTop: "16px",
                      }}
                    >
                      Feedback
                    </label>

                    <textarea
                      value={evaluation.feedback}
                      onChange={(e) =>
                        setEvaluation({
                          ...evaluation,
                          feedback:
                            e.target.value,
                        })
                      }
                      rows={4}
                      placeholder="Write interview feedback..."
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                      }}
                    />

                    {/* SAVE EVALUATION */}
                    <button
                      onClick={
                        handleSaveEvaluation
                      }
                      style={{
                        ...buttonStyle,
                        width: "100%",
                        marginTop: "12px",
                      }}
                    >
                      Save Evaluation
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// INFO ROW
const InfoRow = ({ icon, label, value }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "18px",
      color: "#cbd5e1",
    }}
  >
    {icon}

    <div>
      <div
        style={{
          fontSize: "12px",
          color: "#64748b",
        }}
      >
        {label}
      </div>

      <div>{value}</div>
    </div>
  </div>
);

// INPUT STYLE
const inputStyle = {
  width: "100%",
  marginTop: "8px",
  padding: "11px 12px",
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "8px",
  color: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
};

// BUTTON STYLE
const buttonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "11px 18px",
  background: "#4f46e5",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

export default Interview;