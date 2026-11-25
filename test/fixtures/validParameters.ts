interface Input {
  readonly id: string;
}

export function save({ id }: Input): { readonly id: string } {
  return { id };
}

export const format = (input: Readonly<Input> = { id: "new" }): string => input.id;
export type ReadInput = (read: () => { readonly id: string }) => Input;
export declare function write<T extends { readonly id: string }>(item: T): T;
export const empty: { readonly id: string } = { id: "" };
