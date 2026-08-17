export const stats = {
  total: 1240,
  paid: 980,
  pending: 200,
  overdue: 60
}

export const invoices = [
  { id: 'INV-1001', vendor: 'Acme Co', amount: 1200, status: 'Paid', due: '2026-05-01' },
  { id: 'INV-1002', vendor: 'Beta LLC', amount: 450, status: 'Pending', due: '2026-06-01' },
  { id: 'INV-1003', vendor: 'Gamma Inc', amount: 3200, status: 'Overdue', due: '2026-04-15' }
]

export const vendors = [
  { id: 'V-1', name: 'Acme Co', invoices: 120, total: 42000 },
  { id: 'V-2', name: 'Beta LLC', invoices: 45, total: 9800 }
]
