export const apiJson = async (path: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept-Language")) {
    const stored = window.localStorage.getItem("clara-locale");
    headers.set("Accept-Language", stored === "ja" ? "ja" : "vi");
  }
  return fetch(path, { ...init, credentials: "include", headers });
};
