import { Button, Card, Space, Tag, Tooltip } from "antd";
import { CheckCircleFilled, GeminiFilled } from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import type { Candidate } from "../types";
import { colors } from "../theme/themeConfig";
import BookmarkOutlined from "./icons/BookmarkOutlined";
import { useLocale, interpolate } from "../store/LocaleContext";

interface CandidateCardProps {
  candidate: Candidate;
}

const clampStyle = (lines: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const CandidateCard = ({ candidate }: CandidateCardProps) => {
  const { strings } = useLocale();
  const badgeTone = candidate.matchBadgeTone === "match" ? colors.match : colors.check;

  return (
    <Card
      className="hover-lift"
      style={{ overflow: "hidden", borderRadius: 20, height: "100%" }}
      styles={{ body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" } }}
    >
      <div
        style={{
          position: "relative",
          height: 240,
          flexShrink: 0,
          background: candidate.gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.2}>
          <circle cx="12" cy="8" r="4.5" fill="rgba(255,255,255,0.15)" />
          <path d="M4 20c0-4 4-6.5 8-6.5s8 2.5 8 6.5" fill="rgba(255,255,255,0.15)" />
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%)",
          }}
        />

        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between" }}>
          <Tag color={badgeTone} style={{ border: "none", fontWeight: 600 }}>
            {candidate.matchLabel}
          </Tag>
          <Tag color={colors.purple} style={{ border: "none", fontWeight: 600 }}>
            {strings.common.dataLabel}: {candidate.dataCompleteness}%
          </Tag>
        </div>

        <Button
          shape="circle"
          className="card-bookmark-btn"
          icon={<BookmarkOutlined />}
          style={{
            position: "absolute",
            top: 52,
            right: 12,
            background: "rgba(255,255,255,0.85)",
            border: "none",
            color: "#0f172a",
          }}
          title={strings.candidateCard.saveForLater}
        />

        <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, color: "#fff" }}>
          <Link
            to={`/profile/${candidate.id}`}
            className="card-name-link"
            style={{
              fontWeight: 700,
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#fff",
              width: "fit-content",
            }}
          >
            {candidate.name}, {candidate.age}
            {candidate.dataCompleteness >= 70 && (
              <CheckCircleFilled style={{ color: "#10b981", fontSize: 15 }} />
            )}
          </Link>
          <div style={{ fontSize: 12.5, opacity: 0.9 }}>
            {candidate.job} · {candidate.location}{" "}
            {interpolate(strings.candidateCard.distanceSuffix, { km: candidate.distanceKm })}
          </div>
        </div>
      </div>

      <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <Tooltip title={`"${candidate.bio}"`} placement="top" overlayStyle={{ maxWidth: 320 }}>
          <p
            style={{
              fontSize: 13.5,
              color: colors.textSecondary,
              fontStyle: "italic",
              marginBottom: 10,
              lineHeight: 1.5,
              cursor: "help",
              ...clampStyle(3),
            }}
          >
            "{candidate.bio}"
          </p>
        </Tooltip>

        <Tooltip
          placement="top"
          overlayStyle={{ maxWidth: 320 }}
          title={
            <div style={{ lineHeight: 1.6 }}>
              ✓ <strong>{strings.candidateCard.aligned}</strong> {candidate.aiQuickSummary.positive}
              <br />
              ❓ <strong>{strings.candidateCard.needsDiscussion}</strong> {candidate.aiQuickSummary.question}
            </div>
          }
        >
          <div
            style={{
              background: "rgba(124,58,237,0.06)",
              border: "1px solid rgba(124,58,237,0.15)",
              borderRadius: 12,
              padding: "0.65rem 0.75rem",
              marginBottom: 10,
              minHeight: 96,
              cursor: "help",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: colors.purple, marginBottom: 4 }}>
              <GeminiFilled /> {strings.candidateCard.aiSummaryTitle}
            </div>
            <div style={{ fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.5, ...clampStyle(3) }}>
              ✓ <strong>{strings.candidateCard.aligned}</strong> {candidate.aiQuickSummary.positive}
              <br />
              ❓ <strong>{strings.candidateCard.needsDiscussion}</strong> {candidate.aiQuickSummary.question}
            </div>
          </div>
        </Tooltip>

        <Space wrap size={[6, 6]} style={{ minHeight: 60, alignContent: "flex-start" }}>
          {candidate.tags.map((tag) => (
            <Tag key={tag} bordered={false} style={{ background: colors.bgTertiary, borderRadius: 999 }}>
              {tag}
            </Tag>
          ))}
        </Space>

        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 14 }}>
          <Link to={`/profile/${candidate.id}`} style={{ flex: 1, minWidth: 0, display: "block" }}>
            <Button style={{ width: "100%", paddingInline: 8 }}>
              {strings.candidateCard.viewProfileShort}
            </Button>
          </Link>
          <Link to={`/analysis/${candidate.id}`} style={{ flex: 1.6, minWidth: 0, display: "block" }}>
            <Button type="primary" icon={<GeminiFilled />} style={{ width: "100%", paddingInline: 8 }}>
              {strings.candidateCard.analyzeShort}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default CandidateCard;
