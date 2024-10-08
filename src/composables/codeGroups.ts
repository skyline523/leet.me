export function useCodeGroups() {
  const initializeCodeGroups = () => {
    document.querySelectorAll('.code-group > .blocks').forEach((el) => {
      Array.from(el.children).forEach((child) => {
        child.classList.remove('active')
      })
      el.children[0]?.classList.add('active')
    })
  }

  onMounted(() => {
    if (import.meta.env.DEV) {
      initializeCodeGroups()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('click', (e) => {
        const el = e.target as HTMLInputElement

        if (el.matches('.code-group input')) {
          const group = el.parentElement?.parentElement
          if (!group)
            return

          const i = Array.from(group.querySelectorAll('input')).indexOf(el)
          if (i < 0)
            return

          const blocks = group.querySelector('.blocks')
          if (!blocks)
            return

          const current = Array.from(blocks.children).find(child =>
            child.classList.contains('active'),
          )
          if (!current)
            return

          const next = blocks.children[i]
          if (!next || current === next)
            return

          current.classList.remove('active')
          next.classList.add('active')

          const label = group.querySelector(`label[for="${el.id}"]`)
          label?.scrollIntoView({ block: 'nearest' })
        }
      })
    }
  })

  onUpdated(() => {
    if (import.meta.env.DEV) {
      initializeCodeGroups()
    }
  })
}
