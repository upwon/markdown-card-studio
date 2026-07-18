import type { CardPage, MarkdownBlock } from "@/types/studio";

const headingTypes = new Set(["heading"]);

export function estimateBlockHeight(block: MarkdownBlock, fontSize = 30, lineHeight = 1.72) {
  const charsPerLine = Math.max(14, Math.floor(720 / fontSize));
  const lines = Math.max(1, Math.ceil(block.source.replace(/\s+/g, "").length / charsPerLine));
  const base = lines * fontSize * lineHeight;
  if (block.type === "heading") return Math.max(76, base * 1.35);
  if (block.type === "code") return Math.max(130, lines * fontSize * 1.45 + 54);
  if (block.type === "table") return Math.max(150, lines * fontSize * 1.25 + 52);
  if (block.type === "blockquote") return base + 38;
  if (block.type === "list") return base + 30;
  return base + 10;
}

export function paginateBlocks(
  blocks: MarkdownBlock[],
  options: { capacity: number; gap: number; heights?: Record<string, number>; fontSize?: number; lineHeight?: number },
): CardPage[] {
  const pages: CardPage[] = [];
  let current: MarkdownBlock[] = [];
  let used = 0;

  const heightOf = (block: MarkdownBlock) =>
    options.heights?.[block.id] ?? estimateBlockHeight(block, options.fontSize, options.lineHeight);

  const flush = () => {
    if (!current.length) return;
    pages.push({
      id: `page-${pages.length + 1}-${current[0].id}`,
      blocks: current,
      overflow: current.some((block) => heightOf(block) > options.capacity),
    });
    current = [];
    used = 0;
  };

  for (const block of blocks) {
    if (block.forceBreak) {
      flush();
      continue;
    }

    const blockHeight = heightOf(block);
    const nextHeight = used + (current.length ? options.gap : 0) + blockHeight;

    if (nextHeight > options.capacity && current.length) {
      const previous = current[current.length - 1];
      if (headingTypes.has(previous.type) && current.length > 1) {
        current.pop();
        flush();
        current = [previous, block];
        used = heightOf(previous) + options.gap + blockHeight;
      } else {
        flush();
        current = [block];
        used = blockHeight;
      }
    } else {
      current.push(block);
      used = nextHeight;
    }
  }

  flush();
  return pages.length ? pages : [{ id: "page-empty", blocks: [] }];
}
