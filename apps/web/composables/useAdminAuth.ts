export type AdminSession = {
  id: string
  email: string
  name: string
  picture?: string | null
  typ: 'admin'
}

type AdminLoginResponse = {
  accessToken: string
  admin: AdminSession
}

const TOKEN_KEY = 'rub_admin_token'

export function useAdminAuth() {
  const config = useRuntimeConfig()
  const base = config.public.apiUrl as string

  const token = useState<string | null>('admin-token', () => null)
  const admin = useState<AdminSession | null>('admin-user', () => null)
  const ready = useState('admin-auth-ready', () => false)

  function loadToken() {
    if (!import.meta.client) return null
    const saved = localStorage.getItem(TOKEN_KEY)
    token.value = saved
    return saved
  }

  function saveToken(value: string | null) {
    token.value = value
    if (!import.meta.client) return
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
  }

  function authHeaders(): Record<string, string> {
    const t = token.value || (import.meta.client ? localStorage.getItem(TOKEN_KEY) : null)
    return t ? { Authorization: `Bearer ${t}` } : {}
  }

  async function fetchStatus() {
    return $fetch<{
      googleEnabled: boolean
      clientId: string | null
      allowlistConfigured: boolean
      allowlistCount: number
    }>(`${base}/auth/admin/status`)
  }

  async function loginWithPassword(identifier: string, password: string) {
    const res = await $fetch<AdminLoginResponse>(`${base}/auth/admin/login`, {
      method: 'POST',
      body: { identifier, password },
    })
    saveToken(res.accessToken)
    admin.value = res.admin
    return res
  }

  async function loginWithGoogleCredential(credential: string) {
    const res = await $fetch<AdminLoginResponse>(`${base}/auth/admin/google`, {
      method: 'POST',
      body: { credential },
    })
    saveToken(res.accessToken)
    admin.value = res.admin
    return res
  }

  async function loginBootstrap(email: string, secret: string) {
    const res = await $fetch<AdminLoginResponse>(`${base}/auth/admin/bootstrap`, {
      method: 'POST',
      body: { email, secret },
    })
    saveToken(res.accessToken)
    admin.value = res.admin
    return res
  }

  function acceptToken(accessToken: string) {
    saveToken(accessToken)
  }

  async function refreshMe() {
    const t = token.value || loadToken()
    if (!t) {
      admin.value = null
      ready.value = true
      return null
    }
    try {
      admin.value = await $fetch<AdminSession>(`${base}/auth/admin/me`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      return admin.value
    } catch {
      saveToken(null)
      admin.value = null
      return null
    } finally {
      ready.value = true
    }
  }

  function logout() {
    saveToken(null)
    admin.value = null
  }

  async function ensureSession() {
    if (ready.value && admin.value) return admin.value
    loadToken()
    return refreshMe()
  }

  const isLoggedIn = computed(() => !!admin.value && !!token.value)

  const googleStartUrl = `${base}/auth/admin/google/start`

  return {
    token,
    admin,
    ready,
    isLoggedIn,
    authHeaders,
    fetchStatus,
    loginWithPassword,
    loginWithGoogleCredential,
    loginBootstrap,
    acceptToken,
    refreshMe,
    logout,
    ensureSession,
    googleStartUrl,
  }
}
