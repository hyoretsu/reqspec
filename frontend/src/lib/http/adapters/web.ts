import { runRequest } from "@/lib/http/adapters/run";
import type { HttpAdapter } from "@/lib/http/types";

/** Browser-fetch adapter. Subject to CORS; the unrestricted path is the native adapter. */
export const webAdapter: HttpAdapter = req => runRequest(req, globalThis.fetch.bind(globalThis));
