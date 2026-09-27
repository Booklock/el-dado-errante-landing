import Navbar from "../components/Navbar";
import Memberships from "../components/Memberships";
import ContactCTA from "../components/ContactCTA";
import Footer from "../components/Footer";

export default function MembershipsPage({ onDashboard }) {
  return (
    <>
      <Navbar onDashboard={onDashboard} />
      <div style={{ paddingTop: "2rem" }}>
        <Memberships />
        <ContactCTA />
      </div>
      <Footer />
    </>
  );
}
