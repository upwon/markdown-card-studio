export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function downloadText(content: string, filename: string) {
  downloadBlob(new Blob([content], { type: "text/markdown;charset=utf-8" }), filename);
}
