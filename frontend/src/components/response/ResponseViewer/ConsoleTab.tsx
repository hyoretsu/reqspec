import type { ConsoleLog } from "@/lib/scripting/types";

interface ConsoleTabProps {
	logs: ConsoleLog[];
}

const LEVEL_COLOR: Record<ConsoleLog["level"], string> = {
	log: "text-fg",
	info: "text-blue-400",
	debug: "text-muted",
	warn: "text-yellow-500",
	error: "text-red-500",
};

function format(arg: unknown): string {
	if (typeof arg === "string") return arg;
	try {
		return JSON.stringify(arg);
	} catch {
		return String(arg);
	}
}

/** `console.*` output captured while the request's scripts ran. */
export function ConsoleTab({ logs }: ConsoleTabProps) {
	if (logs.length === 0) {
		return <p className="text-xs text-muted">No console output.</p>;
	}

	return (
		<ul className="flex flex-col gap-0.5 font-mono text-xs">
			{logs.map((entry, i) => (
				<li
					// biome-ignore lint/suspicious/noArrayIndexKey: logs are positional and immutable per run
					key={i}
					className={`flex gap-2 border-border border-b py-1 ${LEVEL_COLOR[entry.level]}`}
				>
					<span className="shrink-0 uppercase opacity-60">{entry.level}</span>
					<span className="whitespace-pre-wrap break-all">{entry.args.map(format).join(" ")}</span>
				</li>
			))}
		</ul>
	);
}
