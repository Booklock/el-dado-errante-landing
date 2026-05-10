import { openWhatsApp } from "../constants";

const PLANS = [
  {
    name: "Casual",
    price: "₡8.000",
    perks: ["1 juego al mes", "Derecho a 2 cambios", "Ideal para empezar"],
    featured: false,
    msg: "Hola, me interesa la Membresía Casual 🎲",
  },
  {
    name: "Jugón",
    price: "₡15.000",
    perks: ["2 juegos al mes", "Rotación de juegos", "Para los que siempre quieren algo nuevo"],
    featured: true,
    msg: "Hola, me interesa la Membresía Jugón 🎲",
  },
  {
    name: "Party",
    price: "₡22.000",
    perks: ["3 juegos al mes", "Rotación de juegos", "Perfecto para grupos y reuniones"],
    featured: false,
    msg: "Hola, me interesa la Membresía Party 🎲",
  },
];

function Memberships() {
  return (
    <section id="memberships" className="memberships-section">
      <div className="container">
        <span className="section-label">Membresías</span>
        <h2 className="section-title">Siempre un juego nuevo en la mesa</h2>
        <p className="section-description">
          Suscribite mensualmente y recibí juegos rotando. Sin aburrirte de jugar siempre lo mismo.
        </p>

        <div className="pricing-grid memberships-grid">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`pricing-card card${plan.featured ? " featured-pricing" : ""}`}
            >
              {plan.featured && (
                <span className="membership-badge">Más popular</span>
              )}
              <h3>{plan.name}</h3>
              <p className="price-highlight">
                {plan.price} <span className="membership-period">/mes</span>
              </p>
              <ul>
                {plan.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <button
                className={`btn ${plan.featured ? "btn-primary" : "btn-secondary"} membership-btn`}
                onClick={() => openWhatsApp(plan.msg)}
              >
                Quiero esta membresía
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Memberships;
