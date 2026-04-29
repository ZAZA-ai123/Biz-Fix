import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/chat(.*)",
  "/onboarding(.*)",
  "/quotes(.*)",
  "/quote/(.*)",
  "/new-quote(.*)",
  "/quote-studio(.*)",
  "/settings(.*)",
  "/api/db/(.*)",
  "/api/quote/(.*)",
  "/api/engine/(.*)",
  "/api/rag/(.*)",
  "/api/company/(.*)",
  "/api/onboarding/(.*)",
  "/api/chat/(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
