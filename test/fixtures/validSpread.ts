export function collect(rows: readonly string[]): string[] {
  const result: string[] = [];
  for (const row of rows) {
    result.push(row);
  }
  return result;
}

export const appendOnce = (rows: readonly string[], row: string): string[] => [...rows, row];
