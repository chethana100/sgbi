"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      setError("Only @sgbi.us email addresses are allowed.");
      return;
    }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirm_password) { setError("Passwords do not match."); return; }

    setIsLoading(true);
    try {
      const { data, error: authError } = await signUp.email({
        email: form.email,
        password: form.password,
        name: form.display_name,
      });

      if (authError) {
        setError(authError.message || "Signup failed. Please try again.");
        return;
      }

      // Sign out immediately — user must wait for admin approval
      await authClient.signOut();
      setSuccess(true);

    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-[#4169e1] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Request Submitted!</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your account request has been submitted successfully. An administrator will review and approve your access. You will be able to log in once approved.
            </p>
          </div>
          <Link href="/auth/login" className="block">
            <Button variant="outline" className="w-full h-11">Back to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#1a1f36] text-white">
        <SgbiLogo />
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight">
            Join the SGBI<br />Asset Platform
          </h1>
          <p className="text-white/60 text-lg max-w-sm font-light">
            Request access to track hardware assets across all locations.
          </p>
          <div className="space-y-3 pt-4">
            {["Real-time asset tracking", "Firmware update management", "Full audit history"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4169e1]" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs font-medium uppercase tracking-wider">
          © {new Date().getFullYear()} SGBI Inc. · INTERNAL USE ONLY
        </p>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center mb-8"><SgbiLogo /></div>
          <div>
            <h2 className="text-2xl font-semibold">Create account</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Use your <span className="font-semibold text-foreground">@sgbi.us</span> email to request access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="display_name">Full name</Label>
              <Input
                id="display_name"
                placeholder="Jane Smith"
                className="h-11"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                required
              />
            </div>

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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  className="h-11 pr-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter password"
                  className="h-11 pr-10"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  <span>Submitting...</span>
                </div>
              ) : "Request Access"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#4169e1] hover:underline font-semibold">
              Sign in
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
        <linearGradient id="g2" x1="0" y1="0" x2="80" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60c8f5" />
          <stop offset="100%" stopColor="#5b6cf5" />
        </linearGradient>
      </defs>
      <text x="0" y="26" fontFamily="system-ui" fontSize="28" fontWeight="700"
        fill="url(#g2)" letterSpacing="1">SGBI</text>
    </svg>
  );
}