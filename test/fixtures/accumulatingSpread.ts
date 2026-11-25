export const copyOnEachStep = (rows: readonly string[]): string[] =>
  rows.reduce<string[]>((acc, row) => [...acc, row], []);

export function copyInLoop(rows: readonly string[]): string[] {
  let result: string[] = [];
  for (const row of rows) {
    result = [...result, row];
  }
  return result;
}
