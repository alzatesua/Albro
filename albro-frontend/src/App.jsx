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
import AdminLayout from "@/pages/admin/Adminlayout";
import PagosPendientesPage from "@/pages/admin/PagosPendientesPage";
import PagosConfirmadosPage from "@/pages/admin/PagosConfirmadosPage";
import MetricasPage from "./pages/admin/Metricaspage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrarme" element={<Registropage />} />
          <Route path="/terminos" element={<TerminosPrivacidadPage />} />
          <Route path="/pago-membresia" element={<FormaPagoPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/agendar/:profesionalId" element={<AgendarProfesionalPage />} />

          {/* Panel admin — contexto de auth independiente */}
          <Route
            path="/gestion-x9k2/*"
            element={
              <AuthProviderAdmin>
                <Routes>
                  <Route path="login" element={<AdminLoginPage />} />

                  {/* Rutas protegidas, envueltas con el sidebar */}
                  <Route
                    element={
                      <RutaProtegidaAdmin>
                        <AdminLayout />
                      </RutaProtegidaAdmin>
                    }
                  >
                    <Route path="pagos-pendientes" element={<PagosPendientesPage />} />
                    <Route path="pagos-confirmados" element={<PagosConfirmadosPage />} />
                    <Route path="metricas"element={<MetricasPage />} />
                  </Route>

                  <Route path="*" element={<Navigate to="pagos-pendientes" replace />} />
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