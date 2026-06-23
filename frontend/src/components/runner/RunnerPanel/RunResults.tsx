import { StatusBadge } from "@/components/ui";
import type { RunReport, RunRequestResult } from "@/lib/runner";

interface RunResultsProps {
	results: RunRequestResult[];
	report: RunReport | null;
	multiIteration: boolean;
}

/** Live + final run results: a summary bar over a flat list of per-request rows. */
export function RunResults({
	results,
	report,
	multiIteration,
}: RunResultsProps) {
	if (results.length === 0)
		return (
			<p className="py-6 text-center text-sm text-muted">No results yet.</p>
		);

	return (
		<div className="flex flex-col gap-2">
			{report ? <RunSummary report={report} /> : null}
			<div className="flex flex-col divide-y divide-border rounded-md border border-border">
				{results.map((result) => (
					<ResultRow
						key={`${result.requestId}-${result.iteration}`}
						result={result}
						showIteration={multiIteration}
					/>
				))}
			</div>
		</div>
	);
}

function RunSummary({ report }: { report: RunReport }) {
	return (
		<div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-surface px-3 py-2 text-xs text-muted">
			<span>
				{report.requestCount} request{report.requestCount === 1 ? "" : "s"} ×{" "}
				{report.iterations} iter
			</span>
			<span className="text-success">{report.passedTests} passed</span>
			<span className={report.failedTests > 0 ? "text-danger" : ""}>
				{report.failedTests} failed
			</span>
			<span>{report.totalTests} assertions</span>
			<span>{report.durationMs} ms</span>
			{report.aborted ? (
				<span className="text-warning">stopped early</span>
			) : null}
		</div>
	);
}

function ResultRow({
	result,
	showIteration,
}: {
	result: RunRequestResult;
	showIteration: boolean;
}) {
	return (
		<div className="flex flex-col gap-1 px-3 py-2">
			<div className="flex items-center gap-2">
				{showIteration ? (
					<span className="font-mono text-xs text-muted">
						#{result.iteration}
					</span>
				) : null}
				<span className="flex-1 truncate text-sm text-fg">{result.name}</span>
				{result.error ? (
					<span className="font-mono text-xs text-danger">{result.error}</span>
				) : (
					<>
						<span className="font-mono text-xs text-muted">
							{result.timeMs} ms
						</span>
						<StatusBadge
							status={result.status ?? 0}
							statusText={result.statusText ?? ""}
						/>
					</>
				)}
			</div>
			{result.tests.length > 0 ? (
				<div className="flex flex-col gap-0.5 pl-1">
					{result.tests.map((test, i) => (
						<div
							// Assertion names are not unique within a script, so the index disambiguates.
							// biome-ignore lint/suspicious/noArrayIndexKey: test list is static for a completed response
							key={`${test.name}-${i}`}
							className="flex items-center gap-1.5 text-xs"
						>
							<span className={test.passed ? "text-success" : "text-danger"}>
								{test.passed ? "✓" : "✕"}
							</span>
							<span className={test.passed ? "text-muted" : "text-fg"}>
								{test.name}
							</span>
							{test.error ? (
								<span className="truncate text-danger">— {test.error}</span>
							) : null}
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}
