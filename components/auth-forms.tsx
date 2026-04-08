"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export function AuthForms() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const { data, error } = await signIn.email({
          email,
          password,
        });
        if (error) {
          setError(error.message || "Failed to sign in");
        }
      } else {
        const { data, error } = await signUp.email({
          email,
          password,
          name,
        });
        if (error) {
          setError(error.message || "Failed to sign up");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-1 border-t border-b border-indigo-400 bg-gradient-to-tr from-indigo-500 rounded-3xl to-purple-500 shadow-2xl">
      <div className="p-8 rounded-3xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl transition-all duration-500 ease-in-out">
        <div className="flex space-x-2 mb-8 bg-zinc-100/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl">
          <button
            onClick={() => { setIsLogin(true); setError("") }}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              isLogin
                ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm border border-black/[0.04] dark:border-white/[0.04]"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError("") }}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              !isLogin
                ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm border border-black/[0.04] dark:border-white/[0.04]"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 text-zinc-900 dark:text-white placeholder-zinc-400"
                placeholder="John Doe"
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 text-zinc-900 dark:text-white placeholder-zinc-400"
              placeholder="you@domain.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 text-zinc-900 dark:text-white placeholder-zinc-400"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              "Secure Sign In"
            ) : (
              "Create My Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
