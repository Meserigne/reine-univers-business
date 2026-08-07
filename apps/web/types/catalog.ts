export type Category = string

export type Product = {
  id: string
  name: string
  description: string
  price: number
  unit: string
  category: Category
  categoryId?: string
  cut: string
  image: string
  badge?: string | null
  popular?: boolean
}

export type CartItem = {
  product: Product
  quantity: number
}

export type CreateOrderPayload = {
  customerName: string
  phone: string
  address: string
  note?: string
  destLat?: number
  destLng?: number
  pointsToUse?: number
  items: { productId: string; quantity: number }[]
}

export const categoryLabels: Record<string, string> = {
  poulet: 'Poulet',
  oeuf: 'Œufs',
  mouton: 'Mouton',
  veau: 'Veau',
  porc: 'Porc',
}

export function formatPrice(amount: number): string {
  return (
    new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount) + ' F CFA'
  )
}
