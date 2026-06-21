import { Button, EmptyState, IconButton, Spinner } from "@/components/ui";
import { useCookies, useCookieMutations } from "@/hooks/queries/use-cookies";
import type { CookieRow } from "@/lib/db/types";

function groupByDomain(cookies: CookieRow[]): Map<string, CookieRow[]> {
	const map = new Map<string, CookieRow[]>();
	for (const c of cookies) {
		const list = map.get(c.domain) ?? [];
		list.push(c);
		map.set(c.domain, list);
	}
	return map;
}

export function CookieManager() {
	const { data: cookies, isLoading } = useCookies();
	const { remove, clear } = useCookieMutations();
	const groups = groupByDomain(cookies ?? []);

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-3 py-2">
				<h2 className="text-sm font-semibold text-fg">Cookies</h2>
				{cookies?.length ? (
					<Button size="sm" variant="secondary" onClick={() => clear.mutate()}>
						Clear all
					</Button>
				) : null}
			</div>

			<div className="min-h-0 flex-1 overflow-auto p-2">
				{isLoading ? (
					<div className="flex justify-center p-4 text-muted">
						<Spinner />
					</div>
				) : cookies?.length ? (
					[...groups.entries()].map(([domain, list]) => (
						<div key={domain} className="mb-3">
							<p className="mb-1 text-xs font-semibold text-muted">{domain}</p>
							{list.map(cookie => (
								<div
									key={cookie.id}
									className="group flex items-center gap-2 rounded px-2 py-1 font-mono text-xs hover:bg-surface"
								>
									<span className="min-w-0 flex-1 truncate">
										<span className="text-fg">{cookie.name}</span>
										<span className="text-muted">={cookie.value}</span>
										<span className="text-muted"> · {cookie.path}</span>
										{cookie.secure ? <span className="text-success"> · Secure</span> : null}
										{cookie.httpOnly ? <span className="text-muted"> · HttpOnly</span> : null}
									</span>
									<IconButton
										label="Delete cookie"
										onClick={() => remove.mutate(cookie.id)}
										className="opacity-0 group-hover:opacity-100"
									>
										✕
									</IconButton>
								</div>
							))}
						</div>
					))
				) : (
					<EmptyState title="No cookies" description="Cookies from responses are stored here." />
				)}
			</div>
		</div>
	);
}
