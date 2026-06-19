interface LogoProps {
	className?: string;
}

/** ReqSpec mark: a request/response exchange glyph on a rounded badge.
 * Badge uses currentColor (set via a text-* class); glyph is white. */
export function Logo({ className }: LogoProps) {
	return (
		<svg viewBox="0 0 32 32" className={className} role="img" aria-label="ReqSpec logo">
			<rect x="1" y="1" width="30" height="30" rx="8" fill="currentColor" />
			<g fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
				<path d="M8 12 H22" />
				<path d="M18 8.5 L22.5 12 L18 15.5" />
				<path d="M24 20 H10" />
				<path d="M14 16.5 L9.5 20 L14 23.5" />
			</g>
		</svg>
	);
}
