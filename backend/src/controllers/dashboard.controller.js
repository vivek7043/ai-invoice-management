const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const { getCompanyFilter, cleanData, isInvoiceOverdue } = require('../utils/cleanData');
const { syncInvoiceNotifications } = require('../services/notification.service');

async function getDashboardSummary(req, res) {
  try {
    const companyFilter = getCompanyFilter(req);
    const userId = req.user ? req.user._id : null;
    const companyId = req.user ? req.user.companyId : null;

    // Trigger notification sync for current workspace
    await syncInvoiceNotifications(userId, companyId);

    const invoices = await Invoice.find(companyFilter).lean();

    let totalInvoices = invoices.length;
    let paidInvoicesCount = 0;
    let pendingInvoicesCount = 0;
    let overdueInvoicesCount = 0;

    let totalSpend = 0;
    let totalPaidSpend = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    const vendorSpendMap = {};
    const monthlyMap = {};
    const categorySpendMap = {};

    for (const inv of invoices) {
      const amount = Number(inv.totalAmount || inv.amount || inv.grandTotal || 0) || 0;
      totalSpend += amount;

      const isPaid = (inv.status || '').toUpperCase() === 'PAID' || (inv.paymentStatus || '').toUpperCase() === 'PAID';
      const isOverdue = isInvoiceOverdue(inv);

      if (isPaid) {
        paidInvoicesCount += 1;
        totalPaidSpend += amount;
      } else if (isOverdue) {
        overdueInvoicesCount += 1;
        overdueAmount += amount;
      } else {
        pendingInvoicesCount += 1;
        pendingAmount += amount;
      }

      // Vendor aggregation
      const rawVendor = inv.vendorName || inv.extractedData?.vendorName;
      if (rawVendor && typeof rawVendor === 'string' && rawVendor.trim()) {
        const vName = rawVendor.trim();
        vendorSpendMap[vName] = (vendorSpendMap[vName] || 0) + amount;
      }

      // Monthly aggregation
      const dateStr = inv.invoiceDate || inv.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const monthIndex = d.getMonth();
          const monthShort = d.toLocaleString('default', { month: 'short' });
          const yearMonthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

          if (!monthlyMap[yearMonthKey]) {
            monthlyMap[yearMonthKey] = {
              sortKey: yearMonthKey,
              year,
              monthIndex,
              month: `${monthShort} ${year}`,
              label: `${monthShort} ${year}`,
              shortMonth: monthShort,
              revenue: 0,
              amount: 0,
              count: 0,
            };
          }
          monthlyMap[yearMonthKey].revenue += amount;
          monthlyMap[yearMonthKey].amount += amount;
          monthlyMap[yearMonthKey].count += 1;
        }
      }

      // Category aggregation
      const category = inv.invoiceType || inv.category || 'General';
      categorySpendMap[category] = (categorySpendMap[category] || 0) + amount;
    }

    const topVendors = Object.entries(vendorSpendMap)
      .map(([name, spend]) => ({ name, spend, vendor: name, amount: spend }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    const monthlyRevenue = Object.values(monthlyMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ month, label, shortMonth, revenue, amount, count }) => ({
        month,
        label,
        shortMonth,
        revenue,
        amount,
        count,
      }));

    const categoryBreakdown = Object.entries(categorySpendMap)
      .map(([category, amount]) => ({ category, amount }));

    const invoiceStatusDistribution = [
      { name: 'Paid Invoices', value: paidInvoicesCount, count: paidInvoicesCount, fill: '#10B981' },
      { name: 'Pending Invoices', value: pendingInvoicesCount, count: pendingInvoicesCount, fill: '#F59E0B' },
      { name: 'Overdue Invoices', value: overdueInvoicesCount, count: overdueInvoicesCount, fill: '#EF4444' },
    ];

    const unreadNotificationsCount = await Notification.countDocuments({
      ...companyFilter,
      isRead: false,
    });

    const recentInvoices = invoices
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .map((inv) => cleanData(inv));

    const responseData = {
      totalInvoices,
      paidInvoices: paidInvoicesCount,
      pendingInvoices: pendingInvoicesCount,
      overdueInvoices: overdueInvoicesCount,
      totalSpend,
      totalPaidSpend,
      pendingAmount,
      overdueAmount,
      unreadNotificationsCount,
      monthlyRevenue,
      monthlyTrends: monthlyRevenue,
      invoiceStatusDistribution,
      topVendors,
      categoryBreakdown,
      recentInvoices,
    };

    return res.status(200).json({
      success: true,
      data: responseData,
      ...responseData,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ message: 'Failed to generate dashboard summary' });
  }
}

module.exports = {
  getDashboardSummary,
};
