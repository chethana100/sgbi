"use client";
import { useEffect, useRef } from "react";

export default function LoginForm() {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    console.log("LoginForm mounted");
    const form = formRef.current;
    if (!form) return;
    
    const handleSubmit = async (e: Event) => {
      e.preventDefault();
      const email = (form.querySelector('input[type="email"]') as HTMLInputElement)?.value;
      const password = (form.querySelector('input[type="password"]') as HTMLInputElement)?.value;
      console.log("Submitting:", email);
      
      try {
        const res = await fetch("/api/auth/sign-in/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, rememberMe: true }),
        });
        const data = await res.json();
        console.log("Response:", data);
        if (res.ok && !data.error) {
          window.location.href = "/dashboard";
        } else {
          alert("Invalid email or password.");
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong.");
      }
    };

    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, []);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#050f23 0%,#0a1a3a 50%,#050f23 100%)" }}>
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="mb-6" style={{ height: "130px" }}>
            <img src="/sgbi-logo.png" alt="SGBI" style={{ height: "100%", width: "auto", objectFit: "contain" }} />
          </div>
          <p className="text-[#29ABE2] font-bold text-xl tracking-[0.2em] uppercase mb-2">Asset Tracker</p>
          <p className="text-white/30 text-xs tracking-widest mb-10">Internal Asset Tracking System</p>
        </div>
      </div>
      <div className="w-full lg:w-[440px] flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
          </div>
          <form ref={formRef} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
              <input type="email" placeholder="you@sgbi.us" required
                className="w-full h-12 pl-4 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-[#29ABE2] transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
              <input type="password" placeholder="••••••••" required
                className="w-full h-12 pl-4 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-[#29ABE2] transition-all" />
            </div>
            <button type="submit"
              className="w-full h-12 rounded-xl font-bold text-sm text-white mt-2"
              style={{ background: "linear-gradient(135deg,#29ABE2,#1a96cc)" }}>
              Sign In →
            </button>
          </form>
          <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              New employee? <a href="/auth/signup" className="text-[#29ABE2] font-semibold">Request access</a> — requires admin approval
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
