"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, Mail, Lock, User } from "lucide-react";
import { signUp, authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    display_name: "", email: "", password: "", confirm_password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.display_name) { setError("Full name is required."); return; }
    if (!form.email.trim().toLowerCase().endsWith("@sgbi.us")) {
      setError("Only @sgbi.us email addresses are allowed."); return;
    }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirm_password) { setError("Passwords do not match."); return; }
    setIsLoading(true);
    try {
      const { error: authError } = await signUp.email({
        email: form.email, password: form.password, name: form.display_name,
      });
      if (authError) { setError(authError.message || "Signup failed."); return; }
      await authClient.signOut();
      document.cookie = "better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "better-auth.session_token.0=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setSuccess(true);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setIsLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8"
        style={{ background: "linear-gradient(135deg, #050f23 0%, #0a1a3a 50%, #050f23 100%)" }}>
        <div className="w-full max-w-sm text-center space-y-6 p-8 rounded-3xl"
          style={{ background: "rgba(10,20,40,0.8)", border: "1.5px solid rgba(41,171,226,0.35)", backdropFilter: "blur(20px)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(41,171,226,0.15)", border: "1.5px solid rgba(41,171,226,0.4)" }}>
            <CheckCircle2 size={32} className="text-[#29ABE2]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Request Submitted!</h2>
            <p className="text-white/40 text-sm mt-2 leading-relaxed">
              Your account request has been submitted. An administrator will review and approve your access shortly.
            </p>
          </div>
          <a href="/auth/login">
            <button className="w-full h-11 rounded-xl font-semibold text-sm text-white mt-2"
              style={{ background: "linear-gradient(135deg, #29ABE2, #1a96cc)", boxShadow: "0 4px 20px rgba(41,171,226,0.35)" }}>
              Back to Sign In
            </button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#050f23 0%,#0a1a3a 50%,#050f23 100%)" }}>

        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(41,171,226,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(41,171,226,0.06) 1px,transparent 1px)`,
            backgroundSize: "50px 50px"
          }} />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle,rgba(41,171,226,0.1) 0%,transparent 60%)" }} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="mb-6" style={{ height: "130px" }}>
            <img src="/sgbi-logo.png" alt="SGBI" style={{
              height: "100%", width: "auto", objectFit: "contain",
              filter: "drop-shadow(0 0 30px rgba(41,171,226,0.5))"
            }} />
          </div>
          <p className="text-[#29ABE2] font-bold text-xl tracking-[0.2em] uppercase mb-2">
            Asset Tracker
          </p>
          <p className="text-white/30 text-xs tracking-widest mb-10">
            Internal Asset Tracking System
          </p>
          <div className="w-12 h-px mb-10" style={{ background: "rgba(41,171,226,0.4)" }} />
          <div className="space-y-3">
            {["Real-time asset tracking", "Firmware update alerts", "Service reminders", "Full audit history"].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#29ABE2] shrink-0" />
                <span className="text-sm text-white/40">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-5 text-white/15 text-xs tracking-widest">
          © {new Date().getFullYear()} SGBI · Internal Use Only
        </p>
      </div>

      {/* RIGHT — Form */}
      <div className="w-full lg:w-[480px] flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">

          <div className="flex lg:hidden justify-center mb-8">
            <img src="/sgbi-logo.png" alt="SGBI" style={{ height: "40px", objectFit: "contain" }} />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Request Access</h2>
            <p className="text-sm text-gray-400 mt-1">
              Use your <span className="font-semibold text-gray-600">@sgbi.us</span> email to sign up
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="text" value={form.display_name}
                  onChange={e => setForm({ ...form, display_name: e.target.value })}
                  placeholder="Jane Smith" required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 transition-all" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@sgbi.us" required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 transition-all" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type={showPassword ? "text" : "password"} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters" required
                  className="w-full h-12 pl-10 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type={showConfirm ? "text" : "password"} value={form.confirm_password}
                  onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                  placeholder="Re-enter password" required
                  className="w-full h-12 pl-10 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 transition-all" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] mt-2"
              style={{ background: "linear-gradient(135deg, #29ABE2, #1a96cc)", boxShadow: "0 4px 20px rgba(41,171,226,0.35)" }}>
              {isLoading ? <><Loader2 size={16} className="animate-spin" />Submitting...</> : "Request Access →"}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Your request needs admin approval before you can log in
            </p>
          </div>

          <p className="text-center text-sm text-gray-400 mt-4">
            Already have an account?{" "}
            <a href="/auth/login" className="text-[#29ABE2] font-semibold hover:text-[#1a96cc] transition-colors">
              Sign in
            </a>
          </p>

          <p className="text-center text-xs text-gray-200 mt-4">
            © {new Date().getFullYear()} SGBI · Internal Use Only
          </p>
        </div>
      </div>
    </div>
  );
}
