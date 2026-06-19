import { describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

describe("useDebouncedInput", () => {
	it("updates local value immediately and debounces the parent onChange", async () => {
		const onChange = mock(() => {});
		const { result } = renderHook(() => useDebouncedInput({ value: "", onChange, delay: 20 }));

		act(() => result.current.onChange("a"));
		expect(result.current.value).toBe("a");
		expect(onChange).not.toHaveBeenCalled();

		await new Promise(r => setTimeout(r, 40));
		expect(onChange).toHaveBeenCalledWith("a");
	});

	it("coalesces rapid changes into one debounced call", async () => {
		const onChange = mock(() => {});
		const { result } = renderHook(() => useDebouncedInput({ value: "", onChange, delay: 20 }));

		act(() => result.current.onChange("a"));
		act(() => result.current.onChange("ab"));
		await new Promise(r => setTimeout(r, 40));

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith("ab");
	});

	it("flush invokes onChange immediately with the latest value", () => {
		const onChange = mock(() => {});
		const { result } = renderHook(() => useDebouncedInput({ value: "", onChange, delay: 1000 }));

		act(() => result.current.onChange("now"));
		act(() => result.current.flush());
		expect(onChange).toHaveBeenCalledWith("now");
	});

	it("syncs local state when the external value changes", () => {
		const onChange = mock(() => {});
		const { result, rerender } = renderHook(
			({ value }) => useDebouncedInput({ value, onChange }),
			{ initialProps: { value: "first" } },
		);
		expect(result.current.value).toBe("first");

		rerender({ value: "external" });
		expect(result.current.value).toBe("external");
	});
});
