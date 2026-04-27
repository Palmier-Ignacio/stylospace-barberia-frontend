import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getIngresosAdmin, getTurnosAdmin } from '../../lib/api'
import {
  addDaysArgentina,
  construirFechaHoraArgentina,
  formatDateArgentina,
  getNowArgentina,
  parseDateOnlyArgentina,
  startOfTodayArgentina,
  toDateOnlyArgentina,
} from '../../lib/argentinaDate'

function toDateOnly(date) {
  return toDateOnlyArgentina(date)
}

function formatFecha(fecha) {
  return formatDateArgentina(fecha, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
}

function formatFechaCompleta(fecha) {
  if (!fecha) return '—'
  return formatDateArgentina(fecha, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatMoney(value = 0) {
  return `$${Number(value || 0).toLocaleString('es-AR')}`
}

function formatPeriodo(periodo) {
  const [year, month] = periodo.split('-').map(Number)
  const fechaPeriodo = year + '-' + String(month).padStart(2, '0') + '-01'
  return parseDateOnlyArgentina(fechaPeriodo).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  })
}

function rangoTexto(rango) {
  if (!rango) return ''
  return `${formatFechaCompleta(rango.desde)} al ${formatFechaCompleta(rango.hasta)}`
}

export default function Dashboard() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [ingresos, setIngresos] = useState(null)
  const [filtrosHistorico, setFiltrosHistorico] = useState({ fecha: '', desde: '', hasta: '' })
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [errorHistorico, setErrorHistorico] = useState('')

  useEffect(() => {
    Promise.all([getTurnosAdmin(), getIngresosAdmin()])
      .then(([turnosData, ingresosData]) => {
        setTurnos(turnosData)
        setIngresos(ingresosData)
      })
      .finally(() => setLoading(false))
  }, [])

  async function aplicarFiltroHistorico(e) {
    e.preventDefault()
    setErrorHistorico('')
    setLoadingHistorico(true)
    try {
      const params = {}
      if (filtrosHistorico.fecha) params.fecha = filtrosHistorico.fecha
      if (!filtrosHistorico.fecha && filtrosHistorico.desde) params.desde = filtrosHistorico.desde
      if (!filtrosHistorico.fecha && filtrosHistorico.hasta) params.hasta = filtrosHistorico.hasta
      const data = await getIngresosAdmin(params)
      setIngresos(data)
    } catch (err) {
      setErrorHistorico(err.message || 'No se pudo filtrar el histórico')
    } finally {
      setLoadingHistorico(false)
    }
  }

  async function limpiarFiltroHistorico() {
    setFiltrosHistorico({ fecha: '', desde: '', hasta: '' })
    setErrorHistorico('')
    setLoadingHistorico(true)
    try {
      const data = await getIngresosAdmin()
      setIngresos(data)
    } catch (err) {
      setErrorHistorico(err.message || 'No se pudo cargar el histórico')
    } finally {
      setLoadingHistorico(false)
    }
  }

  const { turnosHoy, turnosManana, proximosTurnos, proximoTurno } = useMemo(() => {
    const hoyDate = startOfTodayArgentina()

    const mananaDate = addDaysArgentina(hoyDate, 1)

    const hoy = toDateOnly(hoyDate)
    const manana = toDateOnly(mananaDate)

    const confirmados = turnos
      .filter(t => t.estado === 'confirmed')
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))

    const turnosHoy = confirmados.filter(t => t.fecha === hoy)
    const turnosManana = confirmados.filter(t => t.fecha === manana)

    const ahora = getNowArgentina()
    const proximosTurnos = confirmados.filter(t => construirFechaHoraArgentina(t.fecha, t.hora) >= ahora)

    return {
      turnosHoy,
      turnosManana,
      proximosTurnos: proximosTurnos.slice(0, 10),
      proximoTurno: proximosTurnos[0] || null,
    }
  }, [turnos])

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>
  }

  const historicoFiltrado = ingresos?.historico_filtrado

  return (
    <div className="admin-page dashboard-page">
      <header className="page-header">
        <h1 className="page-title">Panel de administración</h1>
        <p className="page-subtitle">Bienvenido a Stylo Space</p>
      </header>

      <div className="stats-grid stats-grid--dashboard">
        <StatCard label="Turnos hoy" value={turnosHoy.length} link="/admin/turnos?vista=hoy" />
        <StatCard label="Turnos mañana" value={turnosManana.length} link="/admin/turnos?vista=manana" />
        <StatCard
          label="Mes actual acumulado"
          value={formatMoney(ingresos?.mes?.acumulado?.ingresos)}
          subvalue={`${ingresos?.mes?.acumulado?.turnos || 0} turnos · ${rangoTexto(ingresos?.mes?.acumulado)}`}
          link="/admin/turnos?vista=proximos"
        />
        <StatCard
          label="Mes actual estimado"
          value={formatMoney(ingresos?.mes?.estimado?.ingresos)}
          subvalue={`${ingresos?.mes?.estimado?.turnos || 0} turnos · ${rangoTexto(ingresos?.mes?.estimado)}`}
          link="/admin/turnos?vista=proximos"
        />
        <StatCard
          label="Semana acumulada"
          value={formatMoney(ingresos?.semana?.acumulado?.ingresos)}
          subvalue={`${ingresos?.semana?.acumulado?.turnos || 0} turnos · ${rangoTexto(ingresos?.semana?.acumulado)}`}
          link="/admin/turnos?vista=semana"
        />
        <StatCard
          label="Semana estimada"
          value={formatMoney(ingresos?.semana?.estimado?.ingresos)}
          subvalue={`${ingresos?.semana?.estimado?.turnos || 0} turnos · ${rangoTexto(ingresos?.semana?.estimado)}`}
          link="/admin/turnos?vista=semana"
        />
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
          <div>
            <h2 className="section-title section-title--sm">Ingresos históricos</h2>
            <p className="section-subtitle">Histórico real: solo turnos no cancelados hasta hoy.</p>
          </div>
          <span className="section-link">{formatMoney(ingresos?.total_historico?.ingresos)} total</span>
        </div>

        <form className="card income-filters" onSubmit={aplicarFiltroHistorico}>
          <div className="form-group">
            <label className="label">Filtrar por día</label>
            <input
              className="input"
              type="date"
              value={filtrosHistorico.fecha}
              onChange={(e) => setFiltrosHistorico(prev => ({ ...prev, fecha: e.target.value, desde: '', hasta: '' }))}
            />
          </div>
          <div className="form-group">
            <label className="label">Desde</label>
            <input
              className="input"
              type="date"
              value={filtrosHistorico.desde}
              disabled={Boolean(filtrosHistorico.fecha)}
              onChange={(e) => setFiltrosHistorico(prev => ({ ...prev, desde: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="label">Hasta</label>
            <input
              className="input"
              type="date"
              value={filtrosHistorico.hasta}
              disabled={Boolean(filtrosHistorico.fecha)}
              onChange={(e) => setFiltrosHistorico(prev => ({ ...prev, hasta: e.target.value }))}
            />
          </div>
          <div className="income-filters__actions">
            <button className="btn btn-primary" type="submit" disabled={loadingHistorico}>{loadingHistorico ? 'Filtrando...' : 'Filtrar'}</button>
            <button className="btn btn-secondary" type="button" onClick={limpiarFiltroHistorico} disabled={loadingHistorico}>Limpiar</button>
          </div>
        </form>
        {errorHistorico && <p className="feedback-text is-error">{errorHistorico}</p>}

        {(historicoFiltrado?.desde || historicoFiltrado?.hasta) && (
          <div className="card income-filter-result">
            <div>
              <div className="income-history__period">Resultado filtrado</div>
              <div className="income-history__meta">{rangoTexto(historicoFiltrado)} · {historicoFiltrado.turnos} turnos</div>
            </div>
            <div className="income-history__amount">{formatMoney(historicoFiltrado.ingresos)}</div>
          </div>
        )}

        {!ingresos?.historico?.length ? (
          <p className="empty-state empty-state--left">Todavía no hay ingresos registrados.</p>
        ) : (
          <div className="income-history card">
            {ingresos.historico.map(item => (
              <div key={item.periodo} className="income-history__row">
                <div>
                  <div className="income-history__period">{formatPeriodo(item.periodo)}</div>
                  <div className="income-history__meta">{item.turnos} turnos computados</div>
                </div>
                <div className="income-history__amount">{formatMoney(item.ingresos)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

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
