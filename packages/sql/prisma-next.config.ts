import { defineConfig } from "@prisma-next/postgres/config";

export default defineConfig({
	contract: "./src/models/contract.prisma",
	db: {
		connection: process.env.DATABASE_URL,
	},
	migrations: {
		dir: "./src/migrations",
	},
});
