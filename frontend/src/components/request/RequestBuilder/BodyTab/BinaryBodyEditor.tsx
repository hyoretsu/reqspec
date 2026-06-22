import { useRef } from "react";
import { Input } from "@/components/ui/Input";
import { setFile } from "@/lib/files/file-store";
import type { BodyDescriptor } from "@/lib/request/model";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

type BinaryBody = Extract<BodyDescriptor, { type: "binary" }>;

/** Binary body: send a single file's raw bytes, with an optional content-type override. */
export function BinaryBodyEditor({ body }: { body: BinaryBody }) {
	const patchDraft = useActiveRequestStore(state => state.patchDraft);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const onPick = (file: File | undefined) => {
		if (!file) return;
		setFile(body.fileId, file);
		patchDraft({ body: { ...body, fileName: file.name, contentType: file.type } });
	};

	return (
		<div className="flex flex-col gap-3">
			<button
				type="button"
				onClick={() => fileInputRef.current?.click()}
				className="flex h-10 w-full items-center truncate rounded-md border border-border bg-surface-raised px-3 text-left text-sm transition-colors hover:border-primary"
				title={body.fileName || "Choose a file"}
			>
				<span className={body.fileName ? "text-fg" : "text-muted"}>{body.fileName || "Choose a file…"}</span>
			</button>
			<input
				ref={fileInputRef}
				type="file"
				className="hidden"
				onChange={event => onPick(event.target.files?.[0])}
			/>
			<label className="flex flex-col gap-1 text-xs text-muted">
				Content-Type
				<Input
					value={body.contentType}
					onChange={contentType => patchDraft({ body: { ...body, contentType } })}
					placeholder="application/octet-stream"
					className="h-9"
				/>
			</label>
			<p className="text-xs text-muted">
				The file is held for this session only — it isn't saved with the request and must be re-picked after a
				reload.
			</p>
		</div>
	);
}
