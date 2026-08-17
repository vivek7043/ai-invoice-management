import React from 'react'

export default function VendorCard({ vendor }: { vendor: any }){
  return (
    <div className="p-4 card">
      <div className="font-semibold">{vendor.name}</div>
      <div className="text-sm text-slate-500">Invoices: {vendor.invoices}</div>
      <div className="text-sm font-medium mt-2">${vendor.total}</div>
    </div>
  )
}
