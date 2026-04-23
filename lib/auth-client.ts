import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "https://sgbi-six.vercel.app",
});
export const { signIn, signUp, signOut, useSession } = authClient;
