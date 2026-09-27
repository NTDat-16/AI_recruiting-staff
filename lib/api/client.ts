const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers: HeadersInit = {
    ...options.headers,
  };

  // Don't set Content-Type if FormData (browser sets boundary)
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      try {
        const loginRes = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "demo.hr@recruiting.vn",
            password: "Demo123456@",
          }),
        });
        if (loginRes.ok) {
          const authData = await loginRes.json();
          if (authData.access_token) {
            localStorage.setItem("auth_token", authData.access_token);
            (headers as Record<string, string>)["Authorization"] = `Bearer ${authData.access_token}`;
            const retryRes = await fetch(`${API_BASE}${endpoint}`, {
              ...options,
              headers,
            });
            if (retryRes.ok) {
              return retryRes.json() as Promise<T>;
            }
          }
        }
      } catch (authErr) {
        console.warn("Auto re-auth error:", authErr);
      }
    }

    let errorMsg = `HTTP Error: ${res.status}`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.detail || errorMsg;
    } catch {
      // no JSON body
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}
