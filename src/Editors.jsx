import { useState } from 'react'
import { categories, cents } from './planner.js'

export function AmountField({ name = 'amount', label = 'Suma (€)', amount, autoFocus }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type="number" min="0" step="0.01" required autoFocus={autoFocus}
        defaultValue={amount == null ? '' : amount / 100} />
    </label>
  )
}

function Editor({ title, onClose, onSubmit, children, saving, saveError }) {
  return (
    <div className="modal">
      <form className="modal-card" role="dialog" aria-modal="true" aria-labelledby="editor-title" aria-busy={saving}
        onKeyDown={(event) => { if (!saving && event.key === 'Escape') onClose() }}
        onSubmit={(event) => {
          event.preventDefault()
          if (!saving) onSubmit(new FormData(event.currentTarget))
        }}>
        <div className="modal-head">
          <h2 id="editor-title">{title}</h2>
        </div>
        <div inert={saving}>{children}</div>
        {saveError && <p className="notice" role="alert">{saveError}</p>}
        <div className="form-actions">
          <button type="button" className="btn secondary" disabled={saving} onClick={onClose}>Atšaukti</button>
          <button className="btn" disabled={saving}>{saving ? 'Saugoma…' : 'Išsaugoti'}</button>
        </div>
      </form>
    </div>
  )
}

export function IncomeEditor({ income, onSave, ...editorProps }) {
  return (
    <Editor title="Mėnesio pajamos" {...editorProps} onSubmit={(fields) => onSave(cents(fields.get('amount')))}>
      <AmountField label="Pajamos (€)" amount={income} autoFocus />
    </Editor>
  )
}

export function ExpenseEditor({ kind, item, month, expenseId, onSave, ...editorProps }) {
  const [error, setError] = useState('')
  const recurring = kind === 'recurring'
  const title = recurring ? 'Pasikartojanti išlaida' : 'Būsima išlaida'

  function save(fields) {
    const name = fields.get('name').trim()
    if (!name) {
      setError('Įvesk pavadinimą.')
      return
    }
    const expense = { id: expenseId, name, amount: cents(fields.get('amount')) }
    if (recurring) {
      expense.day = Number(fields.get('day'))
      expense.active = fields.get('active') === 'true'
    } else {
      expense.date = fields.get('date')
      expense.pocket = fields.get('pocket')
      expense.description = fields.get('description').trim()
    }
    onSave(expense)
  }

  return (
    <Editor title={title} {...editorProps} onSubmit={save}>
      <div className="form-grid">
        <label className="field">
          <span>Pavadinimas</span>
          <input name="name" defaultValue={item?.name} required autoFocus />
        </label>
        <AmountField amount={item?.amount} />
        {recurring ? (
          <>
            <label className="field">
              <span>Mokėjimo diena</span>
              <input name="day" type="number" min="1" max="31" defaultValue={item?.day || ''} />
            </label>
            <label className="field">
              <span>Statusas</span>
              <select name="active" defaultValue={String(item?.active !== false)}>
                <option value="true">Aktyvi</option>
                <option value="false">Neaktyvi</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <label className="field">
              <span>Data</span>
              <input name="date" type="date" defaultValue={item?.date || `${month}-15`} required />
            </label>
            <label className="field">
              <span>Pocket</span>
              <select name="pocket" defaultValue={item?.pocket || 'needs'}>
                {item?.pocket && !Object.hasOwn(categories, item.pocket) && <option value={item.pocket}>—</option>}
                {Object.entries(categories).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
          </>
        )}
      </div>
      {!recurring && (
        <label className="field section">
          <span>Aprašymas</span>
          <textarea name="description" defaultValue={item?.description} />
        </label>
      )}
      {error && <p className="notice" role="alert">{error}</p>}
    </Editor>
  )
}
