"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/core/auth/client";

function CallbackHandler() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");

    if (error) {
      router.replace(`/login?error=${error}`);
      return;
    }

    // Access token tidak lagi dikirim lewat URL. Backend sudah menyetel
    // cookie refresh_token (httpOnly) pada redirect ini; authClient.me()
    // otomatis menukarnya jadi access token via /api/auth/refresh.
    authClient.me().then(user => {
      if (!user) {
        router.replace("/login?error=google_failed");
        return;
      }
      router.replace(user.role === "admin" ? "/admin" : "/");
    });
  }, [searchParams, router]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm font-medium">Menyelesaikan proses masuk...</p>
        <Suspense>
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}