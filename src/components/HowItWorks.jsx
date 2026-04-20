function HowItWorks() {
  const steps = [
    {
      number: "1.",
      title: "Elegí tu juego",
      description:
        "Explorá el catálogo por categorías y encontrá el juego ideal para tu plan.",
    },
    {
      number: "2.",
      title: "Escribinos por WhatsApp",
      description:
        "Consultá disponibilidad y hacé tu reserva de forma rápida y sencilla.",
    },
    {
      number: "3.",
      title: "Confirmá tu reserva",
      description:
        "Coordinamos el depósito, plazo del alquiler y detalles de entrega o devolución.",
    },
    {
      number: "4.",
      title: "Jugá y disfrutá",
      description:
        "Recibí tu juego, disfrutalo con tu grupo y devolvelo en el tiempo acordado.",
    },
  ];

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <p className="section-label">¿Cómo funciona?</p>
        <h2>Alquilar es así de fácil</h2>
        <p className="section-description">
          Reservá tu juego en pocos pasos y armá una noche de juegos sin complicarte.
        </p>

        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.number} className="step-card">
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;