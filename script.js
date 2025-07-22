const CONFIG = {
  animations: {
    duration: 300,
    easing: "ease-out",
    stagger: 100,
  },

  scroll: {
    throttleDelay: 16,
    offsetThreshold: 300,
  },

  breakpoints: {
    mobile: 768,
    tablet: 1024,
  },
}

const Utils = {
  throttle(func, delay) {
    let timeoutId
    let lastExecTime = 0
    return function (...args) {
      const currentTime = Date.now()

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args)
        lastExecTime = currentTime
      } else {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(
          () => {
            func.apply(this, args)
            lastExecTime = Date.now()
          },
          delay - (currentTime - lastExecTime),
        )
      }
    }
  },

  debounce(func, delay) {
    let timeoutId
    return function (...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  },

  supports: {
    intersectionObserver: "IntersectionObserver" in window,
    requestIdleCallback: "requestIdleCallback" in window,
    passiveEvents: (() => {
      let supportsPassive = false
      try {
        const opts = Object.defineProperty({}, "passive", {
          get() {
            supportsPassive = true
            return true
          },
        })
        window.addEventListener("testPassive", null, opts)
        window.removeEventListener("testPassive", null, opts)
      } catch (e) {}
      return supportsPassive
    })(),
  },

  device: {
    isMobile: () => window.innerWidth <= CONFIG.breakpoints.mobile,
    isTablet: () => window.innerWidth <= CONFIG.breakpoints.tablet && window.innerWidth > CONFIG.breakpoints.mobile,
    isDesktop: () => window.innerWidth > CONFIG.breakpoints.tablet,
    isTouchDevice: () => "ontouchstart" in window || navigator.maxTouchPoints > 0,
    prefersReducedMotion: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  },

  smoothScrollTo(element, offset = 0) {
    const targetPosition = element.offsetTop - offset
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    })
  },

  random(min, max) {
    return Math.random() * (max - min) + min
  },
}

class TermsApp {
  constructor() {
    this.elements = {}
    this.observers = {}
    this.isInitialized = false

    this.init()
  }

  init() {
    if (this.isInitialized) return

    this.cacheElements()
    this.setupEventListeners()
    this.initializeComponents()
    this.setupAnimations()

    this.isInitialized = true
    console.log("✅ TermsApp initialized successfully")
  }

  cacheElements() {
    this.elements = {
      navigation: document.getElementById("navigation"),
      navToggle: document.getElementById("navToggle"),
      navMenu: document.getElementById("navMenu"),
      navLinks: document.querySelectorAll(".nav-link"),

      progressBar: document.getElementById("progressBar"),

      scrollToTop: document.getElementById("scrollToTop"),

      sections: document.querySelectorAll(".content-section"),
      animatedElements: document.querySelectorAll('[class*="card"], [class*="item"], [class*="block"]'),

      gradientOrbs: document.querySelectorAll(".gradient-orb"),
      floatingShapes: document.querySelectorAll(".shape"),
    }
  }

