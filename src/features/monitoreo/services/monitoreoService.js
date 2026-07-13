import { apiFetch } from '@/shared/lib/api'

const toISO = (date) => date.toISOString().slice(0, 10)
const primerDia = (year, month) => toISO(new Date(year, month - 1, 1))
const ultimoDia = (year, month)  => toISO(new Date(year, month, 0))

export const monitoreoService = {
  getMesasMes: (year, month) =>
    apiFetch(`/api/mesas?fecha_desde=${primerDia(year, month)}&fecha_hasta=${ultimoDia(year, month)}`),

  getMesasDia: (fechaISO) =>
    apiFetch(`/api/mesas?estado=Programada&fecha_desde=${fechaISO}&fecha_hasta=${fechaISO}`),

  getMonitoreo: () => apiFetch('/api/mesas/monitoreo'),
}
