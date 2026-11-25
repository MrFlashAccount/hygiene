export const STATUS = { state: "ready" } as const;

export type Nonempty = string & { readonly __nonempty: unique symbol };

export function parseNonempty(value: string): Nonempty {
  if (value.length === 0) {
    throw new RangeError("Expected a nonempty string");
  }
  // WHY: The length check establishes the brand; TypeScript cannot infer it.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as Nonempty;
}
