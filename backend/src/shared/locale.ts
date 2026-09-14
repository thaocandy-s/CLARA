export type AppLocale = "vi" | "ja";

export const localeFromHeader = (header: string | undefined): AppLocale =>
  header?.toLowerCase().includes("ja") ? "ja" : "vi";
