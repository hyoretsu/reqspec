import type { MetadataRoute } from "next";

const lastModified = new Date();
const url = process.env.NEXT_PUBLIC_APP_URL!;

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url,
			lastModified,
			changeFrequency: "never",
			priority: 1,
		},
	];
}
