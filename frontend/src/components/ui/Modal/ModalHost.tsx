import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PromptModal } from "@/components/ui/Modal/PromptModal";
import { useModalStore } from "@/lib/store/modal.store";

/** Renders the active modal from the queue. Mounted once at the app root. */
export function ModalHost() {
	const queue = useModalStore(state => state.queue);
	const resolveTop = useModalStore(state => state.resolveTop);
	const active = queue[0];

	if (!active) return null;

	if (active.kind === "prompt") {
		return (
			<PromptModal
				request={active}
				onResolve={value => {
					active.resolve(value);
					resolveTop(active.id);
				}}
			/>
		);
	}

	const close = (value: boolean) => {
		active.resolve(value);
		resolveTop(active.id);
	};

	return (
		<Modal
			title={active.title}
			onClose={() => close(false)}
			footer={
				<>
					<Button variant="secondary" onClick={() => close(false)}>
						{active.cancelLabel}
					</Button>
					<Button variant={active.danger ? "danger" : "primary"} onClick={() => close(true)}>
						{active.confirmLabel}
					</Button>
				</>
			}
		>
			{active.message ? <p className="text-muted">{active.message}</p> : null}
		</Modal>
	);
}
