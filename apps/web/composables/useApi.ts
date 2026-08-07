import type { CreateOrderPayload, Product } from '~/types/catalog'
import type { OrderTracking } from '~/types/tracking'

export type HomePage = {
  brandName: string
  hero: {
    title: string
    subtitle: string
    ctaLabel: string
    ctaHref: string
  }
  menu: { label: string; href: string }[]
  featured: Product[]
  contact: { phone: string; whatsapp: string; email: string }
}

export type ShopPage = {
  brandName: string
  catalogue: {
    eyebrow: string
    title: string
    categories: { id: string; label: string }[]
  }
  delivery: {
    eyebrow: string
    title: string
    text: string
    points: { id: string; title: string; text: string }[]
  }
  loyalty: {
    eyebrow: string
    title: string
    text: string
  }
  contact: { phone: string; whatsapp: string; email: string }
}

export function useApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiUrl as string

  async function getHomePage() {
    return $fetch<HomePage>(`${base}/pages/home`)
  }

  async function getShopPage() {
    return $fetch<ShopPage>(`${base}/pages/shop`)
  }

  async function getProducts(params?: { category?: string; cut?: string }) {
    return $fetch<Product[]>(`${base}/products`, { params })
  }

  async function createOrder(payload: CreateOrderPayload) {
    const { authHeaders } = useAuth()
    return $fetch<OrderTracking>(`${base}/orders`, {
      method: 'POST',
      body: payload,
      headers: authHeaders(),
    })
  }

  async function getOrderTracking(id: string) {
    return $fetch<OrderTracking>(`${base}/orders/${id}/tracking`)
  }

  async function updateOrderLocation(
    id: string,
    coords: { destLat: number; destLng: number },
  ) {
    return $fetch<OrderTracking>(`${base}/orders/${id}/location`, {
      method: 'PATCH',
      body: coords,
    })
  }

  async function updateCourierLocation(
    id: string,
    coords: { courierLat: number; courierLng: number; token?: string },
  ) {
    const q = coords.token
      ? `?token=${encodeURIComponent(coords.token)}`
      : ''
    return $fetch<OrderTracking>(`${base}/orders/${id}/courier-location${q}`, {
      method: 'PATCH',
      body: {
        courierLat: coords.courierLat,
        courierLng: coords.courierLng,
        token: coords.token,
      },
    })
  }

  function trackingStreamUrl(id: string) {
    return `${base}/orders/${id}/tracking/stream`
  }

  async function getLoyalty(phone: string) {
    return $fetch<{
      phone: string
      points: number
      pointValue: number
      valueFcfa: number
    }>(`${base}/loyalty/${encodeURIComponent(phone)}`)
  }

  async function sendContact(payload: {
    name: string
    phone?: string
    email?: string
    message: string
  }) {
    return $fetch(`${base}/contact`, {
      method: 'POST',
      body: payload,
    })
  }

  return {
    getHomePage,
    getShopPage,
    getProducts,
    createOrder,
    getOrderTracking,
    updateOrderLocation,
    updateCourierLocation,
    trackingStreamUrl,
    getLoyalty,
    sendContact,
  }
}
