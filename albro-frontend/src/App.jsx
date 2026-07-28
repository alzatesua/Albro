import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "@/context/AuthContext";
import RutaProtegida from "@/components/RutaProtegida";
import LoginPage from "@/pages/LoginPage";
import Registropage from "@/pages/Registropage";
import DashboardPage from "@/pages/DashboardPage";
import AgendarProfesionalPage from "@/pages/AgendarProfesionalPage";
import TerminosPrivacidadPage from "@/pages/TerminosPrivacidadPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrarme" element={<Registropage />} />
          <Route path="/terminos" element={<TerminosPrivacidadPage />} />
          <Route
            path="/dashboard"
            element={
              <RutaProtegida>
                <DashboardPage />
              </RutaProtegida>
            }
          />
          <Route path="/agendar/:profesionalId" element={<AgendarProfesionalPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;