export async function loginConGoogle(googleToken) {
  const res = await fetch('/api/auth/google-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: googleToken }),
  })

  const data = await res.json()
  
  if (!res.ok) {
    const err = new Error(data.error || 'Error al iniciar sesión con Google')
    err.status = res.status
    throw err
  }

  return data
}