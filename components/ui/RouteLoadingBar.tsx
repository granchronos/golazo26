'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function RouteLoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const prevPath = useRef(pathname)

  // Intercept link clicks to detect navigation start
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return
      if (href !== prevPath.current) {
        setLoading(true)
      }
    }

    // Also detect form submissions (server actions trigger navigation)
    const handleSubmit = () => setLoading(true)

    document.addEventListener('click', handleClick, true)
    document.addEventListener('submit', handleSubmit, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('submit', handleSubmit, true)
    }
  }, [])

  // When pathname changes, navigation is complete
  useEffect(() => {
    prevPath.current = pathname
    setLoading(false)
  }, [pathname, searchParams])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0.7, transition: { duration: 1.5, ease: 'easeOut' } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.2 } }}
          className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#2A398D] via-[#3CAC3B] to-[#C9A84C] z-[200] origin-left"
        />
      )}
    </AnimatePresence>
  )
}
