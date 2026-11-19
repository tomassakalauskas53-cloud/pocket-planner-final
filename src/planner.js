export const categories = {
  needs: 'Būtinos išlaidos',
  invest: 'Investicijos',
  fun: 'Pramogos/dovanos',
  edu: 'Edukacija',
}

const storageKey = 'pocketPlannerReact'
const currency = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })
const calendar = new Intl.DateTimeFormat('lt-LT', { year: 'numeric', month: 'long' })

export const euro = (amount) => currency.format(amount / 100)
export const sum = (entries) => entries.reduce((total, entry) => total + entry.amount, 0)
export const cents = (amount) => Math.round(Number(amount) * 100)
export const emptyMonth = { income: 0, allocations: {}, future: [] }

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthDate(key, offset = 0) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1 + offset, 1)
}

export const shiftMonth = (key, offset) => monthKey(monthDate(key, offset))
export const monthLabel = (key) => calendar.format(monthDate(key))

function importExpense(expense) {
  return { ...expense, amount: cents(expense.amount) }
}

export function loadPlanner() {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) return JSON.parse(saved)

    const original = JSON.parse(localStorage.getItem('pocketPlannerV1'))
    if (original) {
      const months = Object.fromEntries(Object.entries(original.months).map(([key, month]) => [
        key,
        {
          income: cents(month.income),
          allocations: {},
          future: (month.future || []).map(importExpense),
        },
      ]))
      return { months, recurring: original.recurring.map(importExpense) }
    }
  } catch {
    // The planner can start with empty data if storage is unavailable.
  }
  return { months: {}, recurring: [] }
}

export function storePlanner(planner) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(planner))
    return true
  } catch {
    return false
  }
}
