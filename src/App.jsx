import { useEffect, useState } from 'react'
import { Budget, Expenses, ExpenseList } from './Screens.jsx'
import { ExpenseEditor, IncomeEditor } from './Editors.jsx'
import { emptyMonth, monthKey, monthLabel, shiftMonth } from './planner.js'
import { deleteExpense, loadPlanner, saveBudget, saveExpense } from './plannerData.js'
import { AuthGate } from './Auth.jsx'

const pages = { plan: 'Mėnesio planas', expenses: 'Išlaidos' }

export default function App() {
  return (
    <AuthGate>
      {(userId, onSignOut) => <Planner key={userId} userId={userId} onSignOut={onSignOut} />}
    </AuthGate>
  )
}

function Planner({ userId, onSignOut }) {
  const [planner, setPlanner] = useState(null)
  const [screen, setScreen] = useState('plan')
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState(false)
  const [today] = useState(() => monthKey(new Date()))
  const [month, setMonth] = useState(today)
  const [tab, setTab] = useState('recurring')
  const [editor, setEditor] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [writeError, setWriteError] = useState('')
  const [editorError, setEditorError] = useState('')
  const plan = planner?.months[month] || emptyMonth
  const months = [...new Set([
    ...Object.keys(planner?.months || {}),
    ...Array.from({ length: 19 }, (_, index) => shiftMonth(today, index - 6)),
    month,
  ])].sort()

  useEffect(() => {
    const controller = new AbortController()
    loadPlanner(userId, controller.signal).then((data) => {
      if (!controller.signal.aborted) setPlanner(data)
    }).catch(() => {
      if (!controller.signal.aborted) setLoadError(true)
    })
    return () => controller.abort()
  }, [userId, loadAttempt])

  async function signOut() {
    setSigningOut(true)
    setSignOutError(false)
    try {
      await onSignOut()
    } catch {
      setSignOutError(true)
      setSigningOut(false)
    }
  }

  function openEditor(kind, item) {
    setEditorError('')
    setEditor({ kind, item, expenseId: kind === 'income' ? undefined : item?.id || crypto.randomUUID() })
  }

  async function write(action, inEditor = false) {
    const showError = inEditor ? setEditorError : setWriteError
    setSaving(true)
    showError('')
    try {
      await action()
    } catch {
      showError('Nepavyko išsaugoti pakeitimų. Bandyk dar kartą.')
    } finally {
      setSaving(false)
    }
  }

  function updateBudget(changes, inEditor = false) {
    return write(async () => {
      const budget = await saveBudget(userId, month, changes)
      setPlanner((data) => ({
        ...data,
        months: { ...data.months, [month]: { ...(data.months[month] || emptyMonth), ...budget } },
      }))
      if (inEditor) setEditor(null)
    }, inEditor)
  }

  function submitExpense(expense) {
    const { kind, item } = editor
    return write(async () => {
      const saved = await saveExpense(userId, kind, expense, Boolean(item))
      if (kind === 'recurring') {
        setPlanner((data) => ({
          ...data,
          recurring: item
            ? data.recurring.map((entry) => entry.id === saved.id ? saved : entry)
            : [...data.recurring, saved],
        }))
      } else {
        const target = saved.date.slice(0, 7)
        setPlanner((data) => {
          const months = { ...data.months }
          if (item) {
            months[month] = { ...months[month], future: months[month].future.filter((entry) => entry.id !== saved.id) }
          }
          const targetPlan = months[target] || emptyMonth
          months[target] = { ...targetPlan, future: [...targetPlan.future, saved] }
          return { ...data, months }
        })
        setMonth(target)
      }
      setEditor(null)
    }, true)
  }

  function removeExpense(kind, item) {
    if (!window.confirm(`Ištrinti išlaidą „${item.name}“?`)) return
    return write(async () => {
      await deleteExpense(userId, item.id)
      const keep = (entry) => entry.id !== item.id
      setPlanner((data) => kind === 'recurring'
        ? { ...data, recurring: data.recurring.filter(keep) }
        : { ...data, months: { ...data.months, [month]: { ...plan, future: plan.future.filter(keep) } } })
    })
  }

  const expenseActions = { onEdit: openEditor, onRemove: removeExpense }

  return (
    <div className="app">
      <aside className="sidebar" inert={Boolean(editor) || saving}>
        <div className="brand">Pocket Planner</div>
        <nav className="nav" aria-label="Pagrindinė navigacija">
          {Object.entries(pages).map(([key, label]) => (
            <button key={key} className={screen === key ? 'active' : ''}
              aria-current={screen === key ? 'page' : undefined} onClick={() => setScreen(key)}>
              {label}
            </button>
          ))}
          <button disabled={signingOut} onClick={signOut}>
            {signingOut ? 'Atsijungiama…' : 'Atsijungti'}
          </button>
        </nav>
      </aside>
      <main className="main" inert={Boolean(editor) || saving}>
        <header className="top">
          <div>
            <h1>{pages[screen]}</h1>
            {screen === 'plan' && <div className="top-subtitle">Pajamos, išlaidos ir pocket paskirstymas.</div>}
            {screen === 'expenses' && <div className="top-subtitle">Valdyk pasikartojančias ir būsimas išlaidas.</div>}
          </div>
          <div className="month-selector">
            <button className="btn secondary small" aria-label="Ankstesnis mėnuo"
              onClick={() => setMonth(shiftMonth(month, -1))}>←</button>
            <select aria-label="Mėnuo" value={month} onChange={(event) => setMonth(event.target.value)}>
              {months.map((key) => <option key={key} value={key}>{monthLabel(key)}</option>)}
            </select>
            <button className="btn secondary small" aria-label="Kitas mėnuo"
              onClick={() => setMonth(shiftMonth(month, 1))}>→</button>
          </div>
        </header>
        {saving && !editor && <p>Saugomi pakeitimai…</p>}
        {writeError && <p className="notice" role="alert">{writeError}</p>}
        {loadError ? (
          <section className="card">
            <p className="notice" role="alert">Nepavyko įkelti plano duomenų.</p>
            <button className="btn" onClick={() => {
              setLoadError(false)
              setLoadAttempt((attempt) => attempt + 1)
            }}>Bandyti dar kartą</button>
          </section>
        ) : !planner && <p role="status">Įkeliami plano duomenys…</p>}
        {signOutError && <p className="notice" role="alert">Nepavyko atsijungti. Bandyk dar kartą.</p>}
        {planner && screen === 'plan' && (
          <Budget key={month} plan={plan} recurring={planner.recurring}
            onEditIncome={() => openEditor('income')}
            onAllocate={(allocations) => updateBudget({ allocations })}>
            <ExpenseList kind="future" entries={plan.future} heading="Būsimos išlaidos šiame mėnesyje" {...expenseActions} />
          </Budget>
        )}
        {planner && screen === 'expenses' && (
          <Expenses tab={tab} onTabChange={setTab} future={plan.future} recurring={planner.recurring} {...expenseActions} />
        )}
      </main>
      {editor?.kind === 'income' && (
        <IncomeEditor income={plan.income} saving={saving} saveError={editorError}
          onClose={() => setEditor(null)} onSave={(income) => updateBudget({ income }, true)} />
      )}
      {editor && editor.kind !== 'income' && (
        <ExpenseEditor {...editor} month={month} saving={saving} saveError={editorError}
          onClose={() => setEditor(null)} onSave={submitExpense} />
      )}
    </div>
  )
}
