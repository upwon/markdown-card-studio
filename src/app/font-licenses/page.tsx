import Link from "next/link";

export default function FontLicensesPage() {
  return (
    <main style={{ height: "100vh", overflow: "auto", padding: "56px max(24px, calc((100vw - 760px) / 2))", background: "#f7f4ed", color: "#25231f", fontFamily: "system-ui, sans-serif", lineHeight: 1.7 }}>
      <h1>字体授权说明</h1>
      <p>Markdown Card Studio 不上传用户内容。下列开源字体以本地 Web Font 的方式随站点提供，预览与导出使用同一份字体资源。</p>
      <ul>
        <li><strong>Noto Sans SC</strong> — SIL Open Font License 1.1</li>
        <li><strong>Noto Serif SC</strong> — SIL Open Font License 1.1</li>
        <li><strong>霞鹜文楷（LXGW WenKai）</strong> — SIL Open Font License 1.1</li>
        <li><strong>霞鹜漫黑（LXGW Marker Gothic）</strong> — SIL Open Font License 1.1</li>
      </ul>
      <p>“系统黑体”调用设备已有字体，不随本站分发。开源字体允许个人及商业用途、嵌入和再分发，但修改后的字体需继续遵循 OFL 条款，且不能单独出售字体文件。</p>
      <p><a href="https://openfontlicense.org/open-font-license-official-text/" target="_blank" rel="noreferrer">阅读 SIL Open Font License 1.1 全文</a></p>
      <p><Link href="/">返回编辑器</Link></p>
    </main>
  );
}
