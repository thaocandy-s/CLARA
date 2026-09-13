import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Col, Progress, Row, Space, Tag, Typography, message } from "antd";
import { ArrowLeftOutlined, HeartFilled } from "@ant-design/icons";
import { useAppState } from "../store/AppStateContext";
import RadarChart from "../components/RadarChart";
import ChatPanel from "../components/chat/ChatPanel";
import ChecklistPanel from "../components/ChecklistPanel";
import { colors } from "../theme/themeConfig";
import { getCandidateInitials } from "../mock/data";
import BookmarkOutlined from "../components/icons/BookmarkOutlined";
import { useLocale, interpolate } from "../store/LocaleContext";

const { Title, Text, Paragraph } = Typography;

const AnalysisPage = () => {
  const { candidateId } = useParams();
  const { getCandidate } = useAppState();
  const { strings } = useLocale();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const candidate = candidateId ? getCandidate(candidateId) : undefined;
  if (!candidate) return <Navigate to="/" replace />;

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: "1.25rem" }}>
      {contextHolder}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <Title level={4} className="font-display" style={{ marginBottom: 2 }}>
            {strings.analysis.pageTitle}
          </Title>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {strings.analysis.pageSubtitle}
          </Text>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
          {strings.analysis.backToList}
        </Button>
      </div>

      <Row gutter={20}>
        {/* Column 1: Profile comparison */}
        <Col xs={24} lg={7}>
          <Card styles={{ body: { padding: 0 } }} style={{ marginBottom: 16, overflow: "hidden" }}>
            <div
              style={{
                height: 160,
                background: candidate.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                }}
              >
                {getCandidateInitials(candidate.name)}
              </div>
            </div>
            <div style={{ padding: "0.75rem 1rem" }}>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>
                {candidate.name}, {candidate.age}
              </div>
              <Text style={{ fontSize: 12.5, color: colors.textSecondary }}>
                {candidate.job} · {candidate.location}
              </Text>
            </div>

            <div style={{ padding: "0 1rem 1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span>{strings.analysis.dataCompleteness}</span>
                <strong style={{ color: colors.match }}>{candidate.dataCompleteness}%</strong>
              </div>
              <Progress percent={candidate.dataCompleteness} showInfo={false} strokeColor={colors.match} />
              <div style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 6 }}>
                {candidate.confidenceLabel}
              </div>
            </div>

            <div style={{ padding: "0 1rem 1rem" }}>
              <Text strong style={{ fontSize: 11, textTransform: "uppercase", color: colors.textSecondary }}>
                {strings.analysis.compareTitle}
              </Text>
              {candidate.compareRows.map((row) => (
                <div key={row.label} style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11.5, color: colors.textMuted, marginBottom: 3 }}>{row.label}</div>
                  <div
                    style={{
                      fontSize: 12,
                      borderLeft: `3px solid ${colors.indigo}`,
                      paddingLeft: 8,
                      marginBottom: 3,
                    }}
                  >
                    {strings.common.you}: {row.userValue}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      borderLeft: `3px solid ${row.needsConfirmation ? colors.check : colors.rose}`,
                      paddingLeft: 8,
                    }}
                  >
                    {candidate.name.split(" ").pop()}: {row.targetValue}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
            <Text style={{ fontSize: 12.5, color: colors.textSecondary }}>
              <strong>{strings.analysis.guardrailTitle}</strong> {strings.analysis.guardrailBody}
            </Text>
          </Card>
        </Col>

        {/* Column 2: Chat */}
        <Col xs={24} lg={10} style={{ marginBottom: 16 }}>
          <div style={{ height: 640 }}>
            <ChatPanel candidate={candidate} />
          </div>
        </Col>

        {/* Column 3: Radar + Checklist + Actions */}
        <Col xs={24} lg={7}>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text strong style={{ fontSize: 12.5, textTransform: "uppercase", color: colors.rose }}>
                {strings.analysis.radarTitle}
              </Text>
              <Tag color={colors.match}>{interpolate(strings.analysis.consensus, { value: candidate.overallCompatibility })}</Tag>
            </div>
            <RadarChart axes={candidate.radarAxes} />
            <Paragraph style={{ fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: 4, marginBottom: 0 }}>
              {strings.analysis.radarFootnote}
            </Paragraph>
          </Card>

          <div style={{ marginBottom: 16 }}>
            <ChecklistPanel checklist={candidate.checklist} />
          </div>

          <Card>
            <Space direction="vertical" style={{ width: "100%" }} size={8}>
              <Button
                block
                icon={<BookmarkOutlined />}
                onClick={() => {
                  messageApi.success(strings.analysis.savedToast);
                  navigate("/analyses");
                }}
              >
                {strings.analysis.saveToExploring}
              </Button>
              <Button
                block
                type="primary"
                icon={<HeartFilled />}
                onClick={() => messageApi.success(strings.analysis.matchToast)}
              >
                {strings.analysis.matchAndMessage}
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalysisPage;
