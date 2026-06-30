import { useGoogleLogin } from '@react-oauth/google'
import { loginConGoogle } from '../services/authService'

export default function GoogleLoginButton() {
  const handleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const data = await loginConGoogle(response.access_token)
        localStorage.setItem('token', data.token)
        window.location.href = '/dashboard'
      } catch (err) {
        alert(err.message)
      }
    },
    onError: () => alert('Error con Google'),
  })

  return (
    <button onClick={() => handleLogin()}>
      Iniciar sesión con Google
    </button>
  )
}