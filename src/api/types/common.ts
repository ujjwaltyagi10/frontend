// Shared API shapes. Hand-written until the backend's OpenAPI spec exists (CD-007);
// then this folder is replaced by generated types with the same names.

/** Money is always integer paise on the wire. Format with `formatMoney`. */
export type Paise = number;

/** ISO-8601 UTC timestamp, e.g. "2026-10-01T04:30:00Z". */
export type IsoDateTime = string;

export type Uuid = string;

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};
