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
      setTurnos(ts =>
        ts.map(t => (t.id === id ? { ...t, estado: 'cancelled' } : t))
      )
    } catch (err) {
      alert('Error al cancelar: ' + err.message)
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
      const hoy = toDateOnly(hoyDate)
      filtrados = filtrados.filter(t => t.fecha === hoy)
    } else if (vista === 'manana') {
      const manana = toDateOnly(mananaDate)
      filtrados = filtrados.filter(t => t.fecha === manana)
    } else if (vista === 'semana') {
      filtrados = filtrados.filter(t => {
        const fechaTurno = new Date(`${t.fecha}T00:00:00`)
        return fechaTurno >= hoyDate && fechaTurno <= finSemanaDate
      })
    } else if (vista === 'proximos') {
      const ahora = new Date()
      filtrados = filtrados.filter(t => {
        const dt = new Date(`${t.fecha}T${t.hora}:00`)
        return dt >= ahora
      })
    } else if (vista === 'pasados') {
      const ahora = new Date()
      filtrados = filtrados.filter(t => {
        const dt = new Date(`${t.fecha}T${t.hora}:00`)
        return dt < ahora
      })
    } else if (vista === 'fecha') {
      filtrados = filtrados.filter(t => t.fecha === fecha)
    }

    if (estadoFiltro === 'confirmed') {
      filtrados = filtrados.filter(t => t.estado === 'confirmed')
    } else if (estadoFiltro === 'cancelled') {
      filtrados = filtrados.filter(t => t.estado === 'cancelled')
    }

    if(vista === 'pasados'){
      return filtrados.sort((a, b) => {
      const aKey = `${a.fecha} ${a.hora}`
      const bKey = `${b.fecha} ${b.hora}`
      return aKey.localeCompare(bKey)
    }).toReversed()
    }
    return filtrados.sort((a, b) => {
      const aKey = `${a.fecha} ${a.hora}`
      const bKey = `${b.fecha} ${b.hora}`
      return aKey.localeCompare(bKey)
    })
  }, [turnos, vista, fecha, estadoFiltro])

  const confirmados = turnosFiltrados.filter(t => t.estado === 'confirmed')
  const cancelados = turnosFiltrados.filter(t => t.estado === 'cancelled')

  function activarVista(nuevaVista) {
    setVista(nuevaVista)
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
          flexWrap: 'wrap',
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: 36, marginBottom: 6 }}>Turnos</h1>
          <p style={{ color: 'var(--gray-600)' }}>
            {confirmados.length} confirmados · {cancelados.length} cancelados
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ minWidth: 220 }}>
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

          <div className="form-group" style={{ minWidth: 180 }}>
            <label className="label">Estado</label>
            <select
              className="input"
              value={estadoFiltro}
              onChange={e => setEstadoFiltro(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="confirmed">Confirmados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <button
          className={`btn ${vista === 'hoy' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => activarVista('hoy')}
          type="button"
        >
          Hoy
        </button>

        <button
          className={`btn ${vista === 'manana' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => activarVista('manana')}
          type="button"
        >
          Mañana
        </button>

        <button
          className={`btn ${vista === 'semana' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => activarVista('semana')}
          type="button"
        >
          Próximos 7 días
        </button>

        <button
          className={`btn ${vista === 'proximos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => activarVista('proximos')}
          type="button"
        >
          Próximos
        </button>

        <button
          className={`btn ${vista === 'pasados' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => activarVista('pasados')}
          type="button"
        >
          Pasados
        </button>
      </div>

      {vista === 'fecha' && (
        <p style={{ color: 'var(--gray-600)', marginBottom: 20 }}>
          Mostrando turnos del {formatFecha(fecha)}.
        </p>
      )}

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : turnosFiltrados.length === 0 ? (
        <p style={{ color: 'var(--gray-400)', padding: '32px 0', textAlign: 'center' }}>
          No hay turnos para esta vista.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {turnosFiltrados.map(t => (
            <div
              key={t.id}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 90px 1fr auto auto',
                alignItems: 'center',
                gap: 20,
                padding: '16px 20px',
                opacity: t.estado === 'cancelled' ? 0.5 : 1,
              }}
            >
              <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                {formatFecha(t.fecha)}
              </div>

              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300 }}>
                {t.hora}
              </div>

              <div>
                <div style={{ fontWeight: 500 }}>{t.nombre_cliente}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                  {t.servicio_nombre} · {t.contacto}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{t.email}</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 500 }}>${t.precio?.toLocaleString('es-AR')}</div>
                <span className={`badge badge-${t.estado}`}>{t.estado === "cancelled" ? "cancelado" : ( vista === "pasados" ? "Realizado" : "confirmado")}</span>
              </div>

              {t.estado === 'confirmed' && vista != "pasados" && (
                <button
                  className="btn btn-danger"
                  style={{ whiteSpace: 'nowrap', padding: '8px 14px', fontSize: 12 }}
                  disabled={cancelando === t.id}
                  onClick={() => handleCancelar(t.id)}
                >
                  {cancelando === t.id
                    ? <span className="spinner" style={{ width: 14, height: 14 }} />
                    : 'Cancelar'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}