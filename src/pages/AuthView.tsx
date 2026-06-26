import React, { useState } from "react";
import { apiService } from "../data/apiService";

export default function AuthView({ onLogin }: { onLogin: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    fullName: "",
    username: "",
    email: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        if (!formData.identifier || !formData.password) {
          throw new Error("Please enter identifier and password");
        }
        const user = await apiService.login(formData.identifier, formData.password);
        onLogin(user);
      } else {
        if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
          throw new Error("Please fill in all fields");
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        const user = await apiService.register({
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brutal-modal" style={{ width: "100%", maxWidth: "450px" }}>
      <div className="modal-header">
        <h3>{isLogin ? "Welcome Back" : "Create Account"}</h3>
      </div>

      <form onSubmit={handleSubmit} className="brutal-form">
        {error && <div className="form-error-msg">{error}</div>}

        {!isLogin && (
          <>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="brutal-input"
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="brutal-input"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="brutal-input"
              />
            </div>
          </>
        )}

        {isLogin && (
          <div className="form-group">
            <label>Email or Username</label>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              className="brutal-input"
            />
          </div>
        )}

        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
            <label>Password</label>
            {isLogin && (
              <button 
                type="button" 
                style={{ background: "none", border: "none", fontSize: "11px", fontWeight: 800, textDecoration: "underline", cursor: "pointer" }}
              >
                FORGOT PASSWORD?
              </button>
            )}
          </div>
          <div className="input-with-icon" style={{ position: "relative", display: "flex", width: "100%" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="brutal-input"
              style={{ width: "100%", paddingRight: "50px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "12px", background: "none", border: "none", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
        </div>

        {!isLogin && (
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="brutal-input"
            />
          </div>
        )}

        {isLogin && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <input 
              type="checkbox" 
              id="rememberMe"
              style={{ width: "16px", height: "16px", border: "2px solid #000", cursor: "pointer" }}
            />
            <label htmlFor="rememberMe" style={{ fontSize: "12px", fontWeight: 800, cursor: "pointer" }}>
              REMEMBER ME
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ justifyContent: "center", marginTop: "8px", padding: "16px", fontSize: "16px" }}
        >
          {loading ? "PLEASE WAIT..." : isLogin ? "LOGIN" : "CREATE ACCOUNT"}
        </button>

        <div style={{ textAlign: "center", marginTop: "8px", fontSize: "13px", fontWeight: 800 }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            style={{ background: "none", border: "none", marginLeft: "8px", textDecoration: "underline", fontWeight: 900, cursor: "pointer" }}
          >
            {isLogin ? "SIGN UP" : "LOGIN"}
          </button>
        </div>
      </form>
    </div>
  );
}
