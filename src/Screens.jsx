import { AmountField } from './Editors.jsx'
import { categories, cents, euro, sum } from './planner.js'

export function Budget({ plan, recurring, onEditIncome, onAllocate, children }) {
  const recurringTotal = sum(recurring.filter((expense) => expense.active))
  const futureTotal = sum(plan.future)
  const allocated = Object.keys(categories).reduce((total, id) => total + (plan.allocations[id] || 0), 0)
  const remaining = plan.income - recurringTotal - futureTotal - allocated
  const stats = [
    ['Pajamos', plan.income],
    ['Pasikartojančios', recurringTotal],
    ['Būsimos', futureTotal],
    ['Laisvai paskirstoma', remaining],
  ]

  function saveAllocations(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    onAllocate(Object.fromEntries(Object.keys(categories).map((id) => [id, cents(fields.get(id))])))
  }

  return (
    <>
      <div className="grid stats-grid">
        {stats.map(([label, amount]) => (
          <div className="card" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{euro(amount)}</div>
          </div>
        ))}
      </div>
      {remaining < 0 && <p className="notice">Planas viršija mėnesio pajamas {euro(-remaining)}.</p>}
      <section className="section card">
        <div className="section-title">
          <h2>Pajamos</h2>
          <button className="btn small" onClick={onEditIncome}>Redaguoti</button>
        </div>
        <div className="income-value">{euro(plan.income)}</div>
      </section>
      <form className="section" onSubmit={saveAllocations}>
        <div className="section-title">
          <h2>Pocket’ai</h2>
          <button className="btn small">Išsaugoti paskirstymą</button>
        </div>
        <div className="grid four-grid">
          {Object.entries(categories).map(([id, name]) => (
            <div className="card pocket" key={id}>
              <h3>{name}</h3>
              <AmountField name={id} label="Skiriama suma (€)" amount={plan.allocations[id] || 0} />
            </div>
          ))}
        </div>
      </form>
      <div className="section">{children}</div>
    </>
  )
}

export function Expenses({ tab, onTabChange, future, recurring, ...actions }) {
  return (
    <>
      <div className="tabs" aria-label="Išlaidų tipas" role="group">
        {[['recurring', 'Pasikartojančios'], ['future', 'Būsimos']].map(([kind, label]) => (
          <button key={kind} aria-pressed={tab === kind} className={tab === kind ? 'active' : ''}
            onClick={() => onTabChange(kind)}>{label}</button>
        ))}
      </div>
      <ExpenseList kind={tab} entries={tab === 'recurring' ? recurring : future} {...actions} />
    </>
  )
}

export function ExpenseList({ kind, entries, heading, onEdit, onRemove }) {
  const recurring = kind === 'recurring'
  const title = heading || (recurring ? 'Pasikartojančios išlaidos' : 'Būsimos išlaidos')
  const sorted = recurring ? entries : [...entries].sort((first, second) => first.date.localeCompare(second.date))

  return (
    <section className="card">
      <div className="section-title">
        <h2>{title}</h2>
        <button className="btn small" onClick={() => onEdit(kind)}>+ Pridėti</button>
      </div>
      {entries.length === 0 ? (
        <div className="empty">
          {recurring ? 'Pasikartojančių išlaidų dar nėra.' : 'Šiam mėnesiui būsimų išlaidų nėra.'}
        </div>
      ) : (
        <div className="list">
          {sorted.map((item) => (
            <div className="row" key={item.id}>
              <div>
                <div className="row-title">{item.name} · {euro(item.amount)}</div>
                <div className="row-meta">
                  {recurring
                    ? `Mokėjimo diena: ${item.day || '—'} · ${item.active ? 'Aktyvi' : 'Neaktyvi'}`
                    : `${item.date} · ${categories[item.pocket] || '—'}`}
                </div>
                {!recurring && item.description && <div className="row-meta">{item.description}</div>}
              </div>
              <div className="actions">
                <button className="btn secondary small" onClick={() => onEdit(kind, item)}>Redaguoti</button>
                <button className="btn danger small" onClick={() => onRemove(kind, item)}>Trinti</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
