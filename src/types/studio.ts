export type ThemeId =
  | "classic-cream"
  | "warm-magazine"
  | "minimal-mono"
  | "apple-light"
  | "notion-light"
  | "google-color"
  | "linear-dark"
  | "spotify-dark";

export type TemplateId = "deep-reading" | "warm-paper";

export interface ThemeTokens {
  id: ThemeId;
  name: string;
  mode: "light" | "dark";
  paper: string;
  surface: string;
  ink: string;
  text: string;
  muted: string;
  accent: string;
  accentContrast: string;
  line: string;
  quoteBackground: string;
  codeBackground: string;
  codeText: string;
  shadow: string;
}

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  paddingX: number;
  paddingTop: number;
  contentHeight: number;
  fontSize: number;
  lineHeight: number;
  headingScale: number;
  blockGap: number;
  radius: number;
}

export interface StudioSettings {
  appearance: "dark" | "light";
  paginationMode: "auto" | "manual";
  themeId: ThemeId;
  templateId: TemplateId;
  fontSize: number;
  lineHeight: number;
  paddingX: number;
  accentOverride: string;
  account: string;
  column: string;
  zoom: number;
}

export interface MarkdownBlock {
  id: string;
  type: string;
  source: string;
  forceBreak?: boolean;
  atomic?: boolean;
}

export interface CardPage {
  id: string;
  blocks: MarkdownBlock[];
  overflow?: boolean;
}
