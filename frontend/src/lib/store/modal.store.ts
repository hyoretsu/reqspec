import { create } from "zustand";

export interface ConfirmRequest {
	id: string;
	kind: "confirm";
	title: string;
	message?: string;
	confirmLabel: string;
	cancelLabel: string;
	danger: boolean;
	resolve: (value: boolean) => void;
}

export interface PromptRequest {
	id: string;
	kind: "prompt";
	title: string;
	message?: string;
	placeholder: string;
	defaultValue: string;
	confirmLabel: string;
	cancelLabel: string;
	resolve: (value: string | null) => void;
}

export type ModalRequest = ConfirmRequest | PromptRequest;

interface ModalState {
	queue: ModalRequest[];
	push: (request: ModalRequest) => void;
	resolveTop: (id: string) => void;
}

export const useModalStore = create<ModalState>()(set => ({
	queue: [],
	push: request => set(state => ({ queue: [...state.queue, request] })),
	resolveTop: id => set(state => ({ queue: state.queue.filter(r => r.id !== id) })),
}));
