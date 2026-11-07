import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import {
  applyEmailVerificationCode,
  checkPasswordResetCode,
  completePasswordReset,
  isAuthAvailable,
  requestPasswordRecovery,
  resendVerificationEmail,
} from '../../services/auth'

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="auth-brand" to="/" aria-label="Radio 99.7 FM, ir al sitio">
          <span className="brand-mark">99.7</span>
          <span><strong>Radio Continental</strong><small>Panel administrativo</small></span>
        </Link>
        {children}
      </section>
    </main>
  )
}

export function AuthUnavailablePage() {
  return (
    <AuthFrame>
      <span className="eyebrow">Acceso administrativo</span>
      <h1>Autenticación no configurada</h1>
      <p>El panel no está disponible hasta configurar Firebase. No se inició sesión ni se modificaron datos.</p>
      <Link className="button button--primary" to="/">Volver al sitio</Link>
    </AuthFrame>
  )
}

export function AdminLoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  useEffect(() => {
    if (auth.status === 'signed-in') {
      if (!auth.user.emailVerified) {
        navigate('/admin/verificar-correo', { replace: true })
      } else if (auth.role) {
        navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true })
      } else {
        navigate('/admin/sin-permiso', { replace: true })
      }
    }
  }, [auth, from, navigate])

  if (!isAuthAvailable()) return <AuthUnavailablePage />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await auth.signIn(email, password)
      navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame>
      <span className="eyebrow">Acceso seguro</span>
      <h1>Iniciar sesión</h1>
      <p>Ingresá con la cuenta administrativa habilitada por el equipo de Radio Continental.</p>
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="admin-email">Correo electrónico</label>
        <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="admin-password">Contraseña</label>
        <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
        <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
      <Link className="auth-secondary-link" to="/admin/recuperar">¿Olvidaste tu contraseña?</Link>
      <Link className="auth-back-link" to="/">Volver al sitio público</Link>
    </AuthFrame>
  )
}

export function PasswordRecoveryPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isAuthAvailable()) return <AuthUnavailablePage />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await requestPasswordRecovery(email)
      setMessage('Si existe una cuenta habilitada para esa dirección, recibirás instrucciones para recuperar el acceso.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo procesar la solicitud.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame>
      <span className="eyebrow">Recuperación segura</span>
      <h1>Recuperar contraseña</h1>
      <p>Ingresá el correo asociado a tu cuenta administrativa.</p>
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="recovery-email">Correo electrónico</label>
        <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        {message && <p className="auth-message auth-message--success" role="status">{message}</p>}
        {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
        <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Procesando…' : 'Enviar instrucciones'}</button>
      </form>
      <Link className="auth-back-link" to="/admin/login">Volver a iniciar sesión</Link>
    </AuthFrame>
  )
}

