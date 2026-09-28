export async function adminFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  let token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${apiUrl}${endpoint}`;
  let response = await fetch(url, { ...options, headers });

  // If 401 Unauthorized, attempt to rotate refresh token
  if (response.status === 401 && typeof window !== "undefined" && !endpoint.includes("/auth/refresh")) {
    const refreshToken = localStorage.getItem("admin_refresh_token");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.token) {
            token = refreshData.token;
            localStorage.setItem("admin_token", refreshData.token);
            if (refreshData.refreshToken) {
              localStorage.setItem("admin_refresh_token", refreshData.refreshToken);
            }

            // Retry original request with the new access token
            headers["Authorization"] = `Bearer ${token}`;
            response = await fetch(url, { ...options, headers });
          }
        } else {
          // Token rotation failed or family revoked: clear tokens
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_refresh_token");
          localStorage.removeItem("admin_user");
        }
      } catch (err) {
        console.error("Token rotation failed:", err);
      }
    }
  }

  return response;
}
