import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a>,
        img: ({ alt, ...props }) => (
          // Markdown may reference arbitrary runtime URLs, so next/image cannot know dimensions.
          // eslint-disable-next-line @next/next/no-img-element
          <img {...props} alt={alt ?? "Markdown image"} crossOrigin="anonymous" />
        ),
        input: (props) => <input {...props} readOnly />,
      }}
    >
      {source}
    </ReactMarkdown>
  );
}
