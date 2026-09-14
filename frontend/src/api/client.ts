export const apiJson = async (path: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, credentials: "include", headers });
};
