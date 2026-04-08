import { useState, useEffect } from 'react'
import { getServicios, getDisponibilidad, reservarTurno } from '../lib/api'

const STEPS = ['Servicio', 'Turno', 'Datos', 'Confirmar']

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function getProximosDias(n = 14) {
  const dias = []
  const hoy = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() + i)
    dias.push(d)
  }
  return dias
}

function formatFecha(dateObj) {
  return dateObj.toISOString().split('T')[0]
}

export default function Home() {
  const [step, setStep] = useState(0)
  const [servicios, setServicios] = useState([])
  const [servicioSel, setServicioSel] = useState(null)
  const [fechaSel, setFechaSel] = useState(null)
  const [slots, setSlots] = useState([])
  const [slotSel, setSlotSel] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [form, setForm] = useState({ nombre_cliente: '', email: '', contacto: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const dias = getProximosDias(21)

  useEffect(() => {
    getServicios().then(setServicios).catch(console.error)
  }, [])

  useEffect(() => {
    if (!fechaSel) return
    setLoadingSlots(true)
    setSlotSel(null)
    getDisponibilidad(fechaSel)
      .then(setSlots)
      .catch(console.error)
      .finally(() => setLoadingSlots(false))
  }, [fechaSel])

  async function handleReservar() {
    setError('')
    setLoading(true)
    try {
      await reservarTurno({
        nombre_cliente: form.nombre_cliente,
        email: form.email,
        contacto: form.contacto,
        servicio_id: servicioSel.id,
        disponibilidad_id: slotSel.id,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div className="fade-in" style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✂️</div>
          <h2 style={{ fontSize: 36, marginBottom: 12 }}>¡Turno confirmado!</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>
            Te enviamos un email de confirmación a <strong>{form.email}</strong>.
            Te esperamos el <strong>{fechaSel}</strong> a las <strong>{slotSel?.hora_inicio}</strong>.
          </p>
          <button className="btn btn-outline" onClick={() => { setStep(0); setSuccess(false); setServicioSel(null); setSlotSel(null); setFechaSel(null); setForm({ nombre_cliente: '', email: '', contacto: '' }) }}>
            Reservar otro turno
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <section style={{
        padding: '80px 32px 64px',
        textAlign: 'center',
        borderBottom: '1px solid var(--gray-200)',
      }}>
        <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 16 }}>
          Buenos Aires · Barbería
        </p>
        <h1 style={{ fontSize: 'clamp(48px, 8vw, 80px)', marginBottom: 20 }}>
          StyloSpace
        </h1>
        <p style={{ color: 'var(--gray-600)', maxWidth: 400, margin: '0 auto 32px' }}>
          Reservá tu turno en minutos. Sin llamadas, sin esperas.
        </p>
        <button className="btn btn-primary" onClick={() => document.getElementById('reserva').scrollIntoView({ behavior: 'smooth' })}>
          Reservar turno
        </button>
      </section>

      <section id="reserva" style={{ maxWidth: 680, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 48 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i <= step ? 'var(--black)' : 'var(--gray-200)',
                color: i <= step ? 'var(--white)' : 'var(--gray-400)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 500,
                transition: 'background 0.3s',
              }}>{i + 1}</div>
              <span style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: i === step ? 'var(--black)' : 'var(--gray-400)' }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 style={{ fontSize: 28, marginBottom: 8 }}>Elegí tu servicio</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>¿Qué te hacemos hoy?</p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {servicios.map(s => {
                const selected = servicioSel?.id === s.id

                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setServicioSel(s)
                      setStep(1)
                    }}
                    style={{
                      border: `1px solid ${selected ? 'var(--black)' : 'var(--gray-200)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--white)',
                      cursor: 'pointer',
                      transition: 'border-color var(--transition)',
                      textAlign: 'left',
                      padding: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '16 / 10',
                        background: 'var(--gray-100)',
                        borderBottom: '1px solid var(--gray-200)',
                      }}
                    >
                      {s.imagen ? (
                        <img
                          src={s.imagen}
                          alt={s.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--gray-400)',
                            fontSize: 13,
                          }}
                        >
                          Sin imagen
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '18px 18px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 6 }}>
                        {s.nombre}
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 10 }}>
                        {s.duracion_min > 59 ? `${Math.trunc(s.duracion_min/60)} hs` : `` } {s.duracion_min%60 > 0  ? `${s.duracion_min%60} min` : ``} · {s.descripcion}
                      </div>

                      <div style={{ fontWeight: 600 }}>
                        ${s.precio.toLocaleString('es-AR')}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <div className="fade-in">
            <h2 style={{ fontSize: 32, marginBottom: 8 }}>Elegí el día</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>{servicioSel?.nombre} · {servicioSel?.duracion_min} min</p>

            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 32 }}>
              {dias.map(d => {
                const str = formatFecha(d)
                const sel = fechaSel === str
                return (
                  <button
                    key={str}
                    onClick={() => setFechaSel(str)}
                    style={{
                      flexShrink: 0, width: 60, padding: '10px 0',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      border: `1px solid ${sel ? 'var(--black)' : 'var(--gray-200)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: sel ? 'var(--black)' : 'var(--white)',
                      color: sel ? 'var(--white)' : 'var(--black)',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                    }}
                  >
                    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{DIAS[d.getDay()]}</span>
                    <span style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 300 }}>{d.getDate()}</span>
                  </button>
                )
              })}
            </div>

            {fechaSel && (
              <>
                <p className="label" style={{ marginBottom: 12 }}>Horarios disponibles</p>
                {loadingSlots ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner" /></div>
                ) : slots.length === 0 ? (
                  <p style={{ color: 'var(--gray-600)', textAlign: 'center', padding: 32 }}>No hay turnos disponibles para este día.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                    {slots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setSlotSel(slot)}
                        style={{
                          padding: '10px 16px',
                          border: `1px solid ${slotSel?.id === slot.id ? 'var(--black)' : 'var(--gray-200)'}`,
                          borderRadius: 'var(--radius)',
                          background: slotSel?.id === slot.id ? 'var(--black)' : 'var(--white)',
                          color: slotSel?.id === slot.id ? 'var(--white)' : 'var(--black)',
                          fontSize: 14,
                          cursor: 'pointer',
                          transition: 'all var(--transition)',
                        }}
                      >
                        {slot.hora_inicio}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Volver</button>
              <button className="btn btn-primary" disabled={!slotSel} onClick={() => setStep(2)}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h2 style={{ fontSize: 32, marginBottom: 8 }}>Tus datos</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: 32 }}>Para confirmar tu turno necesitamos tus datos.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <label className="label">Nombre completo</label>
                <input
                  className="input"
                  placeholder="Juan Pérez"
                  value={form.nombre_cliente}
                  onChange={e => setForm(f => ({ ...f, nombre_cliente: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="juan@gmail.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">WhatsApp o Instagram</label>
                <input
                  className="input"
                  placeholder="1134567890 o @juanperez"
                  value={form.contacto}
                  onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Volver</button>
              <button
                className="btn btn-primary"
                disabled={!form.nombre_cliente || !form.email || !form.contacto}
                onClick={() => setStep(3)}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h2 style={{ fontSize: 32, marginBottom: 8 }}>Confirmá tu turno</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: 32 }}>Revisá los detalles antes de confirmar.</p>

            <div className="card" style={{ marginBottom: 24 }}>
              <Row label="Servicio" value={servicioSel?.nombre} />
              <hr className="divider" />
              <Row label="Fecha" value={fechaSel} />
              <Row label="Horario" value={slotSel?.hora_inicio} />
              <hr className="divider" />
              <Row label="Nombre" value={form.nombre_cliente} />
              <Row label="Email" value={form.email} />
              <Row label="Contacto" value={form.contacto} />
              <hr className="divider" />
              <Row label="Total" value={`$${servicioSel?.precio?.toLocaleString('es-AR')}`} big />
            </div>

            {error && <p className="error-msg" style={{ marginBottom: 16 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Volver</button>
              <button className="btn btn-primary" onClick={handleReservar} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Confirmar turno'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function Row({ label, value, big }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
      <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>{label}</span>
      <span style={{ fontWeight: big ? 500 : 400, fontSize: big ? 18 : 14, fontFamily: big ? 'var(--font-display)' : 'inherit' }}>
        {value}
      </span>
    </div>
  )
}
