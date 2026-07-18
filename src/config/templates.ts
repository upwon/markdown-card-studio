import type { TemplateConfig } from "@/types/studio";

export const templates: TemplateConfig[] = [
  {
    id: "deep-reading",
    name: "Deep Reading",
    description: "高密度正文，适合知识型长文",
    paddingX: 74,
    paddingTop: 46,
    contentHeight: 948,
    fontSize: 30,
    lineHeight: 1.72,
    headingScale: 1.05,
    blockGap: 20,
    radius: 28,
  },
  {
    id: "warm-paper",
    name: "Warm Paper",
    description: "舒展留白，适合专栏与故事",
    paddingX: 86,
    paddingTop: 58,
    contentHeight: 920,
    fontSize: 29,
    lineHeight: 1.82,
    headingScale: 1.12,
    blockGap: 26,
    radius: 38,
  },
];

export const getTemplate = (id: TemplateConfig["id"]) =>
  templates.find((template) => template.id === id) ?? templates[0];
