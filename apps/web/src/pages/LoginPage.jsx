import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { user, checking, adminStatus } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  if (!checking && user) {
    nav("/dashboard", { replace: true });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      const to = loc.state?.from?.pathname || "/dashboard";
      nav(to, { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Login error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Comidas Periódicas</h1>
        <p className="muted"></p>

        <form className="form" onSubmit={onSubmit}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {err ? <div className="error">{err}</div> : null}
          {adminStatus && adminStatus !== "OK" ? (
            <div className="muted">{adminStatus}</div>
          ) : null}

          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
