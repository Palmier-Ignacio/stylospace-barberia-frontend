import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  cancelarTurno,
  editarTurno,
  getDisponibilidadAdmin,
  getServiciosAdmin,
  getTurnosAdmin,
} from '../../lib/api'
import {
  addDaysArgentina,
  construirFechaHoraArgentina,
  formatDateArgentina,
  getNowArgentina,
  startOfTodayArgentina,
  toDateOnlyArgentina,
} from '../../lib/argentinaDate'

function toDateOnly(date) {
  return toDateOnlyArgentina(date)
}

function formatFecha(fecha) {
  return formatDateArgentina(fecha, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  })
}

const formInicial = {
  nombre_cliente: '',
  email: '',
  contacto: '',
  servicio_id: '',
  disponibilidad_id: '',
  fecha: '',
  precio: '',
  cancelado_por: '',
}

export default function Turnos() {
  const [turnos, setTurnos] = useState([])
  const [servicios, setServicios] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [cancelando, setCancelando] = useState(null)
  const [turnoEditando, setTurnoEditando] = useState(null)
  const [form, setForm] = useState(formInicial)
  const [searchParams, setSearchParams] = useSearchParams()

  const vistaInicial = searchParams.get('vista') || 'hoy'
  const fechaInicial = searchParams.get('fecha') || toDateOnly(startOfTodayArgentina())
  const estadoInicial = searchParams.get('estado') || 'todos'

  const [vista, setVista] = useState(vistaInicial)
  const [fecha, setFecha] = useState(fechaInicial)
  const [estadoFiltro, setEstadoFiltro] = useState(estadoInicial)

  useEffect(() => {
    setLoading(true)
    Promise.all([getTurnosAdmin(), getServiciosAdmin()])
      .then(([turnosData, serviciosData]) => {
        setTurnos(turnosData)
        setServicios(serviciosData)
      })
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

  useEffect(() => {
    if (!turnoEditando || !form.fecha) return
    getDisponibilidadAdmin(form.fecha)
      .then(data => {
        const slotsConActual = data.map(slot => (
          slot.id === turnoEditando.disponibilidad_id ? { ...slot, disponible: true, esActual: true } : slot
        ))
        setSlots(slotsConActual)
      })
      .catch(() => setSlots([]))
  }, [form.fecha, turnoEditando])

  function abrirEdicion(turno) {
    setTurnoEditando(turno)
    setForm({
      nombre_cliente: turno.nombre_cliente || '',
      email: turno.email || '',
      contacto: turno.contacto || '',
      servicio_id: turno.servicio_id || '',
      disponibilidad_id: turno.disponibilidad_id || '',
      fecha: turno.fecha || '',
      precio: turno.precio ?? '',
    })
  }

  function cerrarEdicion() {
    setTurnoEditando(null)
    setForm(formInicial)
    setSlots([])
  }

  function handleChange(e) {
    const { name, value } = e.target

    if (name === 'servicio_id') {
      const servicio = servicios.find(s => s.id === value)
      setForm(actual => ({
        ...actual,
        servicio_id: value,
        precio: servicio ? servicio.precio : actual.precio,
      }))
      return
    }

    if (name === 'fecha') {
      setForm(actual => ({ ...actual, fecha: value, disponibilidad_id: '' }))
      return
    }

    setForm(actual => ({ ...actual, [name]: value }))
  }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!turnoEditando) return

    setGuardando(true)
    try {
      await editarTurno(turnoEditando.id, {
        nombre_cliente: form.nombre_cliente,
        email: form.email,
        contacto: form.contacto,
        servicio_id: form.servicio_id,
        disponibilidad_id: form.disponibilidad_id,
        precio: form.precio,
      })

      const servicio = servicios.find(s => s.id === form.servicio_id)
      const slot = slots.find(s => s.id === form.disponibilidad_id)

      setTurnos(actuales => actuales.map(turno => (
        turno.id === turnoEditando.id
          ? {
            ...turno,
            nombre_cliente: form.nombre_cliente,
            email: form.email,
            contacto: form.contacto,
            servicio_id: form.servicio_id,
            servicio_nombre: servicio?.nombre || turno.servicio_nombre,
            disponibilidad_id: form.disponibilidad_id,
            fecha: slot?.fecha || form.fecha,
            hora: slot?.hora_inicio || turno.hora,
            precio: Number(form.precio),
          }
          : turno
      )))

      cerrarEdicion()
    } catch (err) {
      alert(`Error al editar: ${err.message}`)
    } finally {
      setGuardando(false)
    }
  }

  async function handleCancelar(turno) {
    const turnoYaPaso = construirFechaHoraArgentina(turno.fecha, turno.hora) < getNowArgentina()
    const mensaje = turnoYaPaso
      ? '¿Cancelar este turno? No se notificará al cliente porque ya pasó.'
      : '¿Cancelar este turno? Se va a notificar al cliente.'

    if (!confirm(mensaje)) return

    setCancelando(turno.id)
    try {
      await cancelarTurno(turno.id)
      setTurnos(actuales => actuales.map(item => (
        item.id === turno.id ? { ...item, estado: 'cancelled', cancelado_por: 'admin' } : item
      )))
    } catch (err) {
      alert(`Error al cancelar: ${err.message}`)
    } finally {
      setCancelando(null)
    }
  }

  const turnosFiltrados = useMemo(() => {
    const hoyDate = startOfTodayArgentina()

    const mananaDate = addDaysArgentina(hoyDate, 1)

    const finSemanaDate = addDaysArgentina(hoyDate, 7)

    let filtrados = [...turnos]

    if (vista === 'hoy') {
      filtrados = filtrados.filter(t => t.fecha === toDateOnly(hoyDate))
    } else if (vista === 'manana') {
      filtrados = filtrados.filter(t => t.fecha === toDateOnly(mananaDate))
    } else if (vista === 'semana') {
      filtrados = filtrados.filter(t => {
        const fechaTurno = construirFechaHoraArgentina(t.fecha, '00:00')
        return fechaTurno >= hoyDate && fechaTurno <= finSemanaDate
      })
    } else if (vista === 'proximos') {
      const ahora = getNowArgentina()
      filtrados = filtrados.filter(t => construirFechaHoraArgentina(t.fecha, t.hora) >= ahora)
    } else if (vista === 'pasados') {
      const ahora = getNowArgentina()
      filtrados = filtrados.filter(t => construirFechaHoraArgentina(t.fecha, t.hora) < ahora)
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
                  {turno.estado === 'cancelled' ? (`cancelado por ${turno.cancelado_por}`) : vista === 'pasados' ? 'Realizado' : 'confirmado'}
                </span>
              </div>

              {turno.estado === 'confirmed' && (
                <div className="booking-admin-card__actions">
                  <button
                    className="btn btn-secondary booking-admin-card__action"
                    onClick={() => abrirEdicion(turno)}
                    type="button"
                  >
                    Editar
                  </button>

                  <button
                    className="btn btn-danger booking-admin-card__action"
                    disabled={cancelando === turno.id}
                    onClick={() => handleCancelar(turno)}
                    type="button"
                  >
                    {cancelando === turno.id ? <span className="spinner spinner-sm" /> : 'Cancelar'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {turnoEditando && (
        <div className="modal-backdrop" role="presentation" onClick={cerrarEdicion}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="section-title section-title--sm">Editar turno</h2>
                <p className="page-note">Podés reprogramar horario, cambiar servicio, datos del cliente o precio.</p>
              </div>
              <button className="btn btn-secondary" onClick={cerrarEdicion} type="button">Cerrar</button>
            </div>

            <form className="admin-form" onSubmit={handleGuardar}>
              <div className="form-grid form-grid--two">
                <div className="form-group">
                  <label className="label">Cliente</label>
                  <input className="input" name="nombre_cliente" value={form.nombre_cliente} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="label">Contacto</label>
                  <input className="input" name="contacto" value={form.contacto} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="label">Email</label>
                  <input className="input" type="email" name="email" value={form.email} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="label">Servicio</label>
                  <select className="input" name="servicio_id" value={form.servicio_id} onChange={handleChange} required>
                    <option value="">Seleccionar servicio</option>
                    {servicios.map(servicio => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre} · ${servicio.precio?.toLocaleString('es-AR')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Fecha</label>
                  <input className="input" type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="label">Horario</label>
                  <select className="input" name="disponibilidad_id" value={form.disponibilidad_id} onChange={handleChange} required>
                    <option value="">Seleccionar horario</option>
                    {slots
                      .filter(slot => slot.disponible || slot.id === turnoEditando.disponibilidad_id)
                      .map(slot => (
                        <option key={slot.id} value={slot.id}>
                          {slot.hora_inicio}{slot.id === turnoEditando.disponibilidad_id ? ' · horario actual' : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Precio cobrado</label>
                  <input className="input" type="number" min="0" name="precio" value={form.precio} onChange={handleChange} required />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={cerrarEdicion} type="button">Cancelar</button>
                <button className="btn btn-primary" disabled={guardando} type="submit">
                  {guardando ? <span className="spinner spinner-sm" /> : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
