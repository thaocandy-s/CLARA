import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "antd";
import { gradientBrand } from "../../theme/themeConfig";
import { useLocale } from "../../store/LocaleContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  const { strings } = useLocale();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <Link
            to="/"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div
              className="font-display"
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: gradientBrand,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 22,
              }}
            >
              C
            </div>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 17, color: "var(--clara-text-primary)" }}>
              CLARA · Matching Coach
            </span>
          </Link>

          <Card style={{ borderRadius: 20 }} styles={{ body: { padding: "2rem" } }}>
            {children}
          </Card>
        </div>

        <p
          style={{
            width: "100%",
            maxWidth: 640,
            textAlign: "center",
            marginTop: 20,
            marginBottom: 0,
            padding: "0 1rem",
            fontSize: 11.5,
            color: "var(--clara-text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {strings.footer.copyright}
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
