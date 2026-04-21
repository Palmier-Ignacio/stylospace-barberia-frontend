import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">

        <div className="footer-col">
          <p className="footer-brand">Stylo Space</p>
          <p className="footer-desc">Tu barbería de confianza.<br />Reservá tu turno online.</p>
          <div className="footer-socials">
            <a href="https://instagram.com/stylo_space" target="_blank" rel="noreferrer" className="footer-social-link">Instagram</a>
            <a href="https://wa.me/5491159088342" target="_blank" rel="noreferrer" className="footer-social-link">WhatsApp</a>
          </div>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">Ubicación</p>
          <p className="footer-col-text"><a target="_blank" href="https://maps.app.goo.gl/hh1Lj26j8GtJi1jd7" >Haydn 3175, William C. Morris</a><br />Buenos Aires, Argentina</p>
        </div>
          
        <div className="footer-col">
          <p className="footer-col-title">Horarios</p>
          <p className="footer-col-text footer-hours">Mar - Vie: 15:30 – 20:30</p>
          <p className="footer-col-text footer-hours">Sáb: 12:00 – 21:00</p>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">Reservas</p>
          <p className="footer-col-text">¿Querés sacar turno?</p>
          <button
        className="btn btn-primary"
        onClick={() => document.getElementById('reserva')?.scrollIntoView({ behavior: 'smooth' })}
      >
        Reservar turno
      </button>
        </div>

      </div>

      <div className="footer-bottom">
        <p className="footer-copy">© {new Date().getFullYear()} Stylo Space. Todos los derechos reservados.</p>
        <Link to="/login" className="footer-admin-link">Acceso administrador</Link>
      </div>
    </footer>
  )
}