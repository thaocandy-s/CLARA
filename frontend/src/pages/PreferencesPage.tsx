import { useEffect, useState } from "react";
import { Button, Card, Col, Modal, Row, Slider, Switch, Typography, message } from "antd";
import { DeleteOutlined, LockOutlined, SafetyCertificateOutlined, SaveOutlined } from "@ant-design/icons";
import { apiJson } from "../api/client";
import { useAppState } from "../store/AppStateContext";
import { colors } from "../theme/themeConfig";
import { useLocale } from "../store/LocaleContext";

const { Title, Text, Paragraph } = Typography;

const dealBreakerMeta = [
  { key: "no_smoking", checked: true },
  { key: "long_term", checked: true },
  { key: "pet_friendly", checked: true },
];

const privacyMeta = [
  { key: "incognito", checked: false },
  { key: "hide_from_partner", checked: true },
  { key: "no_training", checked: true },
];

const PreferencesPage = () => {
  const { userProfile, saveCriteria, savePrivacy, deleteHistory } = useAppState();
  const { strings } = useLocale();
  const [messageApi, contextHolder] = message.useMessage();
  const [dealBreakers, setDealBreakers] = useState(
    Object.fromEntries(dealBreakerMeta.map((d) => [d.key, d.checked]))
  );
  const [privacy, setPrivacy] = useState(
    Object.fromEntries(privacyMeta.map((d) => [d.key, d.checked]))
  );
  const [weights, setWeights] = useState(userProfile.weights);

  useEffect(() => {
    setWeights(userProfile.weights);
  }, [userProfile.weights]);

  useEffect(() => {
    void apiJson("/api/me/privacy").then(async (res) => {
      if (!res.ok) return;
      const data = (await res.json()) as {
        incognito: boolean;
        hideFromPartner: boolean;
        noTraining: boolean;
      };
      setPrivacy({
        incognito: data.incognito,
        hide_from_partner: data.hideFromPartner,
        no_training: data.noTraining,
      });
    });
    void apiJson("/api/me/criteria").then(async (res) => {
      if (!res.ok) return;
      const data = (await res.json()) as {
        dealBreakerFlags: { no_smoking: boolean; long_term: boolean; pet_friendly: boolean };
      };
      setDealBreakers(data.dealBreakerFlags);
    });
  }, []);

  const handleWeightChange = (key: string, value: number) => {
    setWeights((prev) => prev.map((w) => (w.key === key ? { ...w, value } : w)));
  };

  const handleSave = () => {
    void (async () => {
      const okCriteria = await saveCriteria({
        weights,
        dealBreakerFlags: {
          no_smoking: !!dealBreakers.no_smoking,
          long_term: !!dealBreakers.long_term,
          pet_friendly: !!dealBreakers.pet_friendly,
        },
      });
      const okPrivacy = await savePrivacy({
        incognito: !!privacy.incognito,
        hideFromPartner: !!privacy.hide_from_partner,
        noTraining: !!privacy.no_training,
      });
      if (okCriteria && okPrivacy) messageApi.success(strings.preferences.savedToast);
    })();
  };

  const handleDeleteHistory = () => {
    Modal.confirm({
      title: strings.preferences.confirmDeleteTitle,
      content: strings.preferences.confirmDeleteContent,
      okText: strings.preferences.confirmOk,
      okButtonProps: { danger: true },
      cancelText: strings.preferences.confirmCancel,
      onOk: async () => {
        const ok = await deleteHistory();
        if (ok) messageApi.success(strings.preferences.deletedToast);
      },
    });
  };

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "1.5rem" }}>
      {contextHolder}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <Title level={3} className="font-display" style={{ margin: 0, marginBottom: 4 }}>
              {strings.preferences.bannerTitle}
            </Title>
            <Paragraph style={{ color: colors.textSecondary, margin: 0 }}>
              {strings.preferences.bannerSubtitle}
            </Paragraph>
          </div>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} style={{ flexShrink: 0 }}>
            {strings.preferences.saveChanges}
          </Button>
        </div>
      </Card>

      <Row gutter={20}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <SafetyCertificateOutlined style={{ color: colors.rose, marginRight: 8 }} />
                {strings.preferences.dealBreakersTitle}
              </span>
            }
            style={{ marginBottom: 20 }}
          >
            {dealBreakerMeta.map((item, index) => {
              const text = strings.preferences.dealBreakers[index];
              return (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid " + colors.borderLight,
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{text.title}</div>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>{text.desc}</div>
                  </div>
                  <Switch
                    checked={dealBreakers[item.key]}
                    onChange={(checked) => setDealBreakers((prev) => ({ ...prev, [item.key]: checked }))}
                  />
                </div>
              );
            })}
          </Card>

          <Card title={strings.preferences.weightsTitle}>
            {weights.map((w) => (
              <div key={w.key} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>{w.label}</span>
                  <strong style={{ color: colors.rose }}>{w.value}%</strong>
                </div>
                <Slider
                  min={0}
                  max={100}
                  value={w.value}
                  onChange={(v) => handleWeightChange(w.key, v)}
                  tooltip={{ open: false }}
                />
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <LockOutlined style={{ color: colors.indigo, marginRight: 8 }} />
                {strings.preferences.privacyTitle}
              </span>
            }
            style={{ marginBottom: 20 }}
          >
            {privacyMeta.map((item, index) => {
              const text = strings.preferences.privacyItems[index];
              return (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid " + colors.borderLight,
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{text.title}</div>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>{text.desc}</div>
                  </div>
                  <Switch
                    checked={privacy[item.key]}
                    onChange={(checked) => setPrivacy((prev) => ({ ...prev, [item.key]: checked }))}
                  />
                </div>
              );
            })}

            <div style={{ background: colors.bgTertiary, borderRadius: 12, padding: 16, marginTop: 12 }}>
              <Text strong style={{ fontSize: 12, textTransform: "uppercase", color: colors.rose }}>
                {strings.preferences.ethicsTitle}
              </Text>
              <ul style={{ fontSize: 12.5, color: colors.textSecondary, paddingLeft: 18, marginTop: 8, lineHeight: 1.6 }}>
                {strings.preferences.ethicsItems.map((item, idx) => {
                  const match = item.match(/^\*\*(.+?):\*\*\s*(.*)$/);
                  return (
                    <li key={idx}>
                      {match ? (
                        <>
                          <strong>{match[1]}:</strong> {match[2]}
                        </>
                      ) : (
                        item
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>

          <Card style={{ borderColor: "rgba(220,38,38,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "#dc2626" }}>
                  {strings.preferences.dangerZoneTitle}
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted }}>{strings.preferences.dangerZoneDesc}</div>
              </div>
              <Button danger icon={<DeleteOutlined />} onClick={handleDeleteHistory}>
                {strings.preferences.deleteData}
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PreferencesPage;
