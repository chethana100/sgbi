"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authClient.signIn.email({ email, password });
      if ((res as any)?.error) {
        setError("Invalid email or password.");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#f0f4f8" }}>
      <form onSubmit={handleSubmit} style={{ background: "white", padding: "40px", borderRadius: "12px", width: "360px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginBottom: "24px", color: "#111" }}>SGBI Asset Tracker</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
          style={{ width: "100%", padding: "12px", marginBottom: "12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
          style={{ width: "100%", padding: "12px", marginBottom: "12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} />
        {error && <p style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ width: "100%", padding: "12px", background: "#29ABE2", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
