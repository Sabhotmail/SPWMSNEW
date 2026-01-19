import * as React from "react"

// ใช้ 1280 เพื่อให้ Tablet (รวม iPad Pro) ใช้ Sheet sidebar เหมือน Mobile
const MOBILE_BREAKPOINT = 1280
const TABLET_BREAKPOINT = 1280

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= 768 && width < TABLET_BREAKPOINT)
    }

    const mql = window.matchMedia(`(min-width: 768px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkTablet)
    checkTablet()
    return () => mql.removeEventListener("change", checkTablet)
  }, [])

  return !!isTablet
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  React.useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize('mobile')
      } else if (width < 1280) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    window.addEventListener("resize", checkSize)
    checkSize()
    return () => window.removeEventListener("resize", checkSize)
  }, [])

  return screenSize
}