export function PasswordResetPage() {
  const [params] = useSearchParams()
  const code = params.get('oobCode') ?? ''
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    let active = true
    if (!isAuthAvailable()) {
      setBusy(false)
      return
    }
    void checkPasswordResetCode(code)
      .then((accountEmail) => {
        if (active) setEmail(accountEmail)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'El enlace no es válido.')
      })
      .finally(() => {
        if (active) setBusy(false)
      })
    return () => { active = false }
  }, [code])

  if (!isAuthAvailable()) return <AuthUnavailablePage />
  if (busy) {
    return <AuthFrame><h1>Validando enlace</h1><p>Comprobando que el enlace de recuperación siga vigente…</p></AuthFrame>
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await completePasswordReset(code, password)
      setConfirmed(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar la contraseña.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame>
      <span className="eyebrow">Recuperación segura</span>
      <h1>{confirmed ? 'Contraseña actualizada' : 'Elegir nueva contraseña'}</h1>
      {confirmed ? (
        <>
          <p>La contraseña de {email} fue actualizada. Ya podés iniciar sesión.</p>
          <Link className="button button--primary" to="/admin/login">Ir al inicio de sesión</Link>
        </>
      ) : error ? (
        <>
          <p className="auth-message auth-message--error" role="alert">{error}</p>
          <Link className="button button--primary" to="/admin/recuperar">Solicitar otro enlace</Link>
        </>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <p>Cuenta: <strong>{email}</strong></p>
          <label htmlFor="new-password">Nueva contraseña</label>
          <input id="new-password" type="password" autoComplete="new-password" minLength={10} required value={password} onChange={(event) => setPassword(event.target.value)} />
          <small>Al menos 10 caracteres, con letras y números.</small>
          {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
          <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Cambiar contraseña'}</button>
        </form>
      )}
    </AuthFrame>
  )
}

export function VerifyEmailPage() {
  const auth = useAuth()
  const [params] = useSearchParams()
  const code = params.get('oobCode') ?? ''
  const actionRef = useRef<{ code: string; promise: Promise<string> } | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(Boolean(code))

  useEffect(() => {
    let active = true
    if (!code || !isAuthAvailable()) return
    if (actionRef.current?.code !== code) {
      actionRef.current = { code, promise: applyEmailVerificationCode(code) }
    }
    const verification = actionRef.current
    if (!verification) return
    void verification.promise
      .then(async (verifiedEmail) => {
        await auth.refresh()
        if (active) {
          const currentEmail = auth.status === 'signed-in' ? auth.user.email?.toLowerCase() : undefined
          setMessage(currentEmail && currentEmail !== verifiedEmail.toLowerCase()
            ? `Se verificó ${verifiedEmail}. Iniciá sesión con esa dirección para continuar.`
            : 'Tu correo fue verificado. Ya podés continuar al panel.')
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudo verificar el correo.')
      })
      .finally(() => {
        if (active) setBusy(false)
      })
    return () => { active = false }
  }, [auth.refresh, code])

  async function resend() {
    if (auth.status !== 'signed-in') return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await resendVerificationEmail(auth.user)
      setMessage('Si el servicio de correo está configurado, recibirás un nuevo enlace de verificación.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo solicitar la verificación.')
    } finally {
      setBusy(false)
    }
  }

  if (!isAuthAvailable()) return <AuthUnavailablePage />
  if (busy) return <AuthFrame><h1>Verificando correo</h1><p>Comprobando el enlace…</p></AuthFrame>

  return (
    <AuthFrame>
      <span className="eyebrow">Verificación de cuenta</span>
      <h1>{auth.status === 'signed-in' && !auth.user.emailVerified ? 'Verificá tu correo' : 'Verificación de correo'}</h1>
      <p>
        {auth.status === 'signed-in'
          ? auth.user.emailVerified
            ? `El correo de ${auth.user.email ?? 'tu cuenta'} ya está verificado.`
            : `La cuenta ${auth.user.email ?? ''} debe tener el correo verificado para acceder al panel.`
          : message
            ? 'El enlace fue procesado. Iniciá sesión para continuar.'
            : 'Abrí el enlace de verificación enviado por Firebase o iniciá sesión con tu cuenta.'}
      </p>
      {message && <p className="auth-message auth-message--success" role="status">{message}</p>}
      {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
      {auth.status === 'signed-in' && !auth.user.emailVerified && (
        <button className="button button--primary" type="button" disabled={busy} onClick={() => void resend()}>
          {busy ? 'Solicitando…' : 'Reenviar correo de verificación'}
        </button>
      )}
      <Link className="auth-back-link" to="/admin/login">Ir al inicio de sesión</Link>
    </AuthFrame>
  )
}

export function AccessDeniedPage() {
  const auth = useAuth()
  return (
    <AuthFrame>
      <span className="eyebrow">Acceso restringido</span>
      <h1>Cuenta sin permisos</h1>
      <p>Esta cuenta no tiene un rol administrativo habilitado. Los permisos solo pueden asignarse desde un entorno confiable.</p>
      {auth.status === 'signed-in' && (
        <button className="button button--primary" type="button" onClick={() => void auth.signOut()}>Cerrar sesión</button>
      )}
      <Link className="auth-back-link" to="/">Volver al sitio público</Link>
    </AuthFrame>
  )
}
