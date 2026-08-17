const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema(
  {
    taxName: { type: String, default: null },
    taxRate: { type: Number, default: null },
    taxAmount: { type: Number, default: null },
  },
  { _id: false }
);

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, default: null },
    productName: { type: String, default: null },
    itemCode: { type: String, default: null },
    SKU: { type: String, default: null },
    HSN: { type: String, default: null },
    SAC: { type: String, default: null },
    quantity: { type: Number, default: null },
    unit: { type: String, default: null },
    unitPrice: { type: Number, default: null },
    discount: { type: Number, default: null },
    taxRate: { type: Number, default: null },
    taxAmount: { type: Number, default: null },
    lineTotal: { type: Number, default: null },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fileName: { type: String, default: null },
    filePath: { type: String, default: null },

    // Basic Invoice
    invoiceNumber: { type: String, default: null },
    invoiceType: { type: String, default: null },
    invoiceDate: { type: String, default: null },
    dueDate: { type: String, default: null },
    currency: { type: String, default: null },
    status: { type: String, default: 'PENDING' },
    paymentStatus: { type: String, default: null },
    paymentTerms: { type: String, default: null },

    // Vendor
    vendorName: { type: String, default: null },
    vendorLegalName: { type: String, default: null },
    vendorAddress: { type: String, default: null },
    vendorCity: { type: String, default: null },
    vendorState: { type: String, default: null },
    vendorCountry: { type: String, default: null },
    vendorPostalCode: { type: String, default: null },
    vendorEmail: { type: String, default: null },
    vendorPhone: { type: String, default: null },
    vendorWebsite: { type: String, default: null },
    taxId: { type: String, default: null },
    GSTIN: { type: String, default: null },
    VATNumber: { type: String, default: null },
    PAN: { type: String, default: null },
    CIN: { type: String, default: null },
    registrationNumber: { type: String, default: null },

    // Customer
    customerName: { type: String, default: null },
    customerLegalName: { type: String, default: null },
    customerAddress: { type: String, default: null },
    customerCity: { type: String, default: null },
    customerState: { type: String, default: null },
    customerCountry: { type: String, default: null },
    customerPostalCode: { type: String, default: null },
    customerEmail: { type: String, default: null },
    customerPhone: { type: String, default: null },
    customerTaxId: { type: String, default: null },
    customerGSTIN: { type: String, default: null },
    customerVATNumber: { type: String, default: null },

    // Billing / Shipping
    billTo: { type: String, default: null },
    soldTo: { type: String, default: null },
    shipTo: { type: String, default: null },
    billingAddress: { type: String, default: null },
    shippingAddress: { type: String, default: null },
    deliveryAddress: { type: String, default: null },
    placeOfSupply: { type: String, default: null },
    placeOfDelivery: { type: String, default: null },
    countryOfSupply: { type: String, default: null },

    // Amounts
    amount: { type: Number, default: null },
    subtotal: { type: Number, default: null },
    discount: { type: Number, default: null },
    shippingCharges: { type: Number, default: null },
    handlingCharges: { type: Number, default: null },
    serviceCharges: { type: Number, default: null },
    otherCharges: { type: Number, default: null },
    tax: { type: Number, default: null },
    totalTax: { type: Number, default: null },
    totalAmount: { type: Number, default: null },
    amountDue: { type: Number, default: null },
    amountPaid: { type: Number, default: null },
    balanceDue: { type: Number, default: null },
    grandTotal: { type: Number, default: null },

    // Tax Breakdowns
    cgst: { type: Number, default: null },
    sgst: { type: Number, default: null },
    igst: { type: Number, default: null },
    vat: { type: Number, default: null },
    salesTax: { type: Number, default: null },
    taxes: [taxSchema],

    // Line Items
    lineItems: [lineItemSchema],

    // Payment
    paymentMethod: { type: String, default: null },
    paymentDueDate: { type: String, default: null },
    bankName: { type: String, default: null },
    accountName: { type: String, default: null },
    accountNumber: { type: String, default: null },
    IBAN: { type: String, default: null },
    SWIFT: { type: String, default: null },
    IFSC: { type: String, default: null },
    routingNumber: { type: String, default: null },
    UPI: { type: String, default: null },
    paymentReference: { type: String, default: null },

    // Additional useful fields
    purchaseOrderNumber: { type: String, default: null },
    referenceNumber: { type: String, default: null },
    orderNumber: { type: String, default: null },
    customerNumber: { type: String, default: null },
    contractNumber: { type: String, default: null },
    billingPeriodStart: { type: String, default: null },
    billingPeriodEnd: { type: String, default: null },
    billingPeriod: { type: String, default: null },
    servicePeriod: { type: String, default: null },
    reverseCharge: { type: String, default: null },
    exchangeRate: { type: Number, default: null },
    pricingCurrency: { type: String, default: null },
    taxCurrency: { type: String, default: null },
    shippingMethod: { type: String, default: null },
    trackingNumber: { type: String, default: null },
    deliveryDate: { type: String, default: null },
    dispatchDate: { type: String, default: null },
    shippingTerms: { type: String, default: null },
    notes: { type: String, default: null },
    remarks: { type: String, default: null },
    termsAndConditions: { type: String, default: null },

    // Storage container
    extractedData: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
