export function save(input: { readonly id: string }): string {
  return input.id;
}

export const label = ({ id }: { readonly id: string }): string => id;

export class Store {
  constructor(readonly initial: { readonly id: string }) {}

  read(options: Readonly<{ id: string }> = this.initial): string {
    return options.id;
  }
}

export interface Sink {
  write(value: string | { readonly id: string }): void;
}

export type Listener = (...events: { readonly id: string }[]) => void;

export declare function processEvent(event: { readonly id: string }): void;
