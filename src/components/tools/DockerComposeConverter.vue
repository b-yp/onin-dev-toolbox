<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { toast as oninToast } from 'onin-sdk'
import { Copy, Eraser, FileText, ArrowRight, ArrowLeftRight } from '@lucide/vue'
import Editor from '../Editor.vue'
import Button from '../ui/button/Button.vue'
import Checkbox from '../ui/checkbox/Checkbox.vue'
import Select from '../ui/select/Select.vue'
import SelectItem from '../ui/select/SelectItem.vue'
import { dockerRunToCompose, composeToDockerRun } from '../../utils/dockerParser'

const toast = {
  success: (msg: string) => { try { oninToast.success(msg)?.catch?.(() => {}) } catch {} },
  error: (msg: string) => { try { oninToast.error(msg)?.catch?.(() => {}) } catch {} },
  info: (msg: string) => { try { oninToast.info(msg)?.catch?.(() => {}) } catch {} },
}

const SAMPLE_RUN = `docker run -d \\
  --name my-nginx \\
  -p 8080:80 \\
  -v nginx_data:/usr/share/nginx/html:ro \\
  -e ENV=prod \\
  --restart always \\
  nginx:alpine`

const SAMPLE_COMPOSE = `version: "3.8"
services:
  web:
    image: nginx:alpine
    container_name: my-nginx
    ports:
      - "8080:80"
    volumes:
      - nginx_data:/usr/share/nginx/html:ro
    environment:
      - ENV=prod
    restart: always`

const direction = ref<'run2compose' | 'compose2run'>('run2compose')
const inputText = ref('')
const outputText = ref('')
const autoSync = ref(true)
const lineFormat = ref<'single' | 'bash' | 'cmd' | 'powershell'>('bash')
const detach = ref(true)
const parseError = ref('')
let isConverting = false

const performConversion = () => {
  parseError.value = ''
  const val = inputText.value.trim()
  if (!val) {
    outputText.value = ''
    return
  }

  isConverting = true
  try {
    if (direction.value === 'run2compose') {
      outputText.value = dockerRunToCompose(val)
    } else {
      outputText.value = composeToDockerRun(val, {
        format: lineFormat.value,
        detach: detach.value
      })
    }
  } catch (err: any) {
    parseError.value = err.message || '转换出错，请检查输入格式是否正确'
    outputText.value = ''
  } finally {
    isConverting = false
  }
}

// 联动及防抖
let debounceTimer: any = null
const triggerConversion = () => {
  if (!autoSync.value) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    performConversion()
  }, 250)
}

// 监听状态改变
watch(inputText, () => {
  triggerConversion()
})

watch([direction, lineFormat, detach], () => {
  performConversion()
})

const handleToggleDirection = () => {
  // 清空之前的输入输出
  inputText.value = ''
  outputText.value = ''
  parseError.value = ''
  
  if (direction.value === 'run2compose') {
    direction.value = 'compose2run'
    inputText.value = SAMPLE_COMPOSE
  } else {
    direction.value = 'run2compose'
    inputText.value = SAMPLE_RUN
  }
  toast.success(`已切换为 ${direction.value === 'run2compose' ? 'Docker Run ➔ Compose' : 'Compose ➔ Docker Run'}`)
}

const loadSample = () => {
  inputText.value = direction.value === 'run2compose' ? SAMPLE_RUN : SAMPLE_COMPOSE
  performConversion()
  toast.success('已载入默认示例')
}

const handleCopy = () => {
  if (!outputText.value) return
  navigator.clipboard.writeText(outputText.value).then(() => {
    toast.success('结果已复制到剪贴板')
  })
}

const handleClear = () => {
  inputText.value = ''
  outputText.value = ''
  parseError.value = ''
  toast.success('内容已清空')
}

