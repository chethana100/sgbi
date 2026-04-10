"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim().toLowerCase().endsWith("@sgbi.us")) {
      setError("Only @sgbi.us email addresses are allowed.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: authError } = await signIn.email({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        setError("Invalid email or password.");
        return;
      }

      // Check approval status before redirecting
      const meRes = await fetch("/api/users/me");
      const meData = await meRes.json();

      if (!meData.success) {
        setError("Something went wrong. Please try again.");
        await authClient.signOut();
        return;
      }

      if (meData.data.approval_status === "pending") {
        await authClient.signOut();
        setError("Your account is pending admin approval. Please wait for an administrator to approve your access.");
        return;
      }

      if (meData.data.approval_status === "revoked") {
        await authClient.signOut();
        setError("Your account access has been revoked. Please contact an administrator.");
        return;
      }

      window.location.href = "/dashboard";

    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#1a1f36] text-white">
        <SgbiLogo />
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight">
            Internal Asset<br />Tracking System
          </h1>
          <p className="text-white/60 text-lg max-w-sm font-light">
            Track firmware, service history, and status of all SGBI hardware — from anywhere.
          </p>
        </div>
        <p className="text-white/30 text-xs font-medium uppercase tracking-wider">
          © {new Date().getFullYear()} SGBI Inc. · INTERNAL USE ONLY
        </p>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <SgbiLogo />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your SGBI account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@sgbi.us"
                className="h-11"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] font-semibold text-[#4169e1] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-11 pr-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-[#4169e1] hover:bg-[#3358cc] text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-[#4169e1] hover:underline font-semibold"
            >
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function SgbiLogo() {
  return (
    <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="80" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60c8f5" />
          <stop offset="100%" stopColor="#5b6cf5" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="26"
        fontFamily="system-ui"
        fontSize="28"
        fontWeight="700"
        fill="url(#g1)"
        letterSpacing="1"
      >
        SGBI
      </text>
    </svg>
  );
}