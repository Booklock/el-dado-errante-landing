import Navbar from "../components/Navbar";
import Catalog from "../components/Catalog";
import Footer from "../components/Footer";

export default function CatalogPage({ onDashboard, categoria }) {
  return (
    <>
      <Navbar onDashboard={onDashboard} />
      <Catalog defaultView="all" initialCategory={categoria ?? "all"} />
      <Footer />
    </>
  );
}
