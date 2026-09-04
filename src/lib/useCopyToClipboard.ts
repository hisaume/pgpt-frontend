import { useEffect, useRef, useState } from "react";

// Resets the "copied" feedback flag after a short delay.
export function useCopyToClipboard(resetDelayMs = 1500) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), resetDelayMs);
    } catch {
      setCopied(false);
    }
  }

  return { copied, copy };
}
