import { useState } from "react";
import axios from "axios";
import { saveToken } from "../services/authStorage";

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      saveToken(response.data.token);

      alert("Login successful!");

      window.location.reload();
    } catch (error) {
      console.error("Login failed:", error);

      alert(
        error.response?.data?.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  // SIGN UP
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !username || !email || !password) {
      alert("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name,
          username,
          email,
          password,
        }
      );

      alert(
        response.data.message ||
          "Account created successfully!"
      );

      // Switch back to login
      setIsSignup(false);

      // Clear fields
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Signup failed:", error);

      alert(
        error.response?.data?.message ||
          "Failed to create account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "16px",
          padding: "32px",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              color: "#ffffff",
            }}
          >
            Code Meet
          </h1>

          <p
            style={{
              color: "#94a3b8",
              marginTop: "8px",
              marginBottom: 0,
            }}
          >
            {isSignup
              ? "Create your Code Meet account"
              : "Collaborate. Code. Interview."}
          </p>
        </div>

        {/* LOGIN */}
        {!isSignup ? (
          <form onSubmit={handleLogin}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: "22px",
              }}
            >
              Login
            </h2>

            {/* EMAIL */}
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

            {/* SIGNUP LINK */}
            <p style={switchTextStyle}>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setIsSignup(true)}
                style={linkButtonStyle}
              >
                Sign Up
              </button>
            </p>
          </form>
        ) : (
          /* SIGN UP */
          <form onSubmit={handleSignup}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: "22px",
              }}
            >
              Create Account
            </h2>

            {/* NAME */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            {/* USERNAME */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>
                Username
              </label>

              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            {/* EMAIL */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>
                Password
              </label>

              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            {/* SIGNUP BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

            {/* LOGIN LINK */}
            <p style={switchTextStyle}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsSignup(false)}
                style={linkButtonStyle}
              >
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

// STYLES

const labelStyle = {
  display: "block",
  fontSize: "13px",
  color: "#cbd5e1",
  marginBottom: "7px",
};

const inputStyle = {
  width: "100%",
  padding: "12px 13px",
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "8px",
  color: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
  fontSize: "14px",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "#4f46e5",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
};

const switchTextStyle = {
  textAlign: "center",
  color: "#94a3b8",
  fontSize: "13px",
  marginTop: "20px",
};

const linkButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#818cf8",
  cursor: "pointer",
  fontWeight: "600",
  padding: 0,
};

export default Login;