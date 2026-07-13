<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Bug, Sparkles, MessageSquare, ArrowUpRight } from '@lucide/vue'
import Button from './ui/button/Button.vue'

const props = defineProps<{
  show: boolean
  pluginVersion?: string
}>()

const emit = defineEmits(['close'])

const version = props.pluginVersion || '0.1.0'
const isWebMode = typeof window !== 'undefined' && !(window as any).__TAURI__

type FeedbackType = 'bug' | 'feature' | 'general'

const selectedType = ref<FeedbackType>('bug')
const feedbackTitle = ref('')

const feedbackTypes = [
  {
    id: 'bug' as FeedbackType,
    name: '报告 Bug',
    description: '遇到运行报错、显示异常或工具使用问题',
    icon: Bug,
    colorClass: 'text-red-400 bg-red-400/10 border-red-500/20',
    selectedColorClass: 'border-red-500 bg-red-500/10 text-red-400'
  },
  {
    id: 'feature' as FeedbackType,
    name: '功能建议',
    description: '希望新增工具、改进现有功能或提出新想法',
    icon: Sparkles,
    colorClass: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
    selectedColorClass: 'border-blue-500 bg-blue-500/10 text-blue-400'
  },
  {
    id: 'general' as FeedbackType,
    name: '其它反馈',
    description: '对工具箱的其它想法、使用疑问或一般性反馈',
    icon: MessageSquare,
    colorClass: 'text-purple-400 bg-purple-400/10 border-purple-500/20',
    selectedColorClass: 'border-purple-500 bg-purple-500/10 text-purple-400'
  }
]

// 自动收集的环境信息
const envInfo = computed(() => {
  if (typeof window === 'undefined') return {}
  return {
    version,
    platform: isWebMode ? 'Web 网页版' : 'Onin 插件版',
    userAgent: navigator.userAgent,
    language: navigator.language
  }
})

