import logo from "../assets/rolosimplificado.png";

function Navbar() {
  const handleWhatsApp = () => {
    const phone = "50688993118";
    const message = "Hola, quiero alquilar un juego de mesa";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <header className="navbar">
      <div className="container navbar-content">

        {/* Logo */}
        <div className="navbar-left">
          <img src={logo} alt="El Dado Errante" className="navbar-logo" />
        </div>

        {/* Links */}
        <nav className="navbar-links">
          <a href="#how-it-works">Cómo funciona</a>
          <a href="#catalog">Catálogo</a>
          <a href="#pricing">Precios</a>
          <a href="#testimonials">Testimonios</a>
        </nav>

        {/* CTA */}
        <div className="navbar-right">
          <button className="btn btn-primary" onClick={handleWhatsApp}>
            WhatsApp
          </button>
        </div>

      </div>
    </header>
  );
}

export default Navbar;