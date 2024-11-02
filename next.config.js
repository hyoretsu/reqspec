const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = async (phase, { defaultConfig }) => {
	/** @type {import('next').NextConfig} */
	const baseConf = {
		eslint: {
			ignoreDuringBuilds: true,
		},
		images: {
			unoptimized: true,
		},
		output: "export",
		productionBrowserSourceMaps: true,
		reactStrictMode: true,
		sassOptions: {
			logger: {
				warn: message => console.warn(message),
				debug: message => console.log(message),
			},
			silenceDeprecations: ["legacy-js-api"],
		},
		skipTrailingSlashRedirect: true,
		swcMinify: true,
		typescript: {
			ignoreBuildErrors: true,
		},
	};

	// Dev-specific settings
	if (phase === PHASE_DEVELOPMENT_SERVER) {
		Object.assign(baseConf, {
			assetPrefix: `http://${process.env.TAURI_DEV_HOST || "localhost"}:3000`,
		});
	} else {
		Object.assign(baseConf, {});
	}

	return baseConf;
};
