'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ 
  content, 
  className = '' 
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const CodeBlock = ({ children, className, ...props }: any) => {
    const language = className?.replace('language-', '') || 'text';
    const code = String(children).replace(/\n$/, '');

    return (
      <div className="relative group">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleCopyCode(code)}
            className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
            title="Copy code"
          >
            {copiedCode === code ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
        <pre className={`${className} p-4 rounded-lg bg-gray-900 text-gray-100 overflow-x-auto`}>
          <code {...props}>{children}</code>
        </pre>
      </div>
    );
  };

  const InlineCode = ({ children, ...props }: any) => (
    <code 
      {...props} 
      className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono"
    >
      {children}
    </code>
  );

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return <InlineCode {...props}>{children}</InlineCode>;
            }
            return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
          },
          // Customize other elements
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
          p: ({ children }) => <p className="mb-2">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-gray-300">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-3 py-2 bg-gray-50 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-3 py-2">{children}</td>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}; 