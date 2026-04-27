import { useEffect, useMemo, useRef, useState } from 'react'
import { getServicios, getDisponibilidad, getDisponibilidadResumen, reservarTurno } from '../lib/api'
import {
  addDaysArgentina,
  parseDateOnlyArgentina,
  startOfTodayArgentina,
  toDateOnlyArgentina,
} from '../lib/argentinaDate'

const STEPS = ['Servicio', 'Turno', 'Datos', 'Confirmar']
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const LIMITE_DIAS_RESERVA = 30

function formatFecha(dateObj) {
  return toDateOnlyArgentina(dateObj)
}

function parseDateOnly(fecha) {
  return parseDateOnlyArgentina(fecha)
}

function addDays(baseDate, days) {
  return addDaysArgentina(baseDate, days)
}

function getMonthMatrix(baseDate) {
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())

  const days = []
  for (let i = 0; i < 42; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(day)
  }
  return days
}

function formatDuracion(minutos) {
  const horas = Math.trunc(minutos / 60)
  const resto = minutos % 60
  return `${horas > 0 ? `${horas} hs` : ''}${horas > 0 && resto > 0 ? ' ' : ''}${resto > 0 ? `${resto} min` : ''}`.trim()
}

function formatFechaLarga(fecha) {
  return parseDateOnly(fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function isSameOrBeforeMonth(leftDate, rightDate) {
  if (leftDate.getFullYear() !== rightDate.getFullYear()) {
    return leftDate.getFullYear() < rightDate.getFullYear()
  }
  return leftDate.getMonth() <= rightDate.getMonth()
}

function isSameOrAfterMonth(leftDate, rightDate) {
  if (leftDate.getFullYear() !== rightDate.getFullYear()) {
    return leftDate.getFullYear() > rightDate.getFullYear()
  }
  return leftDate.getMonth() >= rightDate.getMonth()
}

export default function Home() {
  const [step, setStep] = useState(0)
  const [servicios, setServicios] = useState([])
  const [servicioSel, setServicioSel] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const todayArgentina = startOfTodayArgentina()
    return new Date(todayArgentina.getFullYear(), todayArgentina.getMonth(), 1)
  })
  const [calendarResumen, setCalendarResumen] = useState({})
  const [fechaSel, setFechaSel] = useState(null)
  const [slots, setSlots] = useState([])
  const [slotSel, setSlotSel] = useState(null)
  const [loadingCalendar, setLoadingCalendar] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [form, setForm] = useState({ nombre_cliente: '', email: '', contacto: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const resumenCacheRef = useRef({})
  const reservaRef = useRef(null)
  const firstRenderRef = useRef(true)

  const today = useMemo(() => startOfTodayArgentina(), [])

  const maxBookingDate = useMemo(() => addDays(today, LIMITE_DIAS_RESERVA), [today])
  const minCalendarMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today])
  const maxCalendarMonth = useMemo(() => new Date(maxBookingDate.getFullYear(), maxBookingDate.getMonth(), 1), [maxBookingDate])
  const monthDays = useMemo(() => getMonthMatrix(calendarMonth), [calendarMonth])

  useEffect(() => {
    getServicios().then(setServicios).catch(console.error)
  }, [])

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      return
    }

    reservaRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [step])

  useEffect(() => {
    if (!success) return

    reservaRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [success])

  useEffect(() => {
    if (step !== 1) return

    const desde = formatFecha(monthDays[0])
    const hasta = formatFecha(monthDays[monthDays.length - 1])
    const cacheKey = `${desde}_${hasta}`

    if (resumenCacheRef.current[cacheKey]) {
      setCalendarResumen(resumenCacheRef.current[cacheKey])
      return
    }

    setLoadingCalendar(true)

    getDisponibilidadResumen(desde, hasta)
      .then(items => {
        const map = Object.fromEntries(items.map(item => [item.fecha, item]))
        resumenCacheRef.current[cacheKey] = map
        setCalendarResumen(map)
      })
      .catch(err => {
        console.error(err)
        setCalendarResumen({})
      })
      .finally(() => setLoadingCalendar(false))
  }, [monthDays, step])

  useEffect(() => {
    if (!fechaSel) return

    const fechaDate = parseDateOnly(fechaSel)
    if (fechaDate < today || fechaDate > maxBookingDate) {
      setSlots([])
      setSlotSel(null)
      return
    }

    setLoadingSlots(true)
    setSlotSel(null)
    getDisponibilidad(fechaSel)
      .then(setSlots)
      .catch(err => {
        console.error(err)
        setSlots([])
      })
      .finally(() => setLoadingSlots(false))
  }, [fechaSel, maxBookingDate, today])

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

  function resetReserva() {
    setStep(0)
    setSuccess(false)
    setServicioSel(null)
    setSlotSel(null)
    setFechaSel(null)
    setSlots([])
    setForm({ nombre_cliente: '', email: '', contacto: '' })
  }

  function handleSelectDate(fecha) {
    const selectedDate = parseDateOnly(fecha)
    if (selectedDate < today || selectedDate > maxBookingDate) return
    setFechaSel(fecha)
  }


  return (
    <div>
      <section className="hero-section">
        <p className="hero-section__eyebrow">
          Haydn 3175, William C. Morris <br />
          <a class="btn-maps" target="_blank" href="https://maps.app.goo.gl/hh1Lj26j8GtJi1jd7">
            ver en google maps →
          </a>
          <br /> Buenos Aires · Barbería
        </p>
        <h1 className="hero-section__title">Stylo Space</h1>
        <p className="hero-section__description">
          Reservá tu turno en minutos. Sin llamadas, sin esperas.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => document.getElementById('reserva')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Reservar turno
        </button>
      </section>

      <section id="reserva" ref={reservaRef} className="booking-section">
        {success ? (
          <div className="booking-success">
            <div className="fade-in booking-success__content">
              <div className="booking-success__icon">✂️</div>
              <h2 className="booking-success__title">¡Turno confirmado!</h2>
              <p className="booking-success__text">
                Te enviamos un email de confirmación a <strong>{form.email}</strong>.
                Te esperamos el <strong>{formatFechaLarga(fechaSel)}</strong> a las <strong>{slotSel?.hora_inicio}</strong>.
              </p>
              <p>
                En Haydn 3175, William C. Morris <br />
                <a class="btn-maps" target="_blank" href="https://maps.app.goo.gl/hh1Lj26j8GtJi1jd7">
                  ver en google maps →
                </a>
              </p>
              <button className="btn btn-outline" onClick={resetReserva}>
                Reservar otro turno
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="booking-steps">
              {STEPS.map((item, index) => (
                <div key={item} className="booking-steps__item">
                  <div className={`booking-steps__dot ${index <= step ? 'is-completed' : ''}`}>
                    {index + 1}
                  </div>
                  <span className={`booking-steps__label ${index === step ? 'is-active' : ''}`}>
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {step === 0 && (
              <div className="fade-in">
                <h2 className="section-title">Elegí tu servicio</h2>
                <p className="section-subtitle">¿Qué te hacemos hoy?</p>

                <div className="services-grid">
                  {servicios.map(servicio => {
                    const selected = servicioSel?.id === servicio.id

                    return (
                      <button
                        key={servicio.id}
                        onClick={() => {
                          setServicioSel(servicio)
                          setFechaSel(null)
                          setSlotSel(null)
                          setSlots([])
                          setCalendarMonth(minCalendarMonth)
                          setStep(1)
                        }}
                        className={`service-card ${selected ? 'is-selected' : ''}`}
                      >
                        <div className="service-card__media">
                          {servicio.imagen ? (
                            <img src={servicio.imagen} alt={servicio.nombre} className="service-card__image" />
                          ) : (
                            <div className="service-card__placeholder">Sin imagen</div>
                          )}
                        </div>

                        <div className="service-card__content">
                          <div className="service-card__title">{servicio.nombre}</div>
                          <div className="service-card__meta">
                            {formatDuracion(servicio.duracion_min)} · {servicio.descripcion}
                          </div>
                          <div className="service-card__price">${servicio.precio.toLocaleString('es-AR')}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="fade-in">
                <h2 className="section-title">Elegí día y horario</h2>
                <p className="section-subtitle">
                  {servicioSel?.nombre} · {servicioSel?.duracion_min} min · Podés reservar hasta {LIMITE_DIAS_RESERVA} días desde hoy
                </p>

                <div className="booking-calendar-layout">
                  <div className="card booking-calendar-card">
                    <div className="booking-calendar__header">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={isSameOrAfterMonth(minCalendarMonth, calendarMonth)}
                        onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      >
                        ←
                      </button>

                      <div className="booking-calendar__title">
                        {MESES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                      </div>

                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={isSameOrBeforeMonth(maxCalendarMonth, calendarMonth)}
                        onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      >
                        →
                      </button>
                    </div>

                    <div className="booking-calendar__weekdays">
                      {DIAS.map(dia => <span key={dia}>{dia}</span>)}
                    </div>

                    {loadingCalendar ? (
                      <div className="booking-loader"><div className="spinner" /></div>
                    ) : (
                      <div className="booking-calendar__grid">
                        {monthDays.map(dia => {
                          const fecha = formatFecha(dia)
                          const resumen = calendarResumen[fecha]
                          const isSelected = fechaSel === fecha
                          const isCurrentMonth = dia.getMonth() === calendarMonth.getMonth()
                          const isPast = dia < today
                          const isBeyondLimit = dia > maxBookingDate
                          const isDisabled = isPast || isBeyondLimit
                          const cantidad = Number(resumen?.cantidad ?? resumen?.disponibles ?? 0)
                          const hasAvailability = cantidad > 0

                          let meta = 'Consultá horarios'
                          if (isPast) meta = 'Pasó'
                          else if (isBeyondLimit) meta = 'Fuera de rango'
                          else if (hasAvailability) meta = `${cantidad} horarios`

                          return (
                            <button
                              key={fecha}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => handleSelectDate(fecha)}
                              className={[
                                'calendar-day',
                                isSelected ? 'is-selected' : '',
                                !isCurrentMonth ? 'is-outside' : '',
                                hasAvailability ? 'has-availability' : 'is-empty',
                                isDisabled ? 'is-disabled' : '',
                              ].filter(Boolean).join(' ')}
                            >
                              <span className="calendar-day__number">{dia.getDate()}</span>
                              <span className="calendar-day__meta">{meta}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="card booking-times-card">
                    <div className="booking-times-card__header">
                      <h3>Horarios</h3>
                      <p>{fechaSel ? formatFechaLarga(fechaSel) : 'Elegí una fecha del calendario'}</p>
                    </div>

                    <div className="booking-times-card__body">
                      {!fechaSel ? (
                        <p className="empty-state empty-state--soft">Seleccioná un día para ver los horarios disponibles.</p>
                      ) : loadingSlots ? (
                        <div className="booking-loader"><div className="spinner" /></div>
                      ) : slots.length === 0 ? (
                        <p className="empty-state empty-state--soft">No hay turnos disponibles para este día.</p>
                      ) : (
                        <div className="slot-grid">
                          {slots.map(slot => (
                            <button
                              key={slot.id}
                              onClick={() => setSlotSel(slot)}
                              className={`slot-chip ${slotSel?.id === slot.id ? 'is-selected' : ''}`}
                            >
                              <span className="slot-chip__time">{slot.hora_inicio}</span>
                              <span className="slot-chip__label">Disponible</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="action-row">
                  <button className="btn btn-ghost" onClick={() => setStep(0)}>← Volver</button>
                  <button className="btn btn-primary" disabled={!slotSel} onClick={() => setStep(2)}>
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="fade-in">
                <h2 className="section-title">Tus datos</h2>
                <p className="section-subtitle">Para confirmar tu turno necesitamos tus datos.</p>

                <div className="form-stack">
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

                <div className="action-row action-row--spaced">
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
                <h2 className="section-title">Confirmá tu turno</h2>
                <p className="section-subtitle">Revisá los detalles antes de confirmar.</p>

                <div className="card booking-summary-card">
                  <Row label="Servicio" value={servicioSel?.nombre} />
                  <hr className="divider" />
                  <Row label="Fecha" value={fechaSel ? formatFechaLarga(fechaSel) : ''} />
                  <Row label="Horario" value={slotSel?.hora_inicio} />
                  <hr className="divider" />
                  <Row label="Nombre" value={form.nombre_cliente} />
                  <Row label="Email" value={form.email} />
                  <Row label="Contacto" value={form.contacto} />
                  <hr className="divider" />
                  <Row label="Total" value={`$${servicioSel?.precio?.toLocaleString('es-AR')}`} big />
                </div>

                {error && <p className="error-msg booking-summary__error">{error}</p>}

                <div className="action-row">
                  <button className="btn btn-ghost" onClick={() => setStep(2)}>← Volver</button>
                  <button className="btn btn-primary" onClick={handleReservar} disabled={loading}>
                    {loading ? <span className="spinner spinner-sm" /> : 'Confirmar turno'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function Row({ label, value, big }) {
  return (
    <div className="summary-row">
      <span className="summary-row__label">{label}</span>
      <span className={`summary-row__value ${big ? 'is-big' : ''}`}>{value}</span>
    </div>
  )
}
