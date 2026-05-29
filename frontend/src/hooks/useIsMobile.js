import { useState, useEffect } from 'react'

const MOBILE_BP = 768
const TABLET_BP = 1024

function getBreakpoint(w) {
  if (w < MOBILE_BP) return 'mobile'
  if (w < TABLET_BP) return 'tablet'
  return 'desktop'
}

/**
 * Returns 'mobile' | 'tablet' | 'desktop' based on viewport width.
 * Uses debounced resize listener for performance.
 */
export function useBreakpoint() {
  const [bp, setBp] = useState(() => getBreakpoint(window.innerWidth))

  useEffect(() => {
    let timer
    const handler = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setBp(getBreakpoint(window.innerWidth)), 100)
    }
    window.addEventListener('resize', handler)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handler)
    }
  }, [])

  return bp
}

/** Returns true when viewport < 768px */
export function useIsMobile() {
  const bp = useBreakpoint()
  return bp === 'mobile'
}

/** Returns true when viewport is 768–1023px */
export function useIsTablet() {
  const bp = useBreakpoint()
  return bp === 'tablet'
}

export default useIsMobile
