import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const apiBase = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
if (apiBase) {
  setBaseUrl(apiBase);
} else if (import.meta.env.PROD) {
  console.warn(
    "[Titan Journal] VITE_API_BASE is not set — API calls may hit the Pages host and return non-array JSON. " +
      "Set VITE_API_BASE to your Railway API URL in Cloudflare Pages environment variables, then redeploy.",
  );
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root element");
}

try {
  createRoot(root).render(<App />);
} catch (err) {
  console.error(err);
  root.innerHTML =
    '<div style="padding:2rem;font-family:system-ui;color:#e2e8f0;background:#0f172a;min-height:100vh">' +
    "<h1>Titan Journal failed to start</h1>" +
    `<pre style="margin-top:1rem;white-space:pre-wrap">${err instanceof Error ? err.message : String(err)}</pre>` +
    "</div>";
}
