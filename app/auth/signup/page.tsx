"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    display_name: "", email: "", password: "", confirm_password: "",
  });

  const passwordsMatch = form.password && form.confirm_password && form.password === form.confirm_password;
  const passwordTooShort = form.password && form.password.length < 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email.endsWith("@sgbi.us")) { setError("Only @sgbi.us email addresses are allowed."); return; }
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
        setError(authError.message || "Signup failed."); 
      } else { 
        setSuccess(true); 
      }
    } catch { 
      setError("Something went wrong."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm text-center space-y-6">
          <CheckCircle2 size={56} className="mx-auto text-[#4169e1]" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Request submitted</h2>
            <p className="text-muted-foreground text-sm">
              Your account request has been submitted. An administrator will review and approve your access.
            </p>
          </div>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">Back to login</Button>
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
          <h1 className="text-4xl font-semibold leading-tight">Join the SGBI<br />Asset Platform</h1>
          <p className="text-white/60 text-lg max-w-sm">
            Request access to start tracking SGBI hardware assets across all locations.
          </p>
          <ul className="space-y-2 text-white/50 text-sm">
            {["Real-time asset status and location", "Firmware update tracking", "Service history and reminders"]
              .map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#60c8f5]" />{item}
                </li>
              ))}
          </ul>
        </div>
        <p className="text-white/30 text-sm">© {new Date().getFullYear()} SGBI Inc. · Internal Use Only</p>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center"><SgbiLogo /></div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Create account</h2>
            <p className="text-muted-foreground text-sm">
              Use your <span className="font-medium text-foreground">@sgbi.us</span> email to request access
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="display_name">Full name</Label>
              <Input id="display_name" placeholder="Jane Smith"
                value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="you@sgbi.us"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              {form.email && !form.email.endsWith("@sgbi.us") && (
                <p className="text-xs text-destructive">Must be a @sgbi.us email address</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters" className="pr-10"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordTooShort && <p className="text-xs text-destructive">Minimum 8 characters</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <div className="relative">
                <Input id="confirm_password" type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter password" className="pr-10"
                  value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} required />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirm_password && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Passwords match
                </p>
              )}
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full bg-[#4169e1] hover:bg-[#3358cc] text-white" disabled={isLoading}>
              {isLoading ? <><Loader2 size={16} className="mr-2 animate-spin" />Submitting...</> : "Request access"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#4169e1] hover:underline font-medium">Sign in</Link>
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
