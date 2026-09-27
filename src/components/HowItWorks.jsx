import { useInView } from "../hooks/useInView";

function HowItWorks() {
  const [ref, inView] = useInView();

  const steps = [
    {
      number: "1.",
      title: "Elegí tu juego",
      description: "Explorá el catálogo por categorías y encontrá el juego ideal para tu plan.",
    },
    {
      number: "2.",
      title: "Escribinos por WhatsApp",
      description: "Consultá disponibilidad y hacé tu reserva de forma rápida y sencilla.",
    },
    {
      number: "3.",
      title: "Confirmá tu reserva",
      description: "Coordinamos el depósito, plazo del alquiler y detalles de entrega o devolución.",
    },
    {
      number: "4.",
      title: "Jugá y disfrutá",
      description: "Recibí tu juego, disfrutalo con tu grupo y devolvelo en el tiempo acordado.",
    },
  ];

  const rv = (extra = "") => `reveal${extra}${inView ? " in-view" : ""}`;

  return (
    <section ref={ref} id="how-it-works" className="how-it-works">
      <div className="container">
        <p className={rv()}          >¿Cómo funciona?</p>
        <h2 className={rv(" reveal-delay-1")}>Alquilar es así de fácil</h2>
        <p className={`section-description ${rv(" reveal-delay-2")}`}>
          Reservá tu juego en pocos pasos y armá una noche de juegos sin complicarte.
        </p>

        <div className="steps-grid">
          {steps.map((step, i) => (
            <div key={step.number} className={`step-card ${rv(` reveal-delay-${i + 3}`)}`}>
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
