import type { CardPage, MarkdownBlock } from "@/types/studio";

const headingTypes = new Set(["heading"]);

export type PaginationMode = "auto" | "manual";

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

function isSafeMarkdownBoundary(source: string, index: number) {
  const prefix = source.slice(0, index);
  const backticks = (prefix.match(/`/g) ?? []).length;
  const strongMarkers = (prefix.match(/\*\*|__/g) ?? []).length;
  const openBrackets = (prefix.match(/\[/g) ?? []).length - (prefix.match(/\]/g) ?? []).length;
  const openParens = (prefix.match(/\(/g) ?? []).length - (prefix.match(/\)/g) ?? []).length;
  return backticks % 2 === 0 && strongMarkers % 2 === 0 && openBrackets <= 0 && openParens <= 0;
}

function splitSourceSafely(source: string, targetChars: number, type: string) {
  if (source.length <= targetChars) return [source];
  const boundaries = new Set<number>();
  const boundaryPattern = type === "list"
    ? /\r?\n(?=(?:[-+*]|\d+[.)])\s)/g
    : /(?:\r?\n+|[。！？!?；;]+|\s+)/g;
  for (const match of source.matchAll(boundaryPattern)) {
    const boundary = match.index + match[0].length;
    if (isSafeMarkdownBoundary(source, boundary)) boundaries.add(boundary);
  }
  const ordered = [...boundaries].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = 0;

  while (source.length - start > targetChars) {
    const ideal = start + targetChars;
    const lowerBound = start + Math.floor(targetChars * 0.55);
    const upperBound = start + Math.floor(targetChars * 1.25);
    const before = ordered.filter((value) => value >= lowerBound && value <= ideal).at(-1);
    const after = ordered.find((value) => value > ideal && value <= upperBound);
    const end = before ?? after;
    if (!end) return [source];
    const part = source.slice(start, end).trim();
    if (part) parts.push(part);
    start = end;
  }

  const remainder = source.slice(start).trim();
  if (remainder) parts.push(remainder);
  return parts.length > 1 ? parts : [source];
}

export function splitOversizedBlocks(
  blocks: MarkdownBlock[],
  options: { capacity: number; fontSize: number; lineHeight: number },
) {
  const charsPerLine = Math.max(14, Math.floor(720 / options.fontSize));
  const linesPerPage = Math.max(4, Math.floor(options.capacity / (options.fontSize * options.lineHeight)));
  const pageChars = charsPerLine * linesPerPage;

  return blocks.flatMap((block) => {
    if (block.forceBreak || block.atomic || headingTypes.has(block.type)) return [block];
    const density = block.type === "list" ? 0.42 : 0.72;
    const targetChars = Math.max(100, Math.floor(pageChars * density));
    const parts = splitSourceSafely(block.source, targetChars, block.type);
    return parts.map((source, index) => ({
      ...block,
      id: parts.length > 1 ? `${block.id}-part-${index + 1}` : block.id,
      source,
    }));
  });
}

export function paginateBlocks(
  blocks: MarkdownBlock[],
  options: { capacity: number; gap: number; heights?: Record<string, number>; fontSize?: number; lineHeight?: number; mode?: PaginationMode },
): CardPage[] {
  const pages: CardPage[] = [];
  let current: MarkdownBlock[] = [];
  let used = 0;

  const heightOf = (block: MarkdownBlock) =>
    options.heights?.[block.id] ?? estimateBlockHeight(block, options.fontSize, options.lineHeight);

  const flush = () => {
    if (!current.length) return;
    const totalHeight = current.reduce((total, block, index) => total + heightOf(block) + (index ? options.gap : 0), 0);
    pages.push({
      id: `page-${pages.length + 1}-${current[0].id}`,
      blocks: current,
      overflow: totalHeight > options.capacity,
    });
    current = [];
    used = 0;
  };

  for (const block of blocks) {
    if (block.forceBreak) {
      flush();
      continue;
    }

    if (options.mode === "manual") {
      current.push(block);
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
