import { invoke } from '@tauri-apps/api/core'
import { apiFetch } from '@/shared/lib/api'
import { getToken } from '@/shared/lib/session'

export const dashboardService = {
  async getKPIs() {
    return apiFetch('/api/dashboard/kpis')
  },

  /** Retorna { "YYYY-MM-DD": count } para el heatmap. */
  async getActividad() {
    const dias = await apiFetch('/api/dashboard/actividad')
    const porFecha = {}
    for (const { fecha, count } of dias ?? []) {
      porFecha[fecha] = count
    }
    return porFecha
  },

  async getProximas() {
    return apiFetch('/api/dashboard/proximas')
  },

  async getRecientes() {
    return apiFetch('/api/dashboard/recientes')
  },

  async getPendientesCierre() {
    return apiFetch('/api/dashboard/pendientes-cierre')
  },

  /** Abre el diálogo nativo de guardado y escribe el PDF en la ruta elegida. */
  async descargarReporte() {
    const token = getToken()
    return invoke('descargar_pdf_reporte', { token: token ?? null })
  },
}
