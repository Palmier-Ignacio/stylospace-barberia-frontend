import { auth } from './firebase'

const BASE = import.meta.env.VITE_API_URL

async function getToken() {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

async function authHeaders() {
  const token = await getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ── Servicios ──────────────────────────────────────────────
export async function getServicios() {
  const res = await fetch(`${BASE}/servicios`)
  if (!res.ok) throw new Error('Error al obtener servicios')
  return res.json()
}

export async function getServiciosAdmin() {
  const res = await fetch(`${BASE}/servicios/admin`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Error al obtener servicios')
  return res.json()
}

export async function crearServicio(data) {
  const res = await fetch(`${BASE}/servicios`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear servicio')
  return res.json()
}

export async function editarServicio(id, data) {
  const res = await fetch(`${BASE}/servicios/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al editar servicio')
  return res.json()
}

export async function eliminarServicio(id) {
  const res = await fetch(`${BASE}/servicios/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Error al eliminar servicio')
  return res.json()
}

// ── Disponibilidad ─────────────────────────────────────────
export async function getDisponibilidad(fecha) {
  const res = await fetch(`${BASE}/disponibilidad?fecha=${fecha}`)
  if (!res.ok) throw new Error('Error al obtener disponibilidad')
  return res.json()
}

export async function getDisponibilidadResumen(desde, hasta) {
  const res = await fetch(`${BASE}/disponibilidad/resumen?desde=${desde}&hasta=${hasta}`)
  if (!res.ok) throw new Error('Error al obtener disponibilidad resumida')
  return res.json()
}

export async function getDisponibilidadAdmin(fecha) {
  const res = await fetch(`${BASE}/disponibilidad/admin?fecha=${fecha}`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Error al obtener disponibilidad')
  return res.json()
}

export async function crearRango(data) {
  const res = await fetch(`${BASE}/disponibilidad/rango`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear rango')
  return res.json()
}

export async function crearSlot(data) {
  const res = await fetch(`${BASE}/disponibilidad/slot`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear slot')
  return res.json()
}

export async function toggleSlot(id, disponible) {
  const res = await fetch(`${BASE}/disponibilidad/${id}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify({ disponible }),
  })
  if (!res.ok) throw new Error('Error al actualizar slot')
  return res.json()
}

// ── Turnos ─────────────────────────────────────────────────
export async function reservarTurno(data) {
  const res = await fetch(`${BASE}/turnos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Error al reservar turno')
  return json
}

export async function getTurnosAdmin(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}/turnos/admin?${query}`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Error al obtener turnos')
  return res.json()
}

export async function cancelarTurno(id) {
  const res = await fetch(`${BASE}/turnos/${id}/cancelar`, {
    method: 'PATCH',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Error al cancelar turno')
  return res.json()
}


export async function getEstadoCancelacionPublica(id, token) {
  const params = new URLSearchParams({ token })
  const res = await fetch(`${BASE}/turnos/${id}/cancelacion-publica?${params.toString()}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Error al validar la cancelación')
  return json
}

export async function cancelarTurnoPublico(id, token) {
  const res = await fetch(`${BASE}/turnos/${id}/cancelacion-publica`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  const json = await res.json()
  if (!res.ok) {
    const error = new Error(json.error || 'Error al cancelar turno')
    error.code = json.code
    error.contacto = json.contacto
    throw error
  }
  return json
}

export async function subirImagenServicio(file) {
  const token = await getToken()
  const formData = new FormData()
  formData.append('imagen', file)

  const res = await fetch(`${BASE}/uploads/servicio`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Error al subir imagen')
  return json
}