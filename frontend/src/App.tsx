import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DiscoverPage from "./pages/DiscoverPage";
import ProfilePage from "./pages/ProfilePage";
import AnalysisPage from "./pages/AnalysisPage";
import MyAnalysesPage from "./pages/MyAnalysesPage";
import PreferencesPage from "./pages/PreferencesPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DiscoverPage />} />
          <Route path="/profile/:candidateId" element={<ProfilePage />} />
          <Route path="/analysis/:candidateId" element={<AnalysisPage />} />
          <Route path="/analyses" element={<MyAnalysesPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
