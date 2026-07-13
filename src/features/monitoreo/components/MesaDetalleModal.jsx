import { useState } from 'react'
import Modal from '@/shared/components/Modal'
import { mesasService } from '@/features/mesas/services/mesasService'

const TIPO_LABEL = { 1: 'Tipo I — 40 min', 2: 'Tipo II — 40 min', 3: 'Tipo III Doctoral — 60 min' }

const VEREDICTO_INFO = {
  Aprobado:         { text: 'Aprobado',                  cls: 'text-green-700 bg-green-50 border-green-200' },
  Con_Correcciones: { text: 'Aprobado con correcciones', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  Reprobado:        { text: 'Reprobado',                 cls: 'text-red-700 bg-red-50 border-red-100'       },
}

export default function MesaDetalleModal({ mesa, onClose, session, onValidarCorrecciones }) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  if (!mesa) return null

  // Normaliza field names: daily-agenda mesas usan nombre_estudiante/tutor_principal/etc.
  // mientras que el panel Kanban usa estudiante/tutor/jurado1/jurado2.
  const codigo     = mesa.codigo            ?? `Mesa #${mesa.id}`
  const estudiante = mesa.estudiante        ?? mesa.nombre_estudiante ?? '—'
  const titulo     = mesa.titulo            ?? mesa.titulo_proyecto   ?? ''
  const tutor      = mesa.tutor             ?? mesa.tutor_principal   ?? '—'
  const jurado1    = mesa.jurado1           ?? mesa.jurado1_principal ?? '—'
  const jurado2    = mesa.jurado2           ?? mesa.jurado2_principal ?? '—'
  const ubicacion  = mesa.ubicacion         ?? ''

  const handleValidar = async () => {
    setSaving(true)
    setError(null)
    try {
      await mesasService.validarCorrecciones(mesa.id)
      onValidarCorrecciones?.(mesa.id)
      onClose()
    } catch (e) {
      setError(e.detail ?? 'No se pudo validar las correcciones.')
    } finally {
      setSaving(false)
    }
  }

  const veredictoInfo = VEREDICTO_INFO[mesa.veredicto]

  return (
    <Modal open={!!mesa} onClose={onClose} title={`${codigo} — Detalle`} width="max-w-md">
      <div className="flex flex-col gap-5">

        {/* Info principal */}
        <div className="rounded-xl border border-border bg-secondary/40 p-4 flex flex-col gap-2">
          <p className="text-base font-semibold text-foreground leading-snug">{estudiante}</p>
          {titulo && (
            <p className="text-xs text-muted-foreground leading-relaxed">{titulo}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span><span className="font-medium text-foreground">Aula:</span> {mesa.aula}{ubicacion ? ` — ${ubicacion}` : ''}</span>
            <span><span className="font-medium text-foreground">Hora:</span> {mesa.hora_inicio}–{mesa.hora_fin}</span>
            <span><span className="font-medium text-foreground">Tipo:</span> {TIPO_LABEL[mesa.tipo_mesa] ?? `Tipo ${mesa.tipo_mesa}`}</span>
          </div>
          <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
            <span><span className="font-medium text-foreground">Tutor:</span> {tutor}</span>
            <span><span className="font-medium text-foreground">Jurado 1:</span> {jurado1}</span>
            <span><span className="font-medium text-foreground">Jurado 2:</span> {jurado2}</span>
          </div>
        </div>

        {/* Veredicto */}
        {veredictoInfo && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${veredictoInfo.cls}`}>
            {veredictoInfo.text}
            {mesa.fecha_limite_correccion && (
              <span className="ml-auto text-xs font-normal">Límite: {mesa.fecha_limite_correccion}</span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-1 border-t border-border">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
            Cerrar
          </button>
          {mesa.estado === 'Con_Correcciones' && (
            <button onClick={handleValidar} disabled={saving}
              className="px-4 py-2 text-sm rounded-xl text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 transition-colors">
              {saving ? 'Validando…' : 'Validar correcciones'}
            </button>
          )}
        </div>

      </div>
    </Modal>
  )
}
