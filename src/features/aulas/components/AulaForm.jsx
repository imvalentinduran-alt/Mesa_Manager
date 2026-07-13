import { useState } from 'react'

const INPUT = [
  'w-full px-4 py-2.5 text-sm font-body text-slate-800 bg-white',
  'border border-slate-200 rounded-lg placeholder:text-slate-300',
  'focus:outline-none focus:ring-2 focus:ring-upel-navy/20 focus:border-upel-navy',
  'disabled:bg-slate-50 disabled:text-slate-400 transition-colors',
].join(' ')

const UBICACIONES = ['Doctorado', 'Docencia', 'Extensión', 'Postgrado']

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-body text-sm font-medium text-slate-600">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
    </div>
  )
}

export default function AulaForm({ initial, onSave, onCancel, saving }) {
  const isEdit = !!initial?.id

  const [form, setForm] = useState(() => ({
    nombre_aula:   initial?.nombre_aula   ?? '',
    ubicacion:     initial?.ubicacion     ?? 'Doctorado',
    tiene_equipos: initial?.tiene_equipos ?? false,
  }))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">

      <Field label="Nombre del aula" required>
        <input type="text" value={form.nombre_aula}
          onChange={e => set('nombre_aula', e.target.value)}
          placeholder="Ej. Aula 201" required className={INPUT} />
      </Field>

      <Field label="Ubicación" required>
        <select value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)}
          className={INPUT + ' cursor-pointer'}>
          {UBICACIONES.map(u => <option key={u}>{u}</option>)}
        </select>
      </Field>

      <label className="flex items-center gap-3 cursor-pointer py-1">
        <input
          type="checkbox"
          checked={form.tiene_equipos}
          onChange={e => set('tiene_equipos', e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 accent-upel-navy"
        />
        <span className="font-body text-sm text-slate-700">
          El aula tiene equipos audiovisuales
        </span>
      </label>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" onClick={onCancel} disabled={saving}
          className="px-5 py-2 text-sm font-medium font-body rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={saving}
          className="px-5 py-2 bg-upel-navy text-white text-sm font-medium font-body rounded-lg hover:bg-upel-navy-dark disabled:opacity-50 transition-colors">
          {saving ? 'Guardando…' : (isEdit ? 'Actualizar' : 'Registrar')}
        </button>
      </div>
    </form>
  )
}
