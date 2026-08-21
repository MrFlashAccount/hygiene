import React, { useEffect as synchronize } from "react";

export function Synchronizer(): null {
  synchronize(() => undefined, []);
  React.useLayoutEffect(() => undefined, []);
  React["useInsertionEffect"](() => undefined, []);
  return null;
}
