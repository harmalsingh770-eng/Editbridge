// pages/login.js
import { useState } from 'react'
import { useRouter } from 'next/router'
import { signUp, signIn, upsertUser, getUser } from '../lib/db'
import { useAuth } from '../lib/AuthContext'
import { Button, Input } from '../components/ui'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [mode, setMode]       = useState('login')
  const [role, setRole]       = useState('client')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)

  const doLogin = (uid, emailAddr, displayName, redirect = '/') => {
    const authUser = { uid, email: emailAddr, displayName }
    login(authUser)
    router.push(redirect)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { uid } = signUp(email, password, name, role)
        upsertUser(uid, { uid, email, name, role, user_access: 'locked', user_credit: 0 })
        toast.success(`Welcome to EditBridge, ${name}!`)
        doLogin(uid, email, name)
      } else {
        const { uid } = signIn(email, password)
        const u = getUser(uid)
        toast.success('Welcome back!')
        doLogin(uid, email, u?.name || email)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // One-click admin login
  const handleAdminLogin = () => {
    setLoading(true)
    try {
      const { uid } = signIn('admin@editbridge.com', 'Gurnek191108')
      const u = getUser(uid)
      toast.success('Signed in as Admin')
      doLogin(uid, 'admin@editbridge.com', u?.name || 'Admin', '/admin')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12">
      {/* Admin quick-access — fixed top left */}
      <button
        onClick={handleAdminLogin}
        disabled={loading}
        className="fixed top-20 left-4 z-40 flex items-center gap-2 px-3 py-2 bg-ink-900 text-cream-50 rounded-lg text-xs font-mono font-medium shadow-lg hover:bg-ink-700 transition-all hover:scale-105 border border-ink-700 group"
        title="One-click admin login"
      >
        <span className="text-cinnabar-400">⚡</span>
        <span>Admin</span>
      </button>

      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-cinnabar-500 mb-2">
            {mode === 'login' ? 'Welcome back' : 'Get started'}
          </p>
          <h1 className="font-display text-4xl text-ink-900">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 shadow-sm p-8">
          {mode === 'signup' && (
            <div className="mb-6">
              <p className="text-sm font-medium text-ink-700 mb-3">I am a…</p>
              <div className="grid grid-cols-2 gap-2">
                {['client', 'editor'].map((r) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`py-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                      role === r ? 'bg-ink-800 text-cream-50 border-ink-800' : 'border-ink-200 text-ink-600 hover:border-ink-400'
                    }`}>
                    {r === 'client' ? '🎬 Client' : '✂️ Editor'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input label="Full name" type="text" value={name}
                onChange={e => setName(e.target.value)} placeholder="Alex Kumar" required />
            )}
            <Input label="Email address" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            <Input label="Password" type="password" value={password}
              onChange={e => setPass(e.target.value)} placeholder="••••••••" required minLength={6} />
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-cinnabar-500 hover:underline font-medium">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-ink-400 mt-4">
          Tap <span className="font-mono text-ink-600">⚡ Admin</span> (top-left) for instant admin access
        </p>
      </div>
    </div>
  )
}
