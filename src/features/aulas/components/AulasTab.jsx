import { useState, useEffect, useCallback } from 'react'
import { aulasService } from '@/features/aulas'
import AulaForm from './AulaForm'
import Modal from '@/shared/components/Modal'

const PlusIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const PencilIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
const TrashIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
const AlertIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const CheckIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const RetryIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>

const COL_HEADS = ['Nombre del aula', 'Ubicación', 'Equipos', '']

function SkeletonRows() {
  return Array.from({ length: 4 }, (_, i) => (
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

export default function AulasTab({ session }) {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [loadErr,   setLoadErr]   = useState(null)
  const [modal,     setModal]     = useState(null)
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
    setLoading(true); setLoadErr(null)
    try {
      setItems(await aulasService.getAll())
    } catch (e) {
      setLoadErr(e.detail ?? e.message ?? 'Error al cargar.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (formData) => {
    setSaving(true)
    try {
      if (modal?.id) {
        await aulasService.update(modal.id, formData)
        showToast('ok', 'Aula actualizada.')
      } else {
        await aulasService.create(formData)
        showToast('ok', 'Aula registrada.')
      }
      setModal(null); load()
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
      await aulasService.remove(delTarget.id)
      showToast('ok', 'Aula eliminada.')
      setDelTarget(null); load()
    } catch (e) {
      showToast('err', e.detail ?? 'No se pudo eliminar.')
      setDelTarget(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">

      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-slate-400 tabular-nums">
          {loading ? '…' : `${items.length} registros`}
        </p>
        <button onClick={() => setModal({})}
          className="flex items-center gap-1.5 px-4 py-2 bg-upel-navy text-white text-sm font-medium font-body rounded-lg hover:bg-upel-navy-dark transition-colors">
          <PlusIcon /> Nueva aula
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {COL_HEADS.map(h => (
                <th key={h} className="px-4 py-3 text-left font-body text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows />}

            {!loading && loadErr && (
              <tr><td colSpan={4} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <AlertIcon />
                  <p className="font-body text-sm">{loadErr}</p>
                  <button onClick={load}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-body border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <RetryIcon /> Reintentar
                  </button>
                </div>
              </td></tr>
            )}

            {!loading && !loadErr && items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-14 text-center">
                <p className="font-body text-sm text-slate-400">No hay aulas registradas aún.</p>
              </td></tr>
            )}

            {!loading && !loadErr && items.map(item => (
              <tr key={item.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors group">
                <td className="px-4 py-3.5 font-body font-medium text-slate-800">{item.nombre_aula}</td>
                <td className="px-4 py-3.5">
                  <span className="font-body text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                    {item.ubicacion}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`font-body text-[11px] font-semibold px-2 py-0.5 rounded-full
                    ${item.tiene_equipos ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    {item.tiene_equipos ? 'Sí' : 'No'}
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

      <Modal open={modal !== null} onClose={() => !saving && setModal(null)}
        title={modal?.id ? 'Editar aula' : 'Nueva aula'} width="max-w-md">
        <AulaForm initial={modal} onSave={handleSave}
          onCancel={() => setModal(null)} saving={saving} />
      </Modal>

      <Modal open={!!delTarget} onClose={() => !saving && setDelTarget(null)}
        title="Confirmar eliminación" width="max-w-sm">
        <div className="space-y-5">
          <p className="font-body text-slate-600 text-sm leading-relaxed">
            ¿Eliminar el aula{' '}
            <span className="font-semibold text-slate-800">{delTarget?.nombre_aula}</span>?
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

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl font-body text-sm font-medium
          ${toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
          style={{ animation: 'modalIn 200ms ease-out' }}>
          {toast.type === 'ok' ? <CheckIcon /> : <AlertIcon />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
