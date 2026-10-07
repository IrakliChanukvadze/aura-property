const base =
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_API_URL || "http://localhost:4000/api";
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T = any>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(base + path, {
      method,
      credentials: "include",
      headers:
        body instanceof FormData
          ? undefined
          : { "Content-Type": "application/json" },
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "API_UNAVAILABLE",
      "Cannot reach the API. Check that the backend is running, then retry.",
    );
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      json.error?.code || "REQUEST_FAILED",
      json.error?.message || `Request failed (${response.status})`,
    );
  return json.data ?? json;
}
export async function download(path: string, name: string) {
  const response = await fetch(base + path, { credentials: "include" });
  if (!response.ok) throw new Error("Download not authorized or unavailable");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function mediaUrl(url: string, privatePreview = false) {
  if (!url) return "";
  const origin = base.replace(/\/api\/?$/, "");
  if (url.startsWith("/images/") || url === "/preview-plan.svg")
    return (
      ((import.meta as unknown as { env: Record<string, string> }).env
        .VITE_PUBLIC_URL || "http://localhost:3100") + url
    );
  return url.startsWith("/api/")
    ? origin +
        (privatePreview ? url.replace("/public/media/", "/uploads/") : url)
    : url;
}
