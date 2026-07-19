import type { CardFontId } from "@/types/studio";

export interface CardFontOption {
  id: CardFontId;
  name: string;
  description: string;
  family: string;
  stylesheet?: string;
}

export const cardFonts: CardFontOption[] = [
  {
    id: "system-sans",
    name: "系统黑体",
    description: "清晰现代，无需加载",
    family: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
  },
  {
    id: "noto-sans-sc",
    name: "Noto Sans SC",
    description: "开源黑体，稳重通用",
    family: '"Noto Sans SC Variable", "PingFang SC", sans-serif',
    stylesheet: "/fonts/noto-sans-sc/index.css",
  },
  {
    id: "noto-serif-sc",
    name: "Noto Serif SC",
    description: "开源宋体，适合长文",
    family: '"Noto Serif SC Variable", "Songti SC", serif',
    stylesheet: "/fonts/noto-serif-sc/index.css",
  },
  {
    id: "lxgw-wenkai",
    name: "霞鹜文楷",
    description: "自然温润，适合阅读",
    family: '"LXGW WenKai", "Kaiti SC", serif',
    stylesheet: "/fonts/lxgw-wenkai/index.css",
  },
  {
    id: "lxgw-marker-gothic",
    name: "霞鹜漫黑",
    description: "醒目活泼，适合标题",
    family: '"LXGW Marker Gothic", "PingFang SC", sans-serif',
    stylesheet: "/fonts/lxgw-marker-gothic/index.css",
  },
];

export function getCardFont(id: CardFontId | undefined) {
  return cardFonts.find((font) => font.id === id) ?? cardFonts[0];
}
