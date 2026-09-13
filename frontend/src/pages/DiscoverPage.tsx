import { useState } from "react";
import { Button, Card, Col, Row, Slider, Tag, Typography } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import CandidateCard from "../components/CandidateCard";
import { useAppState } from "../store/AppStateContext";
import { colors } from "../theme/themeConfig";
import { useLocale, interpolate } from "../store/LocaleContext";

const { Title, Paragraph, Text } = Typography;

const TagCloud = ({
  options,
  active,
  onToggle,
}: {
  options: string[];
  active: number[];
  onToggle: (index: number) => void;
}) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {options.map((tag, index) => {
      const isActive = active.includes(index);
      return (
        <Tag.CheckableTag key={index} checked={isActive} onChange={() => onToggle(index)}>
          {tag}
        </Tag.CheckableTag>
      );
    })}
  </div>
);

const useToggle = (initial: number[]) => {
  const [selected, setSelected] = useState<number[]>(initial);
  const toggle = (index: number) =>
    setSelected((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  const clear = () => setSelected([]);
  return { selected, toggle, clear };
};

const DiscoverPage = () => {
  const { candidates } = useAppState();
  const { strings } = useLocale();
  const goals = useToggle([0]);
  const values = useToggle([0, 1, 3]);
  const lifestyle = useToggle([0]);
  const [minCompleteness, setMinCompleteness] = useState(70);

  const clearAllFilters = () => {
    goals.clear();
    values.clear();
    lifestyle.clear();
    setMinCompleteness(0);
  };

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "1.5rem" }}>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <Title level={3} className="font-display" style={{ margin: 0, marginBottom: 4 }}>
              {strings.discover.bannerTitle}
            </Title>
            <Paragraph style={{ color: colors.textSecondary, margin: 0 }}>
              {strings.discover.bannerSubtitle}
            </Paragraph>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{strings.discover.currentPriority}</Text>
            <Tag color={colors.purple}>{strings.discover.priorityLongTerm}</Tag>
            <Tag color={colors.rose}>{strings.discover.priorityOpenCommunication}</Tag>
          </div>
        </div>
      </Card>

      <Row gutter={20}>
        <Col xs={24} lg={6}>
          <Card style={{ position: "sticky", top: 88 }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                {strings.discover.goalSectionTitle}
                <Text
                  style={{ fontSize: 11, color: colors.pink, cursor: "pointer" }}
                  onClick={clearAllFilters}
                >
                  {strings.discover.clearFilters}
                </Text>
              </div>
              <TagCloud options={strings.discover.goalTags} active={goals.selected} onToggle={goals.toggle} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{strings.discover.valueSectionTitle}</div>
              <TagCloud options={strings.discover.valueTags} active={values.selected} onToggle={values.toggle} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{strings.discover.lifestyleSectionTitle}</div>
              <TagCloud options={strings.discover.lifestyleTags} active={lifestyle.selected} onToggle={lifestyle.toggle} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{strings.discover.completenessSectionTitle}</div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>
                {interpolate(strings.discover.completenessHint, { min: minCompleteness })}
              </div>
              <Slider min={0} max={100} value={minCompleteness} onChange={setMinCompleteness} />
            </div>

            <Link to="/preferences">
              <Button block icon={<EditOutlined />}>
                {strings.discover.customizeCriteria}
              </Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Row gutter={[20, 20]} align="stretch">
            {candidates
              .filter((c) => c.dataCompleteness >= minCompleteness)
              .map((candidate) => (
                <Col xs={24} md={12} xl={8} key={candidate.id} style={{ display: "flex" }}>
                  <CandidateCard candidate={candidate} />
                </Col>
              ))}
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default DiscoverPage;
