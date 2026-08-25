/** 7 days x 4 blocks = 28 slots, packed into a single int bitmask. */

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const BLOCKS = [
  { id: 0, label: "Early", hint: "8–10am" },
  { id: 1, label: "Midday", hint: "11am–1pm" },
  { id: 2, label: "Afternoon", hint: "2–5pm" },
  { id: 3, label: "Evening", hint: "6–9pm" },
] as const;

export const SLOT_COUNT = DAYS.length * BLOCKS.length;

export const slotIndex = (day: number, block: number) => day * BLOCKS.length + block;

export const hasSlot = (mask: number, slot: number) => (mask & (1 << slot)) !== 0;

export const toggleSlot = (mask: number, slot: number) => mask ^ (1 << slot);

export function popcount(n: number): number {
  let count = 0;
  let v = n;
  while (v) {
    v &= v - 1;
    count++;
  }
  return count;
}

export function slotLabel(slot: number): string {
  const day = DAYS[Math.floor(slot / BLOCKS.length)];
  const block = BLOCKS[slot % BLOCKS.length];
  return `${day} ${block.hint}`;
}

export function listSlots(mask: number): number[] {
  const out: number[] = [];
  for (let s = 0; s < SLOT_COUNT; s++) if (hasSlot(mask, s)) out.push(s);
  return out;
}

/** Build a mask from a list of [day, block] pairs. */
export function maskFrom(pairs: Array<[number, number]>): number {
  return pairs.reduce((m, [d, b]) => m | (1 << slotIndex(d, b)), 0);
}

/**
 * What we assume when someone hasn't told us yet.
 *
 * Signup asks one question; pinning down a calendar is not it. Weekday
 * middays and afternoons is where coffee chats actually happen, and it's wide
 * enough that a new member is matchable on day one. They can narrow it from
 * the dashboard whenever they care to.
 */
export const DEFAULT_AVAILABILITY = maskFrom([
  [0, 1], [0, 2],
  [1, 1], [1, 2],
  [2, 1], [2, 2],
  [3, 1], [3, 2],
  [4, 1], [4, 2],
]);
