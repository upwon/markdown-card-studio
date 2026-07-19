"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Eye, FileDown, FilePlus2, FileUp, LoaderCircle, Moon, PanelLeft, Settings2, Sparkles, Sun } from "lucide-react";
import { getFontEmbedCSS, toBlob, toPng } from "html-to-image";
import JSZip from "jszip";
import { countWords } from "@/core/markdown/parse";
import { downloadBlob, downloadText } from "@/lib/download";
import { useStudioStore } from "@/store/use-studio-store";
import { MarkdownEditor } from "./editor/markdown-editor";
import { CardPreview } from "./preview/card-preview";
import { SettingsPanel } from "./settings/settings-panel";

type MobileTab = "settings" | "editor" | "preview";

async function waitForCardFonts() {
  const links = Array.from(document.querySelectorAll<HTMLLinkElement>("link[data-card-font]"));
  await Promise.all(links.map((link) => {
    if (link.sheet) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const done = () => resolve();
      link.addEventListener("load", done, { once: true });
      link.addEventListener("error", done, { once: true });
      window.setTimeout(done, 5000);
    });
  }));
  await document.fonts?.ready;
}

export function Studio() {
  const markdown = useStudioStore((state) => state.markdown);
  const setMarkdown = useStudioStore((state) => state.setMarkdown);
  const resetDocument = useStudioStore((state) => state.resetDocument);
  const settings = useStudioStore((state) => state.settings);
  const updateSettings = useStudioStore((state) => state.updateSettings);
  const activePage = useStudioStore((state) => state.activePage);
  const appearance = settings.appearance ?? "dark";
  const [pageCount, setPageCount] = useState(1);
  const saveStatus = "已保存";
  const [exportStatus, setExportStatus] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("editor");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cards = () => Array.from(document.querySelectorAll<HTMLElement>("[data-export-card]"));
  const prepareCard = (card: HTMLElement) => {
    const previous = card.style.transform;
    card.style.transform = "none";
    return () => { card.style.transform = previous; };
  };

  const exportCurrent = useCallback(async () => {
    const card = cards()[activePage];
    if (!card) return;
    setExportStatus("正在导出当前页…");
    const restore = prepareCard(card);
    try {
      await waitForCardFonts();
      const dataUrl = await toPng(card, { width: 900, height: 1200, pixelRatio: 1, cacheBust: true, preferredFontFormat: "woff2" });
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `markdown-card-${String(activePage + 1).padStart(2, "0")}.png`;
      anchor.click();
      setExportStatus("当前页已导出");
    } catch (error) {
      console.error(error);
      setExportStatus("导出失败，请检查外部图片是否允许跨域");
    } finally { restore(); }
  }, [activePage]);

  const exportAll = useCallback(async () => {
    const allCards = cards();
    if (!allCards.length) return;
    setExportStatus(`正在导出 0 / ${allCards.length}`);
    const zip = new JSZip();
    try {
      await waitForCardFonts();
      const fontEmbedCSS = await getFontEmbedCSS(allCards[0], { cacheBust: true, preferredFontFormat: "woff2" });
      for (let index = 0; index < allCards.length; index += 1) {
        const card = allCards[index];
        const restore = prepareCard(card);
        let blob: Blob | null = null;
        try { blob = await toBlob(card, { width: 900, height: 1200, pixelRatio: 1, cacheBust: true, preferredFontFormat: "woff2", fontEmbedCSS }); } finally { restore(); }
        if (!blob) throw new Error(`第 ${index + 1} 页生成失败`);
        zip.file(`markdown-card-${String(index + 1).padStart(2, "0")}.png`, blob);
        setExportStatus(`正在导出 ${index + 1} / ${allCards.length}`);
      }
      downloadBlob(await zip.generateAsync({ type: "blob" }), "markdown-cards.zip");
      setExportStatus(`${allCards.length} 页已打包`);
    } catch (error) {
      console.error(error);
      setExportStatus(error instanceof Error ? error.message : "批量导出失败");
    }
  }, []);

  const importMarkdown = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".md")) { setExportStatus("请选择 .md 文件"); return; }
    setMarkdown(await file.text());
    setExportStatus(`已导入 ${file.name}`);
  };

  return (
    <main className="studio-shell" data-app-theme={appearance}>
      <header className="topbar">
        <div className="topbar-brand"><span>Markdown Card Studio</span><em>MVP</em></div>
        <div className="document-stats"><span>{countWords(markdown)} 字</span><i /><span>{pageCount} 页</span></div>
        <div className="topbar-actions">
          <button
            type="button"
            className="topbar-button ghost appearance-toggle"
            onClick={() => updateSettings({ appearance: appearance === "dark" ? "light" : "dark" })}
            title={appearance === "dark" ? "切换到浅色界面" : "切换到深色界面"}
            aria-label={appearance === "dark" ? "切换到浅色界面" : "切换到深色界面"}
          >
            {appearance === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>{appearance === "dark" ? "浅色界面" : "深色界面"}</span>
          </button>
          <button type="button" className="topbar-button ghost" onClick={() => { if (window.confirm("新建文档会覆盖当前内容，确定继续吗？")) resetDocument(); }}><FilePlus2 size={16} /> 新建</button>
          <button type="button" className="topbar-button ghost" onClick={() => fileInputRef.current?.click()}><FileUp size={16} /> 导入</button>
          <input ref={fileInputRef} type="file" accept=".md,text/markdown" hidden onChange={(event) => { void importMarkdown(event.target.files?.[0]); event.currentTarget.value = ""; }} />
          <button type="button" className="topbar-button ghost" onClick={() => downloadText(markdown, "markdown-card-document.md")}><FileDown size={16} /> 下载 MD</button>
          <label className="zoom-control">预览 <input aria-label="预览缩放" type="range" min="0.32" max="0.76" step="0.02" value={settings.zoom} onChange={(event) => updateSettings({ zoom: Number(event.target.value) })} /><span>{Math.round(settings.zoom * 100)}%</span></label>
          <button type="button" className="topbar-button" onClick={() => void exportCurrent()}><Download size={16} /> 当前页</button>
          <button type="button" className="topbar-button primary" onClick={() => void exportAll()}><Sparkles size={16} /> 全部 ZIP</button>
        </div>
      </header>
      <nav className="mobile-tabs" aria-label="移动端工作区">
        {([["settings", Settings2, "样式"], ["editor", PanelLeft, "编辑"], ["preview", Eye, "预览"]] as const).map(([id, Icon, label]) => <button type="button" className={mobileTab === id ? "is-active" : ""} onClick={() => setMobileTab(id)} key={id}><Icon size={16} />{label}</button>)}
      </nav>
      <div className="workspace" data-mobile-tab={mobileTab}>
        <div className="workspace-settings"><SettingsPanel /></div>
        <div className="workspace-editor"><MarkdownEditor saveStatus={saveStatus} /></div>
        <section className="workspace-preview" aria-label="卡片预览">
          <div className="preview-heading"><span><Eye size={15} /> 实时预览</span><small>900 × 1200 · 3:4</small></div>
          <CardPreview onPageCount={setPageCount} />
        </section>
      </div>
      {exportStatus && <div className="status-toast" role="status">{exportStatus.includes("正在") && <LoaderCircle className="spin" size={15} />}{exportStatus}</div>}
      <button className="mobile-export" type="button" onClick={() => void exportAll()}><Download size={18} /> 导出全部卡片</button>
    </main>
  );
}