  setupEventListeners() {
    const passiveOptions = Utils.supports.passiveEvents ? { passive: true } : false

    window.addEventListener(
      "scroll",
      Utils.throttle(() => {
        this.handleScroll()
      }, CONFIG.scroll.throttleDelay),
      passiveOptions,
    )

    window.addEventListener(
      "resize",
      Utils.debounce(() => {
        this.handleResize()
      }, 250),
      passiveOptions,
    )

    if (this.elements.navToggle) {
      this.elements.navToggle.addEventListener("click", () => {
        this.toggleMobileMenu()
      })
    }

    this.elements.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        this.handleNavClick(e, link)
      })
    })

    if (this.elements.scrollToTop) {
      this.elements.scrollToTop.addEventListener("click", () => {
        this.scrollToTop()
      })
    }

    document.addEventListener("keydown", (e) => {
      this.handleKeydown(e)
    })
  }

  initializeComponents() {
    this.setupProgressBar()
    this.setupSmoothScrolling()
    this.setupActiveNavigation()

    if (!Utils.device.prefersReducedMotion()) {
      this.animateBackground()
    }
  }

  setupAnimations() {
    if (Utils.device.prefersReducedMotion()) {
      console.log("🔇 Animations disabled due to user preference")
      return
    }

    if (Utils.supports.intersectionObserver) {
      this.setupIntersectionObserver()
    }

    this.animateOnLoad()
  }

  handleScroll() {
    const scrollY = window.pageYOffset

    this.updateProgressBar(scrollY)

    this.toggleScrollToTopButton(scrollY)

    this.updateActiveNavigation(scrollY)

    if (Utils.device.isDesktop() && !Utils.device.prefersReducedMotion()) {
      this.updateBackgroundParallax(scrollY)
    }
  }

  handleResize() {
    if (!Utils.device.isMobile() && this.elements.navMenu.classList.contains("active")) {
      this.closeMobileMenu()
    }

    this.recalculateNavPositions()
  }

  toggleMobileMenu() {
    const isActive = this.elements.navMenu.classList.contains("active")

    if (isActive) {
      this.closeMobileMenu()
    } else {
      this.openMobileMenu()
    }
  }

  openMobileMenu() {
    this.elements.navMenu.classList.add("active")
    this.elements.navToggle.classList.add("active")
    this.elements.navToggle.setAttribute("aria-expanded", "true")

    if (Utils.device.isMobile()) {
      document.body.style.overflow = "hidden"
    }
  }

  closeMobileMenu() {
    this.elements.navMenu.classList.remove("active")
    this.elements.navToggle.classList.remove("active")
    this.elements.navToggle.setAttribute("aria-expanded", "false")

    document.body.style.overflow = ""
  }

  handleNavClick(e, link) {
    e.preventDefault()

    const targetId = link.getAttribute("href")
    const targetElement = document.querySelector(targetId)

    if (targetElement) {
      const offset = this.elements.navigation.offsetHeight + 20
      Utils.smoothScrollTo(targetElement, offset)

      if (Utils.device.isMobile()) {
        this.closeMobileMenu()
      }

      this.setActiveNavLink(link)
    }
  }

  handleKeydown(e) {
    if (e.key === "Escape" && this.elements.navMenu.classList.contains("active")) {
      this.closeMobileMenu()
    }

    if (e.key === "Home" && e.ctrlKey) {
      e.preventDefault()
      this.scrollToTop()
    }
  }

  setupProgressBar() {
    if (!this.elements.progressBar) return

    this.elements.progressBar.style.width = "0%"
  }

  updateProgressBar(scrollY) {
    if (!this.elements.progressBar) return

    const documentHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = Math.min((scrollY / documentHeight) * 100, 100)

    this.elements.progressBar.style.width = `${progress}%`
  }

  toggleScrollToTopButton(scrollY) {
    if (!this.elements.scrollToTop) return

    const shouldShow = scrollY > CONFIG.scroll.offsetThreshold

    if (shouldShow && !this.elements.scrollToTop.classList.contains("visible")) {
      this.elements.scrollToTop.classList.add("visible")
    } else if (!shouldShow && this.elements.scrollToTop.classList.contains("visible")) {
      this.elements.scrollToTop.classList.remove("visible")
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  setupSmoothScrolling() {}

  setupActiveNavigation() {
    this.sectionPositions = []
    this.recalculateNavPositions()
  }

  recalculateNavPositions() {
    this.sectionPositions = Array.from(this.elements.sections).map((section) => ({
      id: section.id,
      offsetTop: section.offsetTop,
      offsetBottom: section.offsetTop + section.offsetHeight,
    }))
  }

  updateActiveNavigation(scrollY) {
    const offset = this.elements.navigation.offsetHeight + 50
    const currentPosition = scrollY + offset

    let activeSection = null

    for (const section of this.sectionPositions) {
      if (currentPosition >= section.offsetTop && currentPosition < section.offsetBottom) {
        activeSection = section.id
        break
      }
    }

    if (activeSection) {
      const activeLink = document.querySelector(`.nav-link[href="#${activeSection}"]`)
      if (activeLink) {
        this.setActiveNavLink(activeLink)
      }
    }
  }

  setActiveNavLink(activeLink) {
    this.elements.navLinks.forEach((link) => {
      link.classList.remove("active")
    })

    activeLink.classList.add("active")
  }

  updateBackgroundParallax(scrollY) {
    const parallaxSpeed = 0.5
    const offset = scrollY * parallaxSpeed

    this.elements.gradientOrbs.forEach((orb, index) => {
      const speed = 0.3 + index * 0.1
      orb.style.transform = `translateY(${offset * speed}px)`
    })
  }

  animateBackground() {
    if (Utils.device.isMobile()) return

    this.elements.gradientOrbs.forEach((orb, index) => {
      const delay = index * 2000
      const duration = 20000 + index * 5000

      orb.style.animationDelay = `${delay}ms`
      orb.style.animationDuration = `${duration}ms`
    })

    this.elements.floatingShapes.forEach((shape, index) => {
      const delay = index * 1000
      const duration = 15000 + index * 2000

      shape.style.animationDelay = `${delay}ms`
      shape.style.animationDuration = `${duration}ms`
    })
  }

  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    this.observers.main = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in")
          this.observers.main.unobserve(entry.target)
        }
      })
    }, observerOptions)

    this.elements.animatedElements.forEach((element) => {
      this.observers.main.observe(element)
    })
  }

  animateOnLoad() {
    document.body.classList.add("loaded")

    this.elements.sections.forEach((section, index) => {
      setTimeout(() => {
        section.classList.add("animate-in")
      }, index * CONFIG.animations.stagger)
    })
  }

  destroy() {
    window.removeEventListener("scroll", this.handleScroll)
    window.removeEventListener("resize", this.handleResize)

    Object.values(this.observers).forEach((observer) => {
      if (observer && observer.disconnect) {
        observer.disconnect()
      }
    })

    this.isInitialized = false
    console.log("🧹 TermsApp destroyed")
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.requestAnimationFrame) {
    console.warn("⚠️ RequestAnimationFrame not supported")
    return
  }

  window.termsApp = new TermsApp()

  if (Utils.supports.requestIdleCallback) {
    requestIdleCallback(() => {
      console.log("🚀 Background tasks completed")
    })
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {})
  }
})

window.addEventListener("error", (e) => {
  console.error("❌ JavaScript Error:", e.error)
})

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TermsApp, Utils, CONFIG }
}
