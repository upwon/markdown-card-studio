import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function minimumEditorContrast(page: Page) {
  return page.locator(".cm-editor").evaluate((editor) => {
    const parseRgb = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const luminance = (rgb: number[]) => rgb
      .map((channel) => channel / 255)
      .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const background = parseRgb(getComputedStyle(editor.closest(".editor-pane")!).backgroundColor);
    const backgroundLuminance = luminance(background);
    const nodes = [editor, ...editor.querySelectorAll(".cm-line span")];
    return Math.min(...nodes.map((node) => {
      const foregroundLuminance = luminance(parseRgb(getComputedStyle(node).color));
      return (Math.max(backgroundLuminance, foregroundLuminance) + 0.05)
        / (Math.min(backgroundLuminance, foregroundLuminance) + 0.05);
    }));
  });
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => console.error(`PAGE ERROR: ${error.message}`));
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("edits Markdown, paginates, switches theme, and persists", async ({ page, isMobile }) => {
  await expect(page.getByText("Markdown Card Studio").first()).toBeVisible();
  await expect(page.locator("[data-export-card]")).toHaveCount(2);

  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.type("# 持久化测试\n\n第一张卡片\n\n<!-- pagebreak -->\n\n## 第二张\n\n内容");
  await expect(page.locator("[data-export-card]")).toHaveCount(2);
  if (isMobile) await page.getByRole("button", { name: "样式" }).click();
  await page.getByTitle("Linear 深色").click();
  await expect(page.locator("[data-export-card]").first()).toHaveCSS("background-color", "rgb(17, 17, 19)");

  await page.reload();
  await expect(page.locator(".cm-content")).toContainText("持久化测试");
  await expect(page.locator("[data-export-card]")).toHaveCount(2);
});

test("mobile tabs expose editor, preview and settings", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only flow");
  await page.getByRole("button", { name: "预览" }).click();
  await expect(page.getByLabel("卡片预览")).toBeVisible();
  await page.getByRole("button", { name: "样式" }).click();
  await expect(page.getByLabel("样式设置")).toBeVisible();
});

test("switches the application appearance and persists the choice", async ({ page }) => {
  const shell = page.locator(".studio-shell");
  await expect(shell).toHaveAttribute("data-app-theme", "dark");

  await page.getByRole("button", { name: "切换到浅色界面" }).click();
  await expect(shell).toHaveAttribute("data-app-theme", "light");
  await expect(page.locator(".workspace-preview")).toHaveCSS("background-color", "rgb(233, 237, 243)");

  await page.reload();
  await expect(page.locator(".studio-shell")).toHaveAttribute("data-app-theme", "light");
  await expect(page.getByRole("button", { name: "切换到深色界面" })).toBeVisible();
});

test("keeps Markdown syntax readable in both application appearances", async ({ page }) => {
  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.insertText("# 清晰标题\n\n> 清晰引用\n\n普通正文、**重点文字**、[清晰链接](https://example.com) 和 `代码`。\n\n---");

  await expect.poll(() => minimumEditorContrast(page)).toBeGreaterThanOrEqual(4.5);
  await page.getByRole("button", { name: "切换到浅色界面" }).click();
  await expect.poll(() => minimumEditorContrast(page)).toBeGreaterThanOrEqual(4.5);
});

test("keeps a long pasted Markdown document independently scrollable", async ({ page, isMobile }) => {
  if (isMobile) await page.getByRole("button", { name: "编辑" }).click();
  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  const longMarkdown = Array.from(
    { length: 1200 },
    (_, index) => `这是用于验证长文档滚动的第 ${index + 1} 行。`,
  ).join("\n");
  await page.keyboard.insertText(longMarkdown);

  const scroller = page.locator(".cm-scroller");
  await expect.poll(() => scroller.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await scroller.evaluate((element) => { element.scrollTop = 0; });
  await scroller.hover();
  await page.mouse.wheel(0, 900);
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
});

test("switches between automatic and page-break-only pagination", async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), "desktop pagination controls verification");
  const editor = page.locator(".cm-content");
  const listItems = Array.from({ length: 14 }, (_, index) => `- 第 ${index + 1} 项：这是一段用于验证分页和自动换行的完整内容。`);
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.insertText(listItems.join("\n"));

  await expect.poll(() => page.locator("[data-export-card]").count()).toBeGreaterThan(1);
  await expect(page.locator(".overflow-badge")).toHaveCount(0);

  await page.getByRole("button", { name: /手动分页/ }).click();
  await expect(page.locator("[data-export-card]")).toHaveCount(1);
  await expect(page.locator(".overflow-badge")).toContainText("请插入分页符");

  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.insertText(`${listItems.slice(0, 7).join("\n")}\n\n<!-- pagebreak -->\n\n${listItems.slice(7).join("\n")}`);
  await expect(page.locator("[data-export-card]")).toHaveCount(2);
  await expect(page.locator(".overflow-badge")).toHaveCount(0);
});

test("exports the current card as an exact 900 by 1200 PNG", async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), "desktop export verification");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "当前页" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("markdown-card-01.png");
  const path = await download.path();
  expect(path).toBeTruthy();
  const png = await readFile(path!);
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(900);
  expect(png.readUInt32BE(20)).toBe(1200);
});
