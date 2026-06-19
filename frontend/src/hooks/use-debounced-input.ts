import { useCallback, useEffect, useRef, useState } from "react";

interface UseDebouncedInputOptions {
	value: string;
	onChange: (value: string) => void;
	delay?: number;
}

interface UseDebouncedInput {
	value: string;
	onChange: (value: string) => void;
	flush: () => void;
}

/**
 * Keeps immediate local state (preserving native undo history) while debouncing the
 * parent onChange. Without this, each keystroke re-renders the parent and resets undo.
 */
export function useDebouncedInput({ value, onChange, delay = 300 }: UseDebouncedInputOptions): UseDebouncedInput {
	const [local, setLocal] = useState(value);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	// Sync down when the external value changes from outside (e.g. loading a new request).
	useEffect(() => {
		setLocal(value);
	}, [value]);

	useEffect(() => {
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, []);

	const handleChange = useCallback(
		(next: string) => {
			setLocal(next);
			if (timer.current) clearTimeout(timer.current);
			timer.current = setTimeout(() => onChangeRef.current(next), delay);
		},
		[delay],
	);

	const flush = useCallback(() => {
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
		}
		onChangeRef.current(local);
	}, [local]);

	return { value: local, onChange: handleChange, flush };
}
