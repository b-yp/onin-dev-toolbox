<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { toast as oninToast } from 'onin-sdk'
import { Copy, Download, Image, Monitor, Eraser, RotateCcw, ExternalLink } from '@lucide/vue'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import Editor from '../Editor.vue'
import Button from '../ui/button/Button.vue'
import Slider from '../ui/slider/Slider.vue'
import { isValidUrl } from '../../utils/qrcode'

const toast = {
  success: (msg: string) => { try { oninToast.success(msg)?.catch?.(() => {}) } catch {} },
  error: (msg: string) => { try { oninToast.error(msg)?.catch?.(() => {}) } catch {} },
  info: (msg: string) => { try { oninToast.info(msg)?.catch?.(() => {}) } catch {} },
}

const activeTab = ref<'generate' | 'decode'>('generate')
const text = ref('https://github.com/b-yp/onin-dev-toolbox')
const qrCanvasRef = ref<HTMLCanvasElement | null>(null)
const errorCorrectionLevel = ref<'L' | 'M' | 'Q' | 'H'>('M')
const colorMode = ref<'classic' | 'dark'>('dark')
const size = ref(256)

const renderQRCode = async () => {
  if (!qrCanvasRef.value) return
  if (!text.value.trim()) { const ctx = qrCanvasRef.value.getContext('2d'); if (ctx) ctx.clearRect(0, 0, qrCanvasRef.value.width, qrCanvasRef.value.height); return }
  const darkColor = colorMode.value === 'classic' ? '#000000' : '#60a5fa'
  const lightColor = colorMode.value === 'classic' ? '#ffffff' : '#0d0d0d'
  try { await QRCode.toCanvas(qrCanvasRef.value, text.value, { width: size.value, margin: 3, errorCorrectionLevel: errorCorrectionLevel.value, color: { dark: darkColor, light: lightColor } }) } catch {}
}

let renderTimer: any = null
const triggerRender = () => { if (renderTimer) clearTimeout(renderTimer); renderTimer = setTimeout(renderQRCode, 100) }
watch([text, errorCorrectionLevel, colorMode, size], triggerRender)

const handleInsertLocalhost = () => { text.value = 'http://localhost:5173'; toast.success('已载入本地调试模板') }
const handleClearInput = () => { text.value = '' }
const handleDownload = () => { if (!qrCanvasRef.value || !text.value.trim()) return; const a = document.createElement('a'); a.href = qrCanvasRef.value.toDataURL('image/png'); a.download = `qrcode_${Date.now()}.png`; a.click(); toast.success('已开始下载') }
const handleCopyImage = () => {
  if (!qrCanvasRef.value || !text.value.trim()) return
  qrCanvasRef.value.toBlob((blob) => { if (!blob) return; try { navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => toast.success('二维码已复制')).catch(() => toast.error('复制失败')) } catch { toast.error('浏览器不支持复制图片') } }, 'image/png')
}

const decodedText = ref<string | null>(null)
const decodeError = ref<string | null>(null)
const previewUrl = ref<string | null>(null)
const isDecoding = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const decodeImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) { toast.error('请选择有效的图片文件'); return }
  isDecoding.value = true; decodedText.value = null; decodeError.value = null
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d')
      if (!ctx) { decodeError.value = '无法创建渲染上下文'; isDecoding.value = false; return }
      canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0)
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code) { decodedText.value = code.data; toast.success('解码成功') } else { decodeError.value = '未检测到有效二维码' }
      } catch (err: any) { decodeError.value = '像素读取失败: ' + err.message }
      isDecoding.value = false
    }
    img.onerror = () => { decodeError.value = '加载图片失败'; isDecoding.value = false }
    img.src = previewUrl.value!
  }
  reader.onerror = () => { decodeError.value = '读取文件失败'; isDecoding.value = false }
  reader.readAsDataURL(file)
}

const handleFileChange = (e: Event) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) decodeImageFile(file) }
const handleDrop = (e: DragEvent) => { e.preventDefault(); const file = e.dataTransfer?.files[0]; if (file) decodeImageFile(file) }
const handlePaste = (e: ClipboardEvent) => { const items = e.clipboardData?.items; if (!items) return; for (const item of items) { if (item.type.indexOf('image') !== -1) { const file = item.getAsFile(); if (file) { decodeImageFile(file); toast.info('已自动解析剪贴板截图'); break } } } }

const isUrl = computed(() => decodedText.value ? isValidUrl(decodedText.value) : false)
const handleOpenUrl = () => { if (decodedText.value) window.open(decodedText.value, '_blank') }
const handleCopyDecoded = () => { if (!decodedText.value) return; navigator.clipboard.writeText(decodedText.value).then(() => toast.success('已复制解析内容')) }
const handleResetDecoder = () => { decodedText.value = null; decodeError.value = null; previewUrl.value = null }

