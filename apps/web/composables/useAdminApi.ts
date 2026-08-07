export type AdminStats = {
  products: number
  categories: number
  orders: number
  pendingOrders: number
  messages: number
  loyaltyAccounts: number
  revenue: number
}

export type AdminCategory = {
  id: string
  label: string
  description: string | null
  image: string | null
  sortOrder: number
  active: boolean
  _count?: { products: number }
}

export type AdminProduct = {
  id: string
  name: string
  description: string
  price: number
  unit: string
  categoryId: string
  category: string
  cut: string
  image: string
  badge: string | null
  popular: boolean
  active: boolean
}

export type AdminOrder = {
  id: string
  invoiceNumber?: string | null
  customerName: string
  phone: string
  address: string
  note: string | null
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED'
  total: number
  subtotal?: number
  deliveryFee?: number
  createdAt: string
  courierId?: string | null
  courierName?: string | null
  courierPhone?: string | null
  zoneId?: string | null
  zoneName?: string | null
  prepSeconds?: number
  durationSeconds?: number | null
  estimatedArrivalAt?: string | null
  trackingToken?: string | null
  livreurPath?: string
  items: {
    id: string
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }[]
}

export type AdminCourier = {
  id: string
  name: string
  phone: string
  active: boolean
  available: boolean
  sortOrder: number
  _count?: { orders: number }
}

export type AdminZone = {
  id: string
  name: string
  keywords: string
  fee: number
  durationMinutes: number
  prepMinutes: number
  active: boolean
  sortOrder: number
  _count?: { orders: number }
}

export type AdminDeliverySettings = {
  id: string
  defaultPrepMinutes: number
  defaultDurationMinutes: number
  defaultFee: number
  useMapsEstimate: boolean
}

export type AdminInvoice = {
  id: string
  invoiceNumber: string | null
  customerName: string
  phone: string
  address: string
  status: string
  total: number
  itemCount: number
  createdAt: string
  courierName: string | null
}

export type AdminContent = {
  id: string
  brandName: string
  heroTitle: string
  heroSubtitle: string
  ctaLabel: string
  deliveryEyebrow: string
  deliveryTitle: string
  deliveryText: string
  deliveryFast: string
  deliveryHours: string
  deliveryZones: string
  loyaltyEyebrow: string
  loyaltyTitle: string
  loyaltyText: string
  phone: string
  whatsapp: string
  email: string
}

export type AdminMessage = {
  id: string
  name: string
  phone: string | null
  email: string | null
  message: string
  createdAt: string
}

export type AdminLoyalty = {
  id: string
  phone: string
  points: number
  createdAt: string
}

