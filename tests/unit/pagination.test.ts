import { describe, expect, it } from "vitest";
import { paginateBlocks } from "@/core/pagination/paginate";
import type { MarkdownBlock } from "@/types/studio";

const block = (id: string, type = "paragraph"): MarkdownBlock => ({ id, type, source: id });

describe("pagination", () => {
  it("paginates deterministically using measured heights", () => {
    const blocks = [block("a"), block("b"), block("c")];
    const pages = paginateBlocks(blocks, { capacity: 210, gap: 10, heights: { a: 100, b: 100, c: 100 } });
    expect(pages.map((page) => page.blocks.map((item) => item.id))).toEqual([["a", "b"], ["c"]]);
  });

  it("honors forced page breaks", () => {
    const blocks = [block("a"), { id: "break", type: "pageBreak", source: "", forceBreak: true }, block("b")];
    const pages = paginateBlocks(blocks, { capacity: 1000, gap: 10 });
    expect(pages).toHaveLength(2);
    expect(pages[1].blocks[0].id).toBe("b");
  });

  it("moves a lonely heading to the next page", () => {
    const blocks = [block("body"), block("heading", "heading"), block("next")];
    const pages = paginateBlocks(blocks, { capacity: 220, gap: 10, heights: { body: 130, heading: 70, next: 100 } });
    expect(pages[0].blocks.map((item) => item.id)).toEqual(["body"]);
    expect(pages[1].blocks.map((item) => item.id)).toEqual(["heading", "next"]);
  });

  it("marks a page when a single atomic block exceeds capacity", () => {
    const pages = paginateBlocks([block("code", "code")], { capacity: 300, gap: 10, heights: { code: 500 } });
    expect(pages[0].overflow).toBe(true);
  });
});
