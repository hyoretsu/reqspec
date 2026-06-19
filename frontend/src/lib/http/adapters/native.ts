import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { runRequest } from "@/lib/http/adapters/run";
import type { HttpAdapter } from "@/lib/http/types";

/** Tauri plugin-http adapter. Proxies through Rust (IPC), bypassing browser CORS. */
export const nativeAdapter: HttpAdapter = req => runRequest(req, tauriFetch as typeof globalThis.fetch);
