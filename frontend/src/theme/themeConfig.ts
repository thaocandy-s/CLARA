import { theme as antdTheme } from "antd";
import type { ThemeConfig } from "antd";
import type { ThemeMode } from "../store/ThemeContext";

export const colors = {
  rose: "#e11d48",
  pink: "#db2777",
  purple: "#7c3aed",
  indigo: "#4f46e5",
  cyan: "#0891b2",
  match: "#059669",
  check: "#d97706",
  friction: "#e11d48",
  textPrimary: "var(--clara-text-primary)",
  textSecondary: "var(--clara-text-secondary)",
  textMuted: "var(--clara-text-muted)",
  borderLight: "var(--clara-border-light)",
  bgPrimary: "var(--clara-bg-primary)",
  bgSecondary: "var(--clara-bg-secondary)",
  bgTertiary: "var(--clara-bg-tertiary)",
};

export const gradientBrand =
  "linear-gradient(135deg, #e11d48 0%, #db2777 45%, #7c3aed 100%)";

export const getThemeConfig = (mode: ThemeMode): ThemeConfig => ({
  algorithm: mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: colors.rose,
    colorInfo: colors.purple,
    colorLink: colors.rose,
    colorSuccess: colors.match,
    colorWarning: colors.check,
    colorError: colors.friction,
    borderRadius: 12,
    fontFamily:
      "'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
    colorBgLayout: mode === "dark" ? "#0b1120" : "#f8fafc",
    colorTextBase: mode === "dark" ? "#e2e8f0" : "#0f172a",
  },
  components: {
    Card: {
      borderRadiusLG: 20,
      boxShadowTertiary:
        mode === "dark"
          ? "0 4px 14px -1px rgba(0,0,0,0.35)"
          : "0 4px 12px -1px rgba(15,23,42,0.08)",
    },
    Button: {
      borderRadius: 10,
      controlHeight: 38,
    },
    Tag: {
      borderRadiusSM: 999,
    },
    Layout: {
      headerBg: mode === "dark" ? "rgba(13,19,33,0.88)" : "rgba(255,255,255,0.9)",
      bodyBg: mode === "dark" ? "#0b1120" : "#f8fafc",
    },
  },
});
