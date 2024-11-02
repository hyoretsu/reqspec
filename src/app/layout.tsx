import type { PropsWithChildren } from "react";
import WebVitals from "./components/WebVitals";

import "./_global.scss";

const siteName = "UniDB";

export const metadata = {
	applicationName: siteName,
	appleWebApp: {
		title: siteName,
	},
	metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
	openGraph: {
		images: [
			{
				url: "/opengraph.jpg",
				width: 1200,
				height: 627,
				alt: siteName,
			},
		],
		siteName,
		type: "website",
	},
	title: {
		default: siteName,
		template: `%s | ${siteName}`,
	},
	twitter: {
		card: "summary_large_image",
		creator: `${process.env.NEXT_PUBLIC_SITE_CONTENT_CREATOR}` || "@hyoretsu",
	},
};
export const viewport = {
	themeColor: "#4F53B7",
};

export default function RootLayout({ children }: PropsWithChildren) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="manifest" href="/site.webmanifest" />
				<meta name="theme-color" content={viewport.themeColor} />
			</head>
			<body>
				<main>{children}</main>

				{process.env.NODE_ENV === "production" && <WebVitals />}
			</body>
		</html>
	);
}
