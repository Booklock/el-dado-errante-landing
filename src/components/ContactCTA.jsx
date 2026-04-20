function ContactCTA() {
  const handleWhatsApp = () => {
    const phone = "50688993118";
    const message = "Hola, quiero reservar un juego de mesa";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <section className="contact-cta-section">
      <div className="container">
        <div className="contact-cta card">
          <span className="section-label">Reservá hoy</span>
          <h2 className="section-title">¿Ya tenés plan para tu próxima noche de juegos?</h2>
          <p className="section-description">
            Escribinos por WhatsApp y te ayudamos a encontrar el juego perfecto según
            tu grupo, ocasión y estilo de juego.
          </p>

          <button className="btn btn-primary" onClick={handleWhatsApp}>
            Reservar por WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
}

export default ContactCTA;