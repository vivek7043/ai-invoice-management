const mongoose = require('mongoose');
const fs = require('fs');

const mongoUri = "mongodb+srv://vivekbhut904_db_user:Wgv2Tgvakxd63Y0m@cluster0.n2d9kec.mongodb.net/ai_invoice_db?appName=Cluster0";

async function inspectDatabase() {
  try {
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    const invoices = await db.collection('invoices').find({}).toArray();
    const auditLogs = await db.collection('auditlogs').find({}).toArray();
    const notifications = await db.collection('notifications').find({}).toArray();

    const output = {
      invoices,
      auditLogs,
      notifications
    };

    fs.writeFileSync('c:/tmp/db_dump.json', JSON.stringify(output, null, 2));
    console.log("DB dump saved to c:/tmp/db_dump.json. Total invoices:", invoices.length, "Total auditLogs:", auditLogs.length, "Total notifications:", notifications.length);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectDatabase();
