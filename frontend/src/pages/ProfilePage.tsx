import { Navigate, useNavigate, useParams, Link } from "react-router-dom";
import { Button, Card, Col, Progress, Row, Space, Tag, Typography, message } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  GeminiFilled,
} from "@ant-design/icons";
import { useAppState } from "../store/AppStateContext";
import { colors } from "../theme/themeConfig";
import BookmarkOutlined from "../components/icons/BookmarkOutlined";
import { useLocale, interpolate } from "../store/LocaleContext";

const { Title, Text, Paragraph } = Typography;

const ProfilePage = () => {
  const { candidateId } = useParams();
  const { getCandidate, saveExploring, ready } = useAppState();
  const { strings } = useLocale();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const candidate = candidateId ? getCandidate(candidateId) : undefined;
  if (!ready) return null;
  if (!candidate) return <Navigate to="/" replace />;

  const badgeTone = candidate.matchBadgeTone === "match" ? colors.match : colors.check;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "1.5rem" }}>
      {contextHolder}
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        {strings.common.back}
      </Button>

      <Card style={{ overflow: "hidden", borderRadius: 20, marginBottom: 20 }} styles={{ body: { padding: 0 } }}>
        <div
          style={{
            position: "relative",
            height: 320,
            background: candidate.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.2}>
            <circle cx="12" cy="8" r="4.5" fill="rgba(255,255,255,0.15)" />
            <path d="M4 20c0-4 4-6.5 8-6.5s8 2.5 8 6.5" fill="rgba(255,255,255,0.15)" />
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent 55%)" }} />

          <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
            <Tag color={badgeTone} style={{ border: "none", fontWeight: 600 }}>
              {candidate.matchLabel}
            </Tag>
            <Tag color={colors.purple} style={{ border: "none", fontWeight: 600 }}>
              {strings.common.dataLabel}: {candidate.dataCompleteness}%
            </Tag>
          </div>

          <div style={{ position: "absolute", bottom: 18, left: 20, right: 20, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 28, fontWeight: 800 }} className="font-display">
              {candidate.name}, {candidate.age}
              {candidate.dataCompleteness >= 70 && <CheckCircleFilled style={{ color: "#10b981", fontSize: 20 }} />}
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <EnvironmentOutlined />
              {candidate.job} · {candidate.location}{" "}
              {interpolate(strings.candidateCard.distanceSuffix, { km: candidate.distanceKm })}
            </div>
          </div>
        </div>

        <div style={{ padding: "1.5rem" }}>
          <Row gutter={32}>
            <Col xs={24} md={15}>
              <Title level={5} className="font-display" style={{ margin: 0, marginBottom: 8 }}>
                {strings.profile.introTitle}
              </Title>
              <Paragraph style={{ fontSize: 14, color: colors.textSecondary, fontStyle: "italic" }}>
                "{candidate.bio}"
              </Paragraph>

              <Title level={5} className="font-display" style={{ margin: 0, marginBottom: 8, marginTop: 20 }}>
                {strings.profile.interestsTitle}
              </Title>
              <Space wrap size={[8, 8]}>
                {candidate.tags.map((tag) => (
                  <Tag key={tag} bordered={false} style={{ background: colors.bgTertiary, borderRadius: 999, padding: "4px 12px" }}>
                    {tag}
                  </Tag>
                ))}
              </Space>

              <Title level={5} className="font-display" style={{ margin: 0, marginBottom: 8, marginTop: 20 }}>
                {strings.profile.compareTitle}
              </Title>
              {candidate.compareRows.map((row) => (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>{row.label}</div>
                  <div style={{ fontSize: 13, borderLeft: `3px solid ${colors.indigo}`, paddingLeft: 8, marginBottom: 3 }}>
                    {strings.common.you}: {row.userValue}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      borderLeft: `3px solid ${row.needsConfirmation ? colors.check : colors.rose}`,
                      paddingLeft: 8,
                    }}
                  >
                    {candidate.name.split(" ").pop()}: {row.targetValue}
                  </div>
                </div>
              ))}
            </Col>

            <Col xs={24} md={9}>
              <Card style={{ background: colors.bgTertiary, border: "none", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>{strings.profile.dataCompleteness}</span>
                  <strong style={{ color: colors.match }}>{candidate.dataCompleteness}%</strong>
                </div>
                <Progress percent={candidate.dataCompleteness} showInfo={false} strokeColor={colors.match} />
                <Text style={{ fontSize: 11.5, color: colors.textMuted }}>{candidate.confidenceLabel}</Text>
              </Card>

              <Card
                style={{
                  background: "rgba(124,58,237,0.06)",
                  border: "1px solid rgba(124,58,237,0.15)",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: colors.purple, marginBottom: 6 }}>
                  <GeminiFilled /> {strings.candidateCard.aiSummaryTitle}
                </div>
                <div style={{ fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.6 }}>
                  ✓ <strong>{strings.candidateCard.aligned}</strong> {candidate.aiQuickSummary.positive}
                  <br />
                  ❓ <strong>{strings.candidateCard.needsDiscussion}</strong> {candidate.aiQuickSummary.question}
                </div>
              </Card>

              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                <Button
                  block
                  icon={<BookmarkOutlined />}
                  onClick={() => {
                    void saveExploring(candidate.id);
                    messageApi.success(strings.profile.savedToast);
                  }}
                >
                  {strings.candidateCard.saveForLater}
                </Button>
                <Link to={`/analysis/${candidate.id}`}>
                  <Button block type="primary" icon={<GeminiFilled />}>
                    {strings.candidateCard.analyzeWithAgent}
                  </Button>
                </Link>
              </Space>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
