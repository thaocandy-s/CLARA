import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, Link } from "react-router-dom";
import { Avatar, Button, Card, Input, Space, Tag, Tooltip, Typography } from "antd";
import { ArrowLeftOutlined, GeminiFilled, SendOutlined } from "@ant-design/icons";
import { useAppState } from "../store/AppStateContext";
import { getCandidateInitials } from "../mock/data";
import { colors } from "../theme/themeConfig";
import { useLocale, interpolate } from "../store/LocaleContext";
import type { ChatMessage } from "../types";

const { Text } = Typography;

let messageSeq = 0;
const nextMessageId = () => `mc_${Date.now()}_${messageSeq++}`;

const MatchChatPage = () => {
  const { candidateId } = useParams();
  const { getCandidate, analyze, ready } = useAppState();
  const { strings } = useLocale();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededFor = useRef<string | null>(null);
  const replyIndex = useRef(0);

  const candidate = candidateId ? getCandidate(candidateId) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!candidate || seededFor.current === candidate.id) return;
    const targetId = candidate.id;
    seededFor.current = targetId;
    setPrepared(false);

    void analyze(targetId).then((fresh) => {
      if (seededFor.current !== targetId) return; // navigated to a different candidate meanwhile
      const target = fresh ?? candidate;
      const opener = target.icebreakers[0];
      const seeded: ChatMessage[] = [
        {
          id: nextMessageId(),
          sender: "agent",
          text: interpolate(strings.matchChat.matchedSystemNote, { name: target.name }),
        },
      ];
      if (opener) {
        seeded.push({ id: nextMessageId(), sender: "user", text: opener });
      }
      setMessages(seeded);
      setPrepared(true);

      if (opener) {
        setIsTyping(true);
        setTimeout(() => {
          if (seededFor.current !== targetId) return;
          setMessages((prev) => [
            ...prev,
            { id: nextMessageId(), sender: "agent", text: strings.matchChat.replyTemplates[0] },
          ]);
          replyIndex.current = 1;
          setIsTyping(false);
        }, 900);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isTyping]);

  if (!ready) return null;
  if (!candidate) return <Navigate to="/" replace />;

  const suggestions = prepared
    ? [...candidate.icebreakers.slice(1), ...candidate.probingQuestions].slice(0, 4)
    : [];

  const send = (text: string) => {
    if (!text.trim()) return;
    setDraft("");
    setMessages((prev) => [...prev, { id: nextMessageId(), sender: "user", text }]);
    setIsTyping(true);
    setTimeout(() => {
      const templates = strings.matchChat.replyTemplates;
      const reply = templates[replyIndex.current % templates.length];
      replyIndex.current += 1;
      setMessages((prev) => [...prev, { id: nextMessageId(), sender: "agent", text: reply }]);
      setIsTyping(false);
    }, 700 + Math.random() * 500);
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "1.5rem" }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        {strings.common.back}
      </Button>

      <div style={{ height: 620 }}>
        <Card
          style={{ height: "100%" }}
          styles={{ body: { display: "flex", flexDirection: "column", height: "100%", padding: 16 } }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Space>
              <Avatar style={{ background: candidate.gradient }}>{getCandidateInitials(candidate.name)}</Avatar>
              <div>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  {candidate.name}, {candidate.age}
                  <Tag color={colors.match} style={{ fontSize: 10 }}>{strings.matchChat.onlineStatus}</Tag>
                </div>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {candidate.job} · {candidate.location}
                </Text>
              </div>
            </Space>
            <Link to={`/analysis/${candidate.id}`}>
              <Button size="small" icon={<GeminiFilled />}>
                {strings.matchChat.viewAnalysis}
              </Button>
            </Link>
          </div>

          <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
            {!prepared && (
              <div style={{ fontSize: 12, color: colors.textMuted }}>{strings.matchChat.preparing}</div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{ display: "flex", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}
              >
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
            ))}
            {isTyping && (
              <div style={{ fontSize: 12, color: colors.textMuted }}>
                {interpolate(strings.matchChat.typing, { name: candidate.name })}
              </div>
            )}
          </div>

          {suggestions.length > 0 && (
            <div style={{ margin: "10px 0" }}>
              <Text style={{ fontSize: 11, color: colors.textMuted, display: "block", marginBottom: 6 }}>
                {strings.matchChat.suggestionsTitle}
              </Text>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {suggestions.map((question) => (
                  <Tooltip key={question} title={question}>
                    <Tag
                      style={{
                        cursor: "pointer",
                        borderRadius: 999,
                        padding: "4px 10px",
                        margin: 0,
                        width: "100%",
                        boxSizing: "border-box",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                      onClick={() => send(question)}
                    >
                      {question}
                    </Tag>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder={interpolate(strings.matchChat.inputPlaceholder, { name: candidate.name })}
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

export default MatchChatPage;
