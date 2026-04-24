"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const handleSubmit = async (e: Event) => {
      e.preventDefault();
      const email = (form.querySelector('input[type="email"]') as HTMLInputElement)?.value;
      const password = (form.querySelector('input[type="password"]') as HTMLInputElement)?.value;
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/auth/sign-in/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, rememberMe: true }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setError("Invalid email or password.");
        } else {
          const meRes = await fetch("/api/users/me");
          const meData = await meRes.json();
          const status = meData.data?.approval_status;
          if (status === "revoked") {
            setError("Your account access has been revoked. Contact your administrator.");
          } else if (status !== "approved") {
            setError("Your account is pending admin approval.");
          } else {
            window.location.href = "/dashboard";
          }
        }
      } catch (err) {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, []);

  return (
    <div className="min-h-screen flex">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
      `}</style>

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
        {[
          {x:"15%",y:"20%",s:3,d:3},{x:"80%",y:"15%",s:2,d:4},{x:"90%",y:"60%",s:3,d:5},
          {x:"10%",y:"70%",s:2,d:3},{x:"50%",y:"85%",s:3,d:4},{x:"70%",y:"80%",s:2,d:6},
        ].map((dot,i) => (
          <div key={i} className="absolute rounded-full bg-[#29ABE2]" suppressHydrationWarning
            style={{ left:dot.x, top:dot.y, width:dot.s, height:dot.s, opacity:0.4,
              animation:`pulse ${dot.d}s ease-in-out infinite`, animationDelay:`${i*0.4}s` }}/>
        ))}
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="mb-6" style={{ height: "130px" }}>
            <img src="/sgbi-logo.png" alt="SGBI" style={{
              height: "100%", width: "auto", objectFit: "contain",
              filter: "drop-shadow(0 0 30px rgba(41,171,226,0.5))"
            }} />
          </div>
          <p className="text-[#29ABE2] font-bold text-xl tracking-[0.2em] uppercase mb-2">Asset Tracker</p>
          <p className="text-white/30 text-xs tracking-widest mb-10">Internal Asset Tracking System</p>
          <div className="w-12 h-px mb-10" style={{background:"rgba(41,171,226,0.4)"}}/>
          <div className="space-y-3">
            {["Real-time asset tracking","Firmware update alerts","Service reminders","Full audit history"].map((item,i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#29ABE2] shrink-0"/>
                <span className="text-sm text-white/40">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="absolute bottom-5 text-white/15 text-xs tracking-widest">
          © {new Date().getFullYear()} SGBI · Internal Use Only
        </p>
      </div>

      {/* RIGHT - Login Form */}
      <div className="w-full lg:w-[440px] flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden justify-center mb-8">
            <img src="/sgbi-logo.png" alt="SGBI" style={{ height: "40px", objectFit: "contain" }} />
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
          </div>
          <form ref={formRef} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="email" placeholder="you@sgbi.us" required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type={showPassword ? "text" : "password"} placeholder="••••••••" required
                  className="w-full h-12 pl-10 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs text-[#29ABE2] hover:text-[#1a96cc] font-medium transition-colors">
                Forgot password?
              </Link>
            </div>
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] mt-2"
              style={{ background: "linear-gradient(135deg,#29ABE2,#1a96cc)", boxShadow: "0 4px 20px rgba(41,171,226,0.35)" }}>
              {loading ? <><Loader2 size={16} className="animate-spin" />Signing in...</> : "Sign In →"}
            </button>
          </form>
          <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              New employee?{" "}
              <Link href="/auth/signup" className="text-[#29ABE2] font-semibold hover:text-[#1a96cc] transition-colors">
                Request access
              </Link>
              {" "}— requires admin approval
            </p>
          </div>
          <p className="text-center text-xs text-gray-200 mt-4">
            © {new Date().getFullYear()} SGBI · Internal Use Only
          </p>
        </div>
      </div>
    </div>
  );
}
