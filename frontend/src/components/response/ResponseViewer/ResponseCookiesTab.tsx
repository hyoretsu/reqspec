import { KeyValueList } from "@/components/ui";
import type { NormalizedResponse } from "@/lib/http/types";

export function ResponseCookiesTab({ response }: { response: NormalizedResponse }) {
	const items = response.cookies.map(cookie => ({
		key: cookie.name,
		value: cookie.attributes ? `${cookie.value}  (${cookie.attributes})` : cookie.value,
	}));

	return <KeyValueList items={items} emptyLabel="No cookies set." />;
}
