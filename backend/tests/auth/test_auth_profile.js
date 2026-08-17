const assert = require('assert');

(async () => {
  const baseUrl = 'http://localhost:5000/api/auth';
  const email = `profile_test_${Date.now()}@example.com`;
  const password = 'TestPass123';

  try {
    const registerRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Profile Tester', email, password, rememberMe: false }),
    });

    assert.strictEqual(registerRes.status, 201, 'register should succeed');

    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    assert.strictEqual(loginRes.status, 200, 'login should succeed');
    const loginData = await loginRes.json();
    assert.ok(loginData.token, 'login response should include a token');

    const noTokenRes = await fetch(`${baseUrl}/profile`);
    assert.strictEqual(noTokenRes.status, 401, 'profile should require a token');

    const invalidTokenRes = await fetch(`${baseUrl}/profile`, {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    assert.strictEqual(invalidTokenRes.status, 401, 'profile should reject invalid tokens');

    const validTokenRes = await fetch(`${baseUrl}/profile`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    assert.strictEqual(validTokenRes.status, 200, 'profile should return user data for valid token');

    const profileData = await validTokenRes.json();
    assert.ok(profileData.user, 'profile response should include user data');
    assert.strictEqual(profileData.user.email, email, 'profile should return the authenticated user');

    console.log('Profile route tests passed');
  } catch (error) {
    console.error('Profile route tests failed');
    console.error(error);
    process.exitCode = 1;
  }
})();
