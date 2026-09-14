import { Avatar, Dropdown, Layout, Menu, Tag, notification } from "antd";
import { CompassOutlined, TeamOutlined, ControlOutlined, LogoutOutlined } from "@ant-design/icons";
import { Link, Outlet, useLocation } from "react-router-dom";
import { gradientBrand } from "../../theme/themeConfig";
import { useLocale, interpolate } from "../../store/LocaleContext";
import { useAuth } from "../../store/AuthContext";
import AppFooter from "./AppFooter";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

const { Header, Content } = Layout;

const AppLayout = () => {
  const location = useLocation();
  const { strings } = useLocale();
  const { user, logout } = useAuth();
  const [api, contextHolder] = notification.useNotification();

  const navItems = [
    { key: "/", label: strings.header.navDiscover, icon: <CompassOutlined /> },
    { key: "/analyses", label: strings.header.navMyAnalyses, icon: <TeamOutlined /> },
    { key: "/preferences", label: strings.header.navPreferences, icon: <ControlOutlined /> },
  ];

  const selectedKey =
    navItems.find((item) => location.pathname.startsWith(item.key) && item.key !== "/")?.key ??
    (location.pathname === "/" ? "/" : "");

  const handleLogout = () => {
    api.success({ message: strings.auth.logoutSuccessTitle, description: strings.auth.logoutSuccessDesc });
    // Delay the actual sign-out so the notification is visible before RequireAuth redirects away.
    setTimeout(() => logout(), 600);
  };

  const avatarInitials =
    user?.name
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      {contextHolder}
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          background: "var(--clara-header-bg)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--clara-border-light)",
          padding: "0 1.5rem",
          height: 72,
          lineHeight: "normal",
          gap: 24,
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            className="font-display"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: gradientBrand,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            C
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", lineHeight: 1.3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className="font-display"
                style={{ fontWeight: 700, fontSize: 15, color: "var(--clara-text-primary)", whiteSpace: "nowrap" }}
              >
                CLARA · Matching Coach
              </span>
              <Tag
                color="purple"
                style={{ margin: 0, fontSize: 10, lineHeight: "16px", padding: "0 6px", flexShrink: 0 }}
              >
                AI Clara
              </Tag>
            </div>
            <span
              className="header-brand-subtitle"
              style={{ fontSize: 11.5, color: "var(--clara-text-muted)", whiteSpace: "nowrap" }}
            >
              Decision-Support for Intentional Dating
            </span>
          </div>
        </Link>

        {/* Nav */}
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", justifyContent: "center" }}>
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={navItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: <Link to={item.key}>{item.label}</Link>,
            }))}
            style={{
              borderBottom: "none",
              background: "transparent",
              lineHeight: "70px",
              width: "100%",
              justifyContent: "center",
              minWidth: 0,
            }}
          />
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div
            className="header-status-pill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--clara-text-secondary)",
              background: "var(--clara-bg-tertiary)",
              padding: "6px 12px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                minWidth: 8,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            {strings.header.claraReady}
          </div>

          <LanguageSwitcher />
          <ThemeToggle />

          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: strings.header.logout,
                  onClick: handleLogout,
                },
              ],
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer" }}>
              <Avatar
                style={{
                  background: "linear-gradient(135deg, #6366f1, #ec4899)",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {avatarInitials}
              </Avatar>
              <div className="header-user-meta" style={{ fontSize: 13, lineHeight: 1.3, whiteSpace: "nowrap" }}>
                <div style={{ fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: "var(--clara-text-muted)" }}>
                  {interpolate(strings.header.userMeta, {
                    age: user?.age ?? "—",
                    city: user?.city ?? "—",
                  })}
                </div>
              </div>
            </div>
          </Dropdown>
        </div>
      </Header>

      <Content style={{ position: "relative", zIndex: 1, flex: "1 0 auto" }}>
        <Outlet />
      </Content>

      <AppFooter />
    </Layout>
  );
};

export default AppLayout;
