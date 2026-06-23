import { create } from "zustand";
import type { RunReport, RunRequestResult } from "@/lib/runner";

export interface RunTarget {
	collectionId: string;
	/** When set, run only this folder (and its descendants). */
	folderId: string | null;
	/** Display name of the run target (collection or folder). */
	name: string;
}

export type RunStatus = "idle" | "running" | "done";

interface RunnerState {
	target: RunTarget | null;
	status: RunStatus;
	results: RunRequestResult[];
	report: RunReport | null;
	/** Cooperative cancellation flag read by the running orchestration. */
	signal: { aborted: boolean };
	open: (target: RunTarget) => void;
	close: () => void;
	begin: () => void;
	pushResult: (result: RunRequestResult) => void;
	finish: (report: RunReport) => void;
	requestStop: () => void;
}

export const useRunnerStore = create<RunnerState>()((set) => ({
	target: null,
	status: "idle",
	results: [],
	report: null,
	signal: { aborted: false },
	open: (target) =>
		set({
			target,
			status: "idle",
			results: [],
			report: null,
			signal: { aborted: false },
		}),
	close: () =>
		set((state) => {
			state.signal.aborted = true;
			return { target: null };
		}),
	begin: () =>
		set({
			status: "running",
			results: [],
			report: null,
			signal: { aborted: false },
		}),
	pushResult: (result) =>
		set((state) => ({ results: [...state.results, result] })),
	finish: (report) => set({ status: "done", report }),
	requestStop: () =>
		set((state) => {
			state.signal.aborted = true;
			return {};
		}),
}));
