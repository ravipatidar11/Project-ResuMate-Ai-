const encoder = new TextEncoder();

async function safeEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const a = new Uint8Array(leftHash);
  const b = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    if (request.method === "GET" && incoming.pathname === "/health") {
      return new Response("Ollama proxy ready", { headers: { "Cache-Control": "no-store" } });
    }

    const allowed =
      (request.method === "GET" && incoming.pathname === "/api/tags") ||
      (request.method === "POST" && incoming.pathname === "/api/generate");
    if (!allowed) return new Response("Not found", { status: 404 });

    const expected = `Bearer ${env.BACKEND_API_KEY || ""}`;
    if (!env.BACKEND_API_KEY || !(await safeEqual(request.headers.get("Authorization") || "", expected))) {
      return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    if (!env.OLLAMA_UPSTREAM_URL || !env.UPSTREAM_AUTH_TOKEN) {
      return new Response("Proxy is not configured", { status: 503 });
    }

    const target = new URL(incoming.pathname + incoming.search, env.OLLAMA_UPSTREAM_URL);
    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${env.UPSTREAM_AUTH_TOKEN}`);
    headers.set("Cache-Control", "no-store");
    headers.delete("host");

    const upstreamRequest = new Request(target, request);
    const authenticatedRequest = new Request(upstreamRequest, { headers });
    return fetch(authenticatedRequest);
  },
};
