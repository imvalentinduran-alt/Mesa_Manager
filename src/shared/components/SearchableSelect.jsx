import { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, XIcon as ClearIcon } from '@/shared/components/icons'

const FIELD_BASE = [
  'w-full px-4 py-2.5 text-sm text-foreground bg-background',
  'border border-border rounded-xl placeholder:text-muted-foreground/40',
  'focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary',
  'disabled:bg-secondary disabled:text-muted-foreground transition-colors',
].join(' ')


/**
 * Combobox con búsqueda en tiempo real.
 *
 * Props:
 *   options       — array de objetos con { value, label, searchText? }
 *   value         — valor seleccionado actualmente (string/number)
 *   onChange      — (value) => void
 *   placeholder   — texto placeholder del input de búsqueda
 *   disabled      — bool
 *   renderOption  — (option) => ReactNode — para personalizar el render de cada opción
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Buscar…',
  disabled = false,
  renderOption,
}) {
  const [open,   setOpen]   = useState(false)
  const [query,  setQuery]  = useState('')
  const inputRef = useRef(null)
  const rootRef  = useRef(null)
  const id       = useId()

  const selected = options.find(o => String(o.value) === String(value)) ?? null

  const filtered = query.trim() === ''
    ? options
    : options.filter(o => {
        const text = (o.searchText ?? o.label).toLowerCase()
        return query.toLowerCase().split(' ').every(w => text.includes(w))
      })

  // Cierra al hacer click fuera
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen() {
    if (disabled) return
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleSelect(opt) {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  function handleClear(e) {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div ref={rootRef} className="relative" id={id}>
      {/* Trigger — muestra el valor seleccionado o el placeholder */}
      {!open ? (
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={`${FIELD_BASE} flex items-center justify-between gap-2 cursor-pointer text-left`}
        >
          <span className={selected ? 'text-foreground' : 'text-muted-foreground/40'}>
            {selected ? (renderOption ? renderOption(selected) : selected.label) : placeholder}
          </span>
          <span className="flex items-center gap-1 shrink-0 text-muted-foreground">
            {selected && (
              <span
                onClick={handleClear}
                className="hover:text-foreground transition-colors p-0.5 rounded"
                role="button"
                aria-label="Limpiar"
              >
                <ClearIcon />
              </span>
            )}
            <span className="csel-chev"><ChevronDown /></span>
          </span>
        </button>
      ) : (
        /* Input de búsqueda — visible solo cuando el dropdown está abierto */
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className={FIELD_BASE}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); setQuery('') }
            if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0])
          }}
        />
      )}

      {/* Dropdown */}
      {open && (
        <ul
          className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto
            bg-background border border-border rounded-xl shadow-xl py-1"
          style={{ animation: 'modalIn 120ms ease-out' }}
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground text-center">
              Sin resultados
            </li>
          ) : (
            filtered.map(opt => (
              <li
                key={opt.value}
                onMouseDown={() => handleSelect(opt)}
                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between gap-3
                  hover:bg-secondary transition-colors
                  ${String(opt.value) === String(value) ? 'bg-primary/5 font-medium text-primary' : 'text-foreground'}`}
              >
                {renderOption ? renderOption(opt) : opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
