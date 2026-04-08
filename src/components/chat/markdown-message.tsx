'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = { text: string };

export function MarkdownMessage({ text }: Props) {
  return (
    <div className="text-[13px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-[13px] leading-relaxed">{children}</li>
          ),
          h1: ({ children }) => (
            <h1 className="text-[15px] font-semibold text-[#1a1a1a] mb-2 mt-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[14px] font-semibold text-[#1a1a1a] mb-1.5 mt-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-1">{children}</h3>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[#1a1a1a]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          code: ({ children }) => (
            <code className="px-1 py-0.5 rounded bg-white/60 border border-white/60 font-mono text-[11px]">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#ff6a3d] hover:underline">
              {children}
            </a>
          ),
          pre: ({ children }) => (
            <pre className="p-2 rounded-lg bg-white/60 border border-white/60 overflow-x-auto text-[11px] font-mono my-2">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-2 border-white/60" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#ff6a3d] pl-3 italic text-[#52525b] my-2">
              {children}
            </blockquote>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
