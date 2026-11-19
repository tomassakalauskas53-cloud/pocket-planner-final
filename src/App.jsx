import { useEffect, useState } from 'react'
import { Budget, Expenses, ExpenseList } from './Screens.jsx'
import { ExpenseEditor, IncomeEditor } from './Editors.jsx'
import { emptyMonth, loadPlanner, monthKey, monthLabel, shiftMonth, storePlanner } from './planner.js'

const pages = { auth: 'Prisijungimas', plan: 'Mėnesio planas', expenses: 'Išlaidos' }

export default function App() {
  const [planner, setPlanner] = useState(loadPlanner)
  const [screen, setScreen] = useState('auth')
  const [entered, setEntered] = useState(false)
  const [today] = useState(() => monthKey(new Date()))
  const [month, setMonth] = useState(today)
  const [tab, setTab] = useState('recurring')
  const [editor, setEditor] = useState(null)
  const [storageError, setStorageError] = useState(false)
  const plan = planner.months[month] || emptyMonth
  const months = [...new Set([
    ...Object.keys(planner.months),
    ...Array.from({ length: 19 }, (_, index) => shiftMonth(today, index - 6)),
    month,
  ])].sort()

  useEffect(() => {
    setStorageError(!storePlanner(planner))
  }, [planner])

  function changeMonth(update) {
    setPlanner((data) => ({
      ...data,
      months: { ...data.months, [month]: update(data.months[month] || emptyMonth) },
    }))
  }

  function saveExpense(expense) {
    const { kind, item } = editor
    if (kind === 'recurring') {
      setPlanner((data) => ({
        ...data,
        recurring: item
          ? data.recurring.map((entry) => entry.id === item.id ? expense : entry)
          : [...data.recurring, expense],
      }))
    } else {
      const target = expense.date.slice(0, 7)
      setPlanner((data) => {
        const months = { ...data.months }
        if (item) {
          months[month] = { ...months[month], future: months[month].future.filter((entry) => entry.id !== item.id) }
        }
        const targetPlan = months[target] || emptyMonth
        months[target] = { ...targetPlan, future: [...targetPlan.future, expense] }
        return { ...data, months }
      })
      setMonth(target)
    }
    setEditor(null)
  }

  function removeExpense(kind, item) {
    if (!window.confirm(`Ištrinti išlaidą „${item.name}“?`)) return
    const keep = (entry) => entry.id !== item.id
    if (kind === 'recurring') {
      setPlanner((data) => ({ ...data, recurring: data.recurring.filter(keep) }))
    } else {
      changeMonth((data) => ({ ...data, future: data.future.filter(keep) }))
    }
  }

  const expenseActions = {
    onEdit: (kind, item) => setEditor({ kind, item }),
    onRemove: removeExpense,
  }

  return (
    <div className="app">
      <aside className="sidebar" inert={Boolean(editor)}>
        <div className="brand">Pocket Planner</div>
        <nav className="nav" aria-label="Pagrindinė navigacija">
          {Object.entries(pages).filter(([key]) => entered || key === 'auth').map(([key, label]) => (
            <button key={key} className={screen === key ? 'active' : ''}
              aria-current={screen === key ? 'page' : undefined} onClick={() => setScreen(key)}>
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main" inert={Boolean(editor)}>
        <header className="top">
          <div>
            <h1>{pages[screen]}</h1>
            {screen === 'plan' && <div className="top-subtitle">Pajamos, išlaidos ir pocket paskirstymas.</div>}
            {screen === 'expenses' && <div className="top-subtitle">Valdyk pasikartojančias ir būsimas išlaidas.</div>}
          </div>
          {screen !== 'auth' && (
            <div className="month-selector">
              <button className="btn secondary small" aria-label="Ankstesnis mėnuo"
                onClick={() => setMonth(shiftMonth(month, -1))}>←</button>
              <select aria-label="Mėnuo" value={month} onChange={(event) => setMonth(event.target.value)}>
                {months.map((key) => <option key={key} value={key}>{monthLabel(key)}</option>)}
              </select>
              <button className="btn secondary small" aria-label="Kitas mėnuo"
                onClick={() => setMonth(shiftMonth(month, 1))}>→</button>
            </div>
          )}
        </header>
        {storageError && <p className="notice" role="status">Naršyklėje nepavyko išsaugoti duomenų.</p>}
        {screen === 'auth' && (
          <section className="card auth-card">
            <p>Prisijungimas bus pridėtas vėliau. Dabar gali tęsti be paskyros.</p>
            <button className="btn" onClick={() => { setEntered(true); setScreen('plan') }}>
              Tęsti į planą
            </button>
          </section>
        )}
        {screen === 'plan' && (
          <Budget key={month} plan={plan} recurring={planner.recurring}
            onEditIncome={() => setEditor({ kind: 'income' })}
            onAllocate={(allocations) => changeMonth((data) => ({
              ...data, allocations,
            }))}>
            <ExpenseList kind="future" entries={plan.future} heading="Būsimos išlaidos šiame mėnesyje" {...expenseActions} />
          </Budget>
        )}
        {screen === 'expenses' && (
          <Expenses tab={tab} onTabChange={setTab} future={plan.future} recurring={planner.recurring} {...expenseActions} />
        )}
      </main>
      {editor?.kind === 'income' && (
        <IncomeEditor income={plan.income} onClose={() => setEditor(null)} onSave={(income) => {
          changeMonth((data) => ({ ...data, income }))
          setEditor(null)
        }} />
      )}
      {editor && editor.kind !== 'income' && (
        <ExpenseEditor {...editor} month={month} onClose={() => setEditor(null)} onSave={saveExpense} />
      )}
    </div>
  )
}
