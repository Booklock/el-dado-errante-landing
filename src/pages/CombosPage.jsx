import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactCTA from "../components/ContactCTA";
import { openWhatsApp } from "../constants";
import { useInView } from "../hooks/useInView";

function ComboCard({ combo, i }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  return (
    <article
      ref={ref}
      className={`combo-card card reveal reveal-delay-${Math.min(i + 1, 6)}${inView ? " in-view" : ""}`}
    >
      {combo.image_url && (
        <img src={combo.image_url} alt={combo.title} className="combo-card-img" />
      )}
      <div className="combo-card-body">
        <h3 className="combo-card-title">{combo.title}</h3>
        {combo.description && <p className="combo-card-desc">{combo.description}</p>}
        {combo.items?.length > 0 && (
          <ul className="combo-card-items">
            {combo.items.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        )}
        <p className="combo-card-price">₡{combo.price.toLocaleString("es-CR")}</p>
        <button
          className="btn btn-primary"
          onClick={() => openWhatsApp(`Hola, me interesa el combo "${combo.title}" 🎲`)}
        >
          Quiero este combo
        </button>
      </div>
    </article>
  );
}

export default function CombosPage({ onDashboard }) {
  const [combos,  setCombos]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("combos").select("*").eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setCombos(data ?? []); setLoading(false); });
  }, []);

  return (
    <>
      <Navbar onDashboard={onDashboard} />
      <section className="combos-section">
        <div className="container">
          <span className="section-label">Combos y promos</span>
          <h1 className="section-title">Promociones especiales</h1>
          <p className="section-description">
            Combos armados para que aproveches más por menos. Cambian cada mes.
          </p>

          {loading ? (
            <p className="catalog-loading">Cargando promos...</p>
          ) : combos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--color-text-soft)" }}>
              <p style={{ fontSize: "2rem" }}>🎲</p>
              <p>No hay promos activas en este momento.</p>
              <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Escribinos y armamos algo para vos.</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: "1rem" }}
                onClick={() => openWhatsApp("Hola, me interesan los combos especiales 🎲")}
              >
                Consultar por WhatsApp
              </button>
            </div>
          ) : (
            <div className="combos-grid">
              {combos.map((combo, i) => <ComboCard key={combo.id} combo={combo} i={i} />)}
            </div>
          )}
        </div>
      </section>
      <ContactCTA />
      <Footer />
    </>
  );
}
