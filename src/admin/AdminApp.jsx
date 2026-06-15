import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Login from "./Login";
import Layout from "./Layout";
import "./admin.css";
import "../index.css";

export default function AdminApp() {
  const [session, setSession] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      checkAdmin(s);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      checkAdmin(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function checkAdmin(s) {
    if (!s?.user?.email) { setIsAdmin(false); return; }
    const { data } = await supabase
      .from("admins")
      .select("email")
      .eq("email", s.user.email)
      .maybeSingle();
    setIsAdmin(!!data);
  }

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
