"use client";

import { Check, Files, Palette, SlidersHorizontal, Type } from "lucide-react";
import { templates } from "@/config/templates";
import { themes } from "@/config/themes";
import { useStudioStore } from "@/store/use-studio-store";
import type { StudioSettings } from "@/types/studio";

function RangeField({ label, value, min, max, step, onChange, suffix = "" }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="range-field"><span><b>{label}</b><em>{value}{suffix}</em></span><input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

export function SettingsPanel() {
  const settings = useStudioStore((state) => state.settings);
  const updateSettings = useStudioStore((state) => state.updateSettings);
  const update = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => updateSettings({ [key]: value });
  return (
    <aside className="settings-panel" aria-label="样式设置">
      <div className="settings-heading"><span className="brand-glyph">M</span><div><strong>Markdown</strong><small>Card Studio</small></div></div>
      <section className="setting-section">
        <h2><Files size={15} /> 分页方式</h2>
        <div className="pagination-mode" role="group" aria-label="分页方式">
          <button type="button" className={settings.paginationMode !== "manual" ? "is-selected" : ""} onClick={() => update("paginationMode", "auto")}><strong>自动分页</strong><small>根据卡片高度自动换页</small></button>
          <button type="button" className={settings.paginationMode === "manual" ? "is-selected" : ""} onClick={() => update("paginationMode", "manual")}><strong>手动分页</strong><small>仅按分页符生成新页面</small></button>
        </div>
        <p className="pagination-hint">手动分页符：<code>&lt;!-- pagebreak --&gt;</code></p>
      </section>
      <section className="setting-section">
        <h2><SlidersHorizontal size={15} /> 排版模板</h2>
        <div className="template-list">{templates.map((template) => <button type="button" key={template.id} className={`template-option ${settings.templateId === template.id ? "is-selected" : ""}`} onClick={() => update("templateId", template.id)}><span><strong>{template.name}</strong><small>{template.description}</small></span>{settings.templateId === template.id && <Check size={16} />}</button>)}</div>
      </section>
      <section className="setting-section">
        <h2><Palette size={15} /> 主题配色</h2>
        <div className="theme-grid">{themes.map((theme) => <button type="button" className={`theme-option ${settings.themeId === theme.id ? "is-selected" : ""}`} key={theme.id} onClick={() => update("themeId", theme.id)} title={theme.name}><span className="theme-swatch" style={{ background: theme.paper, color: theme.ink, borderColor: theme.line }}><i style={{ background: theme.accent }} /></span><small>{theme.name}</small></button>)}</div>
      </section>
      <section className="setting-section">
        <h2><Type size={15} /> 文字与留白</h2>
        <RangeField label="正文字号" value={settings.fontSize} min={24} max={38} step={1} suffix="px" onChange={(value) => update("fontSize", value)} />
        <RangeField label="行高" value={settings.lineHeight} min={1.35} max={2.1} step={0.05} onChange={(value) => update("lineHeight", value)} />
        <RangeField label="左右边距" value={settings.paddingX} min={54} max={120} step={2} suffix="px" onChange={(value) => update("paddingX", value)} />
        <label className="color-field"><span>强调色</span><div><input type="color" value={settings.accentOverride || "#bb7a12"} onChange={(event) => update("accentOverride", event.target.value)} /><button type="button" onClick={() => update("accentOverride", "")}>跟随主题</button></div></label>
      </section>
      <section className="setting-section compact-fields">
        <h2>页脚信息</h2>
        <label><span>账号</span><input value={settings.account} onChange={(event) => update("account", event.target.value)} /></label>
        <label><span>栏目</span><input value={settings.column} onChange={(event) => update("column", event.target.value)} /></label>
      </section>
    </aside>
  );
}
