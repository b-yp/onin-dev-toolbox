<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'onin-sdk'
import { Copy, Eraser } from '@lucide/vue'
import Editor from '../Editor.vue'
import Button from '../ui/button/Button.vue'
import Badge from '../ui/badge/Badge.vue'
import { cn } from '../../lib/utils'
import { parseJwt, formatJwtTimestamp } from '../../utils/jwt'

const input = ref('')
const error = ref<string | null>(null)
const headerData = ref<Record<string, any> | null>(null)
const payloadData = ref<Record<string, any> | null>(null)
const signatureHex = ref<string | null>(null)
const headerJsonStr = ref('')
const payloadJsonStr = ref('')

const handleClear = () => {
  input.value = ''; error.value = null; headerData.value = null; payloadData.value = null
  signatureHex.value = null; headerJsonStr.value = ''; payloadJsonStr.value = ''
}

const handleCopy = (text: string, label: string) => {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => toast.success(`已复制 ${label} 到剪贴板`))
}

const parseJwtInput = (token: string) => {
  const trimmed = token.trim()
  if (!trimmed) { handleClear(); return }
  try {
    const res = parseJwt(trimmed)
    headerData.value = res.header; headerJsonStr.value = JSON.stringify(res.header, null, 2)
    payloadData.value = res.payload; payloadJsonStr.value = JSON.stringify(res.payload, null, 2)
    signatureHex.value = res.signature; error.value = null
  } catch (err: any) {
    error.value = '解析失败：' + err.message
    headerData.value = null; payloadData.value = null; signatureHex.value = null
  }
}

watch(input, (newVal) => { parseJwtInput(newVal) })

const formatTimestamp = (timestamp: number) => formatJwtTimestamp(timestamp)

const timeClaims = computed(() => {
  if (!payloadData.value) return []
  const claims = [
    { key: 'iat', label: '签发时间 (iat)', val: payloadData.value.iat },
    { key: 'exp', label: '过期时间 (exp)', val: payloadData.value.exp },
    { key: 'nbf', label: '生效时间 (nbf)', val: payloadData.value.nbf },
  ]
  return claims.filter(c => typeof c.val === 'number').map(c => {
    const formatted = formatTimestamp(c.val)
    let status = ''; let isWarning = false
    if (c.key === 'exp') {
      const now = Math.floor(Date.now() / 1000)
      if (now > c.val) { status = '已过期 ⚠️'; isWarning = true }
      else { const diffMin = Math.round((c.val - now) / 60); status = diffMin < 60 ? `剩余 ${diffMin} 分钟有效` : `剩余 ${(diffMin / 60).toFixed(1)} 小时有效` }
    }
    return { ...c, formatted, status, isWarning }
  })
})

const isExpired = computed(() => {
  if (!payloadData.value || typeof payloadData.value.exp !== 'number') return false
  return Math.floor(Date.now() / 1000) > payloadData.value.exp
})
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold text-[var(--color-muted-foreground)]">JWT 令牌解码</span>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear"><Eraser class="size-3.5" /> 清空</Button>
      </div>
    </div>

    <div class="flex-1 flex gap-3 min-h-0 items-stretch max-md:flex-col">
      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">
          <span>输入 JWT 令牌 (Token)</span>
        </div>
        <div class="flex-1 overflow-hidden">
          <Editor v-model="input" placeholder="请在此处粘贴或输入以 eyJ... 开头的 JWT Token 字符串" />
        </div>
      </div>

      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center justify-between">
          <span>解析结果</span>
          <div v-if="payloadData" class="flex items-center gap-2">
            <Badge v-if="isExpired" variant="destructive" class="text-[11px]">Token 已过期</Badge>
            <Badge v-else variant="secondary" class="text-[11px] text-emerald-400 bg-emerald-500/15 border-emerald-500/20">Token 未过期</Badge>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="error" class="p-8 flex flex-col items-center justify-center text-red-500 text-center gap-3">
            <span class="text-3xl">❌</span>
            <div class="font-mono text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 break-all">{{ error }}</div>
          </div>
          <div v-else-if="!payloadData" class="h-full flex flex-col items-center justify-center text-[var(--color-muted-foreground)] opacity-50 gap-3">
            <span class="text-5xl">🔑</span>
            <p>等待输入有效的 JWT Token...</p>
          </div>
          <div v-else class="flex flex-col gap-4 p-4">
            <div class="rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-blue-500/5 to-transparent p-3.5 flex flex-col gap-3 border-l-2 border-l-blue-500">
              <div class="flex items-center justify-between">
                <Badge variant="secondary" class="text-blue-300 bg-blue-500/15 border-blue-500/20 text-[11px]">头部 (Header)</Badge>
                <Button variant="ghost" size="sm" class="h-6 text-[11px]" @click="handleCopy(headerJsonStr, 'Header')"><Copy class="size-3" /> 复制</Button>
              </div>
              <div class="h-[180px] rounded-lg border border-[var(--color-border)] bg-black/20 overflow-hidden">
                <Editor v-model="headerJsonStr" readonly />
              </div>
            </div>

            <div class="rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-violet-500/5 to-transparent p-3.5 flex flex-col gap-3 border-l-2 border-l-violet-500">
              <div class="flex items-center justify-between">
                <Badge variant="secondary" class="text-violet-300 bg-violet-500/15 border-violet-500/20 text-[11px]">载荷 (Payload)</Badge>
                <Button variant="ghost" size="sm" class="h-6 text-[11px]" @click="handleCopy(payloadJsonStr, 'Payload')"><Copy class="size-3" /> 复制</Button>
              </div>
              <div class="h-[180px] rounded-lg border border-[var(--color-border)] bg-black/20 overflow-hidden">
                <Editor v-model="payloadJsonStr" readonly />
              </div>
            </div>

            <div v-if="timeClaims.length > 0" class="rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-emerald-500/5 to-transparent p-3.5 flex flex-col gap-3 border-l-2 border-l-emerald-500">
              <Badge variant="secondary" class="text-emerald-300 bg-emerald-500/15 border-emerald-500/20 text-[11px] self-start">时间戳翻译</Badge>
              <div class="flex flex-col gap-2">
                <div v-for="claim in timeClaims" :key="claim.key" :class="cn('flex items-center justify-between p-2 px-3 rounded-lg text-sm border', claim.isWarning ? 'border-red-500/15 bg-red-500/[0.02]' : 'border-[var(--color-border)] bg-[var(--color-secondary)]/20')">
                  <span class="font-medium text-[var(--color-muted-foreground)] w-[120px]">{{ claim.label }}</span>
                  <span class="font-mono text-[var(--color-foreground)]/85 flex-1 text-left">{{ claim.formatted }}</span>
                  <span :class="cn('text-xs font-semibold', claim.isWarning ? 'text-red-400' : 'text-emerald-500')" v-if="claim.status">{{ claim.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
