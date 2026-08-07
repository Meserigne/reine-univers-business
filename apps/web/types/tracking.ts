export type OrderTracking = {
  id: string
  invoiceNumber?: string | null
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'
  phase: 'preparing' | 'on_the_way' | 'delivered' | 'cancelled'
  customerName: string
  address: string
  phone: string
  total: number
  subtotal?: number
  deliveryFee?: number
  paymentMethod?: string
  pointsRedeemed?: number
  pointsDiscount?: number
  amountDue?: number
  pointValue?: number
  courierId?: string | null
  courierName: string | null
  courierPhone: string | null
  zoneId?: string | null
  zoneName?: string | null
  distanceMeters: number | null
  distanceLabel: string | null
  durationSeconds: number | null
  prepSeconds: number
  estimatedArrivalAt: string | null
  remainingSeconds: number
  progress: number
  etaSource: string | null
  mapsUrl: string | null
  navigationUrl?: string | null
  destLat: number | null
  destLng: number | null
  storeLat: number | null
  storeLng: number | null
  courierLat?: number | null
  courierLng?: number | null
  courierLocationAt?: string | null
  hasGps?: boolean
  courierLive?: boolean
  createdAt: string
  items: {
    id: string
    productName: string
    quantity: number
    unitPrice: number
  }[]
}
