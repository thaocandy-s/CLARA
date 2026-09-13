import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Col, Progress, Row, Tag, Typography, Input, message } from "antd";
import { CalendarOutlined, GeminiFilled, SafetyOutlined, SaveOutlined, WechatWorkOutlined } from "@ant-design/icons";
import { useAppState } from "../store/AppStateContext";
import { getCandidateInitials } from "../mock/data";
import { colors } from "../theme/themeConfig";
import type { DatingStage } from "../types";
import { useLocale, interpolate } from "../store/LocaleContext";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const stageColor: Record<DatingStage, string> = {
  matched: colors.purple,
  chatting: colors.rose,
  "met-once": colors.check,
  archived: colors.textMuted,
};

const MyAnalysesPage = () => {
  const { candidates, addNote, recalculate } = useAppState();
  const { strings } = useLocale();
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedId, setSelectedId] = useState(candidates[0]?.id);
  const [noteDraft, setNoteDraft] = useState("");
  const [readyToRecalculate, setReadyToRecalculate] = useState(false);

  const active = candidates.find((c) => c.id === selectedId) ?? candidates[0];

  const handleAddNote = () => {
    if (!noteDraft.trim()) return;
    addNote(active.id, noteDraft.trim());
    setNoteDraft("");
    setReadyToRecalculate(true);
  };

  const handleRecalculate = () => {
    recalculate(active.id);
    setReadyToRecalculate(false);
    messageApi.success(
      interpolate(strings.myAnalyses.recalculateToast, {
        value: Math.min(98, active.dataCompleteness + 14),
      })
    );
  };

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "1.5rem" }}>
      {contextHolder}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <Title level={3} className="font-display" style={{ margin: 0, marginBottom: 4 }}>
              {strings.myAnalyses.bannerTitle}
            </Title>
            <Paragraph style={{ color: colors.textSecondary, margin: 0 }}>
              {strings.myAnalyses.bannerSubtitle}
            </Paragraph>
          </div>
          <Tag icon={<SafetyOutlined />} color={colors.purple} style={{ flexShrink: 0 }}>
            {strings.myAnalyses.privateSpace}
          </Tag>
        </div>
      </Card>

      <Row gutter={20}>
        <Col xs={24} lg={7}>
          <Text strong style={{ fontSize: 12, textTransform: "uppercase", color: colors.textSecondary }}>
            {interpolate(strings.myAnalyses.watchingList, { count: candidates.length })}
          </Text>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {candidates.map((c) => (
              <Card
                key={c.id}
                hoverable
                className="hover-lift"
                onClick={() => {
                  setSelectedId(c.id);
                  setReadyToRecalculate(false);
                }}
                style={{
                  borderColor: c.id === active.id ? colors.rose : undefined,
                  borderWidth: c.id === active.id ? 2 : 1,
                }}
                styles={{ body: { padding: 12, display: "flex", gap: 12 } }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: c.gradient,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                  }}
                >
                  {getCandidateInitials(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong style={{ fontSize: 13.5 }}>
                      {c.name}, {c.age}
                    </Text>
                    <Tag color={stageColor[c.stage]} style={{ fontSize: 10 }}>
                      {c.stageLabel}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 11.5, color: colors.textSecondary, margin: "3px 0" }}>
                    {c.job} · {c.savedLabel}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: colors.match, fontWeight: 600 }}>
                      {strings.common.matchLabel} {c.overallCompatibility}%
                    </span>
                    <span style={{ color: colors.textMuted }}>
                      {strings.common.dataLabel}: {c.dataCompleteness}%
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Col>

        <Col xs={24} lg={17}>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Title level={4} className="font-display" style={{ margin: 0 }}>
                    {active.name} · {interpolate(strings.myAnalyses.ageLabel, { age: active.age })}
                  </Title>
                  <Tag color={stageColor[active.stage]}>
                    {strings.myAnalyses.stage} {active.stageLabel}
                  </Tag>
                </div>
                <Text style={{ fontSize: 12.5, color: colors.textSecondary }}>{active.nextDatePlan.title}</Text>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link to={`/analysis/${active.id}`}>
                  <Button icon={<WechatWorkOutlined />}>{strings.myAnalyses.chatWithClara}</Button>
                </Link>
                <Button icon={<SaveOutlined />} onClick={() => messageApi.info(strings.myAnalyses.archivedToast)}>
                  {strings.myAnalyses.archive}
                </Button>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span>{strings.myAnalyses.currentDataCompleteness}</span>
                <strong style={{ color: colors.match }}>{active.dataCompleteness}%</strong>
              </div>
              <Progress percent={active.dataCompleteness} showInfo={false} strokeColor={colors.match} />
              <Text style={{ fontSize: 11.5, color: colors.textMuted }}>{strings.myAnalyses.completenessHelp}</Text>
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <Text strong style={{ fontSize: 14 }}>
                  {strings.myAnalyses.observationsTitle}
                </Text>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>
                  {strings.myAnalyses.observationsHelp}
                </div>
              </div>
              <Button
                type={readyToRecalculate ? "primary" : "default"}
                icon={readyToRecalculate ? <GeminiFilled /> : undefined}
                onClick={handleRecalculate}
                disabled={!readyToRecalculate}
              >
                {readyToRecalculate ? strings.myAnalyses.recalculateReady : strings.myAnalyses.recalculate}
              </Button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <TextArea
                rows={2}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder={strings.myAnalyses.notePlaceholder}
              />
              <Button type="primary" onClick={handleAddNote} style={{ height: "auto" }}>
                {strings.myAnalyses.addNote}
              </Button>
            </div>

            <Text strong style={{ fontSize: 11, textTransform: "uppercase", color: colors.textMuted }}>
              {strings.myAnalyses.noteHistoryTitle}
            </Text>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {active.notes.map((note) => (
                <div key={note.id} style={{ background: colors.bgTertiary, borderRadius: 10, padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 3 }}>{note.timeLabel}</div>
                  <div style={{ fontSize: 13 }}>{note.text}</div>
                </div>
              ))}
            </div>
          </Card>

          <Row gutter={16} align="stretch">
            <Col span={12} style={{ display: "flex" }}>
              <Card style={{ height: "100%", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: colors.pink, fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", marginBottom: 8 }}>
                  <CalendarOutlined /> {strings.myAnalyses.nextDatePlanTitle}
                </div>
                <Text strong style={{ fontSize: 14 }}>{active.nextDatePlan.title}</Text>
                <Paragraph style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 4, marginBottom: 0 }}>
                  {active.nextDatePlan.detail}
                </Paragraph>
              </Card>
            </Col>
            <Col span={12} style={{ display: "flex" }}>
              <Card style={{ height: "100%", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: colors.match, fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", marginBottom: 8 }}>
                  <SafetyOutlined /> {strings.myAnalyses.safetyTitle}
                </div>
                <ul style={{ fontSize: 12.5, color: colors.textSecondary, paddingLeft: 18, margin: 0 }}>
                  <li>{strings.myAnalyses.safetyItem1}</li>
                  <li>{strings.myAnalyses.safetyItem2}</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default MyAnalysesPage;
