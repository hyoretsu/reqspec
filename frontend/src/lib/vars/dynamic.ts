const FIRST_NAMES = ["Alex", "Sam", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Jamie"];
const LAST_NAMES = ["Smith", "Jones", "Lee", "Garcia", "Patel", "Nguyen", "Khan", "Silva"];
const COLORS = ["red", "green", "blue", "cyan", "magenta", "yellow", "black", "white"];
const CITIES = ["London", "Tokyo", "Berlin", "Lisbon", "Toronto", "Austin", "Oslo", "Cairo"];

function pick(list: string[]): string {
	return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min = 0, max = 1000): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Resolvers for Postman-style dynamic variables (`{{$name}}`). Values are non-deterministic. */
const RESOLVERS: Record<string, () => string> = {
	guid: () => crypto.randomUUID(),
	randomUUID: () => crypto.randomUUID(),
	timestamp: () => String(Math.floor(Date.now() / 1000)),
	isoTimestamp: () => new Date().toISOString(),
	randomInt: () => String(randomInt()),
	randomBoolean: () => String(Math.random() < 0.5),
	randomFirstName: () => pick(FIRST_NAMES),
	randomLastName: () => pick(LAST_NAMES),
	randomFullName: () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
	randomEmail: () => `${pick(FIRST_NAMES).toLowerCase()}.${pick(LAST_NAMES).toLowerCase()}@example.com`,
	randomColor: () => pick(COLORS),
	randomCity: () => pick(CITIES),
	randomPhoneNumber: () => `+1${randomInt(2000000000, 9999999999)}`,
};

/** Names (without the leading `$`) of all supported dynamic variables. */
export const DYNAMIC_VARIABLE_NAMES = Object.keys(RESOLVERS);

/** Resolve a dynamic variable token name (e.g. `$guid`). Returns null if unknown. */
export function resolveDynamic(name: string): string | null {
	if (!name.startsWith("$")) return null;
	const resolver = RESOLVERS[name.slice(1)];
	return resolver ? resolver() : null;
}
