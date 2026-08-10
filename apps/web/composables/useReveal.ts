/**
 * Ajoute `.is-in` aux éléments `.reveal` à l’entrée dans le viewport.
 */
export function useReveal(root?: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (import.meta.server) return
    const scope: ParentNode = root?.value ?? document

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scope.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'))
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            observer?.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    const bind = () => {
      scope.querySelectorAll('.reveal:not(.is-in)').forEach((el) => {
        observer?.observe(el)
      })
    }
    bind()
    window.setTimeout(bind, 400)
    window.setTimeout(bind, 1200)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })
}
