import { auth } from "@/lib/auth/better-auth-server";
import { toNextJsHandler } from "better-auth/next-js";

console.log('[Better Auth Route] Loading catch-all handler');

// Create handlers
const handlers = toNextJsHandler(auth.handler);
console.log('[Better Auth Route] Handlers created:', Object.keys(handlers));
console.log('[Better Auth Route] POST handler type:', typeof handlers.POST);

// Export Better Auth handlers directly - as per Better Auth documentation
export const GET = handlers.GET;
export const POST = handlers.POST;