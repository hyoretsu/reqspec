import { useModalStore } from "@/lib/store/modal.store";

export interface ConfirmOptions {
	title: string;
	message?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	danger?: boolean;
}

export interface PromptOptions {
	title: string;
	message?: string;
	placeholder?: string;
	defaultValue?: string;
	confirmLabel?: string;
	cancelLabel?: string;
}

/** Promise-based replacement for window.confirm. */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
	return new Promise(resolve => {
		useModalStore.getState().push({
			id: crypto.randomUUID(),
			kind: "confirm",
			title: options.title,
			message: options.message,
			confirmLabel: options.confirmLabel ?? "Confirm",
			cancelLabel: options.cancelLabel ?? "Cancel",
			danger: options.danger ?? false,
			resolve,
		});
	});
}

/** Promise-based replacement for window.prompt. Resolves null on cancel. */
export function promptDialog(options: PromptOptions): Promise<string | null> {
	return new Promise(resolve => {
		useModalStore.getState().push({
			id: crypto.randomUUID(),
			kind: "prompt",
			title: options.title,
			message: options.message,
			placeholder: options.placeholder ?? "",
			defaultValue: options.defaultValue ?? "",
			confirmLabel: options.confirmLabel ?? "Save",
			cancelLabel: options.cancelLabel ?? "Cancel",
			resolve,
		});
	});
}
