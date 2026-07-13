import { apiFetch } from '@/shared/lib/api'

export const portalesService = {
  getEstudiante: (cedula) => apiFetch(`/api/mesas/portal/estudiante/${cedula}`),
  getProfesor:   (cedula) => apiFetch(`/api/mesas/portal/profesor/${cedula}`),
}
