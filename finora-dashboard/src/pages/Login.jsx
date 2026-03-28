import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("user1@gmail.com");
  const [password, setPassword] = useState("finora123");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/app/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="eyebrow">Sign in</div>
        <h2>Welcome back to Finora</h2>
        <p>Use the seeded credentials or create your own account.</p>
        <div className="hint-card">
          <strong>Seeded demo account</strong>
          <span>Email: user1@gmail.com</span>
          <span>Password: finora123</span>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button className="primary-btn full" type="submit">Login</button>
          {error && <div className="form-error">{error}</div>}
        </form>
        <div className="form-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}
