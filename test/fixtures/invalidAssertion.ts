export const readString = (value: unknown): string => value as string;

// Unrelated adjacent comment.
export const unmarked = "example" as string;

// WHY:
export const emptyReason = "example" as string;

// WHY: This comment is not adjacent to the assertion.

export const detached = "example" as string;

// Unrelated comment before an otherwise valid directive.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
export const readNumber = (value: unknown): number => value as number;
