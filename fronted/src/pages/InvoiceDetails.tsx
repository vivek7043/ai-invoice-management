import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, AlertCircle, X, Check } from 'lucide-react'

/**
 * Checks if a value is meaningful and non-empty.
 * Returns false for null, undefined, "", "N/A", "null", "undefined", "—", "-", [], and {}.
 */
function hasMeaningfulData(val: any): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === 'string') {
    const s = val.trim()
    if (
      s === '' ||
      s.toLowerCase() === 'n/a' ||
      s.toLowerCase() === 'null' ||
      s.toLowerCase() === 'undefined' ||
      s === '—' ||
      s === '-'
    ) {
      return false
    }
    return true
  }
  if (typeof val === 'number') return !isNaN(val)
  if (typeof val === 'boolean') return true
  if (Array.isArray(val)) return val.some(hasMeaningfulData)
  if (typeof val === 'object') {
    return Object.values(val).some(hasMeaningfulData)
  }
  return true
}

/**
 * Formats values safely for UI display.
 */
function formatDisplayValue(val: any, isCurrency = false, currencySymbol = '$'): string {
  if (!hasMeaningfulData(val)) return ''
  if (isCurrency || (typeof val === 'number' && !isNaN(val))) {
    const num = Number(val)
    if (!isNaN(num)) {
      return `${currencySymbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }
  return String(val)
}

/**
 * Field component that renders ONLY if value is non-empty.
 */
function Field({
  label,
  value,
  isCurrency = false,
  currencySymbol = '$',
  className = '',
}: {
  label: string
  value: any
  isCurrency?: boolean
  currencySymbol?: string
  className?: string
}) {
  if (!hasMeaningfulData(value)) return null

  const display = isCurrency
    ? formatDisplayValue(value, true, currencySymbol)
    : String(value)

  return (
    <div className={className}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium mt-0.5 text-slate-900 dark:text-slate-100">{display}</div>
    </div>
  )
}

/**
 * Section component that renders ONLY if it contains at least one meaningful item.
 */
function Section({
  title,
  children,
  hasContent,
}: {
  title: string
  children: React.ReactNode
  hasContent: boolean
}) {
  if (!hasContent) return null

  return (
    <div className="card p-6 space-y-3 border border-[#e3e8f0] dark:border-slate-800/80 shadow-sm">
      <h3 className="text-base font-semibold text-[#172033] dark:text-white border-b pb-2 border-[#e3e8f0] dark:border-slate-800">
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function InvoiceDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState<boolean>(false)
  const [paying, setPaying] = useState<boolean>(false)
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null)
  const [payErrorMsg, setPayErrorMsg] = useState<string | null>(null)

  const fetchInvoiceDetails = async () => {
    if (!id) {
      setError('Invalid invoice ID')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Invoice not found')
      }

      setInvoice(data.invoice || data)
    } catch (err) {
      console.error('Failed to fetch invoice details:', err)
      setError(err instanceof Error ? err.message : 'Error fetching invoice details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoiceDetails()
  }, [id])

  const handleMarkAsPaid = async () => {
    if (!id) return
    setPaying(true)
    setPayErrorMsg(null)

    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}/pay`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark invoice as paid')
      }

      setShowPayModal(false)
      const invNumDisplay = data.invoice?.invoiceNumber || invoice?.invoiceNumber || invoice?.fileName || 'Invoice'
      setPaySuccessMsg(`Invoice ${invNumDisplay} has been marked as paid successfully!`)

      // Re-fetch details to update UI state dynamically
      fetchInvoiceDetails()
    } catch (err: any) {
      console.error('Payment error:', err)
      setPayErrorMsg(err.message || 'Failed to update payment status')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/invoices')}
          className="text-xs font-semibold text-[#64748b] hover:text-[#172033] dark:hover:text-slate-200 flex items-center gap-1"
        >
          ← Back to Invoices
        </button>
        <div className="card p-12 text-center text-[#64748b] dark:text-slate-400 text-xs border border-[#e3e8f0] dark:border-slate-800">
          Loading invoice details from database...
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/invoices')}
          className="text-xs font-semibold text-[#64748b] hover:text-[#172033] dark:hover:text-slate-200 flex items-center gap-1"
        >
          ← Back to Invoices
        </button>
        <div className="card p-8 bg-red-50 text-red-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
          <div className="font-semibold text-sm mb-1">Invoice Not Found</div>
          <div className="text-xs">{error || 'Unable to locate the specified invoice document.'}</div>
        </div>
      </div>
    )
  }

  const ext = invoice.extractedData || {}
  const data = { ...ext, ...invoice }

  const currencySymbol = data.currency || '$'

  const invNumber = data.invoiceNumber
  const vendorName = data.vendorName
  const invDate = data.invoiceDate
  const dueDate = data.dueDate
  const status = data.status || data.paymentStatus
  const totalAmount = data.amount !== null && data.amount !== undefined ? data.amount : (data.totalAmount !== null && data.totalAmount !== undefined ? data.totalAmount : data.grandTotal)

  const normStatus = hasMeaningfulData(status) ? String(status).toUpperCase() : null
  const isPaid = normStatus && ['PAID', 'FULLY_PAID', 'PAYMENT_RECEIVED', 'SETTLED'].includes(normStatus)

  let statusBadgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  if (isPaid) {
    statusBadgeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
  } else if (normStatus && ['OVERDUE', 'PAST_DUE'].includes(normStatus)) {
    statusBadgeClass = 'bg-rose-500/10 text-rose-600 border-rose-500/20'
  }

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
  const pdfUrl = data.filePath ? `${API_BASE_URL}${data.filePath.startsWith('/') ? '' : '/'}${data.filePath}` : null

  // 1. Invoice Info Section Presence
  const hasInvoiceInfo = [invNumber, data.invoiceType, invDate, dueDate, normStatus, data.currency, data.paymentTerms].some(hasMeaningfulData)

  // 2. Vendor Info Section Presence
  const hasVendorInfo = [
    vendorName,
    data.vendorLegalName,
    data.vendorAddress,
    data.vendorCity,
    data.vendorState,
    data.vendorCountry,
    data.vendorPostalCode,
    data.vendorEmail,
    data.vendorPhone,
    data.vendorWebsite,
    data.taxId,
    data.GSTIN,
    data.gstin,
    data.VATNumber,
    data.vatNumber,
    data.PAN,
    data.pan,
    data.CIN,
    data.cin,
    data.registrationNumber,
  ].some(hasMeaningfulData)

  // 3. Customer Info Section Presence
  const hasCustomerInfo = [
    data.customerName,
    data.customerLegalName,
    data.customerAddress,
    data.customerCity,
    data.customerState,
    data.customerCountry,
    data.customerPostalCode,
    data.customerEmail,
    data.customerPhone,
    data.customerTaxId,
    data.customerGSTIN,
    data.customerVATNumber,
  ].some(hasMeaningfulData)

  // 4. Billing & Location Info Section Presence
  const hasBillingInfo = [
    data.billTo,
    data.soldTo,
    data.shipTo,
    data.billingAddress,
    data.shippingAddress,
    data.deliveryAddress,
    data.placeOfSupply,
    data.placeOfDelivery,
    data.countryOfSupply,
  ].some(hasMeaningfulData)

  // 5. Line Items Section Presence & Column Filtering
  const lineItems: any[] = Array.isArray(data.lineItems) ? data.lineItems.filter(hasMeaningfulData) : []
  const hasLineItems = lineItems.length > 0

  // Compute active columns across line items
  const lineItemCols = {
    description: lineItems.some(i => hasMeaningfulData(i.description || i.productName)),
    itemCode: lineItems.some(i => hasMeaningfulData(i.itemCode || i.SKU)),
    hsnSac: lineItems.some(i => hasMeaningfulData(i.HSN || i.SAC || i.hsnSac || i.hsn || i.sac)),
    quantity: lineItems.some(i => hasMeaningfulData(i.quantity)),
    unit: lineItems.some(i => hasMeaningfulData(i.unit)),
    unitPrice: lineItems.some(i => hasMeaningfulData(i.unitPrice)),
    discount: lineItems.some(i => hasMeaningfulData(i.discount)),
    taxRate: lineItems.some(i => hasMeaningfulData(i.taxRate)),
    taxAmount: lineItems.some(i => hasMeaningfulData(i.taxAmount)),
    lineTotal: lineItems.some(i => hasMeaningfulData(i.lineTotal || i.total)),
  }

  // 6. Tax Breakdown Section
  const customTaxes: any[] = Array.isArray(data.taxes) ? data.taxes.filter(hasMeaningfulData) : []
  const hasTaxBreakdown = [
    data.cgst,
    data.sgst,
    data.igst,
    data.vat,
    data.salesTax,
    data.totalTax || data.tax,
  ].some(hasMeaningfulData) || customTaxes.length > 0

  // 7. Amount Summary Section Presence
  const hasAmountSummary = [
    data.subtotal,
    data.discount,
    data.shippingCharges,
    data.handlingCharges,
    data.serviceCharges,
    data.otherCharges,
    data.totalTax || data.tax,
    totalAmount,
    data.amountPaid,
    data.amountDue || data.balanceDue,
  ].some(hasMeaningfulData)

  // 8. Payment Info Section Presence
  const hasPaymentInfo = [
    data.paymentStatus,
    data.paymentMethod,
    data.paymentTerms,
    data.paymentDueDate,
    data.bankName,
    data.accountName,
    data.accountNumber,
    data.IFSC || data.ifscCode,
    data.SWIFT || data.swiftCode,
    data.IBAN || data.iban,
    data.routingNumber,
    data.UPI || data.upiId,
    data.paymentReference,
  ].some(hasMeaningfulData)

  // 9. Additional Info Section Presence
  const hasAdditionalInfo = [
    data.purchaseOrderNumber,
    data.referenceNumber,
    data.orderNumber,
    data.customerNumber,
    data.contractNumber,
    data.billingPeriodStart,
    data.billingPeriodEnd,
    data.billingPeriod,
    data.servicePeriod,
    data.reverseCharge,
    data.exchangeRate,
    data.pricingCurrency,
    data.taxCurrency,
    data.shippingMethod,
    data.trackingNumber,
    data.deliveryDate,
    data.dispatchDate,
    data.shippingTerms,
    data.notes,
    data.remarks,
    data.termsAndConditions,
  ].some(hasMeaningfulData)

  return (
    <div className="space-y-6 pb-8">
      {/* Success Notification Banner */}
      {paySuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{paySuccessMsg}</span>
          </div>
          <button
            onClick={() => setPaySuccessMsg(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <button
          onClick={() => navigate('/invoices')}
          className="px-3.5 py-2 text-xs font-semibold bg-[#EEF2F7] dark:bg-slate-800 hover:bg-[#e2e8f0] dark:hover:bg-slate-700 text-[#172033] dark:text-slate-200 rounded-xl transition-all border border-[#d7dee8] dark:border-slate-700/60 flex items-center gap-1.5"
        >
          ← Back to Invoices
        </button>

        <div className="flex items-center gap-3">
          {/* Status Badge or Mark as Paid Action */}
          {isPaid ? (
            <span className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              ✓ Paid
            </span>
          ) : (
            <button
              onClick={() => setShowPayModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Paid
            </button>
          )}

          {normStatus && !isPaid && (
            <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl border ${statusBadgeClass}`}>
              {normStatus}
            </span>
          )}

          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              📄 View Original PDF
            </a>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#e3e8f0] dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033] dark:text-white">
                  Mark this invoice as paid?
                </h3>
                <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1 leading-relaxed">
                  This will update the payment status and stop future payment reminders.
                </p>
              </div>
            </div>

            {payErrorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{payErrorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPayModal(false)
                  setPayErrorMsg(null)
                }}
                disabled={paying}
                className="px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkAsPaid}
                disabled={paying}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {paying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Mark as Paid
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Banner */}
      {(hasMeaningfulData(invNumber) || hasMeaningfulData(totalAmount)) && (
        <div className="card p-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Invoice Document</div>
            {hasMeaningfulData(invNumber) && (
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{String(invNumber)}</h1>
            )}
            {hasMeaningfulData(vendorName) && (
              <div className="text-sm text-slate-500 mt-0.5">
                Vendor: <strong className="text-slate-700 dark:text-slate-300">{String(vendorName)}</strong>
              </div>
            )}
          </div>
          {hasMeaningfulData(totalAmount) && (
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Amount</div>
              <div className="text-2xl font-bold text-primary mt-1">
                {formatDisplayValue(totalAmount, true, currencySymbol)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Invoice Information */}
      <Section title="Invoice Information" hasContent={hasInvoiceInfo}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-sm">
          <Field label="Invoice Number" value={invNumber} />
          <Field label="Invoice Type" value={data.invoiceType} />
          <Field label="Invoice Date" value={invDate} />
          <Field label="Due Date" value={dueDate} />
          <Field label="Status" value={normStatus} />
          <Field label="Currency" value={data.currency} />
          <Field label="Payment Terms" value={data.paymentTerms} />
        </div>
      </Section>

      {/* 2 & 3. Vendor & Customer Information */}
      {(hasVendorInfo || hasCustomerInfo) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vendor Info */}
          <Section title="Vendor Information" hasContent={hasVendorInfo}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Field label="Vendor Name" value={vendorName} />
              <Field label="Legal Name" value={data.vendorLegalName} />
              <Field label="Address" value={data.vendorAddress} className="sm:col-span-2" />
              <Field label="City" value={data.vendorCity} />
              <Field label="State" value={data.vendorState} />
              <Field label="Country" value={data.vendorCountry} />
              <Field label="Postal Code" value={data.vendorPostalCode} />
              <Field label="Email" value={data.vendorEmail} />
              <Field label="Phone" value={data.vendorPhone} />
              <Field label="Website" value={data.vendorWebsite} />
              <Field label="GSTIN" value={data.GSTIN || data.gstin} />
              <Field label="VAT Number" value={data.VATNumber || data.vatNumber} />
              <Field label="PAN" value={data.PAN || data.pan} />
              <Field label="CIN" value={data.CIN || data.cin} />
              <Field label="Tax ID" value={data.taxId} />
              <Field label="Registration Number" value={data.registrationNumber} />
            </div>
          </Section>

          {/* Customer Info */}
          <Section title="Customer Information" hasContent={hasCustomerInfo}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Field label="Customer Name" value={data.customerName} />
              <Field label="Legal Name" value={data.customerLegalName} />
              <Field label="Address" value={data.customerAddress} className="sm:col-span-2" />
              <Field label="City" value={data.customerCity} />
              <Field label="State" value={data.customerState} />
              <Field label="Country" value={data.customerCountry} />
              <Field label="Postal Code" value={data.customerPostalCode} />
              <Field label="Email" value={data.customerEmail} />
              <Field label="Phone" value={data.customerPhone} />
              <Field label="GSTIN" value={data.customerGSTIN} />
              <Field label="VAT Number" value={data.customerVATNumber} />
              <Field label="Tax ID" value={data.customerTaxId} />
            </div>
          </Section>
        </div>
      )}

      {/* 4. Billing / Shipping */}
      <Section title="Billing & Shipping Information" hasContent={hasBillingInfo}>
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
          <Field label="Bill To" value={data.billTo} />
          <Field label="Sold To" value={data.soldTo} />
          <Field label="Ship To" value={data.shipTo} />
          <Field label="Place of Supply" value={data.placeOfSupply} />
          <Field label="Place of Delivery" value={data.placeOfDelivery} />
          <Field label="Country of Supply" value={data.countryOfSupply} />
          <Field label="Billing Address" value={data.billingAddress} className="sm:col-span-2" />
          <Field label="Shipping Address" value={data.shippingAddress} className="sm:col-span-2" />
          <Field label="Delivery Address" value={data.deliveryAddress} className="sm:col-span-2" />
        </div>
      </Section>

      {/* 5. Line Items */}
      <Section title="Line Items" hasContent={hasLineItems}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                {lineItemCols.description && <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Description</th>}
                {lineItemCols.itemCode && <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Code / SKU</th>}
                {lineItemCols.hsnSac && <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">HSN/SAC</th>}
                {lineItemCols.quantity && <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Qty</th>}
                {lineItemCols.unit && <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Unit</th>}
                {lineItemCols.unitPrice && <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Unit Price</th>}
                {lineItemCols.discount && <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Discount</th>}
                {lineItemCols.taxRate && <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Tax Rate</th>}
                {lineItemCols.taxAmount && <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Tax Amount</th>}
                {lineItemCols.lineTotal && <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Line Total</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {lineItems.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  {lineItemCols.description && <td className="px-3 py-2.5 font-medium">{String(item.description || item.productName || '')}</td>}
                  {lineItemCols.itemCode && <td className="px-3 py-2.5 text-slate-500">{String(item.itemCode || item.SKU || '')}</td>}
                  {lineItemCols.hsnSac && <td className="px-3 py-2.5 text-slate-500">{String(item.HSN || item.SAC || item.hsnSac || item.hsn || item.sac || '')}</td>}
                  {lineItemCols.quantity && <td className="px-3 py-2.5 text-right font-medium">{String(item.quantity || '')}</td>}
                  {lineItemCols.unit && <td className="px-3 py-2.5 text-slate-500">{String(item.unit || '')}</td>}
                  {lineItemCols.unitPrice && <td className="px-3 py-2.5 text-right">{formatDisplayValue(item.unitPrice, true, currencySymbol)}</td>}
                  {lineItemCols.discount && <td className="px-3 py-2.5 text-right">{formatDisplayValue(item.discount, true, currencySymbol)}</td>}
                  {lineItemCols.taxRate && <td className="px-3 py-2.5 text-right">{hasMeaningfulData(item.taxRate) ? `${item.taxRate}%` : ''}</td>}
                  {lineItemCols.taxAmount && <td className="px-3 py-2.5 text-right">{formatDisplayValue(item.taxAmount, true, currencySymbol)}</td>}
                  {lineItemCols.lineTotal && <td className="px-3 py-2.5 text-right font-semibold text-slate-900 dark:text-white">{formatDisplayValue(item.lineTotal || item.total, true, currencySymbol)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 6. Tax Breakdown */}
      <Section title="Tax Information" hasContent={hasTaxBreakdown}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Field label="CGST" value={data.cgst} isCurrency currencySymbol={currencySymbol} />
          <Field label="SGST" value={data.sgst} isCurrency currencySymbol={currencySymbol} />
          <Field label="IGST" value={data.igst} isCurrency currencySymbol={currencySymbol} />
          <Field label="VAT" value={data.vat} isCurrency currencySymbol={currencySymbol} />
          <Field label="Sales Tax" value={data.salesTax} isCurrency currencySymbol={currencySymbol} />
          <Field label="Total Tax" value={data.totalTax || data.tax} isCurrency currencySymbol={currencySymbol} />
          {customTaxes.map((t: any, idx: number) => (
            <Field
              key={idx}
              label={t.taxName || `Tax #${idx + 1}`}
              value={t.taxAmount !== undefined ? t.taxAmount : (t.taxRate ? `${t.taxRate}%` : null)}
              isCurrency={t.taxAmount !== undefined}
              currencySymbol={currencySymbol}
            />
          ))}
        </div>
      </Section>

      {/* 7 & 8. Amount Summary & Payment Info */}
      {(hasAmountSummary || hasPaymentInfo) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount Summary */}
          <Section title="Amount Summary" hasContent={hasAmountSummary}>
            <div className="space-y-2 text-sm">
              {hasMeaningfulData(data.subtotal) && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium">{formatDisplayValue(data.subtotal, true, currencySymbol)}</span>
                </div>
              )}
              {hasMeaningfulData(data.discount) && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-medium">{formatDisplayValue(data.discount, true, currencySymbol)}</span>
                </div>
              )}
              {hasMeaningfulData(data.shippingCharges) && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping Charges</span>
                  <span className="font-medium">{formatDisplayValue(data.shippingCharges, true, currencySymbol)}</span>
                </div>
              )}
              {hasMeaningfulData(data.handlingCharges) && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Handling Charges</span>
                  <span className="font-medium">{formatDisplayValue(data.handlingCharges, true, currencySymbol)}</span>
                </div>
              )}
              {hasMeaningfulData(data.serviceCharges) && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Service Charges</span>
                  <span className="font-medium">{formatDisplayValue(data.serviceCharges, true, currencySymbol)}</span>
                </div>
              )}
              {hasMeaningfulData(data.otherCharges) && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Other Charges</span>
                  <span className="font-medium">{formatDisplayValue(data.otherCharges, true, currencySymbol)}</span>
                </div>
              )}
              {hasMeaningfulData(data.totalTax || data.tax) && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Tax</span>
                  <span className="font-medium">{formatDisplayValue(data.totalTax || data.tax, true, currencySymbol)}</span>
                </div>
              )}
              {hasMeaningfulData(totalAmount) && (
                <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatDisplayValue(totalAmount, true, currencySymbol)}</span>
                </div>
              )}
              {(hasMeaningfulData(data.amountPaid) || hasMeaningfulData(data.amountDue || data.balanceDue)) && (
                <div className="flex justify-between pt-1 text-xs text-slate-500">
                  {hasMeaningfulData(data.amountPaid) && <span>Amount Paid: {formatDisplayValue(data.amountPaid, true, currencySymbol)}</span>}
                  {hasMeaningfulData(data.amountDue || data.balanceDue) && <span>Amount Due: {formatDisplayValue(data.amountDue || data.balanceDue, true, currencySymbol)}</span>}
                </div>
              )}
            </div>
          </Section>

          {/* Payment Info */}
          <Section title="Payment Information" hasContent={hasPaymentInfo}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Payment Status" value={data.paymentStatus} />
              <Field label="Payment Method" value={data.paymentMethod} />
              <Field label="Payment Terms" value={data.paymentTerms} />
              <Field label="Payment Due Date" value={data.paymentDueDate} />
              <Field label="Bank Name" value={data.bankName} />
              <Field label="Account Name" value={data.accountName} />
              <Field label="Account Number" value={data.accountNumber} />
              <Field label="IFSC Code" value={data.IFSC || data.ifscCode} />
              <Field label="SWIFT Code" value={data.SWIFT || data.swiftCode} />
              <Field label="IBAN" value={data.IBAN || data.iban} />
              <Field label="Routing Number" value={data.routingNumber} />
              <Field label="UPI ID" value={data.UPI || data.upiId} />
              <Field label="Payment Reference" value={data.paymentReference} />
            </div>
          </Section>
        </div>
      )}

      {/* 9. Additional Information */}
      <Section title="Additional Information" hasContent={hasAdditionalInfo}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Field label="Purchase Order Number" value={data.purchaseOrderNumber} />
          <Field label="Reference Number" value={data.referenceNumber} />
          <Field label="Order Number" value={data.orderNumber} />
          <Field label="Customer Number" value={data.customerNumber} />
          <Field label="Contract Number" value={data.contractNumber} />
          <Field label="Billing Period Start" value={data.billingPeriodStart} />
          <Field label="Billing Period End" value={data.billingPeriodEnd} />
          <Field label="Billing Period" value={data.billingPeriod} />
          <Field label="Service Period" value={data.servicePeriod} />
          <Field label="Reverse Charge" value={data.reverseCharge} />
          <Field label="Exchange Rate" value={data.exchangeRate} />
          <Field label="Pricing Currency" value={data.pricingCurrency} />
          <Field label="Tax Currency" value={data.taxCurrency} />
          <Field label="Shipping Method" value={data.shippingMethod} />
          <Field label="Tracking Number" value={data.trackingNumber} />
          <Field label="Delivery Date" value={data.deliveryDate} />
          <Field label="Dispatch Date" value={data.dispatchDate} />
          <Field label="Shipping Terms" value={data.shippingTerms} />
          <Field label="Notes" value={data.notes} className="sm:col-span-2" />
          <Field label="Remarks" value={data.remarks} className="sm:col-span-2" />
          <Field label="Terms & Conditions" value={data.termsAndConditions} className="sm:col-span-2" />
        </div>
      </Section>
    </div>
  )
}
