export async function loginConGoogle(googleToken) {
  const res = await fetch('/api/auth/google-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: googleToken }),
  })

  const data = await res.json()
  
  if (!res.ok) {
    const mensaje =
      data?.non_field_errors?.[0] ||   
      data?.error ||
      data?.detail ||
      'Error al iniciar sesión con Google'

    const err = new Error(mensaje)
    err.status = res.status
    throw err
  }

  return data
}