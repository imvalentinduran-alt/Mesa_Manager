import { useState, useEffect, useCallback } from 'react'
import { estudiantesService } from '@/features/estudiantes'
import EstudianteForm from './EstudianteForm'
import Modal from '@/shared/components/Modal'

// ── Icons ──────────────────────────────────────────────────────────────────
const PlusIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const PencilIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
const TrashIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
const AlertIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const CheckIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const RetryIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>

// ── Helpers ────────────────────────────────────────────────────────────────
const COL_HEADS = ['Identificación', 'Apellido, Nombre', 'Correo', 'Programa', 'Cohorte', 'Pago', '']

function SkeletonRows() {
  return Array.from({ length: 6 }, (_, i) => (
    <tr key={i} className="border-b border-slate-50">
      {COL_HEADS.map((_, j) => (
        <td key={j} className="px-4 py-4">
          <div className="h-3 bg-slate-100 rounded animate-pulse"
            style={{ width: `${55 + ((i + j) * 13) % 40}%`, animationDelay: `${i * 60 + j * 20}ms` }} />
        </td>
      ))}
    </tr>
  ))
}

// ── Component ──────────────────────────────────────────────────────────────
export default function EstudiantesTab({ session }) {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [loadErr,   setLoadErr]   = useState(null)
  const [modal,     setModal]     = useState(null)  // null | {} (crear) | item (editar)
  const [delTarget, setDelTarget] = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState(null)

  const isJefa = session?.rol === 'Jefa'

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg })
    const id = setTimeout(() => setToast(null), type === 'ok' ? 3000 : 5000)
    return () => clearTimeout(id)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadErr(null)
    try {
      setItems(await estudiantesService.getAll())
    } catch (e) {
      setLoadErr(e.detail ?? e.message ?? 'Error al cargar. Verifica que el backend esté activo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (formData) => {
    setSaving(true)
    try {
      if (modal?.id) {
        await estudiantesService.update(modal.id, formData)
        showToast('ok', '¡Estudiante actualizado exitosamente!')
      } else {
        await estudiantesService.create(formData)
        showToast('ok', '¡Estudiante registrado exitosamente!')
      }
      setModal(null)
      load()
    } catch (e) {
      showToast('err', e.detail ?? 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!delTarget) return
    setSaving(true)
    try {
      await estudiantesService.remove(delTarget.id)
      showToast('ok', 'Estudiante eliminado.')
      setDelTarget(null)
      load()
    } catch (e) {
      showToast('err', e.detail ?? 'No se pudo eliminar.')
      setDelTarget(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-slate-400 tabular-nums">
          {loading ? '…' : `${items.length} registros`}
        </p>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1.5 px-4 py-2 bg-upel-navy text-white text-sm font-medium font-body rounded-lg hover:bg-upel-navy-dark transition-colors"
        >
          <PlusIcon /> Nuevo estudiante
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {COL_HEADS.map(h => (
                  <th key={h} className="px-4 py-3 text-left font-body text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonRows />}

              {!loading && loadErr && (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <AlertIcon />
                    <p className="font-body text-sm max-w-sm">{loadErr}</p>
                    <button onClick={load}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-body border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <RetryIcon /> Reintentar
                    </button>
                  </div>
                </td></tr>
              )}

              {!loading && !loadErr && items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-14 text-center">
                  <p className="font-body text-sm text-slate-400">No hay estudiantes registrados aún.</p>
                </td></tr>
              )}

              {!loading && !loadErr && items.map(item => (
                <tr key={item.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors group">
                  <td className="px-4 py-3.5">
                    {item.tipo_documento === 'Colombiano' ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-body text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">C.C.</span>
                          <span className="font-mono text-xs text-slate-600">{item.cedula}</span>
                        </div>
                        {item.pasaporte && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-body text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">Pas.</span>
                            <span className="font-mono text-xs text-slate-500">{item.pasaporte}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-body text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">V</span>
                        <span className="font-mono text-xs text-slate-600">{item.cedula}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-body font-medium text-slate-800">{item.nombre_completo}</td>
                  <td className="px-4 py-3.5 font-body text-xs text-slate-500 max-w-[200px] truncate" title={item.correo_electronico}>{item.correo_electronico}</td>
                  <td className="px-4 py-3.5 font-body text-slate-500 max-w-[180px] truncate">{item.programa}</td>
                  <td className="px-4 py-3.5 font-body text-slate-500">{item.cohorte}</td>
                  <td className="px-4 py-3.5">
                    <span className={`font-body text-[11px] font-semibold px-2 py-0.5 rounded-full
                      ${item.pago_mesa ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {item.pago_mesa ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 w-16">
                    <div className="flex gap-1 opacity-30 dark:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal(item)} title="Editar"
                        className="p-1.5 rounded text-slate-400 hover:text-upel-navy hover:bg-upel-navy/10 transition-colors">
                        <PencilIcon />
                      </button>
                      {isJefa && (
                        <button onClick={() => setDelTarget(item)} title="Eliminar"
                          className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: crear / editar */}
      <Modal
        open={modal !== null}
        onClose={() => !saving && setModal(null)}
        title={modal?.id ? 'Editar estudiante' : 'Nuevo estudiante'}
        width="max-w-xl"
      >
        <EstudianteForm
          initial={modal}
          onSave={handleSave}
          onCancel={() => setModal(null)}
          saving={saving}
        />
      </Modal>

      {/* Modal: confirmar eliminación */}
      <Modal
        open={!!delTarget}
        onClose={() => !saving && setDelTarget(null)}
        title="Confirmar eliminación"
        width="max-w-sm"
      >
        <div className="space-y-5">
          <p className="font-body text-slate-600 text-sm leading-relaxed">
            ¿Eliminar a{' '}
            <span className="font-semibold text-slate-800">{delTarget?.nombre_completo}</span>?
            {' '}Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDelTarget(null)} disabled={saving}
              className="px-4 py-2 text-sm font-body border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleDelete} disabled={saving}
              className="px-4 py-2 text-sm font-body bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              {saving ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-4 pl-0 pr-6 py-4
            bg-white rounded-2xl border border-slate-100 border-l-4
            shadow-[0_8px_32px_rgba(0,0,0,0.10)]
            ${toast.type === 'ok' ? 'border-l-green-500' : 'border-l-red-500'}`}
          style={{ animation: 'modalIn 200ms ease-out' }}
        >
          <span className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ml-3
            ${toast.type === 'ok' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
            {toast.type === 'ok' ? <CheckIcon /> : <AlertIcon />}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-body text-[13px] font-semibold text-slate-800">
              {toast.type === 'ok' ? 'Operación exitosa' : 'Algo salió mal'}
            </span>
            <span className="font-body text-xs text-slate-500 max-w-[230px] leading-relaxed">
              {toast.msg}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
