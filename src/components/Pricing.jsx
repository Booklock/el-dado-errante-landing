function Pricing() {
  const handleWhatsApp = () => {
    const phone = "50688993118";
    const message = "Hola, quiero conocer los precios, promos y servicios 🎲";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <section id="pricing" className="pricing-section">
      <div className="container">
        <span className="section-label">Precios y servicios</span>
        <h2 className="section-title">Opciones pensadas para cada tipo de noche</h2>
        <p className="section-description">
          Desde alquiler individual hasta promos y suscripciones para quienes quieren
          tener siempre un juego nuevo en la mesa.
        </p>

        <div className="pricing-grid">
          <article className="pricing-card card">
            <h3>Alquiler individual</h3>
            <p className="price-highlight">Desde ₡3000</p>
            <ul>
              <li>Alquiler por 5 días</li>
              <li>Depósito reembolsable</li>
              <li>Ideal para probar un juego específico</li>
            </ul>
          </article>

          <article className="pricing-card card featured-pricing">
            <h3>Promos</h3>
            <p className="price-highlight">Combos especiales</p>
            <ul>
              <li>2 o más juegos con precio especial</li>
              <li>Opciones para grupos y eventos</li>
              <li>Ideal para fines de semana</li>
            </ul>
          </article>

          <article className="pricing-card card">
            <h3>Suscripciones</h3>
            <p className="price-highlight">Consultá disponibilidad</p>
            <ul>
              <li>Rotación de juegos en el periodo de suscripción</li>
              <li>Perfecto para verdaderos amantes del tablero</li>
            </ul>
          </article>
        </div>

        <div className="pricing-cta">
          <button className="btn btn-primary" onClick={handleWhatsApp}>
            Quiero más información
          </button>
        </div>
      </div>
    </section>
  );
}

export default Pricing;