interface WebApp {
  ready(): void
  expand(): void
  close(): void
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void
  initDataUnsafe?: {
    user?: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
    }
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export const initTelegramWebApp = () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    tg.ready()
    tg.expand()
  }
}

export const getTelegramUser = () => {
  if (window.Telegram?.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user
    if (user) {
      return user
    }
  }
  // Fallback for development
  return { id: 123456789, first_name: 'Test', last_name: 'User', username: 'test' }
}

export const showAlert = (message: string) => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert(message)
  } else {
    alert(message)
  }
}

export const showConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showConfirm(message, (confirmed) => {
        resolve(confirmed)
      })
    } else {
      const confirmed = window.confirm(message)
      resolve(confirmed)
    }
  })
}

export const close = () => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.close()
  }
}

