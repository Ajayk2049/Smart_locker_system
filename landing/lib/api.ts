let refreshPromise: Promise<string | null> | null = null;

export function clearStoredUserSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("smartbox_logged_in");
  localStorage.removeItem("smartbox_user");
  localStorage.removeItem("smartbox_user_data");
  localStorage.removeItem("smartbox_token");
  localStorage.removeItem("smartbox_refresh_token");
}

export async function getRefreshedUserToken(apiUrl: string): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    if (typeof window === "undefined") return null;
    const refreshToken = localStorage.getItem("smartbox_refresh_token");
    if (!refreshToken) return null;

    try {
      const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.token) {
          localStorage.setItem("smartbox_token", refreshData.token);
          if (refreshData.refreshToken) {
            localStorage.setItem("smartbox_refresh_token", refreshData.refreshToken);
          }
          return refreshData.token as string;
        }
      }

      // If refresh token is expired or revoked in database, clear user session
      clearStoredUserSession();
      return null;
    } catch (err) {
      console.error("User token rotation network error:", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function userFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300/api";
  let token = typeof window !== "undefined" ? localStorage.getItem("smartbox_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http") ? endpoint : `${apiUrl}${cleanEndpoint}`;
  let response = await fetch(url, { ...options, headers });

  // If 401 Unauthorized, attempt to rotate refresh token seamlessly and retry once
  if (response.status === 401 && typeof window !== "undefined" && !endpoint.includes("/auth/refresh")) {
    const newToken = await getRefreshedUserToken(apiUrl);
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    } else {
      clearStoredUserSession();
    }
  }

  return response;
}
