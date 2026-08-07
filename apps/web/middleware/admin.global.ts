export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/connexion') return

  const { ensureSession, isLoggedIn } = useAdminAuth()
  await ensureSession()

  if (!isLoggedIn.value) {
    return navigateTo(`/admin/connexion?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
