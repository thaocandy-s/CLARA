import { Button } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useThemeMode } from "../../store/ThemeContext";
import { useLocale } from "../../store/LocaleContext";

const ThemeToggle = () => {
  const { mode, toggleMode } = useThemeMode();
  const { strings } = useLocale();

  return (
    <Button
      type="text"
      shape="circle"
      onClick={toggleMode}
      title={strings.header.toggleTheme}
      icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
    />
  );
};

export default ThemeToggle;
