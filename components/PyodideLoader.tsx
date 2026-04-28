"use client";

import Script from "next/script";

export default function PyodideLoader() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/pyodide/v0.27.4/full/pyodide.js"
      strategy="afterInteractive"
      onLoad={() => {
        // @ts-expect-error global
        window.__pyodidePromise = window.loadPyodide();
      }}
    />
  );
}
