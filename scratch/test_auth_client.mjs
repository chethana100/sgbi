import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});

async function main() {
  console.log("authClient.signIn:", typeof authClient.signIn);
  console.log("authClient.signIn.email:", typeof authClient.signIn.email);
}

main();
