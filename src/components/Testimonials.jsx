function Testimonials() {
  const testimonials = [
    {
      name: "Rebecca",
      text: "Fue súper fácil reservar y el juego llegó en excelente estado. Perfecto para una noche diferente.",
    },
    {
      name: "Josue",
      text: "De tanto ver Hues and Cues teniamos que probar que tan bueno era, y lo fue.",
    },
    {
      name: "Mauricio",
      text: "Como amantes del café, Coffee Rush fue un invreible juego para un date night increible",
    },
  ];

  return (
    <section id="testimonials" className="testimonials-section">
      <div className="container">
        <span className="section-label">Testimonios</span>
        <h2 className="section-title">Personas que ya vivieron la experiencia</h2>
        <p className="section-description">
          Nada genera más confianza que una mesa feliz y una noche bien jugada.
        </p>

        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="testimonial-card card">
              <p className="testimonial-text">“{testimonial.text}”</p>
              <p className="testimonial-name">{testimonial.name}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;