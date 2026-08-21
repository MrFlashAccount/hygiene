import { useEffect } from "react";

export const InvalidUiCapabilities = () => {
  useEffect(() => {
    localStorage.setItem("renderedAt", String(Date.now()));
  }, []);

  fetch("/api/data");
  window.fetch("/api/window-data");
  globalThis.localStorage.getItem("session");
  new self.WebSocket("wss://example.test");

  return <div>{Math.random()}</div>;
};
