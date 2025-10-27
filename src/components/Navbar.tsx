// src/components/Navbar.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAdminToken, getAdminToken } from "../service/admin";

export default function Navbar() {
  const navigate = useNavigate();
  const isAdmin = Boolean(getAdminToken());
  const [open, setOpen] = useState(false);

  function logout() {
    clearAdminToken();
    navigate("/admin/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/70 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-600 shadow-sm" />
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Rifas
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          <NavItem to="/" label="Inicio" />
          {isAdmin ? (
            <>
              <NavItem to="/admin" label="Panel" />
              <button
                onClick={logout}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Salir
              </button>
              <span className="ml-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Admin
              </span>
            </>
          ) : (
            <NavItem to="/admin/login" label="Admin" />
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-slate-200/80 bg-white/90 px-4 py-2 md:hidden">
          <div className="flex flex-col">
            <MobileItem to="/" label="Inicio" onClick={() => setOpen(false)} />
            {isAdmin ? (
              <>
                <MobileItem to="/admin" label="Panel" onClick={() => setOpen(false)} />
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Salir
                </button>
              </>
            ) : (
              <MobileItem to="/admin/login" label="Admin" onClick={() => setOpen(false)} />
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
    >
      {label}
    </Link>
  );
}

function MobileItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
    >
      {label}
    </Link>
  );
}
