const fs = require('fs');
const path = require('path');

(async () => {
  const baseUrl = 'http://localhost:5000/api';
  const email = `upload_test_${Date.now()}@example.com`;
  const password = 'TestPass123';

  const registerRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Upload Tester', email, password, rememberMe: false }),
  });

  if (!registerRes.ok) {
    throw new Error(`register failed: ${registerRes.status}`);
  }

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    throw new Error('login failed');
  }

  const samplePath = path.join(__dirname, 'uploads', 'invoices', 'sample.pdf');
  const fileBuffer = fs.readFileSync(samplePath);
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), 'sample.pdf');

  const uploadRes = await fetch(`${baseUrl}/invoices/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${loginData.token}` },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  console.log('upload status', uploadRes.status);
  console.log(uploadData);

  const uploadedFiles = fs.readdirSync(path.join(__dirname, 'uploads', 'invoices'));
  console.log('stored files', uploadedFiles.filter((name) => name.endsWith('.pdf')));
})();
