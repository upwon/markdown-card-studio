"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getTemplate } from "@/config/templates";
import { getTheme } from "@/config/themes";
import { parseMarkdown } from "@/core/markdown/parse";
import { paginateBlocks, splitOversizedBlocks } from "@/core/pagination/paginate";
import { useStudioStore } from "@/store/use-studio-store";
import type { MarkdownBlock } from "@/types/studio";
import { MarkdownContent } from "./markdown-content";

type CardStyle = React.CSSProperties & Record<`--card-${string}`, string>;

function CardBody({ blocks }: { blocks: MarkdownBlock[] }) {
  if (!blocks.length) return <div className="empty-card">开始输入 Markdown，卡片会出现在这里。</div>;
  return blocks.map((block) => (
    <div className="markdown-block" key={block.id} data-block-type={block.type}>
      <MarkdownContent source={block.source} />
    </div>
  ));
}

export function CardPreview({ onPageCount }: { onPageCount: (count: number) => void }) {
  const markdown = useStudioStore((state) => state.markdown);
  const settings = useStudioStore((state) => state.settings);
  const activePage = useStudioStore((state) => state.activePage);
  const setActivePage = useStudioStore((state) => state.setActivePage);
  const measureRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);
  const theme = getTheme(settings.themeId);
  const template = getTemplate(settings.templateId);
  const accent = settings.accentOverride || theme.accent;
  const paginationMode = settings.paginationMode ?? "auto";

  const flowBlocks = useMemo(() => paginationMode === "auto"
    ? splitOversizedBlocks(blocks, {
      capacity: template.contentHeight,
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
    })
    : blocks, [blocks, paginationMode, settings.fontSize, settings.lineHeight, template.contentHeight]);

  const style = useMemo<CardStyle>(() => ({
    "--card-paper": theme.paper,
    "--card-surface": theme.surface,
    "--card-ink": theme.ink,
    "--card-text": theme.text,
    "--card-muted": theme.muted,
    "--card-accent": accent,
    "--card-accent-contrast": theme.accentContrast,
    "--card-line": theme.line,
    "--card-quote": theme.quoteBackground,
    "--card-code-bg": theme.codeBackground,
    "--card-code-text": theme.codeText,
    "--card-shadow": theme.shadow,
    "--card-font-size": `${settings.fontSize}px`,
    "--card-line-height": String(settings.lineHeight),
    "--card-padding-x": `${settings.paddingX}px`,
    "--card-padding-top": `${template.paddingTop}px`,
    "--card-block-gap": `${template.blockGap}px`,
    "--card-radius": `${template.radius}px`,
    "--card-heading-scale": String(template.headingScale),
  }), [accent, settings, template, theme]);

  const pages = useMemo(() => paginateBlocks(flowBlocks, {
    capacity: template.contentHeight,
    gap: template.blockGap,
    heights,
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    mode: paginationMode,
  }), [flowBlocks, heights, paginationMode, settings.fontSize, settings.lineHeight, template]);

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const next: Record<string, number> = {};
      root.querySelectorAll<HTMLElement>("[data-measure-id]").forEach((element) => {
        const id = element.dataset.measureId;
        if (id) next[id] = Math.ceil(element.getBoundingClientRect().height);
      });
      setHeights((current) => {
        const keys = Object.keys(next);
        if (keys.length === Object.keys(current).length && keys.every((key) => current[key] === next[key])) return current;
        return next;
      });
    };
    measure();
    document.fonts?.ready.then(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => { cancelled = true; observer.disconnect(); };
  }, [flowBlocks, style]);

  useEffect(() => {
    onPageCount(pages.length);
    if (activePage >= pages.length) setActivePage(Math.max(0, pages.length - 1));
  }, [activePage, onPageCount, pages.length, setActivePage]);

  return (
    <div className="preview-stage" data-testid="preview-stage">
      <div className="measure-stage" aria-hidden ref={measureRef} style={style}>
        <div className="card-measure-content">
          {flowBlocks.filter((block) => !block.forceBreak).map((block) => (
            <div className="markdown-block" data-block-type={block.type} data-measure-id={block.id} key={block.id}>
              <MarkdownContent source={block.source} />
            </div>
          ))}
        </div>
      </div>
      <div className="preview-list">
        {pages.map((page, index) => (
          <button type="button" className={`card-preview-wrap ${activePage === index ? "is-active" : ""}`} style={{ width: 900 * settings.zoom, height: 1200 * settings.zoom }} onClick={() => setActivePage(index)} key={page.id} aria-label={`选择第 ${index + 1} 页`}>
            <article className="export-card" data-export-card data-page={index + 1} style={{ ...style, transform: `scale(${settings.zoom})` }}>
              <header className="card-header"><span className="card-column">{settings.column}</span><span className="card-mark"><i /> M</span></header>
              <main className="card-content"><CardBody blocks={page.blocks} /></main>
              <footer className="card-footer"><span>{settings.account}</span><span>{String(index + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}</span></footer>
              {page.overflow && <span className="overflow-badge">{paginationMode === "manual" ? "本页内容超出卡片，请插入分页符" : "单个内容块过高，请拆分内容或调小字号"}</span>}
            </article>
          </button>
        ))}
      </div>
    </div>
  );
}
