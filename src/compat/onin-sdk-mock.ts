import * as realSdk from 'real-onin-sdk'
import { addToast } from './toast-manager'

// 检测是否处于真正的 Tauri / Onin 客户端环境
const isOnin = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined

export const storage = {
  async getItem<T>(key: string): Promise<T | null> {
    if (isOnin) {
      try {
        return await realSdk.storage.getItem<T>(key)
      } catch (err) {
        console.warn('RealStorage.getItem error, falling back to localStorage', err)
      }
    }
    // Web Fallback
    try {
      const val = localStorage.getItem(key)
      if (val === null) return null
      return JSON.parse(val) as T
    } catch (err) {
      console.error(`MockStorage: Failed to getItem for key "${key}"`, err)
      return null
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    if (isOnin) {
      try {
        await realSdk.storage.setItem(key, value)
        return
      } catch (err) {
        console.warn('RealStorage.setItem error, falling back to localStorage', err)
      }
    }
    // Web Fallback
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.error(`MockStorage: Failed to setItem for key "${key}"`, err)
    }
  },

  async removeItem(key: string): Promise<void> {
    if (isOnin) {
      try {
        await realSdk.storage.removeItem(key)
        return
      } catch (err) {
        console.warn('RealStorage.removeItem error, falling back to localStorage', err)
      }
    }
    // Web Fallback
    try {
      localStorage.removeItem(key)
    } catch (err) {
      console.error(`MockStorage: Failed to removeItem for key "${key}"`, err)
    }
  },

  async clear(): Promise<void> {
    if (isOnin) {
      try {
        await realSdk.storage.clear()
        return
      } catch (err) {
        console.warn('RealStorage.clear error, falling back to localStorage', err)
      }
    }
    // Web Fallback
    try {
      localStorage.clear()
    } catch (err) {
      console.error('MockStorage: Failed to clear storage', err)
    }
  }
}

export const toast = {
  async success(message: string): Promise<void> {
    if (isOnin) {
      try {
        await realSdk.toast.success(message)
        return
      } catch (err) {
        console.warn('RealToast.success error, falling back to custom toast', err)
      }
    }
    addToast({ description: message, type: 'success' })
  },

  async error(message: string): Promise<void> {
    if (isOnin) {
      try {
        await realSdk.toast.error(message)
        return
      } catch (err) {
        console.warn('RealToast.error error, falling back to custom toast', err)
      }
    }
    addToast({ description: message, type: 'error' })
  },

  async info(message: string): Promise<void> {
    if (isOnin) {
      try {
        await realSdk.toast.info(message)
        return
      } catch (err) {
        console.warn('RealToast.info error, falling back to custom toast', err)
      }
    }
    addToast({ description: message, type: 'info' })
  }
}

// 导出 Onin 原生特有的后台命令、生命周期和设置接口（主要供给 background 线程或宿主通讯使用）
export const command = realSdk.command
export const lifecycle = realSdk.lifecycle
export const settings = realSdk.settings
