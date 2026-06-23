import { useState } from "react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { useCollectionRunner } from "@/hooks/use-collection-runner";
import type { RunConfig } from "@/lib/runner";
import { serializeReport } from "@/lib/runner";
import { useRunnerStore } from "@/lib/store/runner.store";
import { RunConfigForm } from "./RunConfigForm";
import { RunResults } from "./RunResults";
import type { DataFileState } from "./types";

/** Collection Runner modal: configure iterations/data, run, and inspect per-request results. */
export function RunnerPanel() {
	const target = useRunnerStore((state) => state.target);
	const status = useRunnerStore((state) => state.status);
	const results = useRunnerStore((state) => state.results);
	const report = useRunnerStore((state) => state.report);
	const close = useRunnerStore((state) => state.close);
	const requestStop = useRunnerStore((state) => state.requestStop);
	const run = useCollectionRunner();

	const [iterations, setIterations] = useState("");
	const [delay, setDelay] = useState("");
	const [data, setData] = useState<DataFileState | null>(null);

	if (!target) return null;

	const running = status === "running";
	const dataRows = data && !data.error ? data.rows : undefined;
	const effectiveIterations = iterations
		? Number(iterations)
		: (dataRows?.length ?? 1);

	const start = () => {
		const config: RunConfig = {
			iterations: iterations ? Number(iterations) : undefined,
			delayMs: delay ? Number(delay) : undefined,
			data: dataRows,
		};
		void run(config);
	};

	const exportReport = () => {
		if (!report) return;
		const blob = new Blob([serializeReport(report)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${target.name}-run.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<Modal
			title={`Run · ${target.name}`}
			onClose={close}
			size="xl"
			footer={
				<>
					{status === "done" && report ? (
						<Button variant="secondary" onClick={exportReport}>
							Export JSON
						</Button>
					) : null}
					{running ? (
						<Button variant="danger" onClick={requestStop}>
							Stop
						</Button>
					) : (
						<Button onClick={start}>Run</Button>
					)}
					<Button variant="secondary" onClick={close}>
						Close
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<RunConfigForm
					iterations={iterations}
					onIterations={setIterations}
					delay={delay}
					onDelay={setDelay}
					data={data}
					onData={setData}
					disabled={running}
				/>
				<RunResults
					results={results}
					report={report}
					multiIteration={effectiveIterations > 1}
				/>
			</div>
		</Modal>
	);
}
