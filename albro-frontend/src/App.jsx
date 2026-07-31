import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "@/context/AuthContext";
import { AuthProviderAdmin } from "@/context/AuthContextAdmin";
import RutaProtegida from "@/components/RutaProtegida";
import RutaProtegidaAdmin from "@/components/RutaProtegidaAdmin";
import LoginPage from "@/pages/LoginPage";
import Registropage from "@/pages/Registropage";
import DashboardPage from "@/pages/DashboardPage";
import AgendarProfesionalPage from "@/pages/AgendarProfesionalPage";
import TerminosPrivacidadPage from "@/pages/TerminosPrivacidadPage";
import FormaPagoPage from "@/pages/admin/Formulariopagomembresia";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import PagosPendientesPage from "@/pages/admin/PagosPendientesPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrarme" element={<Registropage />} />
          <Route path="/terminos" element={<TerminosPrivacidadPage />} />
          <Route path="/pago-membresia" element={<FormaPagoPage />} />
          <Route
            path="/dashboard"
            element={
              <RutaProtegida>
                <DashboardPage />
              </RutaProtegida>
            }
          />
          <Route path="/agendar/:profesionalId" element={<AgendarProfesionalPage />} />

          {/* Panel admin — contexto de auth independiente */}
          <Route
            path="/gestion-x9k2/*"
            element={
              <AuthProviderAdmin>
                <Routes>
                  <Route path="login" element={<AdminLoginPage />} />
                  <Route
                    path="pagos-pendientes"
                    element={
                      <RutaProtegidaAdmin>
                        <PagosPendientesPage />
                      </RutaProtegidaAdmin>
                    }
                  />
                </Routes>
              </AuthProviderAdmin>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;