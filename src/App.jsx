import { useState } from "react";
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
import { useCurrentClient } from "./hooks/useCurrentClient";

function App() {
  const [view, setView] = useState("landing"); // 'landing' | 'dashboard'
  const { client } = useCurrentClient();

  if (view === "dashboard" && client) {
    return (
      <>
        <Navbar onDashboard={() => setView("dashboard")} onBack={() => setView("landing")} />
        <CustomerDashboard client={client} onBack={() => setView("landing")} />
        <Footer />
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
    </>
  );
}

export default App;
