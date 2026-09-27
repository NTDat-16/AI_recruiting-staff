"use client";

import { useEffect, useState } from "react";

export function AuthInitializer() {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const ensureAuth = async () => {
      const existingToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!existingToken) {
        try {
          const res = await fetch("/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "demo.hr@recruiting.vn",
              password: "Demo123456@",
            }),
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem("auth_token", data.access_token);
            setUserName("HR Manager (Demo)");
          }
        } catch (e) {
          console.warn("Auto-login demo account error:", e);
        }
      } else {
        setUserName("HR Manager (Demo)");
      }
    };

    ensureAuth();
  }, []);

  return null;
}
