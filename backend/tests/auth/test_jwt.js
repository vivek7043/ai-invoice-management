;(async () => {
  const ts = Date.now()
  const email = `test${ts}@example.com`
  const pwd = 'TestPass123'

  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Node Tester', email, password: pwd, rememberMe: false }),
    })
    console.log('register status', res.status)
    console.log(await res.text())
  } catch (e) {
    console.error('register error', e)
  }

  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pwd }),
    })
    console.log('login status', loginRes.status)
    const loginData = await loginRes.json()
    console.log(loginData)

    if (loginData.token) {
      const me = await fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: 'Bearer ' + loginData.token },
      })
      console.log('me status', me.status)
      console.log(await me.text())
    }
  } catch (e) {
    console.error('login error', e)
  }
})()
