export type Customer = {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  createdAt?: string
  points?: number
  pointValue?: number
  pointsValueFcfa?: number
  orderCount?: number
}

type AuthResponse = {
  accessToken: string
  customer: Customer
}

const TOKEN_KEY = 'rub_customer_token'

export function useAuth() {
  const config = useRuntimeConfig()
  const base = config.public.apiUrl as string

  const token = useState<string | null>('auth-token', () => null)
  const customer = useState<Customer | null>('auth-customer', () => null)
  const ready = useState('auth-ready', () => false)

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

  function authHeaders() {
    const t = token.value || (import.meta.client ? localStorage.getItem(TOKEN_KEY) : null)
    return t ? { Authorization: `Bearer ${t}` } : {}
  }

  async function register(payload: {
    name: string
    phone: string
    password: string
    email?: string
    address?: string
  }) {
    const res = await $fetch<AuthResponse>(`${base}/auth/register`, {
      method: 'POST',
      body: payload,
    })
    saveToken(res.accessToken)
    customer.value = res.customer
    await refreshMe()
    return res
  }

  async function login(payload: { phone: string; password: string }) {
    const res = await $fetch<AuthResponse>(`${base}/auth/login`, {
      method: 'POST',
      body: payload,
    })
    saveToken(res.accessToken)
    customer.value = res.customer
    await refreshMe()
    return res
  }

  function logout() {
    saveToken(null)
    customer.value = null
  }

  async function refreshMe() {
    const t = token.value || loadToken()
    if (!t) {
      customer.value = null
      ready.value = true
      return null
    }
    try {
      const me = await $fetch<Customer>(`${base}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      customer.value = me
      ready.value = true
      return me
    } catch {
      logout()
      ready.value = true
      return null
    }
  }

  async function updateProfile(payload: {
    name?: string
    email?: string
    address?: string
    password?: string
  }) {
    const me = await $fetch<Customer>(`${base}/auth/me`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: payload,
    })
    customer.value = { ...customer.value, ...me }
    return me
  }

  async function myOrders() {
    return $fetch<
      {
        id: string
        invoiceNumber: string | null
        status: string
        total: number
        pointsRedeemed?: number
        pointsDiscount?: number
        amountDue?: number
        paymentMethod?: string
        address: string
        createdAt: string
        courierName: string | null
        items: { productName: string; quantity: number; unitPrice: number }[]
      }[]
    >(`${base}/auth/me/orders`, { headers: authHeaders() })
  }

  async function ensureSession() {
    if (ready.value) return customer.value
    loadToken()
    return refreshMe()
  }

  const isLoggedIn = computed(() => !!customer.value && !!token.value)

  return {
    token,
    customer,
    ready,
    isLoggedIn,
    authHeaders,
    register,
    login,
    logout,
    refreshMe,
    updateProfile,
    myOrders,
    ensureSession,
  }
}
