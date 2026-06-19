import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd());

const host = env.TAURI_DEV_HOST;

	return {
		build: {
			minify: env.TAURI_ENV_DEBUG ? false : "esbuild",
			sourcemap: !!env.TAURI_ENV_DEBUG,
			target: "es2022",
		},
		clearScreen: false,
		envPrefix: ["TAURI_", "VITE_"],
		plugins: [
			tanstackStart({
				prerender: {
					autoStaticPathsDiscovery: false,
					crawlLinks: false,
					enabled: false,
				},
				router: {
					routeFileIgnorePattern: "^components$",
				},
				spa: {
					enabled: true,
				},
			}),
			tailwindcss(),
			react(),
			svgr(),
		],
		preview: {
			host: "127.0.0.1",
		},
		resolve: {
			tsconfigPaths: true,
		},
		server: {
			allowedHosts: [env.VITE_APP_URL || ""]
				.filter(Boolean)
				.map(each => each.replace(/(^https?:\/\/|\/$)/, "")),
			hmr: host
				? {
						host,
						port: 5174,
						protocol: "ws",
					}
				: undefined,
			host: host || false,
			port: 5173,
			strictPort: true,
			watch: {
				ignored: ["**/src-tauri/**"],
			},
		},
	};
});
