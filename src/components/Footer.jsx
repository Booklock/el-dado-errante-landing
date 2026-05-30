const INSTAGRAM_URL = "https://www.instagram.com/eldadoerrantecr?igsh=c3QxM2JkYmp5dTJh";

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div>
          <h3>El Dado Errante 🎲</h3>
          <p>Alquiler de juegos de mesa para noches memorables.</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-instagram"
            aria-label="Instagram de El Dado Errante"
          >
            <InstagramIcon />
            @eldadoerrantecr
          </a>
        </div>

        <div className="footer-links">
          <a href="#how-it-works">Cómo funciona</a>
          <a href="#catalog">Catálogo</a>
          <a href="#pricing">Precios</a>
          <a href="#reservar">Reservar</a>
          <a href="#testimonials">Testimonios</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} El Dado Errante. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;
