import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getTurnosAdmin } from '../../lib/api'

function toDateOnly(date) {
  return date.toISOString().split('T')[0]
}

function formatFecha(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
}

export default function Dashboard() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTurnosAdmin()
      .then(setTurnos)
      .finally(() => setLoading(false))
  }, [])

  const {
    turnosHoy,
    turnosManana,
    turnosSemana,
    proximosTurnos,
    proximoTurno,
  } = useMemo(() => {
    const hoyDate = new Date()
    hoyDate.setHours(0, 0, 0, 0)

    const mananaDate = new Date(hoyDate)
    mananaDate.setDate(mananaDate.getDate() + 1)

    const finSemanaDate = new Date(hoyDate)
    finSemanaDate.setDate(finSemanaDate.getDate() + 7)

    const hoy = toDateOnly(hoyDate)
    const manana = toDateOnly(mananaDate)

    const confirmados = turnos
      .filter(t => t.estado === 'confirmed')
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))

    const turnosHoy = confirmados.filter(t => t.fecha === hoy)
    const turnosManana = confirmados.filter(t => t.fecha === manana)

    const turnosSemana = confirmados.filter(t => {
      const fechaTurno = new Date(`${t.fecha}T00:00:00`)
      return fechaTurno >= hoyDate && fechaTurno <= finSemanaDate
    })

    const ahora = new Date()
    const proximosTurnos = confirmados.filter(t => new Date(`${t.fecha}T${t.hora}:00`) >= ahora)

    return {
      turnosHoy,
      turnosManana,
      turnosSemana,
      proximosTurnos: proximosTurnos.slice(0, 10),
      proximoTurno: proximosTurnos[0] || null,
    }
  }, [turnos])

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>
  }

  return (
    <div className="admin-page dashboard-page">
      <header className="page-header">
        <h1 className="page-title">Panel de administración</h1>
        <p className="page-subtitle">Bienvenido a Stylo Space</p>
      </header>

      <div className="stats-grid">
        <StatCard label="Turnos hoy" value={turnosHoy.length} link="/admin/turnos?vista=hoy" />
        <StatCard label="Turnos mañana" value={turnosManana.length} link="/admin/turnos?vista=manana" />
        <StatCard label="Próximos 7 días" value={turnosSemana.length} link="/admin/turnos?vista=semana" />
        <StatCard
          label="Próximo turno"
          value={proximoTurno ? proximoTurno.hora : '—'}
          subvalue={proximoTurno ? formatFecha(proximoTurno.fecha) : 'Sin turnos'}
          link="/admin/turnos?vista=proximos"
          highlight
        />
      </div>

      <section className="dashboard-section">
        <div className="section-head">
          <h2 className="section-title section-title--sm">Próximos turnos</h2>
          <Link to="/admin/turnos?vista=proximos" className="section-link">
            Ver todos →
          </Link>
        </div>

        {proximosTurnos.length === 0 ? (
          <p className="empty-state empty-state--left">No hay próximos turnos confirmados.</p>
        ) : (
          <div className="appointment-list">
            {proximosTurnos.map(turno => (
              <div key={turno.id} className="card appointment-card">
                  <div className="appointment-card__date">{formatFecha(turno.fecha)} - {turno.hora}</div>
                <div className="appointment-card__info">
                  <div className="appointment-card__name">{turno.nombre_cliente}</div>
                  <div className="appointment-card__service">{turno.servicio_nombre}</div>
                </div>
                  <div className="appointment-card__price">${turno.precio?.toLocaleString('es-AR')}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, subvalue, link, highlight }) {
  return (
    <Link to={link} className="stat-card-link">
      <div className={`card stat-card ${highlight ? 'is-highlighted' : ''}`}>
        <div className={`stat-card__value ${typeof value !== 'number' ? 'is-text' : ''}`}>{value}</div>
        <div className="stat-card__label">{label}</div>
        {subvalue && <div className="stat-card__subvalue">{subvalue}</div>}
      </div>
    </Link>
  )
}