export function useAdminApi() {
  const config = useRuntimeConfig()
  const base = `${config.public.apiUrl as string}/admin`
  const { authHeaders } = useAdminAuth()

  function api<T>(url: string, opts: Parameters<typeof $fetch<T>>[1] = {}) {
    return $fetch<T>(url, {
      ...opts,
      headers: {
        ...(opts?.headers || {}),
        ...authHeaders(),
      },
    })
  }

  return {
    stats: () => api<AdminStats>(`${base}/stats`),
    categories: () => api<AdminCategory[]>(`${base}/categories`),
    createCategory: (body: Partial<AdminCategory> & { id: string; label: string }) =>
      api<AdminCategory>(`${base}/categories`, { method: 'POST', body }),
    updateCategory: (id: string, body: Partial<AdminCategory>) =>
      api<AdminCategory>(`${base}/categories/${id}`, { method: 'PATCH', body }),
    deleteCategory: (id: string) =>
      api(`${base}/categories/${id}`, { method: 'DELETE' }),
    products: () => api<AdminProduct[]>(`${base}/products`),
    createProduct: (body: Record<string, unknown>) =>
      api<AdminProduct>(`${base}/products`, { method: 'POST', body }),
    updateProduct: (id: string, body: Record<string, unknown>) =>
      api<AdminProduct>(`${base}/products/${id}`, { method: 'PATCH', body }),
    deleteProduct: (id: string) =>
      api(`${base}/products/${id}`, { method: 'DELETE' }),
    orders: () => api<AdminOrder[]>(`${base}/orders`),
    createOrder: (body: {
      customerName: string
      phone: string
      address: string
      note?: string
      items: { productId: string; quantity: number }[]
    }) => api(`${base}/orders`, { method: 'POST', body }),
    invoices: () => api<AdminInvoice[]>(`${base}/invoices`),
    invoice: (id: string) => api(`${base}/invoices/${id}`),
    updateOrderStatus: (id: string, status: AdminOrder['status']) =>
      api<AdminOrder>(`${base}/orders/${id}/status`, {
        method: 'PATCH',
        body: { status },
      }),
    updateOrderTracking: (
      id: string,
      body: {
        courierId?: string
        prepSeconds?: number
        durationSeconds?: number
        addMinutes?: number
        markDeparted?: boolean
        markArrived?: boolean
        status?: AdminOrder['status']
      },
    ) => api(`${base}/orders/${id}/tracking`, { method: 'PATCH', body }),
    couriers: () => api<AdminCourier[]>(`${base}/couriers`),
    createCourier: (body: Partial<AdminCourier> & { name: string; phone: string }) =>
      api<AdminCourier>(`${base}/couriers`, { method: 'POST', body }),
    updateCourier: (id: string, body: Partial<AdminCourier>) =>
      api<AdminCourier>(`${base}/couriers/${id}`, { method: 'PATCH', body }),
    deleteCourier: (id: string) =>
      api(`${base}/couriers/${id}`, { method: 'DELETE' }),
    zones: () => api<AdminZone[]>(`${base}/zones`),
    createZone: (body: Partial<AdminZone> & { name: string; keywords: string }) =>
      api<AdminZone>(`${base}/zones`, { method: 'POST', body }),
    updateZone: (id: string, body: Partial<AdminZone>) =>
      api<AdminZone>(`${base}/zones/${id}`, { method: 'PATCH', body }),
    deleteZone: (id: string) =>
      api(`${base}/zones/${id}`, { method: 'DELETE' }),
    deliverySettings: () => api<AdminDeliverySettings>(`${base}/delivery-settings`),
    updateDeliverySettings: (body: Partial<AdminDeliverySettings>) =>
      api<AdminDeliverySettings>(`${base}/delivery-settings`, {
        method: 'PATCH',
        body,
      }),
    seedDelivery: () => api(`${base}/delivery/seed`, { method: 'POST' }),
    content: () => api<AdminContent>(`${base}/content`),
    updateContent: (body: Partial<AdminContent>) =>
      api<AdminContent>(`${base}/content`, { method: 'PATCH', body }),
    messages: () => api<AdminMessage[]>(`${base}/messages`),
    deleteMessage: (id: string) =>
      api(`${base}/messages/${id}`, { method: 'DELETE' }),
    loyalty: () => api<AdminLoyalty[]>(`${base}/loyalty`),
    adminAccounts: () =>
      api<
        {
          id: string
          email: string
          username: string
          name: string
          active: boolean
          createdAt: string
        }[]
      >(`${base}/accounts`),
    createAdminAccount: (body: {
      email: string
      username: string
      name: string
      password: string
    }) => api(`${base}/accounts`, { method: 'POST', body }),
    updateAdminAccount: (
      id: string,
      body: Partial<{
        email: string
        username: string
        name: string
        password: string
        active: boolean
      }>,
    ) => api(`${base}/accounts/${id}`, { method: 'PATCH', body }),
    deleteAdminAccount: (id: string) =>
      api(`${base}/accounts/${id}`, { method: 'DELETE' }),
    adminAuthSettings: () =>
      api<{
        googleClientId: string
        googleAllowedEmails: string
        googleClientSecretSet: boolean
      }>(`${base}/auth-settings`),
    updateAdminAuthSettings: (body: {
      googleClientId?: string
      googleClientSecret?: string
      googleAllowedEmails?: string
    }) => api(`${base}/auth-settings`, { method: 'PATCH', body }),
    notifications: () =>
      api<
        {
          id: string
          event: string
          channel: string
          title: string
          body: string
          status: string
          phone: string | null
          email: string | null
          createdAt: string
        }[]
      >(`${base}/notifications`),
    notificationSettings: () =>
      api<{
        emailEnabled: boolean
        smsEnabled: boolean
        pushEnabled: boolean
        inAppEnabled: boolean
        notifyPlaced: boolean
        notifyPreparing: boolean
        notifyDeparted: boolean
        notifyDelivered: boolean
        notifyCancelled: boolean
      }>(`${base}/notification-settings`),
    updateNotificationSettings: (
      body: Partial<{
        emailEnabled: boolean
        smsEnabled: boolean
        pushEnabled: boolean
        inAppEnabled: boolean
        notifyPlaced: boolean
        notifyPreparing: boolean
        notifyDeparted: boolean
        notifyDelivered: boolean
        notifyCancelled: boolean
      }>,
    ) => api(`${base}/notification-settings`, { method: 'PATCH', body }),
  }
}
