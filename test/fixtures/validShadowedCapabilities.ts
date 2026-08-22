interface LocalCapabilities {
  fetch(url: string): void;
  localStorage: {
    getItem(key: string): string | null;
  };
}

export function useLocalCapabilities(
  window: LocalCapabilities,
  globalThis: LocalCapabilities,
): void {
  window.fetch("/local");
  globalThis.localStorage.getItem("local");
}
