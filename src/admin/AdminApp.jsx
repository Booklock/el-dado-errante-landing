import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Login from "./Login";
import Layout from "./Layout";
import "./admin.css";
import "../index.css";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export default function AdminApp() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase() ?? "");

  if (session === undefined) {
    return (
      <div className="admin-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--color-text-soft)" }}>Cargando...</p>
      </div>
    );
  }

  if (!session) return <div className="admin-root"><Login /></div>;

  if (!isAdmin) {
    return (
      <div className="admin-root" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1rem" }}>
        <p style={{ fontSize: "2rem" }}>🚫</p>
        <p style={{ fontWeight: 700 }}>Acceso no autorizado</p>
        <p style={{ color: "var(--color-text-soft)" }}>Tu cuenta no tiene permisos de administrador.</p>
        <button className="btn btn-secondary" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </div>
    );
  }

  return <div className="admin-root"><Layout /></div>;
}
