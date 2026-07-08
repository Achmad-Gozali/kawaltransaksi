"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/core/auth/client";

function CallbackHandler() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error || !token) {
      router.replace(`/login?error=${error ?? "unknown"}`);
      return;
    }

    authClient.setToken(token);

    authClient.me().then(user => {
      if (user?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    });
  }, [searchParams, router]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm font-medium">Menyelesaikan login...</p>
        <Suspense>
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}