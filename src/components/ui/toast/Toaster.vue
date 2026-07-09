<script setup lang="ts">
import {
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastViewport,
  ToastClose,
} from 'reka-ui'
import { toasts } from '../../../compat/toast-manager'
import { CheckCircle2, AlertCircle, Info, X } from '@lucide/vue'

const handleOpenChange = (id: string, open: boolean) => {
  if (!open) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }
}
</script>

<template>
  <ToastProvider :duration="3000">
    <ToastRoot
      v-for="toast in toasts"
      :key="toast.id"
      :open="true"
      @update:open="(val) => handleOpenChange(toast.id, val)"
      class="group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border border-[var(--color-border)] p-4 pr-6 shadow-lg transition-all backdrop-blur-md
             data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full"
      :class="{
        'border-emerald-500/20 bg-emerald-950/20 text-emerald-200 shadow-emerald-950/20': toast.type === 'success',
        'border-red-500/20 bg-red-950/20 text-red-200 shadow-red-950/20': toast.type === 'error',
        'border-blue-500/20 bg-blue-950/20 text-blue-200 shadow-blue-950/20': toast.type === 'info',
      }"
    >
      <div class="flex items-start gap-3">
        <CheckCircle2 v-if="toast.type === 'success'" class="size-5 text-emerald-400 shrink-0 mt-0.5" />
        <AlertCircle v-else-if="toast.type === 'error'" class="size-5 text-red-400 shrink-0 mt-0.5" />
        <Info v-else class="size-5 text-blue-400 shrink-0 mt-0.5" />

        <div class="grid gap-1">
          <ToastTitle v-if="toast.title" class="text-sm font-semibold leading-none">
            {{ toast.title }}
          </ToastTitle>
          <ToastDescription class="text-xs font-medium opacity-90 leading-normal">
            {{ toast.description }}
          </ToastDescription>
        </div>
      </div>

      <ToastClose class="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 group-hover:opacity-100 hover:text-foreground focus:opacity-100 focus:outline-none transition-opacity cursor-pointer">
        <X class="size-4" />
      </ToastClose>
    </ToastRoot>

    <ToastViewport class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
  </ToastProvider>
</template>
