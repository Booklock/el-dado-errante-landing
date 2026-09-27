import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Login from "./Login";
import Layout from "./Layout";
import "./admin.css";

export default function AdminApp() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="admin-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--color-text-soft)" }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="admin-root">
      {session ? <Layout /> : <Login />}
    </div>
  );
}
