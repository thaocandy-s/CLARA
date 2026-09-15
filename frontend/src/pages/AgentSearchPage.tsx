import { useEffect, useRef, useState } from "react";
import { Avatar, Button, Card, Col, Input, Row, Space, Tag, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";
import CandidateCard from "../components/CandidateCard";
import { useAppState } from "../store/AppStateContext";
import { useAuth } from "../store/AuthContext";
import { useLocale, interpolate } from "../store/LocaleContext";
import { colors, gradientBrand } from "../theme/themeConfig";
import type { Candidate } from "../types";

const { Title, Paragraph, Text } = Typography;

interface SearchMessage {
  id: string;
  sender: "agent" | "user";
  text: string;
  results?: Candidate[];
}

const STOPWORDS = new Set([
  "tôi", "mình", "muốn", "tìm", "một", "người", "và", "có", "là", "cho",
  "với", "các", "những", "hay", "thích", "cần", "kiếm", "bạn", "nào",
  "được", "rất", "không", "của", "này", "đang", "cùng",
]);

const extractKeywords = (query: string): string[] => {
  const tokens = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
  return Array.from(new Set(tokens));
};

const searchCandidates = (query: string, candidates: Candidate[]) => {
  const keywords = extractKeywords(query);
  const scored = candidates.map((candidate) => {
    const haystack = [candidate.name, candidate.job, candidate.location, candidate.bio, ...candidate.tags]
      .join(" ")
      .toLowerCase();
    const hitCount = keywords.filter((keyword) => haystack.includes(keyword)).length;
    return { candidate, hitCount };
  });

  const matched = scored
    .filter((entry) => entry.hitCount > 0)
    .sort((a, b) => b.hitCount - a.hitCount || b.candidate.overallCompatibility - a.candidate.overallCompatibility)
    .map((entry) => entry.candidate);

  if (matched.length > 0) {
    return { keywords, results: matched, matchedByKeyword: true };
  }

  const fallback = [...candidates].sort((a, b) => b.overallCompatibility - a.overallCompatibility).slice(0, 3);
  return { keywords, results: fallback, matchedByKeyword: false };
};

let messageSeq = 0;
const nextMessageId = () => `sm_${Date.now()}_${messageSeq++}`;

const AgentSearchPage = () => {
  const { candidates, ready } = useAppState();
  const { user } = useAuth();
  const { strings } = useLocale();
  const [messages, setMessages] = useState<SearchMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);

  useEffect(() => {
    if (!ready || greeted.current) return;
    greeted.current = true;
    setMessages([
      {
        id: nextMessageId(),
        sender: "agent",
        text: interpolate(strings.agentSearch.greeting, { name: user?.name ?? "" }),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const lastChild = container.lastElementChild as HTMLElement | null;
    if (lastChild) {
      lastChild.scrollIntoView({ block: "start", behavior: "smooth" });
    } else {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, isTyping]);

  const suggestionChips = [
    { label: strings.agentSearch.suggestionSerious, query: strings.agentSearch.querySerious },
    { label: strings.agentSearch.suggestionCreative, query: strings.agentSearch.queryCreative },
    { label: strings.agentSearch.suggestionActive, query: strings.agentSearch.queryActive },
    { label: strings.agentSearch.suggestionNature, query: strings.agentSearch.queryNature },
  ];

  const send = (text: string) => {
    if (!text.trim()) return;
    setDraft("");
    setMessages((prev) => [...prev, { id: nextMessageId(), sender: "user", text }]);
    setIsTyping(true);

    setTimeout(() => {
      const { keywords, results, matchedByKeyword } = searchCandidates(text, candidates);
      const summary = matchedByKeyword
        ? `${strings.agentSearch.analyzedPrefix} ${keywords.join(", ")}`
        : strings.agentSearch.resultsFallbackLabel;
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), sender: "agent", text: summary, results },
      ]);
      setIsTyping(false);
    }, 700 + Math.random() * 400);
  };

  if (!ready) return null;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem" }}>
      <Card style={{ marginBottom: 16 }}>
        <Title level={3} className="font-display" style={{ margin: 0, marginBottom: 4 }}>
          {strings.agentSearch.pageTitle}
        </Title>
        <Paragraph style={{ color: colors.textSecondary, margin: 0 }}>
          {strings.agentSearch.pageSubtitle}
        </Paragraph>
      </Card>

      <div style={{ height: 760 }}>
        <Card
          style={{ height: "100%" }}
          styles={{ body: { display: "flex", flexDirection: "column", height: "100%", padding: 16 } }}
        >
          <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingRight: 4 }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                  {msg.sender === "agent" && (
                    <Avatar style={{ background: gradientBrand, marginRight: 8, flexShrink: 0 }}>✦</Avatar>
                  )}
                  <div
                    style={{
                      maxWidth: "80%",
                      background: msg.sender === "user" ? colors.rose : colors.bgTertiary,
                      color: msg.sender === "user" ? "#fff" : colors.textPrimary,
                      borderRadius: 14,
                      padding: "10px 14px",
                      fontSize: 13.5,
                      lineHeight: 1.55,
                    }}
                  >
                    {msg.text}
                  </div>
                </div>

                {msg.results && msg.results.length > 0 && (
                  <div style={{ marginTop: 10, marginLeft: 40, overflow: "hidden" }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, display: "block", marginBottom: 8 }}>
                      {interpolate(strings.agentSearch.resultsFoundLabel, { count: msg.results.length })}
                    </Text>
                    <Row gutter={[16, 16]}>
                      {msg.results.map((candidate) => (
                        <Col xs={24} sm={12} lg={8} key={candidate.id} style={{ display: "flex" }}>
                          <CandidateCard candidate={candidate} compact />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div style={{ fontSize: 12, color: colors.textMuted, marginLeft: 40 }}>
                {strings.agentSearch.typing}
              </div>
            )}

            {candidates.length === 0 && !isTyping && (
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{strings.agentSearch.noCandidates}</Text>
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
              placeholder={strings.agentSearch.inputPlaceholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onPressEnter={() => send(draft)}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={() => send(draft)} />
          </Space.Compact>
        </Card>
      </div>
    </div>
  );
};

export default AgentSearchPage;
