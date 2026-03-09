import type { TemplateLayoutDefinition } from "./layoutTypes";

export type GuidedQuestionInputType = "text" | "textarea";

export type GuidedTemplateQuestion = {
  questionId: string;
  prompt: string;
  helpText?: string;
  required: boolean;
  inputType?: GuidedQuestionInputType;
  slotKey?: string;
};

export type GuidedTemplateChapter = {
  chapterKey: string;
  title: string;
  subtitle?: string;
};

export type GuidedTemplateSlotBinding = {
  chapterKey: string;
  questionId: string;
  slotPath: string;
  layoutIdLandscape?: string;
  pageLayoutId?: string;
  slotId?: string;
  bindingKey?: string;
};

export type GuidedTemplateV2 = {
  templateId: string;
  version: number;
  title: string;
  subtitle: string;
  isActive: boolean;
  chapters: GuidedTemplateChapter[];
  questionFlow: Record<string, GuidedTemplateQuestion[]>;
  slotMap: Record<string, GuidedTemplateSlotBinding>;
} & Partial<TemplateLayoutDefinition>;

export type GuidedTemplateSummary = {
  templateId: string;
  version: number;
  title: string;
  subtitle: string;
  isActive: boolean;
  chapters: GuidedTemplateChapter[];
} & Partial<Pick<TemplateLayoutDefinition, "layoutSchemaVersion" | "pageLayouts" | "chapterPagePlans">>;
