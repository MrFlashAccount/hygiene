import React, { useEffect as synchronize } from "react";

export function Synchronizer(): null {
  synchronize(() => undefined, []);
  React.useLayoutEffect(() => undefined, []);
  React["useInsertionEffect"](() => undefined, []);
  return null;
}

export function useLocalEffects(React: { useEffect(): void }, synchronize: () => void): void {
  React.useEffect();
  synchronize();
}
