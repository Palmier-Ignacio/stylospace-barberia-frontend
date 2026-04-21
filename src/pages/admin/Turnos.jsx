import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getTurnosAdmin, cancelarTurno } from '../../lib/api'

function toDateOnly(date) {
  return date.toISOString().split('T')[0]
}

function formatFecha(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  })
}

export default function Turnos() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const vistaInicial = searchParams.get('vista') || 'hoy'
  const fechaInicial = searchParams.get('fecha') || toDateOnly(new Date())
  const estadoInicial = searchParams.get('estado') || 'todos'

  const [vista, setVista] = useState(vistaInicial)
  const [fecha, setFecha] = useState(fechaInicial)
  const [estadoFiltro, setEstadoFiltro] = useState(estadoInicial)

  useEffect(() => {
    setLoading(true)
    getTurnosAdmin()
      .then(setTurnos)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()

    if (vista !== 'fecha') {
      params.set('vista', vista)
    } else {
      params.set('vista', 'fecha')
      params.set('fecha', fecha)
    }

    if (estadoFiltro !== 'todos') {
      params.set('estado', estadoFiltro)
    }

    setSearchParams(params, { replace: true })
  }, [vista, fecha, estadoFiltro, setSearchParams])

  async function handleCancelar(id) {
    if (!confirm('¿Cancelar este turno? Se va a notificar al cliente.')) return

    setCancelando(id)
    try {
      await cancelarTurno(id)
      setTurnos(actuales => actuales.map(turno => (
        turno.id === id ? { ...turno, estado: 'cancelled' } : turno
      )))
    } catch (err) {
      alert(`Error al cancelar: ${err.message}`)
    } finally {
      setCancelando(null)
    }
  }

  const turnosFiltrados = useMemo(() => {
    const hoyDate = new Date()
    hoyDate.setHours(0, 0, 0, 0)

    const mananaDate = new Date(hoyDate)
    mananaDate.setDate(mananaDate.getDate() + 1)

    const finSemanaDate = new Date(hoyDate)
    finSemanaDate.setDate(finSemanaDate.getDate() + 7)

    let filtrados = [...turnos]

    if (vista === 'hoy') {
      filtrados = filtrados.filter(t => t.fecha === toDateOnly(hoyDate))
    } else if (vista === 'manana') {
      filtrados = filtrados.filter(t => t.fecha === toDateOnly(mananaDate))
    } else if (vista === 'semana') {
      filtrados = filtrados.filter(t => {
        const fechaTurno = new Date(`${t.fecha}T00:00:00`)
        return fechaTurno >= hoyDate && fechaTurno <= finSemanaDate
      })
    } else if (vista === 'proximos') {
      const ahora = new Date()
      filtrados = filtrados.filter(t => new Date(`${t.fecha}T${t.hora}:00`) >= ahora)
    } else if (vista === 'pasados') {
      const ahora = new Date()
      filtrados = filtrados.filter(t => new Date(`${t.fecha}T${t.hora}:00`) < ahora)
    } else if (vista === 'fecha') {
      filtrados = filtrados.filter(t => t.fecha === fecha)
    }

    if (estadoFiltro === 'confirmed') {
      filtrados = filtrados.filter(t => t.estado === 'confirmed')
    } else if (estadoFiltro === 'cancelled') {
      filtrados = filtrados.filter(t => t.estado === 'cancelled')
    }

    const ordenados = filtrados.sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
    return vista === 'pasados' ? ordenados.toReversed() : ordenados
  }, [turnos, vista, fecha, estadoFiltro])

  const confirmados = turnosFiltrados.filter(t => t.estado === 'confirmed')
  const cancelados = turnosFiltrados.filter(t => t.estado === 'cancelled')

  return (
    <div className="admin-page">
      <div className="page-header page-header--split">
        <div>
          <h1 className="page-title">Turnos</h1>
          <p className="page-subtitle">{confirmados.length} confirmados · {cancelados.length} cancelados</p>
        </div>

        <div className="filters-grid filters-grid--turnos">
          <div className="form-group">
            <label className="label">Fecha específica</label>
            <input
              type="date"
              className="input"
              value={fecha}
              onChange={e => {
                setFecha(e.target.value)
                setVista('fecha')
              }}
            />
          </div>

          <div className="form-group">
            <label className="label">Estado</label>
            <select className="input" value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="confirmed">Confirmados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      <div className="filter-pills">
        {[
          ['hoy', 'Hoy'],
          ['manana', 'Mañana'],
          ['semana', 'Próximos 7 días'],
          ['proximos', 'Próximos'],
          ['pasados', 'Pasados'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`btn ${vista === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setVista(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {vista === 'fecha' && <p className="page-note">Mostrando turnos del {formatFecha(fecha)}.</p>}

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : turnosFiltrados.length === 0 ? (
        <p className="empty-state">No hay turnos para esta vista.</p>
      ) : (
        <div className="appointment-list">
          {turnosFiltrados.map(turno => (
            <div
              key={turno.id}
              className={`card booking-admin-card ${turno.estado === 'cancelled' ? 'is-cancelled' : ''}`}
            >
              <div className="booking-admin-card__date">{formatFecha(turno.fecha)} - {turno.hora}</div>

              <div className="booking-admin-card__info">
                <div className="booking-admin-card__name">{turno.nombre_cliente}</div>
                <div className="booking-admin-card__meta">{turno.servicio_nombre} · {turno.contacto}</div>
                <div className="booking-admin-card__email">{turno.email}</div>
              </div>

              <div className="booking-admin-card__status">
                <div className="booking-admin-card__price">${turno.precio?.toLocaleString('es-AR')}</div>
                <span className={`badge badge-${turno.estado}`}>
                  {turno.estado === 'cancelled' ? 'cancelado' : vista === 'pasados' ? 'Realizado' : 'confirmado'}
                </span>
              </div>

              {turno.estado === 'confirmed' && vista !== 'pasados' && (
                <button
                  className="btn btn-danger booking-admin-card__action"
                  disabled={cancelando === turno.id}
                  onClick={() => handleCancelar(turno.id)}
                >
                  {cancelando === turno.id ? <span className="spinner spinner-sm" /> : 'Cancelar'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
