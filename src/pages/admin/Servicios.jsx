import { useState, useEffect } from 'react'
import {
  getServiciosAdmin,
  crearServicio,
  editarServicio,
  eliminarServicio,
  subirImagenServicio
} from '../../lib/api'

const EMPTY = {
  nombre: '',
  precio: '',
  duracion_min: '',
  descripcion: '',
  imagen: '',
  activo: true,
}

export default function Servicios() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [subiendoImagen, setSubiendoImagen] = useState(false)

  useEffect(() => {
    getServiciosAdmin()
      .then(setServicios)
      .finally(() => setLoading(false))
  }, [])

  function startEdit(s) {
    setEditId(s.id)
    setForm({
      nombre: s.nombre || '',
      precio: s.precio ?? '',
      duracion_min: s.duracion_min ?? '',
      descripcion: s.descripcion || '',
      imagen: s.imagen || '',
      activo: Boolean(s.activo),
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY)
    setError('')
  }

  async function handleImageFile(file) {
  if (!file) return

  setError('')
  setSubiendoImagen(true)

  try {
    const res = await subirImagenServicio(file)
    setForm(prev => ({ ...prev, imagen: res.imagen }))
  } catch (err) {
    setError(err.message)
  } finally {
    setSubiendoImagen(false)
  }
}

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const data = {
        ...form,
        precio: Number(form.precio),
        duracion_min: Number(form.duracion_min),
      }

      if (editId) {
        await editarServicio(editId, data)
        setServicios(ss => ss.map(s => (
          s.id === editId ? { ...s, ...data } : s
        )))
      } else {
        const res = await crearServicio(data)
        setServicios(ss => [...ss, { id: res.id, ...data }])
      }

      cancelEdit()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Desactivar este servicio?')) return

    await eliminarServicio(id)
    setServicios(ss => ss.map(s => (
      s.id === id ? { ...s, activo: false } : s
    )))
  }

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 32 }}>Servicios</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 32,
          alignItems: 'start',
        }}
      >
        <section>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Servicios actuales</h2>

          {servicios.length === 0 ? (
            <p style={{ color: 'var(--gray-400)' }}>No hay servicios cargados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {servicios.map(s => (
                <div
                  key={s.id}
                  className="card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '110px 1fr auto',
                    gap: 16,
                    alignItems: 'center',
                    padding: 16,
                    opacity: s.activo ? 1 : 0.6,
                  }}
                >
                  <div
                    style={{
                      width: 110,
                      height: 90,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: 'var(--gray-100)',
                      border: '1px solid var(--gray-200)',
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
                          fontSize: 12,
                          textAlign: 'center',
                          padding: 8,
                        }}
                      >
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{s.nombre}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
                      {s.duracion_min} min · {s.descripcion || 'Sin descripción'}
                    </div>
                    <div style={{ fontWeight: 500 }}>${s.precio?.toLocaleString('es-AR')}</div>
                    {!s.activo && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 8,
                          fontSize: 11,
                          background: 'var(--gray-100)',
                          padding: '4px 8px',
                          borderRadius: 999,
                        }}
                      >
                        Inactivo
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => startEdit(s)}>
                      Editar
                    </button>

                    {s.activo && (
                      <button className="btn btn-danger" onClick={() => handleEliminar(s.id)}>
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>
            {editId ? 'Editar servicio' : 'Nuevo servicio'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="label">Nombre</label>
              <input
                className="input"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="label">Precio ($)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.precio}
                  onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Duración (min)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.duracion_min}
                  onChange={e => setForm(f => ({ ...f, duracion_min: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Descripción</label>
              <textarea
                className="input"
                rows="3"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              />
            </div>

            
            <div className="form-group">
              <label className="label">Subir imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleImageFile(e.target.files?.[0])}
              />
              {subiendoImagen && (
  <small>Subiendo imagen...</small>
)}
            </div>

            <div className="form-group">
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                />
                Servicio activo
              </label>
            </div>

            <div
              style={{
                width: '100%',
                aspectRatio: '16 / 10',
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid var(--gray-200)',
                background: 'var(--gray-100)',
              }}
            >
              {form.imagen ? (
                <img
                  src={form.imagen}
                  alt="Preview del servicio"
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
                    fontSize: 14,
                  }}
                >
                  Preview de imagen
                </div>
              )}
            </div>

            {error && (
              <p className="error-msg" style={{ margin: 0 }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear servicio'}
              </button>

              {editId && (
                <button className="btn btn-secondary" type="button" onClick={cancelEdit}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}