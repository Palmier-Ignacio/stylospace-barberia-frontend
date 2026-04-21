import { useState, useEffect, useRef } from 'react'
import {
  getServiciosAdmin,
  crearServicio,
  editarServicio,
  eliminarServicio,
  subirImagenServicio,
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

  const formRef = useRef(null)

  useEffect(() => {
    getServiciosAdmin()
      .then(setServicios)
      .finally(() => setLoading(false))
  }, [])

  function startEdit(servicio) {
    setEditId(servicio.id)
    setForm({
      nombre: servicio.nombre || '',
      precio: servicio.precio ?? '',
      duracion_min: servicio.duracion_min ?? '',
      descripcion: servicio.descripcion || '',
      imagen: servicio.imagen || '',
      activo: Boolean(servicio.activo),
    })
    setError('')

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
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
        setServicios(actuales =>
          actuales.map(servicio =>
            servicio.id === editId ? { ...servicio, ...data } : servicio
          )
        )
      } else {
        const res = await crearServicio(data)
        setServicios(actuales => [...actuales, { id: res.id, ...data }])
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
    setServicios(actuales =>
      actuales.map(servicio =>
        servicio.id === id ? { ...servicio, activo: false } : servicio
      )
    )
  }

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>
  }

  return (
    <div className="admin-page services-page">
      <header className="page-header">
        <h1 className="page-title">Servicios</h1>
      </header>

      <div className="services-layout">
        <section>
          <h2 className="section-title section-title--sm">Servicios actuales</h2>

          {servicios.length === 0 ? (
            <p className="empty-state empty-state--left">No hay servicios cargados.</p>
          ) : (
            <div className="service-admin-list">
              {servicios.map(servicio => (
                <div
                  key={servicio.id}
                  className={`card service-admin-card ${!servicio.activo ? 'is-inactive' : ''}`}
                >
                  <div className="service-admin-card__media">
                    {servicio.imagen ? (
                      <img src={servicio.imagen} alt={servicio.nombre} className="service-admin-card__image" />
                    ) : (
                      <div className="service-admin-card__placeholder">Sin imagen</div>
                    )}
                  </div>

                  <div className="service-admin-card__info">
                    <div className="service-admin-card__title">{servicio.nombre}</div>
                    <div className="service-admin-card__meta">
                      {servicio.duracion_min} min · {servicio.descripcion || 'Sin descripción'}
                    </div>
                    <div className="service-admin-card__price">${servicio.precio?.toLocaleString('es-AR')}</div>
                    {!servicio.activo && <span className="pill-muted">Inactivo</span>}
                  </div>

                  <div className="service-admin-card__actions">
                    <button className="btn btn-secondary" onClick={() => startEdit(servicio)}>
                      Editar
                    </button>

                    {servicio.activo && (
                      <button className="btn btn-danger" onClick={() => handleEliminar(servicio.id)}>
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          ref={formRef}
          className="card service-form-card"
          id="form-servicios"
        >
          <h2 className="section-title section-title--sm">
            {editId ? 'Editar servicio' : 'Nuevo servicio'}
          </h2>

          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label className="label">Nombre</label>
              <input
                className="input"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                required
              />
            </div>

            <div className="two-column-grid">
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
                className="input textarea-input"
                rows="3"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="label">Subir imagen</label>
              <input type="file" accept="image/*" onChange={e => handleImageFile(e.target.files?.[0])} />
              {subiendoImagen && <small className="helper-text">Subiendo imagen...</small>}
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
              />
              <span>Servicio activo</span>
            </label>

            <div className="image-preview-box">
              {form.imagen ? (
                <img src={form.imagen} alt="Preview del servicio" className="image-preview-box__image" />
              ) : (
                <div className="image-preview-box__placeholder">Vista previa de la imagen</div>
              )}
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div className="action-row action-row--wrap">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner spinner-sm" /> : editId ? 'Guardar cambios' : 'Crear servicio'}
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