import { useState, useEffect } from 'react'
import { getDisponibilidadAdmin, crearRango, crearSlot, toggleSlot } from '../../lib/api'

const DIAS_SEMANA = [
  { label: 'Domingo', value: 0 },
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miércoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sábado', value: 6 },
]

const EMPTY_RANGO = {
  dias_semana: [],
  hora_desde: '09:00',
  hora_hasta: '18:00',
  fecha_desde: '',
  fecha_hasta: '',
  duracion_min: 30,
}

const EMPTY_SLOT = { fecha: '', hora_inicio: '', hora_fin: '' }

export default function Disponibilidad() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('slots')
  const [rango, setRango] = useState(EMPTY_RANGO)
  const [slot, setSlot] = useState(EMPTY_SLOT)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setLoading(true)
    getDisponibilidadAdmin(fecha)
      .then(setSlots)
      .finally(() => setLoading(false))
  }, [fecha])

  async function handleToggle(slotActual) {
    await toggleSlot(slotActual.id, !slotActual.disponible)
    setSlots(actuales => actuales.map(item => (
      item.id === slotActual.id ? { ...item, disponible: !item.disponible } : item
    )))
  }

  async function handleCrearRango(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const res = await crearRango({ ...rango, duracion_min: Number(rango.duracion_min) })
      setMsg(`✓ Rango creado: slots generados`)
      setRango(EMPTY_RANGO)
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleCrearSlot(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      await crearSlot(slot)
      setMsg('✓ Slot creado correctamente')
      setSlot(EMPTY_SLOT)
      if (slot.fecha === fecha) {
        const updated = await getDisponibilidadAdmin(fecha)
        setSlots(updated)
      }
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  function toggleDia(valor) {
    setRango(actual => ({
      ...actual,
      dias_semana: actual.dias_semana.includes(valor)
        ? actual.dias_semana.filter(dia => dia !== valor)
        : [...actual.dias_semana, valor],
    }))
  }

  return (
    <div className="admin-page availability-page">
      <header className="page-header">
        <h1 className="page-title">Disponibilidad</h1>
      </header>

      <div className="tabs-row">
        {[
          { key: 'slots', label: 'Ver slots' },
          { key: 'rango', label: 'Crear rango' },
          { key: 'manual', label: 'Slot manual' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => {
              setTab(item.key)
              setMsg('')
            }}
            className={`tab-button ${tab === item.key ? 'is-active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'slots' && (
        <div>
          <div className="filters-grid filters-grid--single">
            <div className="form-group form-group--inline-date">
              <label className="label">Fecha</label>
              <input type="date" className="input input--auto" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : slots.length === 0 ? (
            <p className="empty-state">No hay slots para esta fecha.</p>
          ) : (
            <div className="slots-admin-grid">
              {slots.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleToggle(item)}
                  className={`availability-slot ${item.disponible ? '' : 'is-disabled'}`}
                >
                  <div className="availability-slot__time">{item.hora_inicio}</div>
                  <div className="availability-slot__status">{item.disponible ? 'Disponible' : 'Ocupado'}</div>
                </button>
              ))}
            </div>
          )}

          <p className="page-note">Hacé click en un slot para habilitarlo o deshabilitarlo.</p>
        </div>
      )}

      {tab === 'rango' && (
        <form onSubmit={handleCrearRango} className="form-stack form-stack--medium">
          <div className="form-group">
            <label className="label">Días de la semana</label>
            <div className="chip-row">
              {DIAS_SEMANA.map(dia => (
                <button
                  key={dia.value}
                  type="button"
                  onClick={() => toggleDia(dia.value)}
                  className={`slot-chip ${rango.dias_semana.includes(dia.value) ? 'is-selected' : ''}`}
                >
                  {dia.label}
                </button>
              ))}
            </div>
          </div>

          <div className="two-column-grid">
            <div className="form-group">
              <label className="label">Hora desde</label>
              <input type="time" className="input" value={rango.hora_desde} onChange={e => setRango(r => ({ ...r, hora_desde: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Hora hasta</label>
              <input type="time" className="input" value={rango.hora_hasta} onChange={e => setRango(r => ({ ...r, hora_hasta: e.target.value }))} required />
            </div>
          </div>

          <div className="two-column-grid">
            <div className="form-group">
              <label className="label">Fecha desde</label>
              <input type="date" className="input" value={rango.fecha_desde} onChange={e => setRango(r => ({ ...r, fecha_desde: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Fecha hasta</label>
              <input type="date" className="input" value={rango.fecha_hasta} onChange={e => setRango(r => ({ ...r, fecha_hasta: e.target.value }))} required />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Duración por slot (minutos)</label>
            <input type="number" className="input" value={rango.duracion_min} onChange={e => setRango(r => ({ ...r, duracion_min: e.target.value }))} min={15} max={180} step={15} required />
          </div>

          {msg && <p className={`feedback-text ${msg.startsWith('✓') ? 'is-success' : 'is-error'}`}>{msg}</p>}

          <button type="submit" className="btn btn-primary" disabled={saving || rango.dias_semana.length === 0}>
            {saving ? <span className="spinner spinner-sm" /> : 'Generar slots'}
          </button>
        </form>
      )}

      {tab === 'manual' && (
        <form onSubmit={handleCrearSlot} className="form-stack form-stack--small">
          <div className="form-group">
            <label className="label">Fecha</label>
            <input type="date" className="input" value={slot.fecha} onChange={e => setSlot(s => ({ ...s, fecha: e.target.value }))} required />
          </div>

          <div className="two-column-grid">
            <div className="form-group">
              <label className="label">Hora inicio</label>
              <input type="time" className="input" value={slot.hora_inicio} onChange={e => setSlot(s => ({ ...s, hora_inicio: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Hora fin</label>
              <input type="time" className="input" value={slot.hora_fin} onChange={e => setSlot(s => ({ ...s, hora_fin: e.target.value }))} required />
            </div>
          </div>

          {msg && <p className={`feedback-text ${msg.startsWith('✓') ? 'is-success' : 'is-error'}`}>{msg}</p>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner spinner-sm" /> : 'Crear slot'}
          </button>
        </form>
      )}
    </div>
  )
}
