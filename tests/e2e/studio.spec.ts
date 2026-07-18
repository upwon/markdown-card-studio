import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

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
