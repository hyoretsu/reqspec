import { describe, expect as bunExpect, it } from "bun:test";
import { AssertionError, deepEqual, expect } from "@/lib/scripting/expect";

function throws(fn: () => unknown): boolean {
	try {
		fn();
		return false;
	} catch (err) {
		return err instanceof AssertionError;
	}
}

describe("deepEqual", () => {
	it("compares primitives, arrays and nested objects", () => {
		bunExpect(deepEqual(1, 1)).toBe(true);
		bunExpect(deepEqual(Number.NaN, Number.NaN)).toBe(true);
		bunExpect(deepEqual(1, 2)).toBe(false);
		bunExpect(deepEqual([1, [2]], [1, [2]])).toBe(true);
		bunExpect(deepEqual([1], [1, 2])).toBe(false);
		bunExpect(deepEqual([1], { 0: 1 })).toBe(false);
		bunExpect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
		bunExpect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
		bunExpect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
		bunExpect(deepEqual({ a: 1 }, null)).toBe(false);
		bunExpect(deepEqual(null, null)).toBe(true);
	});
});

describe("expect chains", () => {
	it("language chains return the same assertion", () => {
		expect(1).to.be.been.is.that.which.and.has.have.with.of.deep.equal(1);
	});

	it("equal / not equal", () => {
		expect(1).to.equal(1);
		expect(1).to.not.equal(2);
		bunExpect(throws(() => expect(1).to.equal(2))).toBe(true);
		bunExpect(throws(() => expect(1).to.not.equal(1))).toBe(true);
	});

	it("eql deep equality", () => {
		expect({ a: [1] }).to.eql({ a: [1] });
		expect({ a: 1 }).to.not.eql({ a: 2 });
		bunExpect(throws(() => expect({ a: 1 }).to.eql({ a: 2 }))).toBe(true);
		bunExpect(throws(() => expect({ a: 1 }).to.not.eql({ a: 1 }))).toBe(true);
	});

	it("type checks via a/an", () => {
		expect("x").to.be.a("string");
		expect([]).to.be.an("array");
		expect(null).to.be.a("null");
		expect(1).to.not.be.a("string");
		bunExpect(throws(() => expect(1).to.be.a("string"))).toBe(true);
	});

	it("boolean / null / undefined / ok flags", () => {
		expect(true).to.be.true;
		expect(false).to.be.false;
		expect(null).to.be.null;
		expect(undefined).to.be.undefined;
		expect(1).to.be.ok;
		expect(0).to.not.be.ok;
		bunExpect(throws(() => expect(false).to.be.true)).toBe(true);
		bunExpect(throws(() => expect(true).to.be.false)).toBe(true);
		bunExpect(throws(() => expect(1).to.be.null)).toBe(true);
		bunExpect(throws(() => expect(1).to.be.undefined)).toBe(true);
		bunExpect(throws(() => expect(0).to.be.ok)).toBe(true);
	});

	it("empty", () => {
		expect("").to.be.empty;
		expect([]).to.be.empty;
		expect({}).to.be.empty;
		expect(5).to.be.empty; // length() undefined → 0
		expect([1]).to.not.be.empty;
		bunExpect(throws(() => expect("x").to.be.empty)).toBe(true);
		bunExpect(throws(() => expect({ a: 1 }).to.be.empty)).toBe(true);
	});

	it("numeric comparisons", () => {
		expect(5).to.be.above(4);
		expect(5).to.be.below(6);
		expect(5).to.be.least(5);
		expect(5).to.be.most(5);
		expect(5).to.be.within(1, 10);
		bunExpect(throws(() => expect(5).to.be.above(5))).toBe(true);
		bunExpect(throws(() => expect(5).to.be.below(5))).toBe(true);
		bunExpect(throws(() => expect(5).to.be.least(6))).toBe(true);
		bunExpect(throws(() => expect(5).to.be.most(4))).toBe(true);
		bunExpect(throws(() => expect(5).to.be.within(6, 10))).toBe(true);
		expect(5).to.not.be.within(6, 10);
	});

	it("match", () => {
		expect("hello").to.match(/ell/);
		expect("hello").to.not.match(/xyz/);
		bunExpect(throws(() => expect("hello").to.match(/xyz/))).toBe(true);
	});

	it("include for strings, arrays, objects", () => {
		expect("hello world").to.include("world");
		expect([1, 2, 3]).to.include(2);
		expect([{ a: 1 }]).to.contain({ a: 1 });
		expect({ a: 1, b: 2 }).to.include({ a: 1 });
		expect(5).to.not.include(1); // non-string/array/object → false
		bunExpect(throws(() => expect("hi").to.include("z"))).toBe(true);
		bunExpect(throws(() => expect({ a: 1 }).to.include({ a: 2 }))).toBe(true);
	});

	it("property with and without value", () => {
		expect({ a: 1 }).to.have.property("a");
		expect({ a: 1 }).to.have.property("a", 1);
		expect({ a: 1 }).to.not.have.property("b");
		expect(1).to.not.have.property("a");
		bunExpect(throws(() => expect({ a: 1 }).to.have.property("b"))).toBe(true);
		bunExpect(throws(() => expect({ a: 1 }).to.have.property("a", 2))).toBe(true);
	});

	it("lengthOf / length", () => {
		expect([1, 2]).to.have.lengthOf(2);
		expect("abc").to.have.length(3);
		bunExpect(throws(() => expect([1]).to.have.lengthOf(2))).toBe(true);
	});

	it("stringifies bigint and circular values without throwing", () => {
		bunExpect(throws(() => expect(1n).to.equal(2n))).toBe(true);
		const circular: Record<string, unknown> = {};
		circular.self = circular;
		bunExpect(throws(() => expect(circular).to.equal(2))).toBe(true);
	});
});
