import { useState } from 'react'

const INPUT = [
  'w-full px-4 py-2.5 text-sm font-body',
  'text-slate-800 dark:text-slate-100',
  'bg-white dark:bg-slate-800',
  'border border-slate-200 dark:border-slate-600',
  'rounded-lg placeholder:text-slate-300 dark:placeholder:text-slate-500',
  'focus:outline-none focus:ring-2 focus:ring-upel-navy/20 dark:focus:ring-upel-navy/30 focus:border-upel-navy',
  'disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-500',
  'transition-colors',
].join(' ')

const INPUT_ERR = [
  'w-full px-4 py-2.5 text-sm font-body',
  'text-slate-800 dark:text-slate-100',
  'bg-white dark:bg-slate-800',
  'border border-red-300 dark:border-red-500',
  'rounded-lg placeholder:text-slate-300 dark:placeholder:text-slate-500',
  'focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/30 focus:border-red-400',
  'disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-500',
  'transition-colors',
].join(' ')

const PROGRAMAS = [
  'Innovación Educativa',
  'Gerencia Educacional',
  'Planificación Global',
  'Educación, Ambiente y Desarrollo',
  'Enseñanza de la Educación Física',
  'Recreación',
  'Informática Educativa',
  'Orientación Educativa',
]

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-body text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 font-body">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

export default function ProfesorForm({ initial, onSave, onCancel, saving }) {
  const isEdit = !!initial?.id

  const [form, setForm] = useState(() => ({
    cedula:             initial?.cedula             ?? '',
    nombre:             initial?.nombre             ?? '',
    apellido:           initial?.apellido           ?? '',
    especialidad:       initial?.especialidad       ?? '',
    correo_electronico: initial?.correo_electronico ?? '',
  }))

  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function validate() {
    const e = {}
    if (!form.cedula.trim())       e.cedula       = 'La cédula es obligatoria.'
    if (!form.nombre.trim())       e.nombre       = 'El nombre es obligatorio.'
    if (!form.apellido.trim())     e.apellido     = 'El apellido es obligatorio.'
    if (!form.especialidad)        e.especialidad = 'Selecciona una especialidad.'
    if (!form.correo_electronico.trim()) {
      e.correo_electronico = 'El correo electrónico es obligatorio.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_electronico.trim())) {
      e.correo_electronico = 'Ingresa un correo electrónico válido.'
    }
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
  }

  const inp = k => errors[k] ? INPUT_ERR : INPUT

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cédula" required error={errors.cedula}>
          <input
            type="text" inputMode="numeric"
            value={form.cedula}
            onChange={e => set('cedula', e.target.value.replace(/\D/g, ''))}
            placeholder="Ej. 12345678"
            disabled={isEdit}
            title={isEdit ? 'La cédula no se puede modificar' : undefined}
            className={inp('cedula') + (isEdit ? ' cursor-not-allowed' : '')}
          />
        </Field>
        <Field label="Especialidad" required error={errors.especialidad}>
          <select
            value={form.especialidad}
            onChange={e => set('especialidad', e.target.value)}
            className={inp('especialidad') + ' cursor-pointer'}>
            <option value="" disabled>Seleccione un programa...</option>
            {PROGRAMAS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre(s)" required error={errors.nombre}>
          <input type="text" value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
            placeholder="Ej. Carlos"
            className={inp('nombre')} />
        </Field>
        <Field label="Apellido(s)" required error={errors.apellido}>
          <input type="text" value={form.apellido}
            onChange={e => set('apellido', e.target.value)}
            placeholder="Ej. Ramírez"
            className={inp('apellido')} />
        </Field>
      </div>

      <Field label="Correo Electrónico" required error={errors.correo_electronico}>
        <input
          type="email"
          value={form.correo_electronico}
          onChange={e => set('correo_electronico', e.target.value)}
          placeholder="Ej. c.mendoza@upel.edu.ve"
          className={inp('correo_electronico')}
        />
      </Field>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <button type="button" onClick={onCancel} disabled={saving}
          className="px-5 py-2 text-sm font-medium font-body rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors">
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
