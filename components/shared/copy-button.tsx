"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyButton({ text, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <>
          <Icons.check className="size-4 mr-2 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Icons.copy className="size-4 mr-2" />
          {label || "Copy"}
        </>
      )}
    </Button>
  );
}

// Inline copy icon button
export function CopyIcon({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-muted transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Icons.check className="size-3.5 text-green-600" />
      ) : (
        <Icons.copy className="size-3.5 text-muted-foreground" />
      )}
    </button>
  );
}
