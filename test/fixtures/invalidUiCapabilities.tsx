import { useEffect } from "react";

export const InvalidUiCapabilities = () => {
  useEffect(() => {
    localStorage.setItem("renderedAt", String(Date.now()));
  }, []);

  fetch("/api/data");

  return <div>{Math.random()}</div>;
};
