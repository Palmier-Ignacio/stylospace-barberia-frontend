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
      .sort((a, b) => {
        const aKey = `${a.fecha} ${a.hora}`
        const bKey = `${b.fecha} ${b.hora}`
        return aKey.localeCompare(bKey)
      })

    const turnosHoy = confirmados.filter(t => t.fecha === hoy)
    const turnosManana = confirmados.filter(t => t.fecha === manana)

    const turnosSemana = confirmados.filter(t => {
      const fechaTurno = new Date(`${t.fecha}T00:00:00`)
      return fechaTurno >= hoyDate && fechaTurno <= finSemanaDate
    })

    const ahora = new Date()
    const proximosTurnos = confirmados.filter(t => {
      const dt = new Date(`${t.fecha}T${t.hora}:00`)
      return dt >= ahora
    })

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
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 6 }}>Panel de administración</h1>
      <p style={{ color: 'var(--gray-600)', marginBottom: 40 }}>Bienvenido a StyloSpace</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 48,
        }}
      >
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

      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <h2 style={{ fontSize: 24, margin: 0 }}>Próximos turnos</h2>
          <Link to="/admin/turnos?vista=proximos" style={{ fontSize: 13, color: 'var(--gray-600)' }}>
            Ver todos →
          </Link>
        </div>

        {proximosTurnos.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', padding: '24px 0' }}>
            No hay próximos turnos confirmados.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {proximosTurnos.map(t => (
              <div
                key={t.id}
                className="card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 90px 1fr auto',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{formatFecha(t.fecha)}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{t.hora}</div>
                <div>
                  <div style={{ fontWeight: 500 }}>{t.nombre_cliente}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{t.servicio_nombre}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--gray-600)' }}>
                  ${t.precio?.toLocaleString('es-AR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, subvalue, link, highlight }) {
  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{
          borderColor: highlight ? 'var(--black)' : 'var(--gray-200)',
          transition: 'border-color var(--transition)',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: typeof value === 'number' ? 40 : 28,
            fontWeight: 300,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 8 }}>{label}</div>
        {subvalue && (
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>{subvalue}</div>
        )}
      </div>
    </Link>
  )
}