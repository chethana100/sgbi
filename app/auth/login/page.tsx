"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email.endsWith("@sgbi.us")) {
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
        setError(authError.message || "Login failed. Please try again.");
      } else {
        // Redirect to home (dashboard)
        window.location.href = "/";
      }
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
          <p className="text-white/60 text-lg max-w-sm">
            Track firmware, service history, and status of all SGBI hardware — from anywhere.
          </p>
        </div>
        <p className="text-white/30 text-sm">© {new Date().getFullYear()} SGBI Inc. · Internal Use Only</p>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center"><SgbiLogo /></div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm">Sign in to your SGBI account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="you@sgbi.us"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"}
                  placeholder="Enter your password" className="pr-10"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full bg-[#4169e1] hover:bg-[#3358cc] text-white" disabled={isLoading}>
              {isLoading ? <><Loader2 size={16} className="mr-2 animate-spin" />Signing in...</> : "Sign in"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-[#4169e1] hover:underline font-medium">Request access</Link>
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
      <text x="0" y="26" fontFamily="system-ui" fontSize="28" fontWeight="700"
        fill="url(#g1)" letterSpacing="1">SGBI</text>
    </svg>
  );
}
