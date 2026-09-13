import { useEffect, useRef, useState } from "react";
import { Avatar, Button, Card, Input, Space, Tag, Typography } from "antd";
import { DeleteOutlined, SendOutlined, StarFilled } from "@ant-design/icons";
import type { Candidate } from "../../types";
import { useAppState } from "../../store/AppStateContext";
import { generateAgentReply } from "../../utils/chatSimulator";
import { colors, gradientBrand } from "../../theme/themeConfig";
import { useLocale } from "../../store/LocaleContext";

const { Text } = Typography;

const ChatPanel = ({ candidate }: { candidate: Candidate }) => {
  const { appendChatMessage } = useAppState();
  const { locale, strings } = useLocale();
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    { label: strings.chat.suggestionOpener, query: strings.chat.queryOpener },
    { label: strings.chat.suggestionDateIdea, query: strings.chat.queryDateIdea },
    { label: strings.chat.suggestionFinance, query: strings.chat.queryFinance },
    { label: strings.chat.suggestionKeyAdvice, query: strings.chat.queryKeyAdvice },
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [candidate.chatHistory.length, isTyping]);

  const send = (text: string) => {
    if (!text.trim()) return;
    appendChatMessage(candidate.id, { id: "", sender: "user", text });
    setDraft("");
    setIsTyping(true);
    setTimeout(() => {
      const reply = generateAgentReply(candidate, text, locale);
      appendChatMessage(candidate.id, reply);
      setIsTyping(false);
    }, 900);
  };

  return (
    <Card
      styles={{ body: { display: "flex", flexDirection: "column", height: "100%", padding: 16 } }}
      style={{ height: "100%" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Space>
          <Avatar style={{ background: gradientBrand }}>✦</Avatar>
          <div>
            <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              {strings.chat.title}
              <Tag color={colors.purple} style={{ fontSize: 10 }}>{strings.chat.activeBadge}</Tag>
            </div>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {strings.chat.subtitle}
            </Text>
          </div>
        </Space>
        <Button size="small" icon={<DeleteOutlined />}>
          {strings.chat.clearHistory}
        </Button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingRight: 4, minHeight: 260 }}>
        {candidate.chatHistory.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                maxWidth: "88%",
                background: msg.sender === "user" ? colors.rose : colors.bgTertiary,
                color: msg.sender === "user" ? "#fff" : colors.textPrimary,
                borderRadius: 14,
                padding: "10px 14px",
                fontSize: 13.5,
                lineHeight: 1.55,
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: msg.text }} />
              {msg.recommendation && (
                <div
                  style={{
                    marginTop: 10,
                    background: colors.bgSecondary,
                    border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: 10,
                    padding: "8px 10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12, color: colors.purple, marginBottom: 4 }}>
                    <StarFilled /> {msg.recommendation.title}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {msg.recommendation.items.map((item, idx) => (
                      <li key={idx} style={{ fontSize: 12.5, marginBottom: 4 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ fontSize: 12, color: colors.textMuted }}>{strings.chat.typing}</div>
        )}
      </div>

      <Space wrap size={[6, 6]} style={{ margin: "10px 0" }}>
        {suggestionChips.map((chip) => (
          <Tag
            key={chip.label}
            style={{ cursor: "pointer", borderRadius: 999, padding: "4px 10px" }}
            onClick={() => send(chip.query)}
          >
            {chip.label}
          </Tag>
        ))}
      </Space>

      <Space.Compact style={{ width: "100%" }}>
        <Input
          placeholder={strings.chat.inputPlaceholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPressEnter={() => send(draft)}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={() => send(draft)} />
      </Space.Compact>
    </Card>
  );
};

export default ChatPanel;
