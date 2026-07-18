import type { Root, RootContent } from "mdast";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import type { MarkdownBlock } from "@/types/studio";

const atomicTypes = new Set(["code", "blockquote", "table", "image", "thematicBreak"]);

function sourceForNode(markdown: string, node: RootContent) {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (typeof start !== "number" || typeof end !== "number") return "";
  return markdown.slice(start, end);
}

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;

  return tree.children.flatMap<MarkdownBlock>((node, index) => {
    if (node.type === "html" && /<!--\s*pagebreak\s*-->/i.test(node.value.trim())) {
      return [{ id: `break-${index}`, type: "pageBreak", source: "", forceBreak: true }];
    }

    const source = sourceForNode(markdown, node).trim();
    if (!source) return [];

    return [{
      id: `${node.type}-${node.position?.start.offset ?? index}`,
      type: node.type,
      source,
      atomic: atomicTypes.has(node.type),
    }];
  });
}

export function countWords(markdown: string) {
  const plain = markdown
    .replace(/<!--\s*pagebreak\s*-->/gi, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`\[\]()|~-]/g, " ")
    .trim();
  const chinese = plain.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latin = plain.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  return chinese + latin;
}
