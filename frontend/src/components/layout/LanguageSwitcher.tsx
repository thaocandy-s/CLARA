import type { ReactNode } from "react";
import { Button, Dropdown } from "antd";
import { useLocale } from "../../store/LocaleContext";
import { locales } from "../../i18n/translations";
import type { Locale } from "../../i18n/translations";
import { VietnamFlag, JapanFlag } from "../icons/FlagIcons";

const localeFlags: Record<Locale, ReactNode> = {
  vi: <VietnamFlag />,
  ja: <JapanFlag />,
};

export const FlagBadge = ({ children, size = 24 }: { children: ReactNode; size?: number }) => (
  <span
    style={{
      display: "inline-flex",
      width: size,
      height: size,
      borderRadius: "50%",
      overflow: "hidden",
      border: "1px solid var(--clara-border-light)",
      flexShrink: 0,
    }}
  >
    {children}
  </span>
);

const LanguageSwitcher = () => {
  const { locale, setLocale, strings } = useLocale();

  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        selectedKeys: [locale],
        onClick: ({ key }) => setLocale(key as Locale),
        items: locales.map((l) => ({
          key: l.value,
          label: (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FlagBadge size={20}>{localeFlags[l.value]}</FlagBadge>
              {l.label}
            </span>
          ),
        })),
      }}
    >
      <Button type="text" shape="circle" title={strings.header.toggleLanguage} style={{ padding: 0 }}>
        <FlagBadge>{localeFlags[locale]}</FlagBadge>
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher;
