"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { AuthForms } from "@/components/auth-forms";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-16 items-center bg-gradient-to-br from-[#f8f9fc] via-white to-[#eef2ff] dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 font-sans selection:bg-indigo-200 dark:selection:bg-indigo-900">
      
      <header className="mb-12 text-center space-y-4 px-6">
        <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none border border-zinc-100 dark:border-zinc-700 mb-2">
          <ShieldCheck className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          SGBI Internal Asset Tracking System
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Manage your equipment and product lifecycle seamlessly with better-auth integration.
        </p>
      </header>

      {session ? (
        ((session.user as any).approval_status === "approved" || (session.user as any).role === "admin") ? (
          <div className="w-full max-w-2xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-700 zoom-in-95">
            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">You are securely signed in.</p>
                </div>
              <button
                onClick={async () => {
                  await signOut();
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/30 text-zinc-700 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 rounded-xl font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-50/80 dark:bg-zinc-950/80 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800/50 backdrop-blur-sm">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Name</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">{session.user.name}</p>
              </div>
              
              <div className="bg-zinc-50/80 dark:bg-zinc-950/80 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800/50 backdrop-blur-sm">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Email</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">{session.user.email}</p>
              </div>

              <div className="bg-zinc-50/80 dark:bg-zinc-950/80 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800/50 backdrop-blur-sm md:col-span-2 shadow-inner">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center justify-between">
                  <span>Session Object</span>
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">Active</span>
                </p>
                <pre className="mt-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 break-all bg-zinc-200/50 dark:bg-black/50 p-4 rounded-xl overflow-x-auto border border-zinc-200 dark:border-zinc-800">
                  {JSON.stringify(session.session, null, 2)}
                </pre>
              </div>
            </div>
            
          </div>
        </div>
        ) : (
          <div className="w-full max-w-2xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-700 zoom-in-95">
            <div className="bg-yellow-50/80 dark:bg-yellow-900/20 backdrop-blur-xl border border-yellow-200 dark:border-yellow-800/50 rounded-3xl p-10 shadow-2xl relative overflow-hidden text-center">
              <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-500 mb-4">Account Pending Admin Approval</h2>
              <p className="text-yellow-700 dark:text-yellow-400/80 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                Your account request has been successfully submitted. An administrator must review and approve your access before you can enter the tracking system.
              </p>
              <button
                onClick={async () => {
                  await signOut();
                }}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-white dark:bg-zinc-950 text-yellow-700 dark:text-yellow-500 rounded-xl font-bold transition-all shadow-sm hover:shadow-md border border-yellow-100 dark:border-yellow-900 mx-auto"
              >
                <LogOut className="w-5 h-5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        )
      ) : null}
      
      <div className="fixed bottom-0 pointer-events-none w-full h-1/2 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent -z-10" />
    </div>
  );
}