// 拼接并打开 GitHub Issue 页面
const handleSubmit = () => {
  const repoUrl = 'https://github.com/b-yp/onin-dev-toolbox/issues/new'
  
  let label = 'feedback'
  let titlePrefix = '[Feedback]'
  let bodyTemplate = ''

  const userTitle = feedbackTitle.value.trim()

  if (selectedType.value === 'bug') {
    label = 'bug'
    titlePrefix = '[Bug]'
    bodyTemplate = `## Bug 描述
${userTitle ? `**问题简述**：${userTitle}\n\n` : ''}请清晰、简洁地描述您遇到的问题：

## 复现步骤
1. 
2. 
3. 

## 预期行为
请描述期望发生的结果。

## 实际行为
请描述实际发生的结果（如果可以，请在 GitHub 提交页面中拖入截图）。

## 环境信息
- **工具箱版本**: ${envInfo.value.version}
- **运行平台**: ${envInfo.value.platform}
- **浏览器 UserAgent**: \`${envInfo.value.userAgent}\`
- **系统语言**: ${envInfo.value.language}
`
  } else if (selectedType.value === 'feature') {
    label = 'enhancement'
    titlePrefix = '[Feature]'
    bodyTemplate = `## 您希望新增什么工具或功能？
${userTitle ? `**新工具建议**：${userTitle}\n\n` : ''}请详细描述您的需求：

## 该功能的使用场景或类似参考
请描述该功能的使用场景，或提供市面上类似工具的参考链接/设计。
`
  } else {
    label = 'feedback'
    titlePrefix = '[Feedback]'
    bodyTemplate = `## 反馈内容
${userTitle ? `**反馈主题**：${userTitle}\n\n` : ''}请写下您的意见或建议：
`
  }

  const finalTitle = userTitle ? `${titlePrefix} ${userTitle}` : titlePrefix
  
  const queryParams = new URLSearchParams({
    title: finalTitle,
    labels: label,
    body: bodyTemplate
  })

  const fullUrl = `${repoUrl}?${queryParams.toString()}`
  window.open(fullUrl, '_blank')
  
  // 重置表单并关闭弹窗
  feedbackTitle.value = ''
  emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- 遮罩层 -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-xs" @click="emit('close')"></div>
      
      <!-- 弹窗卡片 -->
      <div class="relative w-full max-w-lg bg-[var(--color-popover)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- 头部 -->
        <header class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h3 class="text-base font-semibold text-[var(--color-foreground)] flex items-center gap-2">
            <MessageSquare class="size-4.5 text-[var(--color-primary)]" />
            问题与反馈
          </h3>
          <button 
            @click="emit('close')" 
            class="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors cursor-pointer p-1 rounded-md hover:bg-[var(--color-secondary)]/50"
          >
            <X class="size-4.5" />
          </button>
        </header>

        <!-- 内容区域 -->
        <div class="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-5">
          <!-- 选择类型 -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">反馈类型</label>
            <div class="flex flex-col gap-2">
              <button
                v-for="item in feedbackTypes"
                :key="item.id"
                @click="selectedType = item.id"
                :class="[
                  'flex items-start gap-3.5 p-3 rounded-lg border text-left cursor-pointer transition-all duration-150',
                  selectedType === item.id 
                    ? item.selectedColorClass + ' ring-1 ring-[var(--color-ring)]/40 shadow-xs' 
                    : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]/30'
                ]"
              >
                <div :class="['p-1.5 rounded-md', selectedType === item.id ? 'bg-current/10' : 'bg-[var(--color-secondary)]']">
                  <component :is="item.icon" class="size-4.5" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-[var(--color-foreground)]">{{ item.name }}</div>
                  <div class="text-xs text-[var(--color-muted-foreground)] mt-0.5 leading-relaxed">{{ item.description }}</div>
                </div>
              </button>
            </div>
          </div>

          <!-- 简短标题输入 -->
          <div class="flex flex-col gap-2">
            <label for="feedback-title" class="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              简短主题 / 标题 <span class="text-[var(--color-muted-foreground)] font-normal text-[10px]">(可选)</span>
            </label>
            <input
              id="feedback-title"
              type="text"
              v-model="feedbackTitle"
              :placeholder="
                selectedType === 'bug' 
                  ? '例如：Docker 转换工具在 Windows 路径下报错' 
                  : selectedType === 'feature'
                  ? '例如：希望能增加一个 JWT 解码与验证工具'
                  : '例如：关于界面布局或性能的一些建议'
              "
              class="w-full h-9 px-3 bg-[var(--color-input)] border border-[var(--color-border)] rounded-md text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)] transition-all"
            />
          </div>

          <!-- 环境信息预览（仅 Bug 模式显示） -->
          <div v-if="selectedType === 'bug'" class="flex flex-col gap-2">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">将带入的环境信息</label>
            <div class="bg-[var(--color-secondary)]/30 border border-[var(--color-border)] rounded-md p-3 font-mono text-[11px] leading-relaxed text-[var(--color-muted-foreground)]">
              <div><span class="text-[var(--color-foreground)]/70">工具箱版本:</span> {{ envInfo.version }}</div>
              <div><span class="text-[var(--color-foreground)]/70">运行平台:</span> {{ envInfo.platform }}</div>
              <div class="truncate"><span class="text-[var(--color-foreground)]/70">UserAgent:</span> {{ envInfo.userAgent }}</div>
            </div>
            <p class="text-[11px] text-[var(--color-muted-foreground)]/80 leading-normal">
              提示：这些信息会自动填充至 Issue 内容中，有助于我们极速排查与复现 Bug。
            </p>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <footer class="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-secondary)]/20">
          <Button variant="ghost" @click="emit('close')">取消</Button>
          <Button variant="default" @click="handleSubmit" class="flex items-center gap-1.5 font-medium">
            前往 GitHub 提交
            <ArrowUpRight class="size-3.5" />
          </Button>
        </footer>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
