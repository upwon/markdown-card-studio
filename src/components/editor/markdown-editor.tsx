"use client";

import { useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { markdown as markdownLanguage } from "@codemirror/lang-markdown";
import { defaultKeymap, history, historyKeymap, indentWithTab, redo, undo } from "@codemirror/commands";
import { searchKeymap } from "@codemirror/search";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import type { EditorView as EditorViewType } from "@codemirror/view";
import { Bold, Code2, Heading2, Italic, Link, List, ListOrdered, Quote, Redo2, SeparatorHorizontal, Undo2 } from "lucide-react";
import { useStudioStore } from "@/store/use-studio-store";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

const tools = [
  { label: "标题", icon: Heading2, before: "## ", after: "", placeholder: "小标题" },
  { label: "粗体", icon: Bold, before: "**", after: "**", placeholder: "重点" },
  { label: "斜体", icon: Italic, before: "_", after: "_", placeholder: "文字" },
  { label: "引用", icon: Quote, before: "> ", after: "", placeholder: "引用" },
  { label: "无序列表", icon: List, before: "- ", after: "", placeholder: "列表项" },
  { label: "有序列表", icon: ListOrdered, before: "1. ", after: "", placeholder: "列表项" },
  { label: "链接", icon: Link, before: "[", after: "](https://)", placeholder: "链接文字" },
  { label: "代码", icon: Code2, before: "`", after: "`", placeholder: "code" },
  { label: "分页", icon: SeparatorHorizontal, before: "\n\n<!-- pagebreak -->\n\n", after: "", placeholder: "" },
];

export function MarkdownEditor({ saveStatus }: { saveStatus: string }) {
  const markdown = useStudioStore((state) => state.markdown);
  const setMarkdown = useStudioStore((state) => state.setMarkdown);
  const editorRef = useRef<EditorViewType | null>(null);
  const extensions = useMemo(() => [
    lineNumbers(), history(), markdownLanguage(),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
    EditorView.lineWrapping,
    EditorView.theme({
      "&": { height: "100%", backgroundColor: "transparent", fontSize: "14px" },
      ".cm-scroller": { fontFamily: '"Geist Mono", ui-monospace, monospace', lineHeight: "1.7" },
      ".cm-content": { padding: "22px 12px 120px" },
      ".cm-gutters": { backgroundColor: "transparent", borderRight: "1px solid #262a33", color: "#596170" },
      ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,.035)" },
      ".cm-cursor": { borderLeftColor: "#82aaff" },
      ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "#28476e !important" },
    }),
  ], []);

  const insert = useCallback((before: string, after: string, placeholder: string) => {
    const view = editorRef.current;
    if (!view) return;
    const selection = view.state.selection.main;
    const selected = view.state.sliceDoc(selection.from, selection.to) || placeholder;
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: `${before}${selected}${after}` },
      selection: { anchor: selection.from + before.length, head: selection.from + before.length + selected.length },
      scrollIntoView: true,
    });
    view.focus();
  }, []);

  return (
    <section className="editor-pane" aria-label="Markdown 编辑器">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button type="button" className="icon-button" onClick={() => editorRef.current && undo(editorRef.current)} title="撤销"><Undo2 size={16} /></button>
          <button type="button" className="icon-button" onClick={() => editorRef.current && redo(editorRef.current)} title="重做"><Redo2 size={16} /></button>
        </div>
        <span className="toolbar-divider" />
        <div className="toolbar-group formatting-tools">
          {tools.map(({ label, icon: Icon, before, after, placeholder }) => (
            <button type="button" className="icon-button" key={label} onClick={() => insert(before, after, placeholder)} title={label}><Icon size={16} /></button>
          ))}
        </div>
        <span className="save-state"><i /> {saveStatus}</span>
      </div>
      <div className="editor-surface" data-testid="markdown-editor">
        <CodeMirror value={markdown} height="100%" extensions={extensions} onChange={setMarkdown} onCreateEditor={(view) => { editorRef.current = view; }} basicSetup={{ foldGutter: true, highlightActiveLine: true, bracketMatching: true, closeBrackets: true }} />
      </div>
    </section>
  );
}
