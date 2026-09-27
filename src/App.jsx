import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Catalog from "./components/Catalog";
import Pricing from "./components/Pricing";
import Memberships from "./components/Memberships";
import ReservationForm from "./components/ReservationForm";
import ContactCTA from "./components/ContactCTA";
import Footer from "./components/Footer";
import CustomerDashboard from "./components/CustomerDashboard";
import ResetPasswordModal from "./components/ResetPasswordModal";
import { useCurrentClient } from "./hooks/useCurrentClient";
import { supabase } from "./lib/supabase";
import CatalogPage from "./pages/CatalogPage";
import MembershipsPage from "./pages/MembershipsPage";
import CombosPage from "./pages/CombosPage";

function LandingPage({ onDashboard }) {
  return (
    <>
      <Navbar onDashboard={onDashboard} />
      <Hero />
      <HowItWorks />
      <Catalog compact />
      <Pricing />
      <Memberships />
      <ReservationForm />
      <ContactCTA />
      <Footer />
    </>
  );
}

function CatalogPageRoute({ onDashboard }) {
  const { categoria } = useParams();
  return <CatalogPage onDashboard={onDashboard} categoria={categoria} />;
}

function AppInner() {
  const [view,          setView]          = useState("landing");
  const [resetPassword, setResetPassword] = useState(false);
  const { client, refetch } = useCurrentClient();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setResetPassword(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Reset dashboard view when navigating anywhere
  useEffect(() => {
    if (view === "dashboard") setView("landing");
  }, [`${location.pathname}${location.hash}`]);

  if (view === "dashboard" && client) {
    return (
      <>
        <Navbar onDashboard={() => setView("dashboard")} onBack={() => setView("landing")} />
        <CustomerDashboard client={client} refetch={refetch} onBack={() => setView("landing")} />
        <Footer />
        {resetPassword && <ResetPasswordModal onClose={() => setResetPassword(false)} />}
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage onDashboard={() => setView("dashboard")} />} />
        <Route path="/catalogo" element={<CatalogPageRoute onDashboard={() => setView("dashboard")} />} />
        <Route path="/catalogo/:categoria" element={<CatalogPageRoute onDashboard={() => setView("dashboard")} />} />
        <Route path="/precios/membresias" element={<MembershipsPage onDashboard={() => setView("dashboard")} />} />
        <Route path="/precios/combos" element={<CombosPage onDashboard={() => setView("dashboard")} />} />
        <Route path="*" element={<LandingPage onDashboard={() => setView("dashboard")} />} />
      </Routes>
      {resetPassword && <ResetPasswordModal onClose={() => setResetPassword(false)} />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