onMounted(() => { if (activeTab.value === 'generate') renderQRCode(); window.addEventListener('paste', handlePaste) })
onBeforeUnmount(() => { window.removeEventListener('paste', handlePaste); if (renderTimer) clearTimeout(renderTimer) })
watch(activeTab, (newTab) => { if (newTab === 'generate') setTimeout(renderQRCode, 50) })
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <div class="flex bg-[var(--color-muted)] p-0.5 rounded-lg">
        <Button variant="ghost" size="sm" :class="activeTab === 'generate'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="activeTab = 'generate'">生成二维码</Button>
        <Button variant="ghost" size="sm" :class="activeTab === 'decode'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="activeTab = 'decode'">解码二维码</Button>
      </div>

      <div v-if="activeTab === 'generate'" class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="handleInsertLocalhost"><Monitor class="size-3.5" /> 本机调试模板</Button>
        <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClearInput"><Eraser class="size-3.5" /> 清空输入</Button>
      </div>
      <div v-if="activeTab === 'decode'" class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="handleResetDecoder"><RotateCcw class="size-3.5" /> 重置解码器</Button>
      </div>
    </div>

    <div class="flex-1 overflow-hidden relative">
      <div v-show="activeTab === 'generate'" class="flex w-full h-full gap-3 max-md:flex-col">
        <div class="flex-1 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div class="px-4 py-2 text-xs font-medium text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider">输入文本或链接 (URL)</div>
          <div class="flex-1 min-h-0">
            <Editor v-model="text" placeholder="输入你想转换为二维码的内容..." />
          </div>
        </div>

        <div class="w-full md:w-80 shrink-0 flex flex-col gap-3">
          <div class="flex flex-col items-center justify-center bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl p-6 mx-auto relative overflow-hidden aspect-square w-full max-w-[280px]">
            <canvas ref="qrCanvasRef" class="max-w-full max-h-full object-contain" />
            <div v-if="!text.trim()" class="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl text-xs text-[var(--color-muted-foreground)]">请输入文本</div>
          </div>

          <div class="flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 gap-4">
            <div class="flex items-center justify-between">
              <span class="text-xs text-[var(--color-muted-foreground)]">纠错等级</span>
              <div class="flex bg-[var(--color-muted)] p-0.5 rounded-md">
                <button v-for="level in ['L', 'M', 'Q', 'H']" :key="level" :class="['px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors border-none', errorCorrectionLevel === level ? 'bg-[var(--color-background)] text-[var(--color-foreground)]' : 'bg-transparent text-slate-400 hover:text-white']" @click="errorCorrectionLevel = level as any">{{ level }}</button>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-[var(--color-muted-foreground)]">配色主题</span>
              <div class="flex bg-[var(--color-muted)] p-0.5 rounded-md">
                <Button variant="ghost" size="sm" :class="colorMode === 'dark'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="colorMode = 'dark'">暗色科技</Button>
                <Button variant="ghost" size="sm" :class="colorMode === 'classic'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="colorMode = 'classic'">经典黑白</Button>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-[var(--color-muted-foreground)]">图片尺寸</span>
              <div class="flex items-center gap-2">
                <Slider :model-value="[size]" @update:model-value="(v: number[]) => size = v[0]" :min="128" :max="512" :step="32" class="w-24" />
                <span class="text-[11px] font-mono text-slate-400 w-10 text-right">{{ size }}px</span>
              </div>
            </div>

            <div class="flex gap-2">
              <Button variant="outline" class="flex-1" :disabled="!text.trim()" @click="handleCopyImage"><Image class="size-3.5" /> 复制图片</Button>
              <Button variant="default" class="flex-1" :disabled="!text.trim()" @click="handleDownload"><Download class="size-3.5" /> 下载 PNG</Button>
            </div>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'decode'" class="flex w-full h-full gap-3 max-md:flex-col">
        <div class="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-xl p-8 cursor-pointer transition-all relative overflow-hidden" @dragover.prevent @drop="handleDrop" @click="fileInputRef?.click()">
          <input type="file" ref="fileInputRef" class="hidden" accept="image/*" @change="handleFileChange" />
          <div v-if="!previewUrl" class="flex flex-col items-center text-center">
            <span class="text-5xl mb-4 opacity-70">📷</span>
            <h3 class="text-sm font-medium text-[var(--color-foreground)] mb-2">选择或拖拽图片到这里</h3>
            <p class="text-xs text-[var(--color-muted-foreground)]">支持主流格式图片，亦可在页面内直接按 <kbd class="px-1.5 py-0.5 rounded bg-[var(--color-secondary)] font-mono text-[10px] border border-[var(--color-border)]">Ctrl + V</kbd> 粘贴截图</p>
          </div>
          <div v-else class="flex flex-col items-center justify-center w-full h-full relative">
            <img :src="previewUrl" class="max-h-72 rounded-lg border border-[var(--color-border)] shadow-lg mb-2 object-contain" />
            <div class="text-[11px] text-[var(--color-muted-foreground)]">拖拽新图片或 Ctrl+V 更换</div>
            <div v-if="isDecoding" class="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl"><div class="flex flex-col items-center gap-2"><span class="text-2xl animate-spin">🔄</span><span class="text-xs text-slate-300">正在分析...</span></div></div>
          </div>
        </div>

        <div class="w-full md:w-80 shrink-0 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div class="px-4 py-2 text-xs font-medium text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider">解码分析结果</div>
          <div class="flex-1 flex flex-col p-4 justify-between min-h-0">
            <div class="flex-1 min-h-0 overflow-auto flex flex-col">
              <template v-if="decodedText">
                <div class="flex-1 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-xs font-mono text-slate-200 break-all select-all whitespace-pre-wrap">{{ decodedText }}</div>
              </template>
              <template v-else-if="decodeError">
                <div class="flex-1 flex flex-col items-center justify-center p-6 rounded-lg border border-red-500/10 bg-red-500/[0.02] text-red-400 text-center gap-2"><span class="text-2xl">⚠️</span><div class="text-xs">{{ decodeError }}</div></div>
              </template>
              <template v-else>
                <div class="flex-1 flex flex-col items-center justify-center p-6 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] text-center gap-1.5"><span class="text-3xl opacity-50">📥</span><div class="text-xs">等待读取图像文件</div></div>
              </template>
            </div>
            <div v-if="decodedText" class="flex gap-2 mt-4">
              <Button variant="outline" class="flex-1" @click="handleCopyDecoded"><Copy class="size-3.5" /> 复制原文</Button>
              <Button v-if="isUrl" variant="default" class="flex-1" @click="handleOpenUrl"><ExternalLink class="size-3.5" /> 打开链接</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
