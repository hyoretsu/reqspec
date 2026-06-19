import clsx from "clsx";

interface CodeBlockProps {
	content: string;
	className?: string;
}

export function CodeBlock({ content, className }: CodeBlockProps) {
	return (
		<pre
			className={clsx(
				"overflow-auto whitespace-pre-wrap break-words rounded-md bg-surface p-3 font-mono text-xs text-fg",
				className,
			)}
		>
			<code>{content}</code>
		</pre>
	);
}
