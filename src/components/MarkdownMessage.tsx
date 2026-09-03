/*
    MarkdownMessage — renders assistant markdown with GFM (tables, etc.)
    and syntax-highlighted, copyable fenced code blocks. Raw HTML is never
    rendered (no rehype-raw) since content originates from an LLM response.
*/

import { type ComponentPropsWithoutRef, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useCopyToClipboard } from "../lib/useCopyToClipboard";

function CodeBlock({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"code">) {
  const codeRef = useRef<HTMLElement>(null);
  const { copied, copy } = useCopyToClipboard();
  const lang = /language-(\w+)/.exec(className || "")?.[1] ?? "text";

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-lang">{lang}</span>
        <button
          type="button"
          className="code-block-copy"
          onClick={() =>
            copy((codeRef.current?.textContent ?? "").replace(/\n$/, ""))
          }
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code ref={codeRef} className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

const components: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }) => {
    const isBlock = /language-(\w+)/.test(className || "");
    if (!isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <CodeBlock className={className} {...props}>
        {children}
      </CodeBlock>
    );
  },
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
