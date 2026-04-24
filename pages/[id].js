// pages/editor/[id].js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getEditorProfile, getUser, getOrCreateChat, createDeal } from '../../lib/db'
import { useAuth } from '../../lib/AuthContext'
import { Button, Badge, Spinner, Card } from '../../components/ui'
import DealModal from '../../components/editor/DealModal'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function EditorProfilePage() {
  const router = useRouter()
  const { id }  = router.query
  const { user, profile } = useAuth()

  const [editor, setEditor]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [dealOpen, setDealOpen]   = useState(false)
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const editorProfile = getEditorProfile(id)
    const userDoc = getUser(id)
    setEditor({ ...(editorProfile || {}), ...(userDoc || {}) })
    setLoading(false)
  }, [id])

  const handleChat = () => {
    if (!user) { router.push('/login'); return }
    if (profile?.user_access !== 'unlocked') {
      toast.error('You need to unlock chat first.')
      return
    }
    setChatLoading(true)
    try {
      const chatId = getOrCreateChat(user.uid, id)
      router.push(`/chat?chatId=${chatId}`)
    } catch {
      toast.error('Failed to open chat')
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (!editor?.name) return <div className="text-center py-24 text-ink-500">Editor not found.</div>

  const { name, bio, skills = [], portfolioLinks = [], pricing, approved } = editor
  const colors = ['bg-amber-200', 'bg-rose-200', 'bg-sky-200', 'bg-violet-200', 'bg-emerald-200']
  const colorIdx = (name?.charCodeAt(0) || 0) % colors.length
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 page-enter">
      <Link href="/" className="text-sm text-ink-400 hover:text-ink-700 flex items-center gap-1 mb-8 transition-colors">
        ← All editors
      </Link>

      <div className="flex items-start gap-5 mb-8">
        <div className={`w-20 h-20 rounded-2xl ${colors[colorIdx]} flex items-center justify-center text-2xl font-display font-bold text-ink-700 shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-3xl text-ink-900">{name}</h1>
            {approved && <Badge variant="approved">Verified Editor</Badge>}
          </div>
          {pricing && <p className="text-cinnabar-500 font-mono mt-1">Starting at ₹{pricing}/project</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {bio && (
            <Card className="p-5">
              <h2 className="font-display text-lg text-ink-800 mb-3">About</h2>
              <p className="text-ink-600 text-sm leading-relaxed whitespace-pre-line">{bio}</p>
            </Card>
          )}
          {skills.length > 0 && (
            <Card className="p-5">
              <h2 className="font-display text-lg text-ink-800 mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-ink-50 border border-ink-100 rounded-lg text-sm text-ink-700 font-mono">{skill}</span>
                ))}
              </div>
            </Card>
          )}
          {portfolioLinks.length > 0 && (
            <Card className="p-5">
              <h2 className="font-display text-lg text-ink-800 mb-3">Portfolio</h2>
              <div className="space-y-2">
                {portfolioLinks.map((link, i) => (
                  <a key={i} href={link.startsWith('http') ? link : `https://${link}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-cinnabar-500 hover:underline">
                    <span>🔗</span><span className="truncate">{link}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h3 className="font-medium text-ink-800 text-sm">Connect</h3>
            {user?.uid === id ? (
              <Link href="/editor/profile">
                <Button variant="outline" className="w-full">Edit my profile</Button>
              </Link>
            ) : (
              <>
                <Button onClick={handleChat} loading={chatLoading} className="w-full" disabled={!user}>
                  💬 Message editor
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  if (!user) { router.push('/login'); return }
                  setDealOpen(true)
                }}>
                  🤝 Send deal proposal
                </Button>
                {user && profile?.user_access !== 'unlocked' && (
                  <p className="text-xs text-ink-400 text-center">
                    <Link href="/payment" className="text-cinnabar-500 hover:underline">Unlock chat</Link>{' '}to send messages
                  </p>
                )}
              </>
            )}
          </Card>
          {pricing && (
            <Card className="p-5">
              <p className="text-xs text-ink-400 font-mono uppercase mb-1">Pricing</p>
              <p className="font-display text-2xl text-ink-900">₹{pricing}</p>
              <p className="text-xs text-ink-400 mt-1">per project</p>
            </Card>
          )}
        </div>
      </div>

      <DealModal open={dealOpen} onClose={() => setDealOpen(false)} editorId={id} editorName={name} />
    </main>
  )
}
