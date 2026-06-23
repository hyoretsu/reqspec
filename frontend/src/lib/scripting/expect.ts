/**
 * A small, dependency-free subset of Chai's BDD `expect` API — enough to cover the
 * assertions Postman tests use in practice. Pure and synchronous: every terminal
 * assertion throws {@link AssertionError} on failure and returns the chain on success.
 */

export class AssertionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AssertionError";
	}
}

function typeOf(value: unknown): string {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	return typeof value;
}

function stringify(value: unknown): string {
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "bigint") return `${value}n`;
	if (value === undefined) return "undefined";
	try {
		return JSON.stringify(value) ?? String(value);
	} catch {
		return String(value);
	}
}

export function deepEqual(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true;
	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;

	const keysA = Object.keys(a as object);
	const keysB = Object.keys(b as object);
	if (keysA.length !== keysB.length) return false;
	return keysA.every(
		key => key in (b as object) && deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
	);
}

function length(value: unknown): number | undefined {
	if (typeof value === "string" || Array.isArray(value)) return value.length;
	return undefined;
}

class Assertion {
	private negated = false;

	constructor(private readonly obj: unknown) {}

	// Language chains — no-ops that read naturally.
	get to(): this {
		return this;
	}
	get be(): this {
		return this;
	}
	get been(): this {
		return this;
	}
	get is(): this {
		return this;
	}
	get that(): this {
		return this;
	}
	get which(): this {
		return this;
	}
	get and(): this {
		return this;
	}
	get has(): this {
		return this;
	}
	get have(): this {
		return this;
	}
	get with(): this {
		return this;
	}
	get of(): this {
		return this;
	}
	get deep(): this {
		return this;
	}

	get not(): this {
		this.negated = !this.negated;
		return this;
	}

	private check(pass: boolean, message: string, negatedMessage: string): this {
		if (this.negated ? pass : !pass) {
			throw new AssertionError(this.negated ? negatedMessage : message);
		}
		return this;
	}

	equal(expected: unknown): this {
		return this.check(
			Object.is(this.obj, expected),
			`expected ${stringify(this.obj)} to equal ${stringify(expected)}`,
			`expected ${stringify(this.obj)} to not equal ${stringify(expected)}`,
		);
	}

	eql(expected: unknown): this {
		return this.check(
			deepEqual(this.obj, expected),
			`expected ${stringify(this.obj)} to deeply equal ${stringify(expected)}`,
			`expected ${stringify(this.obj)} to not deeply equal ${stringify(expected)}`,
		);
	}

	a(type: string): this {
		return this.check(
			typeOf(this.obj) === type,
			`expected ${stringify(this.obj)} to be a ${type}`,
			`expected ${stringify(this.obj)} to not be a ${type}`,
		);
	}

	an(type: string): this {
		return this.a(type);
	}

	get true(): this {
		return this.check(this.obj === true, `expected ${stringify(this.obj)} to be true`, `expected ${stringify(this.obj)} to not be true`);
	}

	get false(): this {
		return this.check(this.obj === false, `expected ${stringify(this.obj)} to be false`, `expected ${stringify(this.obj)} to not be false`);
	}

	get null(): this {
		return this.check(this.obj === null, `expected ${stringify(this.obj)} to be null`, `expected ${stringify(this.obj)} to not be null`);
	}

	get undefined(): this {
		return this.check(
			this.obj === undefined,
			`expected ${stringify(this.obj)} to be undefined`,
			`expected ${stringify(this.obj)} to not be undefined`,
		);
	}

	get ok(): this {
		return this.check(Boolean(this.obj), `expected ${stringify(this.obj)} to be truthy`, `expected ${stringify(this.obj)} to be falsy`);
	}

	get empty(): this {
		const len = typeof this.obj === "object" && this.obj !== null && !Array.isArray(this.obj)
			? Object.keys(this.obj).length
			: length(this.obj) ?? 0;
		return this.check(len === 0, `expected ${stringify(this.obj)} to be empty`, `expected ${stringify(this.obj)} to not be empty`);
	}

	above(n: number): this {
		return this.check(Number(this.obj) > n, `expected ${stringify(this.obj)} to be above ${n}`, `expected ${stringify(this.obj)} to not be above ${n}`);
	}

	below(n: number): this {
		return this.check(Number(this.obj) < n, `expected ${stringify(this.obj)} to be below ${n}`, `expected ${stringify(this.obj)} to not be below ${n}`);
	}

	least(n: number): this {
		return this.check(Number(this.obj) >= n, `expected ${stringify(this.obj)} to be at least ${n}`, `expected ${stringify(this.obj)} to be below ${n}`);
	}

	most(n: number): this {
		return this.check(Number(this.obj) <= n, `expected ${stringify(this.obj)} to be at most ${n}`, `expected ${stringify(this.obj)} to be above ${n}`);
	}

	within(lo: number, hi: number): this {
		const n = Number(this.obj);
		return this.check(
			n >= lo && n <= hi,
			`expected ${stringify(this.obj)} to be within ${lo}..${hi}`,
			`expected ${stringify(this.obj)} to not be within ${lo}..${hi}`,
		);
	}

	match(re: RegExp): this {
		return this.check(re.test(String(this.obj)), `expected ${stringify(this.obj)} to match ${re}`, `expected ${stringify(this.obj)} to not match ${re}`);
	}

	include(needle: unknown): this {
		let pass = false;
		if (typeof this.obj === "string") pass = this.obj.includes(String(needle));
		else if (Array.isArray(this.obj)) pass = this.obj.some(item => deepEqual(item, needle));
		else if (typeof this.obj === "object" && this.obj !== null && typeof needle === "object" && needle !== null) {
			pass = Object.entries(needle).every(([k, v]) => deepEqual((this.obj as Record<string, unknown>)[k], v));
		}
		return this.check(pass, `expected ${stringify(this.obj)} to include ${stringify(needle)}`, `expected ${stringify(this.obj)} to not include ${stringify(needle)}`);
	}

	contain(needle: unknown): this {
		return this.include(needle);
	}

	property(name: string, value?: unknown): this {
		const has = typeof this.obj === "object" && this.obj !== null && name in (this.obj as object);
		if (arguments.length < 2) {
			return this.check(has, `expected ${stringify(this.obj)} to have property ${stringify(name)}`, `expected ${stringify(this.obj)} to not have property ${stringify(name)}`);
		}
		const actual = has ? (this.obj as Record<string, unknown>)[name] : undefined;
		return this.check(
			has && deepEqual(actual, value),
			`expected property ${stringify(name)} to equal ${stringify(value)} but got ${stringify(actual)}`,
			`expected property ${stringify(name)} to not equal ${stringify(value)}`,
		);
	}

	lengthOf(n: number): this {
		const len = length(this.obj);
		return this.check(len === n, `expected ${stringify(this.obj)} to have length ${n} but got ${len}`, `expected length to not be ${n}`);
	}

	length(n: number): this {
		return this.lengthOf(n);
	}
}

export function expect(obj: unknown): Assertion {
	return new Assertion(obj);
}

export type { Assertion };
