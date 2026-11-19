import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

function authError(error) {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Neteisingas el. paštas arba slaptažodis.'
    case 'email_not_confirmed':
      return 'Patvirtink el. pašto adresą ir bandyk prisijungti dar kartą.'
    case 'weak_password':
      return 'Slaptažodis per silpnas. Pasirink stipresnį slaptažodį.'
    case 'user_already_exists':
      return 'Šiuo el. paštu jau užregistruota paskyra.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Per daug bandymų. Palauk ir bandyk dar kartą.'
    case 'signup_disabled':
      return 'Šiuo metu naujų paskyrų registracija išjungta.'
    default:
      return 'Veiksmo atlikti nepavyko. Patikrink ryšį ir bandyk dar kartą.'
  }
}

export function AuthGate({ children }) {
  const [session, setSession] = useState(undefined)
  const [signedOut, setSignedOut] = useState(false)

  useEffect(() => {
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) setSignedOut(false)
      setSession(nextSession)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session) {
    return children(session.user.id, async () => {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      setSignedOut(true)
    })
  }

  return (
    <div className="app">
      <aside className="sidebar"><div className="brand">Pocket Planner</div></aside>
      <main className="main">
        <header className="top"><h1>Prisijungimas</h1></header>
        <section className="card auth-card">
          {!supabase ? (
            <p role="alert">Prisijungimui nustatyk Supabase projekto URL ir viešąjį raktą faile .env.local.</p>
          ) : session === undefined ? (
            <p role="status">Tikrinama prisijungimo būsena…</p>
          ) : (
            <AuthForm signedOut={signedOut} dismissSignedOut={() => setSignedOut(false)} />
          )}
        </section>
      </main>
    </div>
  )
}

function AuthForm({ signedOut, dismissSignedOut }) {
  const [registering, setRegistering] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const credentials = { email: fields.get('email').trim(), password: fields.get('password') }

    dismissSignedOut()
    setPending(true)
    setError('')
    setSuccess('')
    try {
      const result = registering
        ? await supabase.auth.signUp({
          ...credentials,
          options: { emailRedirectTo: window.location.origin },
        })
        : await supabase.auth.signInWithPassword(credentials)
      if (result.error) throw result.error

      if (registering && !result.data.session) {
        setRegistering(false)
        setSuccess('Patikrink el. paštą ir paspausk paskyros patvirtinimo nuorodą.')
      }
    } catch (failure) {
      setError(authError(failure))
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div className="tabs" role="group" aria-label="Paskyros veiksmas">
        {[false, true].map((mode) => (
          <button key={String(mode)} className={mode === registering ? 'active' : ''}
            aria-pressed={mode === registering} disabled={pending} onClick={() => {
              dismissSignedOut()
              setRegistering(mode)
              setError('')
              setSuccess('')
            }}>
            {mode ? 'Registracija' : 'Prisijungimas'}
          </button>
        ))}
      </div>
      <form onSubmit={submit} aria-busy={pending}>
        <label className="field">
          <span>El. paštas</span>
          <input name="email" type="email" autoComplete="email" required disabled={pending} />
        </label>
        <label className="field section">
          <span>Slaptažodis</span>
          <input key={String(registering)} name="password" type="password" required disabled={pending}
            autoComplete={registering ? 'new-password' : 'current-password'} />
        </label>
        {error && <p className="notice" role="alert">{error}</p>}
        {(success || signedOut) && <p className="success" role="status">{success || 'Sėkmingai atsijungei.'}</p>}
        <div className="form-actions">
          <button className="btn" disabled={pending}>
            {pending ? 'Palauk…' : registering ? 'Sukurti paskyrą' : 'Prisijungti'}
          </button>
        </div>
      </form>
    </>
  )
}
