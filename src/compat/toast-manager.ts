import { ref } from 'vue'

export interface ToastItem {
  id: string
  title?: string
  description: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

export const toasts = ref<ToastItem[]>([])

export function addToast(toast: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).substring(2, 9)
  const item: ToastItem = { ...toast, id }
  toasts.value.push(item)
}
