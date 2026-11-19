import { categories, emptyMonth } from './planner.js'
import { supabase } from './supabase.js'

const categoryIds = Object.keys(categories)
const pageSize = 500

async function readRows(table, userId, orderBy, signal) {
  const rows = []
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from(table).select('*').eq('user_id', userId)
      .order(orderBy).range(offset, offset + pageSize - 1).abortSignal(signal)
    if (error) throw error
    rows.push(...data)
    if (data.length < pageSize) return rows
  }
}

function toBudget(row) {
  return {
    income: row.income_cents,
    allocations: Object.fromEntries(categoryIds.map((id) => [id, row[id + '_cents']])),
  }
}

function toExpense(row) {
  const expense = { id: row.id, name: row.name, amount: row.amount_cents }
  if (row.kind === 'recurring') {
    return { ...expense, day: row.payment_day, active: row.active }
  }
  return { ...expense, date: row.due_date, pocket: row.category, description: row.description }
}

export async function loadPlanner(userId, signal) {
  const [budgets, expenses] = await Promise.all([
    readRows('budgets', userId, 'month', signal),
    readRows('expenses', userId, 'id', signal),
  ])
  const months = Object.fromEntries(budgets.map((row) => [
    row.month.slice(0, 7),
    { ...toBudget(row), future: [] },
  ]))
  const recurring = []
  for (const row of expenses) {
    const expense = toExpense(row)
    if (row.kind === 'recurring') {
      recurring.push(expense)
    } else {
      const month = row.budget_month.slice(0, 7)
      months[month] ??= { ...emptyMonth, future: [] }
      months[month].future.push(expense)
    }
  }
  return { months, recurring }
}

export async function saveBudget(userId, month, changes) {
  const fields = changes.allocations
    ? Object.fromEntries(categoryIds.map((id) => [id + '_cents', changes.allocations[id]]))
    : { income_cents: changes.income }
  const { data, error } = await supabase.from('budgets').upsert(
    { user_id: userId, month: month + '-01', ...fields },
    { onConflict: 'user_id,month', defaultToNull: false },
  ).select().single()
  if (error) throw error
  return toBudget(data)
}

export async function saveExpense(userId, kind, expense, editing) {
  const fields = {
    name: expense.name,
    amount_cents: expense.amount,
    ...(kind === 'recurring'
      ? { payment_day: expense.day || null, active: expense.active }
      : { due_date: expense.date, category: expense.pocket, description: expense.description || null }),
  }

  const query = supabase.from('expenses')
  const request = editing
    ? query.update(fields).eq('user_id', userId).eq('id', expense.id)
    : query.upsert({
      user_id: userId, id: expense.id, kind: kind === 'future' ? 'upcoming' : kind, ...fields,
    }, { onConflict: 'user_id,id' })
  const { data, error } = await request.select().single()
  if (error) throw error
  return toExpense(data)
}

export async function deleteExpense(userId, id) {
  const { error } = await supabase.from('expenses').delete().eq('user_id', userId).eq('id', id)
  if (error) throw error
}
