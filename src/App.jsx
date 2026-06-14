import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Catalog from "./components/Catalog";
import Pricing from "./components/Pricing";
import Memberships from "./components/Memberships";
import ReservationForm from "./components/ReservationForm";
import Testimonials from "./components/Testimonials";
import ContactCTA from "./components/ContactCTA";
import Footer from "./components/Footer";
import CustomerDashboard from "./components/CustomerDashboard";
import ResetPasswordModal from "./components/ResetPasswordModal";
import { useCurrentClient } from "./hooks/useCurrentClient";
import { supabase } from "./lib/supabase";

function App() {
  const [view,          setView]          = useState("landing");
  const [resetPassword, setResetPassword] = useState(false);
  const { client, refetch } = useCurrentClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setResetPassword(true);
    });
    return () => subscription.unsubscribe();
  }, []);

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
      <Navbar onDashboard={() => setView("dashboard")} onBack={() => setView("landing")} />
      <Hero />
      <HowItWorks />
      <Catalog />
      <Pricing />
      <Memberships />
      <ReservationForm />
      <Testimonials />
      <ContactCTA />
      <Footer />
      {resetPassword && <ResetPasswordModal onClose={() => setResetPassword(false)} />}
    </>
  );
}

export default App;
