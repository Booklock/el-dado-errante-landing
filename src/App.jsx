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

function App() {
  return (
    <>
      <Navbar />
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