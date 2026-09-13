import { Card, Tag, Typography } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined } from "@ant-design/icons";
import type { Checklist, ChecklistItem, ChecklistTone } from "../types";
import { colors } from "../theme/themeConfig";
import { useLocale } from "../store/LocaleContext";
import type { TranslationShape } from "../i18n/translations";

const { Text } = Typography;

const getToneMeta = (
  strings: TranslationShape
): Record<ChecklistTone, { color: string; bg: string; icon: React.ReactNode; heading: string }> => ({
  matched: {
    color: colors.match,
    bg: "rgba(16,185,129,0.08)",
    icon: <CheckCircleOutlined />,
    heading: strings.checklist.matched,
  },
  check: {
    color: colors.check,
    bg: "rgba(245,158,11,0.08)",
    icon: <ExclamationCircleOutlined />,
    heading: strings.checklist.needsCheck,
  },
  friction: {
    color: colors.friction,
    bg: "rgba(225,29,72,0.06)",
    icon: <WarningOutlined />,
    heading: strings.checklist.friction,
  },
});

const ChecklistGroup = ({
  tone,
  items,
  strings,
}: {
  tone: ChecklistTone;
  items: ChecklistItem[];
  strings: TranslationShape;
}) => {
  if (items.length === 0) return null;
  const meta = getToneMeta(strings)[tone];

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: meta.color, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
        {meta.icon} {meta.heading} ({items.length})
      </div>
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            background: meta.bg,
            border: `1px solid ${meta.color}33`,
            borderRadius: 12,
            padding: "10px 12px",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
            {item.tag && (
              <Tag color={meta.color} style={{ fontSize: 10, border: "none" }}>
                {item.tag}
              </Tag>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: colors.textSecondary, marginBottom: 4 }}>{item.detail}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>
            {strings.checklist.source} {item.sourceEvidence}
          </div>
        </div>
      ))}
    </div>
  );
};

const ChecklistPanel = ({ checklist }: { checklist: Checklist }) => {
  const { strings } = useLocale();
  return (
    <Card
      title={strings.checklist.title}
      styles={{ header: { fontFamily: "Outfit, sans-serif", fontWeight: 700 } }}
    >
      <ChecklistGroup tone="matched" items={checklist.matched} strings={strings} />
      <ChecklistGroup tone="check" items={checklist.needsCheck} strings={strings} />
      <ChecklistGroup tone="friction" items={checklist.potentialFriction} strings={strings} />
    </Card>
  );
};

export default ChecklistPanel;
