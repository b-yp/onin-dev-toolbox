<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { TOOLS } from '../config/tools'
import { ArrowLeft } from '@lucide/vue'
import Button from './ui/button/Button.vue'
import { cn } from '../lib/utils'

const props = defineProps<{
  toolId: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const tool = computed(() => TOOLS.find(t => t.id === props.toolId))

const ToolComponent = computed(() => {
  switch (props.toolId) {
    case 'json-format':
      return defineAsyncComponent(() => import('./tools/JsonFormatter.vue'))
    case 'base64':
      return defineAsyncComponent(() => import('./tools/Base64Converter.vue'))
    case 'timestamp':
      return defineAsyncComponent(() => import('./tools/TimestampConverter.vue'))
    case 'url-encode':
      return defineAsyncComponent(() => import('./tools/UrlEncoder.vue'))
    case 'uuid-generator':
      return defineAsyncComponent(() => import('./tools/UuidGenerator.vue'))
    case 'jwt-decode':
      return defineAsyncComponent(() => import('./tools/JwtDecoder.vue'))
    case 'case-convert':
      return defineAsyncComponent(() => import('./tools/CaseConverter.vue'))
    case 'hash-calculator':
      return defineAsyncComponent(() => import('./tools/HashCalculator.vue'))
    case 'regex-test':
      return defineAsyncComponent(() => import('./tools/RegexTester.vue'))
    case 'text-diff':
      return defineAsyncComponent(() => import('./tools/TextDiff.vue'))
    case 'qrcode':
      return defineAsyncComponent(() => import('./tools/QrCode.vue'))
    case 'password-generator':
      return defineAsyncComponent(() => import('./tools/PasswordGenerator.vue'))
    case 'cron-generator':
      return defineAsyncComponent(() => import('./tools/CronGenerator.vue'))
    case 'url-parser':
      return defineAsyncComponent(() => import('./tools/UrlParser.vue'))
    case 'yaml-json-converter':
      return defineAsyncComponent(() => import('./tools/YamlJsonConverter.vue'))
    default:
      return null
  }
})
</script>

<template>
  <div class="flex flex-col h-screen bg-[var(--color-background)]">
    <header class="flex items-center justify-between px-6 h-16 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-xl z-10">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="emit('back')" title="返回列表">
          <ArrowLeft class="size-5" />
        </Button>
        <div>
          <h1 class="text-lg font-semibold text-[var(--color-foreground)]">{{ tool?.name }}</h1>
          <span class="text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-wider">{{ tool?.category }}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <div class="flex-1 overflow-hidden relative">
      <component :is="ToolComponent" v-if="ToolComponent" :toolId="toolId" />
      <div v-else class="h-full flex flex-col items-center justify-center text-[var(--color-muted-foreground)] text-center p-10">
        <span class="text-6xl opacity-50 mb-6">🛠️</span>
        <h3 class="text-lg font-semibold mb-2">工具开发中</h3>
        <p class="text-sm mb-6">工具 "{{ tool?.name }}" 正在开发中，敬请期待</p>
        <Button @click="emit('back')"><ArrowLeft class="size-4" /> 返回工具列表</Button>
      </div>
    </div>
  </div>
</template>
