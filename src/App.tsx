// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "./components/PublicLayout";
import RutaProtegida from "./components/RutaProtegida";

// Público
import HomePage from "./pages/Home/HomePage";
import RifaDetailPage from "./pages/Rifas/RifaDetailPage";

// Admin
import LoginAdmin from "./pages/Admin/AdminLogin";
import DashboardAdminPage from "./pages/Admin/DashboardAdminPage";
import RifaCreatePage from "./pages/Admin/RifaCreatePage";
import ProductosPage from "./pages/Admin/ProductoPage";
import ParticipantesPage from "./pages/Admin/ParticipantesPage";
import RifaTicketsPage from "./pages/Admin/RifaTicketPage";
import RifasListPage from "./pages/Admin/RifasListPage";
import RifaDetailAdminPage from "./pages/Admin/RifaDetailAdminPage";
import RifaEditPage from "./pages/Admin/RifaEditPage";

// 404
function NotFound() {
  return (
    <div className="flex-grow flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-lg">Página no encontrada</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Público */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          }
        />
        <Route
          path="/rifa/:id"
          element={
            <PublicLayout>
              <RifaDetailPage />
            </PublicLayout>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/login"
          element={
            <PublicLayout>
              <LoginAdmin />
            </PublicLayout>
          }
        />

        {/* Dashboard como home del admin */}
        <Route
          path="/admin"
          element={
            <RutaProtegida>
              <PublicLayout>
                <DashboardAdminPage />
              </PublicLayout>
            </RutaProtegida>
          }
        />

        {/* Dashboard accesible también por URL explícita */}
        <Route
          path="/admin/dashboard"
          element={
            <RutaProtegida>
              <PublicLayout>
                <DashboardAdminPage />
              </PublicLayout>
            </RutaProtegida>
          }
        />

        {/* Rutas del admin */}
        <Route
          path="/admin/rifas/crear"
          element={
            <RutaProtegida>
              <PublicLayout>
                <RifaCreatePage />
              </PublicLayout>
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/productos"
          element={
            <RutaProtegida>
              <PublicLayout>
                <ProductosPage />
              </PublicLayout>
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/participantes"
          element={
            <RutaProtegida>
              <PublicLayout>
                <ParticipantesPage />
              </PublicLayout>
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/rifas/tickets"
          element={
            <RutaProtegida>
              <PublicLayout>
                <RifaTicketsPage />
              </PublicLayout>
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/rifas"
          element={
            <RutaProtegida>
              <PublicLayout>
                <RifasListPage />
              </PublicLayout>
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/rifas/:id"
          element={
            <RutaProtegida>
              <PublicLayout>
                <RifaDetailAdminPage />
              </PublicLayout>
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/rifas/:id/editar"
          element={
            <RutaProtegida>
              <PublicLayout>
                <RifaEditPage />
              </PublicLayout>
            </RutaProtegida>
          }
        />

        {/* Catch-all: redirige rutas admin no reconocidas al Dashboard */}
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

        {/* 404 general */}
        <Route
          path="*"
          element={
            <PublicLayout>
              <NotFound />
            </PublicLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
