export type { TiptapDoc, TiptapNode, TiptapMark } from "./tiptapTypes";
export { isValidTiptapDoc, normalizeTiptapDoc, plainTextToTiptapDoc } from "./normalize";
export { extractPlainText } from "./extractPlainText";
export { tiptapDocToHtml } from "./tiptapToHtml";
export { appendPlainTextToDoc, replacePlainTextInDoc, countWords } from "./insertText";
