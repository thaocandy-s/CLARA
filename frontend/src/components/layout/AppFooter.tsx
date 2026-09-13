import { Layout } from "antd";
import { Link } from "react-router-dom";
import { gradientBrand } from "../../theme/themeConfig";
import { useLocale } from "../../store/LocaleContext";

const { Footer } = Layout;

const AppFooter = () => {
  const { strings } = useLocale();

  const navLinks = [
    { to: "/", label: strings.header.navDiscover },
    { to: "/analyses", label: strings.header.navMyAnalyses },
    { to: "/preferences", label: strings.header.navPreferences },
  ];

  return (
    <Footer
      style={{
        background: "var(--clara-bg-secondary)",
        borderTop: "1px solid var(--clara-border-light)",
        padding: "28px 1.5rem 20px",
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 32,
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div
              className="font-display"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: gradientBrand,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              C
            </div>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 14, color: "var(--clara-text-primary)" }}>
              CLARA · Matching Coach
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--clara-text-secondary)", margin: 0, lineHeight: 1.6 }}>
            {strings.footer.tagline}
          </p>
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--clara-text-muted)",
              marginBottom: 10,
            }}
          >
            {strings.footer.linksTitle}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{ fontSize: 12.5, color: "var(--clara-text-secondary)" }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 320 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--clara-text-muted)",
              marginBottom: 10,
            }}
          >
            {strings.footer.principlesTitle}
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: "var(--clara-text-secondary)", lineHeight: 1.7 }}>
            <li>{strings.footer.principle1}</li>
            <li>{strings.footer.principle2}</li>
          </ul>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1320,
          margin: "20px auto 0",
          paddingTop: 16,
          borderTop: "1px solid var(--clara-border-light)",
          fontSize: 11.5,
          color: "var(--clara-text-muted)",
        }}
      >
        {strings.footer.copyright}
      </div>
    </Footer>
  );
};

export default AppFooter;