onMounted(() => {
  inputText.value = SAMPLE_RUN
  performConversion()
})
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border">
    <!-- 工具控制栏 -->
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2.5 px-4 rounded-xl border border-[var(--color-border)] shrink-0 flex-wrap gap-2">
      <div class="flex items-center gap-4 flex-wrap text-xs">
        <!-- 切换方向 -->
        <Button variant="outline" size="sm" class="gap-1.5 font-medium" @click="handleToggleDirection">
          <ArrowLeftRight class="size-3.5" />
          <span>{{ direction === 'run2compose' ? 'Docker Run ➔ Compose' : 'Compose ➔ Docker Run' }}</span>
        </Button>

        <div class="w-px h-4 bg-[var(--color-border)]" />

        <!-- 实时联动 -->
        <label class="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
          <Checkbox v-model="autoSync" />
          <span class="font-medium">实时自动联动</span>
        </label>

        <!-- Detach 参数仅在 Compose ➔ Docker Run 模式可见 -->
        <template v-if="direction === 'compose2run'">
          <div class="w-px h-4 bg-[var(--color-border)]" />
          <label class="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
            <Checkbox v-model="detach" />
            <span class="font-medium">后台运行 (-d)</span>
          </label>
        </template>

        <!-- 换行格式仅在 Compose ➔ Docker Run 模式可见 -->
        <template v-if="direction === 'compose2run'">
          <div class="w-px h-4 bg-[var(--color-border)]" />
          <div class="flex items-center gap-2 text-slate-400">
            <span>折行风格:</span>
            <Select :model-value="lineFormat" @update:model-value="(v) => lineFormat = v as any" class="w-28">
              <SelectItem value="single">单行命令</SelectItem>
              <SelectItem value="bash">Linux Bash (\\)</SelectItem>
              <SelectItem value="cmd">Windows CMD (^)</SelectItem>
              <SelectItem value="powershell">PowerShell (\`)</SelectItem>
            </Select>
          </div>
        </template>
      </div>

      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="loadSample">
          <FileText class="size-3.5" /> 载入示例
        </Button>
        <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear">
          <Eraser class="size-3.5" /> 全部清空
        </Button>
      </div>
    </div>

    <!-- 主体分栏编辑器 -->
    <div class="flex-1 flex gap-3 flex-col md:flex-row min-h-0 relative">
      <!-- 左侧输入栏 -->
      <div class="flex-1 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden min-h-0">
        <div class="px-4 py-2 text-xs font-semibold text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] flex justify-between items-center shrink-0">
          <span class="tracking-wide">{{ direction === 'run2compose' ? 'Docker Run 命令行' : 'Docker Compose 配置 (YAML)' }}</span>
          <div class="text-[10px] text-slate-500 font-mono">INPUT</div>
        </div>
        <div class="flex-1 min-h-0 relative flex flex-col">
          <Editor 
            v-model="inputText" 
            :language="direction === 'run2compose' ? 'text' : 'yaml'" 
            :placeholder="direction === 'run2compose' ? '粘贴 docker run 命令在此...' : '粘贴 docker-compose.yml 内容在此...'" 
          />
          <div v-show="parseError" class="bg-red-500/10 border-t border-red-500/20 text-red-400 text-[11px] p-3 font-mono shrink-0 flex items-start gap-2 max-h-20 overflow-y-auto">
            <span class="text-sm select-none">⚠️</span>
            <div class="flex-1 leading-normal break-all">{{ parseError }}</div>
          </div>
        </div>
      </div>

      <!-- 手动触发按钮 (当关闭自动联动时展示) -->
      <div v-if="!autoSync" class="shrink-0 flex gap-2 items-center justify-center py-2 md:py-0 md:flex-col">
        <Button variant="outline" size="sm" class="gap-1" @click="performConversion" title="手动转换">
          <ArrowRight class="size-3.5" />
        </Button>
      </div>

      <!-- 右侧输出栏 -->
      <div class="flex-1 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden min-h-0">
        <div class="px-4 py-2 text-xs font-semibold text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] flex justify-between items-center shrink-0">
          <span class="tracking-wide">{{ direction === 'run2compose' ? 'Docker Compose 配置 (YAML)' : 'Docker Run 命令行' }}</span>
          <div class="flex gap-1.5">
            <Button variant="ghost" size="sm" class="h-6 text-[10px]" :disabled="!outputText" @click="handleCopy">
              <Copy class="size-3" /> 复制
            </Button>
          </div>
        </div>
        <div class="flex-1 min-h-0 relative flex flex-col">
          <Editor 
            :model-value="outputText" 
            :language="direction === 'run2compose' ? 'yaml' : 'text'" 
            readonly 
            :placeholder="direction === 'run2compose' ? '生成的 yaml 配置将显示在此...' : '生成的 docker run 命令将显示在此...'" 
          />
        </div>
      </div>
    </div>
  </div>
</template>
