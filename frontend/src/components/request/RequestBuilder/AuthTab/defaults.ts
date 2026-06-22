import type { AuthDescriptor } from "@/lib/request/model";

export type AuthType = AuthDescriptor["type"];

export function defaultAuth(type: AuthType): AuthDescriptor {
	switch (type) {
		case "basic":
			return { type: "basic", username: "", password: "" };
		case "bearer":
			return { type: "bearer", token: "" };
		case "apikey":
			return { type: "apikey", key: "", value: "", addTo: "header" };
		case "awsv4":
			return {
				type: "awsv4",
				accessKeyId: "",
				secretAccessKey: "",
				region: "",
				service: "",
				sessionToken: "",
			};
		case "oauth2":
			return {
				type: "oauth2",
				grantType: "client_credentials",
				accessToken: "",
				tokenUrl: "",
				clientId: "",
				clientSecret: "",
				username: "",
				password: "",
				scope: "",
			};
		default:
			return { type: "none" };
	}
}
