import type { TestResult } from "@/lib/scripting/types";

interface TestResultsTabProps {
	results: TestResult[];
}

/** Pass/fail list for the assertions a request's test script produced. */
export function TestResultsTab({ results }: TestResultsTabProps) {
	if (results.length === 0) {
		return <p className="text-xs text-muted">No tests ran for this request.</p>;
	}

	return (
		<ul className="flex flex-col gap-1">
			{results.map((result, i) => (
				<li
					// biome-ignore lint/suspicious/noArrayIndexKey: results are positional and immutable per run
					key={i}
					className="flex items-start gap-2 rounded border border-border px-3 py-2 text-sm"
				>
					<span className={result.passed ? "text-green-500" : "text-red-500"}>{result.passed ? "✓" : "✗"}</span>
					<div className="flex min-w-0 flex-col">
						<span className="text-fg">{result.name}</span>
						{result.error ? <span className="text-xs text-red-500">{result.error}</span> : null}
					</div>
				</li>
			))}
		</ul>
	);
}
