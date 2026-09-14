import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Input, Typography, notification } from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import AuthLayout from "../../components/layout/AuthLayout";
import { useAuth } from "../../store/AuthContext";
import { useLocale } from "../../store/LocaleContext";
import { colors } from "../../theme/themeConfig";

const { Title, Paragraph } = Typography;

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage = () => {
  const { strings } = useLocale();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm<RegisterFormValues>();
  const [api, contextHolder] = notification.useNotification();

  const onFinish = async (values: RegisterFormValues) => {
    const success = await register(values.name, values.email, values.password);
    if (success) {
      api.success({ message: strings.auth.registerSuccessTitle, description: strings.auth.registerSuccessDesc });
      setTimeout(() => navigate("/login", { state: { email: values.email } }), 1000);
    } else {
      api.error({ message: strings.auth.registerFailTitle, description: strings.auth.registerFailDesc });
    }
  };

  return (
    <AuthLayout>
      {contextHolder}
      <Title level={3} className="font-display" style={{ margin: 0, marginBottom: 4, textAlign: "center" }}>
        {strings.auth.registerTitle}
      </Title>
      <Paragraph style={{ textAlign: "center", color: colors.textSecondary, marginBottom: 24 }}>
        {strings.auth.registerSubtitle}
      </Paragraph>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="name"
          label={strings.auth.nameLabel}
          rules={[{ required: true, message: strings.auth.fillAllFields }]}
        >
          <Input prefix={<UserOutlined />} placeholder={strings.auth.namePlaceholder} size="large" />
        </Form.Item>

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

        <Form.Item
          name="confirmPassword"
          label={strings.auth.confirmPasswordLabel}
          dependencies={["password"]}
          rules={[
            { required: true, message: strings.auth.fillAllFields },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) return Promise.resolve();
                return Promise.reject(new Error(strings.auth.passwordMismatch));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder={strings.auth.confirmPasswordPlaceholder} size="large" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block size="large" style={{ marginTop: 8 }}>
          {strings.auth.registerButton}
        </Button>
      </Form>

      <Paragraph style={{ textAlign: "center", marginTop: 20, marginBottom: 0, fontSize: 13, color: colors.textSecondary }}>
        {strings.auth.haveAccount}{" "}
        <Link to="/login" style={{ color: colors.rose, fontWeight: 600 }}>
          {strings.auth.signInNow}
        </Link>
      </Paragraph>

      <Paragraph style={{ textAlign: "center", marginTop: 16, marginBottom: 0, fontSize: 11.5, color: colors.textMuted }}>
        {strings.auth.mockNotice}
      </Paragraph>
    </AuthLayout>
  );
};

export default RegisterPage;
