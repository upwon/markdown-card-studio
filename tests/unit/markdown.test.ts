import { describe, expect, it } from "vitest";
import { countWords, parseMarkdown } from "@/core/markdown/parse";

describe("Markdown parser", () => {
  it("keeps horizontal rules and recognizes explicit page breaks", () => {
    const blocks = parseMarkdown("# 标题\n\n---\n\n正文\n\n<!-- pagebreak -->\n\n## 下一页");
    expect(blocks.some((block) => block.type === "thematicBreak")).toBe(true);
    expect(blocks.filter((block) => block.forceBreak)).toHaveLength(1);
  });

  it("supports GFM tables and task lists", () => {
    const blocks = parseMarkdown("- [x] 完成\n\n| A | B |\n|---|---|\n| 1 | 2 |");
    expect(blocks.map((block) => block.type)).toEqual(["list", "table"]);
  });

  it("counts Chinese characters and latin words", () => {
    expect(countWords("你好 Markdown Card 2026")).toBe(5);
  });
});
