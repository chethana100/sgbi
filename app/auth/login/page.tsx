"use client";

import dynamic from "next/dynamic";

const LoginForm = dynamic(() => import("@/components/login-form"), { 
  ssr: false,
  loading: () => <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>Loading...</div>
});

export default function LoginPage() {
  return <LoginForm />;
}
