import type { CartItem, Product } from '~/types/catalog'

const items = ref<CartItem[]>([])
const isOpen = ref(false)
const checkoutOpen = ref(false)

export function useCart() {
  const itemCount = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0),
  )

  const total = computed(() =>
    items.value.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  )

  function openCart() {
    isOpen.value = true
  }

  function closeCart() {
    isOpen.value = false
  }

  function openCheckout() {
    isOpen.value = false
    checkoutOpen.value = true
  }

  function closeCheckout() {
    checkoutOpen.value = false
  }

  function addItem(product: Product, qty = 1) {
    const existing = items.value.find((i) => i.product.id === product.id)
    if (existing) {
      existing.quantity += qty
    } else {
      items.value.push({ product, quantity: qty })
    }
    isOpen.value = true
  }

  function removeItem(productId: string) {
    items.value = items.value.filter((i) => i.product.id !== productId)
  }

  function setQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    const item = items.value.find((i) => i.product.id === productId)
    if (item) item.quantity = quantity
  }

  function clearCart() {
    items.value = []
  }

  return {
    items,
    itemCount,
    total,
    isOpen,
    checkoutOpen,
    openCart,
    closeCart,
    openCheckout,
    closeCheckout,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
  }
}
