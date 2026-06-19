import { Link } from "@tanstack/react-router";

export function NotFound() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
			<p className="text-lg font-semibold text-fg">Page not found</p>
			<p className="text-sm text-muted">The page you're looking for doesn't exist.</p>
			<Link to="/" className="text-sm font-medium text-primary hover:underline">
				Go to workspace
			</Link>
		</div>
	);
}
