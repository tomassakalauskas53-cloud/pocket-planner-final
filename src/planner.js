export const categories = {
  needs: 'Būtinos išlaidos',
  invest: 'Investicijos',
  fun: 'Pramogos/dovanos',
  edu: 'Edukacija',
}

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
