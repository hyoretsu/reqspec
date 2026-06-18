import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
	build: {
		minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
		sourcemap: !!process.env.TAURI_ENV_DEBUG,
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
});
