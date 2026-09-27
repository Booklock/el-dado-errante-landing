import { openWhatsApp } from "../constants";
import { useInView } from "../hooks/useInView";

function Pricing() {
  const [ref, inView] = useInView();
  const handleWhatsApp = () => openWhatsApp("Hola, quiero conocer los precios, promos y servicios 🎲");
  const rv = (extra = "") => `reveal${extra}${inView ? " in-view" : ""}`;

  return (
    <section ref={ref} id="pricing" className="pricing-section">
      <div className="container">
        <span className={`section-label ${rv()}`}>Precios y servicios</span>
        <h2 className={`section-title ${rv(" reveal-delay-1")}`}>
          Opciones pensadas para cada tipo de noche
        </h2>
        <p className={`section-description ${rv(" reveal-delay-2")}`}>
          Desde alquiler individual hasta promos y suscripciones para quienes quieren
          tener siempre un juego nuevo en la mesa.
        </p>

        <div className="pricing-grid">
          <article className={`pricing-card card ${rv(" reveal-delay-3")}`}>
            <h3>Alquiler individual</h3>
            <p className="price-highlight">Desde ₡3000</p>
            <ul>
              <li>Alquiler por 5 días</li>
              <li>Depósito reembolsable</li>
              <li>Ideal para probar un juego específico</li>
            </ul>
          </article>

          <article className={`pricing-card card featured-pricing ${rv(" reveal-delay-4")}`}>
            <h3>Promos</h3>
            <p className="price-highlight">Combos especiales</p>
            <ul>
              <li>2 o más juegos con precio especial</li>
              <li>Opciones para grupos y eventos</li>
              <li>Ideal para fines de semana</li>
            </ul>
          </article>

          <article className={`pricing-card card ${rv(" reveal-delay-5")}`}>
            <h3>Membresías</h3>
            <p className="price-highlight">Desde ₡8.000/mes</p>
            <ul>
              <li>Rotación mensual de juegos</li>
              <li>Planes Casual, Jugón y Party</li>
              <li>Para los que siempre quieren algo nuevo</li>
            </ul>
            <a href="#memberships" className="btn btn-secondary pricing-membership-link">
              Ver planes
            </a>
          </article>
        </div>

        <div className={`pricing-cta ${rv(" reveal-delay-6")}`}>
          <button className="btn btn-primary" onClick={handleWhatsApp}>
            Quiero más información
          </button>
        </div>
      </div>
    </section>
  );
}

export default Pricing;
