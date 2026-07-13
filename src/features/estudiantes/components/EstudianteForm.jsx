import { useState } from 'react'

const INPUT = [
  'w-full px-4 py-2.5 text-sm font-body',
  'text-slate-800 dark:text-slate-100',
  'bg-white dark:bg-slate-800/50',
  'border border-slate-200 dark:border-slate-700 rounded-lg',
  'placeholder:text-slate-300 dark:placeholder:text-slate-500',
  'focus:outline-none focus:ring-2 focus:ring-upel-navy/20 focus:border-upel-navy',
  'dark:focus:border-upel-gold dark:focus:ring-upel-gold/20',
  'disabled:bg-slate-50 dark:disabled:bg-slate-900',
  'disabled:text-slate-400 dark:disabled:text-slate-600',
  'transition-all duration-200',
].join(' ')

const INPUT_ERR = [
  'w-full px-4 py-2.5 text-sm font-body',
  'text-slate-800 dark:text-slate-100',
  'bg-white dark:bg-slate-800/50',
  'border border-red-400 dark:border-red-500 rounded-lg',
  'placeholder:text-slate-300 dark:placeholder:text-slate-500',
  'focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500',
  'dark:focus:border-red-400 dark:focus:ring-red-500/20',
  'disabled:bg-slate-50 dark:disabled:bg-slate-900',
  'disabled:text-slate-400 dark:disabled:text-slate-600',
  'transition-all duration-200',
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
      <span className="font-body text-sm font-medium text-slate-600">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 font-body animate-error-in">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

export default function EstudianteForm({ initial, onSave, onCancel, saving }) {
  const isEdit = !!initial?.id

  const [form, setForm] = useState(() => ({
    cedula:          initial?.cedula          ?? '',
    tipo_documento:  initial?.tipo_documento  ?? 'Cédula',
    nombre:          initial?.nombre          ?? '',
    apellido:        initial?.apellido        ?? '',
    cohorte:         initial?.cohorte         ?? '',
    programa:        initial?.programa        ?? '',
    titulo_proyecto: initial?.titulo_proyecto ?? '',
    pago_mesa:       initial?.pago_mesa       ?? false,
  }))

  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function validate() {
    const e = {}
    if (!form.cedula.trim())   e.cedula   = 'La cédula es obligatoria.'
    if (!form.nombre.trim())   e.nombre   = 'El nombre es obligatorio.'
    if (!form.apellido.trim()) e.apellido = 'El apellido es obligatorio.'
    if (!form.cohorte.trim())  e.cohorte  = 'La cohorte es obligatoria.'
    if (!form.programa)        e.programa = 'Selecciona un programa.'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
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
        <Field label="Tipo de documento" required>
          <select value={form.tipo_documento}
            onChange={e => set('tipo_documento', e.target.value)}
            className={INPUT + ' cursor-pointer'}>
            {['Cédula', 'Pasaporte', 'Otro'].map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre" required error={errors.nombre}>
          <input type="text" value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
            placeholder="Ej. María"
            className={inp('nombre')} />
        </Field>
        <Field label="Apellido" required error={errors.apellido}>
          <input type="text" value={form.apellido}
            onChange={e => set('apellido', e.target.value)}
            placeholder="Ej. González"
            className={inp('apellido')} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cohorte" required error={errors.cohorte}>
          <input type="text" value={form.cohorte}
            onChange={e => set('cohorte', e.target.value)}
            placeholder="Ej. 2023-I"
            className={inp('cohorte')} />
        </Field>
        <Field label="Programa de Maestría / Especialidad" required error={errors.programa}>
          <select value={form.programa} onChange={e => set('programa', e.target.value)}
            className={inp('programa') + ' cursor-pointer'}>
            <option value="" disabled>Seleccione un programa...</option>
            {PROGRAMAS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Título del proyecto">
        <textarea
          value={form.titulo_proyecto}
          onChange={e => set('titulo_proyecto', e.target.value)}
          placeholder="Título de la tesis o trabajo de grado"
          rows={2}
          className={INPUT + ' resize-none'}
        />
      </Field>

      <label className="flex items-center gap-3 cursor-pointer py-1">
        <input
          type="checkbox"
          checked={form.pago_mesa}
          onChange={e => set('pago_mesa', e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 accent-upel-navy"
        />
        <span className="font-body text-sm text-slate-700">Pago de mesa realizado</span>
      </label>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" onClick={onCancel} disabled={saving}
          className="px-5 py-2 text-sm font-medium font-body rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={saving}
          className="px-5 py-2 bg-upel-navy text-white text-sm font-medium font-body rounded-lg hover:bg-upel-navy-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {saving ? 'Guardando…' : (isEdit ? 'Actualizar' : 'Registrar')}
        </button>
      </div>
    </form>
  )
}
