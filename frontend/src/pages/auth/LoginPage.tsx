import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Checkbox, Divider, Form, Input, Typography, notification } from "antd";
import { LockOutlined, MailOutlined, ThunderboltOutlined } from "@ant-design/icons";
import AuthLayout from "../../components/layout/AuthLayout";
import { DEMO_ACCOUNT, useAuth } from "../../store/AuthContext";
import { useLocale } from "../../store/LocaleContext";
import { colors } from "../../theme/themeConfig";

const { Title, Paragraph } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginPage = () => {
  const { strings } = useLocale();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillEmail = (location.state as { email?: string } | null)?.email;
  const [form] = Form.useForm<LoginFormValues>();
  const [api, contextHolder] = notification.useNotification();

  const attemptLogin = (email: string, password: string) => {
    const success = login(email, password);
    if (success) {
      api.success({ message: strings.auth.loginSuccessTitle, description: strings.auth.loginSuccessDesc });
      setTimeout(() => navigate("/"), 600);
    } else {
      api.error({ message: strings.auth.loginFailTitle, description: strings.auth.loginFailDesc });
    }
  };

  const onFinish = (values: LoginFormValues) => attemptLogin(values.email, values.password);

  const handleDemoLogin = () => {
    form.setFieldsValue(DEMO_ACCOUNT);
    attemptLogin(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password);
  };

  return (
    <AuthLayout>
      {contextHolder}
      <Title level={3} className="font-display" style={{ margin: 0, marginBottom: 4, textAlign: "center" }}>
        {strings.auth.loginTitle}
      </Title>
      <Paragraph style={{ textAlign: "center", color: colors.textSecondary, marginBottom: 24 }}>
        {strings.auth.loginSubtitle}
      </Paragraph>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        initialValues={{ email: prefillEmail }}
      >
        <Form.Item
          name="email"
          label={strings.auth.emailLabel}
          rules={[{ required: true, message: strings.auth.fillAllFields }]}
        >
          <Input prefix={<MailOutlined />} placeholder={strings.auth.emailPlaceholder} size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          label={strings.auth.passwordLabel}
          rules={[{ required: true, message: strings.auth.fillAllFields }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder={strings.auth.passwordPlaceholder} size="large" />
        </Form.Item>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>{strings.auth.rememberMe}</Checkbox>
          </Form.Item>
          <span style={{ fontSize: 13, color: colors.rose, cursor: "pointer" }}>{strings.auth.forgotPassword}</span>
        </div>

        <Button type="primary" htmlType="submit" block size="large">
          {strings.auth.loginButton}
        </Button>
      </Form>

      <Divider style={{ margin: "20px 0" }} />

      <Button block size="large" icon={<ThunderboltOutlined />} onClick={handleDemoLogin}>
        {strings.auth.demoLoginButton}
      </Button>

      <Paragraph style={{ textAlign: "center", marginTop: 20, marginBottom: 0, fontSize: 13, color: colors.textSecondary }}>
        {strings.auth.noAccount}{" "}
        <Link to="/register" style={{ color: colors.rose, fontWeight: 600 }}>
          {strings.auth.signUpNow}
        </Link>
      </Paragraph>

      <Paragraph style={{ textAlign: "center", marginTop: 16, marginBottom: 0, fontSize: 11.5, color: colors.textMuted }}>
        {strings.auth.mockNotice}
      </Paragraph>
    </AuthLayout>
  );
};

export default LoginPage;
