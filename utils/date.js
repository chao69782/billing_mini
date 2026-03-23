const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function formatDate(isoStr) {
  const d = new Date(isoStr)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const week = WEEK_DAYS[d.getDay()]
  return { month: m, day, week, dateKey: `${d.getFullYear()}-${pad(m)}-${pad(day)}` }
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function formatDisplayDate(isoStr) {
  const d = new Date(isoStr)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const week = WEEK_DAYS[d.getDay()]
  return `${pad(m)}月${pad(day)}日 ${week}`
}

function formatTime(isoStr) {
  const d = new Date(isoStr)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function groupRecordsByDate(records) {
  const groups = {}
  records.forEach(r => {
    const { dateKey } = formatDate(r.time)
    if (!groups[dateKey]) {
      groups[dateKey] = { dateKey, display: formatDisplayDate(r.time), list: [], income: 0, expense: 0 }
    }
    const amount = Number(r.amount) || 0
    if (r.type === 'income') groups[dateKey].income += amount
    else groups[dateKey].expense += amount
    groups[dateKey].list.push(r)
  })
  return Object.values(groups)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .map(g => ({
      ...g,
      incomeText: g.income.toFixed(2),
      expenseText: g.expense.toFixed(2)
    }))
}

function getMonthSummary(records, year, month) {
  let income = 0
  let expense = 0
  const prefix = `${year}-${pad(month)}`
  if (!records || !records.length) return { income: 0, expense: 0 }
  records.forEach(r => {
    if (!r || !r.time) return
    const { dateKey } = formatDate(r.time)
    if (!dateKey || !dateKey.startsWith(prefix)) return
    const amount = Number(r.amount) || 0
    if (r.type === 'income') income += amount
    else expense += amount
  })
  return { income: Number(income), expense: Number(expense) }
}

module.exports = {
  formatDate,
  formatDisplayDate,
  formatTime,
  groupRecordsByDate,
  getMonthSummary,
  pad,
  WEEK_DAYS
}
