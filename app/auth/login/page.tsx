"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await signIn.email({ email, password });
      if ((res as any)?.error) {
        setError("Invalid email or password.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT — Brand Panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d1e35 50%, #0a1628 100%)" }}>

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(#29ABE2 1px, transparent 1px), linear-gradient(90deg, #29ABE2 1px, transparent 1px)`,
            backgroundSize: "50px 50px"
          }} />

        {/* Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(41,171,226,0.1) 0%, transparent 65%)" }} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          {/* Logo */}
          <div className="w-48 h-24 overflow-hidden mb-6"
            >
            <img src="/sgbi-logo.png" alt="SGBI" className="w-full h-full object-contain mix-blend-screen" />
          </div>

          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            Track, manage and monitor all SGBI hardware assets across locations in real time.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12">
            {[
              { value: "134+", label: "Assets" },
              { value: "3", label: "Locations" },
              { value: "100%", label: "Tracked" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-6 text-white/15 text-xs tracking-widest">
          © {new Date().getFullYear()} SGBI Inc.
        </p>
      </div>

      {/* RIGHT — Login Form */}
      <div className="w-full lg:w-[480px] flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src="/sgbi-logo.png" alt="SGBI" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Asset Tracker</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@sgbi.us"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-12 pl-10 pr-12 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password"
                className="text-xs text-[#29ABE2] hover:text-[#1a96cc] font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] mt-2"
              style={{
                background: "linear-gradient(135deg, #29ABE2, #1a96cc)",
                boxShadow: "0 4px 20px rgba(41,171,226,0.35)"
              }}>
              {isLoading ? <><Loader2 size={16} className="animate-spin" />Signing in...</> : "Sign In →"}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 text-center">
              New employee?{" "}
              <Link href="/auth/signup" className="text-[#29ABE2] font-semibold hover:text-[#1a96cc] transition-colors">
                Request access
              </Link>
              {" "}— requires admin approval
            </p>
          </div>

          <p className="text-center text-xs text-gray-200 dark:text-gray-800 mt-6">
            © {new Date().getFullYear()} SGBI Inc. · Internal Use Only
          </p>
        </div>
      </div>
    </div>
  );
}
