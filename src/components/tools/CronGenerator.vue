<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { toast as oninToast } from 'onin-sdk'
import { Copy, HelpCircle } from '@lucide/vue'
import Button from '../ui/button/Button.vue'
import Input from '../ui/input/Input.vue'
import Checkbox from '../ui/checkbox/Checkbox.vue'
import { translateCron, predictNextRuns } from '../../utils/cron'
import { cn } from '../../lib/utils'

const toast = {
  success: (msg: string) => { try { oninToast.success(msg)?.catch?.(() => {}) } catch {} },
  error: (msg: string) => { try { oninToast.error(msg)?.catch?.(() => {}) } catch {} },
  info: (msg: string) => { try { oninToast.info(msg)?.catch?.(() => {}) } catch {} },
}

const CRON_TEMPLATES = [
  { name: '每分钟', value: '* * * * *' },
  { name: '每 5 分钟', value: '*/5 * * * *' },
  { name: '每小时', value: '0 * * * *' },
  { name: '每天凌晨 2 点', value: '0 2 * * *' },
  { name: '每个工作日凌晨 4 点', value: '0 4 * * 1-5' },
  { name: '每月 1 号零点', value: '0 0 1 * *' },
  { name: '每周五下午 6 点', value: '0 18 * * 5' },
  { name: '每秒 (6位模式)', value: '* * * * * *', isSeconds: true },
]

const cronExpression = ref('*/5 * * * *')
const isSecondsMode = ref(false)
const showHelp = ref(false)
const predictCount = ref(5)
const translation = computed(() => translateCron(cronExpression.value))

const nextRuns = computed(() => { try { return predictNextRuns(cronExpression.value, predictCount.value) } catch { return [] } })
const isExpressionValid = computed(() => { try { predictNextRuns(cronExpression.value, 1); return true } catch { return false } })

interface CronFieldConfig { type: 'all' | 'step' | 'specific'; step: number; specifics: number[] }

const activeTab = ref<'second' | 'minute' | 'hour' | 'day' | 'month' | 'week'>('minute')
const secondConfig = ref<CronFieldConfig>({ type: 'all', step: 5, specifics: [] })
const minuteConfig = ref<CronFieldConfig>({ type: 'step', step: 5, specifics: [] })
const hourConfig = ref<CronFieldConfig>({ type: 'all', step: 2, specifics: [] })
const dayConfig = ref<CronFieldConfig>({ type: 'all', step: 1, specifics: [] })
const monthConfig = ref<CronFieldConfig>({ type: 'all', step: 1, specifics: [] })
const weekConfig = ref<CronFieldConfig>({ type: 'all', step: 1, specifics: [] })

watch(isSecondsMode, (enabled) => {
  if (enabled) { activeTab.value = 'second'; const parts = cronExpression.value.trim().split(/\s+/); if (parts.length === 5) cronExpression.value = '* ' + cronExpression.value }
  else { activeTab.value = 'minute'; const parts = cronExpression.value.trim().split(/\s+/); if (parts.length === 6) { parts.shift(); cronExpression.value = parts.join(' ') } }
})

const compiledExpression = computed(() => {
  const compileField = (cfg: CronFieldConfig, defaultVal = '*') => {
    if (cfg.type === 'all') return '*'
    if (cfg.type === 'step') return `*/${cfg.step}`
    if (cfg.type === 'specific') { if (cfg.specifics.length === 0) return defaultVal; return [...cfg.specifics].sort((a, b) => a - b).join(',') }
    return '*'
  }
  const parts = [compileField(minuteConfig.value), compileField(hourConfig.value), compileField(dayConfig.value), compileField(monthConfig.value), compileField(weekConfig.value)]
  if (isSecondsMode.value) parts.unshift(compileField(secondConfig.value))
  return parts.join(' ')
})

let isUpdatingFromVisual = false
watch(compiledExpression, (newVal) => { isUpdatingFromVisual = true; cronExpression.value = newVal; setTimeout(() => { isUpdatingFromVisual = false }, 20) })

watch(cronExpression, (newVal) => {
  if (isUpdatingFromVisual) return
  const parts = newVal.trim().split(/\s+/)
  if (parts.length === 6 && !isSecondsMode.value) isSecondsMode.value = true
  else if (parts.length === 5 && isSecondsMode.value) isSecondsMode.value = false
})

const handleLoadTemplate = (tpl: typeof CRON_TEMPLATES[0]) => { if (tpl.isSeconds) isSecondsMode.value = true; else isSecondsMode.value = false; cronExpression.value = tpl.value; toast.success(`已载入模版: ${tpl.name}`) }
const handleCopyCron = () => { navigator.clipboard.writeText(cronExpression.value).then(() => toast.success('Cron 表达式已成功复制')) }

const handleQuickSelect = (tab: string, type: 'all' | 'clear' | 'odd' | 'even') => {
  let limit = 59, start = 0
  let targetRef: any = null
  if (tab === 'second') { targetRef = secondConfig; limit = 59 }
  else if (tab === 'minute') { targetRef = minuteConfig; limit = 59 }
  else if (tab === 'hour') { targetRef = hourConfig; limit = 23 }
  else if (tab === 'day') { targetRef = dayConfig; limit = 31; start = 1 }
  else if (tab === 'month') { targetRef = monthConfig; limit = 12; start = 1 }
  else if (tab === 'week') { targetRef = weekConfig; limit = 6; start = 0 }
  if (!targetRef) return
  targetRef.value.type = 'specific'
  if (type === 'clear') targetRef.value.specifics = []
  else if (type === 'all') { const l = []; for (let i = start; i <= limit; i++) l.push(i); targetRef.value.specifics = l }
  else if (type === 'odd') { const l = []; for (let i = start; i <= limit; i++) { if (i % 2 !== 0) l.push(i) } targetRef.value.specifics = l }
  else if (type === 'even') { const l = []; for (let i = start; i <= limit; i++) { if (i % 2 === 0) l.push(i) } targetRef.value.specifics = l }
}

const toggleSpecificValue = (configRef: any, val: number) => {
  configRef.type = 'specific'
  const idx = configRef.specifics.indexOf(val)
  idx > -1 ? configRef.specifics.splice(idx, 1) : configRef.specifics.push(val)
}

const getWeekName = (val: number) => ['周日 (0)', '周一 (1)', '周二 (2)', '周三 (3)', '周四 (4)', '周五 (5)', '周六 (6)'][val]
const getMonthName = (val: number) => ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][val - 1] + ` (${val})`

const fieldsList = computed(() => [
  { id: 'second', config: secondConfig, limit: 59, label: '秒', start: 0 },
  { id: 'minute', config: minuteConfig, limit: 59, label: '分钟', start: 0 },
  { id: 'hour', config: hourConfig, limit: 23, label: '小时', start: 0 },
  { id: 'day', config: dayConfig, limit: 31, label: '日期', start: 1 },
  { id: 'month', config: monthConfig, limit: 12, label: '月份', start: 1 },
  { id: 'week', config: weekConfig, limit: 6, label: '星期', start: 0 },
])
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <div class="flex items-center gap-3 overflow-x-auto">
        <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none shrink-0">
          <Checkbox v-model="isSecondsMode" />
          <span class="font-medium">启用秒级模式 (6位)</span>
        </label>
        <div class="w-px h-5 bg-[var(--color-border)] shrink-0" />
        <span class="text-xs text-[var(--color-muted-foreground)] shrink-0">常用模版:</span>
        <div class="flex gap-1.5 overflow-x-auto max-w-[400px]">
          <button v-for="tpl in CRON_TEMPLATES" :key="tpl.name" v-show="!tpl.isSeconds || isSecondsMode" @click="handleLoadTemplate(tpl)" class="px-2 py-1 rounded text-[11px] font-medium text-slate-300 transition-colors cursor-pointer whitespace-nowrap border border-[var(--color-border)] bg-[var(--color-secondary)]/50 hover:bg-[var(--color-secondary)]">{{ tpl.name }}</button>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" @click="showHelp = !showHelp"><HelpCircle class="size-3.5" /> {{ showHelp ? '隐藏说明' : '格式说明' }}</Button>
      </div>
    </div>

    <div v-show="showHelp" class="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-xs text-slate-300">
      <h3 class="font-bold text-sm text-blue-400 mb-1">Standard Cron 表达式域说明：</h3>
      <div class="grid grid-cols-6 gap-2 pb-2 border-b border-[var(--color-border)] font-semibold text-slate-400">
        <div>域名称</div><div>是否必填</div><div>允许的值</div><div>允许的特殊字符</div><div class="col-span-2">表达式示例</div>
      </div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono py-1"><div class="text-emerald-400">秒 (Seconds)</div><div>是 (6位模式)</div><div>0 - 59</div><div>, - * /</div><div class="col-span-2">`*` (每秒), `*/5` (每5秒)</div></div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono py-1"><div class="text-blue-400">分 (Minutes)</div><div>是</div><div>0 - 59</div><div>, - * /</div><div class="col-span-2">`30` (第30分), `15,45` (15和45分)</div></div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono py-1"><div class="text-blue-400">时 (Hours)</div><div>是</div><div>0 - 23</div><div>, - * /</div><div class="col-span-2">`0` (午夜), `9-17` (朝九晚五)</div></div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono py-1"><div class="text-blue-400">日 (Day of Month)</div><div>是</div><div>1 - 31</div><div>, - * / ?</div><div class="col-span-2">`1,15` (每月1号和15号)</div></div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono py-1"><div class="text-blue-400">月 (Month)</div><div>是</div><div>1 - 12</div><div>, - * /</div><div class="col-span-2">`*/3` (每季度一次)</div></div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono py-1"><div class="text-blue-400">周 (Day of Week)</div><div>是</div><div>0 - 6 (0=周日)</div><div>, - * / ?</div><div class="col-span-2">`1-5` (周一至周五)</div></div>
    </div>

    <div class="flex-1 overflow-hidden relative">
      <div class="flex w-full h-full gap-3 max-md:flex-col">
        <div class="flex-1 flex flex-col gap-3 min-w-0">
          <div class="flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 gap-3 relative">
            <span class="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Cron 表达式 ({{ isSecondsMode ? '6位秒级' : '5位标准' }})</span>
            <div class="flex items-center gap-3">
              <Input v-model="cronExpression" class="flex-1 text-lg font-mono tracking-widest font-bold" placeholder="输入 Cron 表达式，如 */5 * * * *" />
              <Button variant="outline" size="lg" @click="handleCopyCron"><Copy class="size-4" /> 复制表达式</Button>
            </div>
            <div :class="cn('p-3.5 rounded-lg border text-xs font-medium leading-relaxed transition-all flex items-center gap-2', isExpressionValid ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-400')">
              <span class="text-sm font-bold">{{ isExpressionValid ? '💡' : '⚠️' }}</span>
              <div>{{ translation }}</div>
            </div>
          </div>

          <div class="flex-1 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden min-h-0">
            <div class="px-4 py-2.5 text-xs font-medium text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider flex justify-between items-center">
              <span>未来执行时间预测</span>
              <div class="flex bg-[var(--color-muted)] p-0.5 rounded">
                <button v-for="c in [5, 10]" :key="c" :class="['px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border-none', predictCount === c ? 'bg-[var(--color-background)] text-[var(--color-foreground)]' : 'bg-transparent text-slate-400 hover:text-white']" @click="predictCount = c">前 {{ c }} 次</button>
              </div>
            </div>
            <div class="flex-1 overflow-auto p-4 flex flex-col gap-2">
              <template v-if="isExpressionValid && nextRuns.length > 0">
                <div v-for="(time, idx) in nextRuns" :key="idx" class="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:border-white/5 transition-all font-mono">
                  <span class="text-xs text-slate-500">第 {{ idx + 1 }} 次运行时间</span>
                  <span class="text-xs text-emerald-400 font-bold tracking-wider">{{ time }}</span>
                </div>
              </template>
              <div v-else class="flex-1 flex flex-col items-center justify-center p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/50 text-[var(--color-muted-foreground)] text-center gap-1.5">
                <span class="text-3xl opacity-50">⏰</span>
                <div class="text-xs">等待生成合法有效的表达式</div>
              </div>
            </div>
          </div>
        </div>

        <div class="w-full md:w-[480px] flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden shrink-0">
          <div class="px-4 py-2.5 text-xs font-medium text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider flex justify-between items-center">
            <span>可视化生成器</span>
          </div>

          <div class="flex bg-[var(--color-card)]/50 border-b border-[var(--color-border)] overflow-x-auto">
            <button v-if="isSecondsMode" :class="['px-4 py-3 text-xs font-semibold cursor-pointer border-b-2 transition-all border-none', activeTab === 'second' ? 'border-[var(--color-primary)] text-[var(--color-foreground)] bg-[var(--color-secondary)]/20' : 'border-transparent text-slate-400 hover:text-white']" @click="activeTab = 'second'">秒 (Sec)</button>
            <button v-for="tab in [{ id: 'minute', label: '分' }, { id: 'hour', label: '时' }, { id: 'day', label: '日' }, { id: 'month', label: '月' }, { id: 'week', label: '周' }]" :key="tab.id" :class="['px-4 py-3 text-xs font-semibold cursor-pointer border-b-2 transition-all border-none', activeTab === tab.id ? 'border-[var(--color-primary)] text-[var(--color-foreground)] bg-[var(--color-secondary)]/20' : 'border-transparent text-slate-400 hover:text-white']" @click="activeTab = tab.id as any">{{ tab.label }}</button>
          </div>

          <div class="flex-1 p-4 overflow-auto min-h-0 flex flex-col gap-4">
            <div v-for="current in fieldsList" :key="current.id" v-show="activeTab === current.id" class="flex flex-col gap-4">
              <label class="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:border-white/5 cursor-pointer select-none">
                <input type="radio" value="all" v-model="current.config.value.type" class="accent-[var(--color-primary)]" />
                <div>
                  <span class="text-xs text-slate-200 font-semibold">每一{{ current.label }} (通配符 `*`)</span>
                  <span class="text-[10px] text-slate-500 mt-0.5 block">该域在计划执行时允许所有数值</span>
                </div>
              </label>

              <div class="flex flex-col gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
                <label class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="radio" value="step" v-model="current.config.value.type" class="accent-[var(--color-primary)]" />
                  <span class="text-xs text-slate-200 font-semibold">定期周期 (间隔执行)</span>
                </label>
                <div v-show="current.config.value.type === 'step'" class="flex items-center gap-3 pl-6 mt-1">
                  <span class="text-xs text-slate-400">每隔</span>
                  <input type="number" min="1" :max="current.limit" v-model.number="current.config.value.step" class="w-16 rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs font-mono text-slate-200 text-center focus:border-[var(--color-primary)] outline-none font-bold" />
                  <span class="text-xs text-slate-400">{{ current.label }}执行一次</span>
                </div>
              </div>

              <div class="flex flex-col gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
                <label class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="radio" value="specific" v-model="current.config.value.type" class="accent-[var(--color-primary)]" />
                  <span class="text-xs text-slate-200 font-semibold">指定具体时间 (支持多选)</span>
                </label>
                <div v-show="current.config.value.type === 'specific'" class="pl-6 flex flex-col gap-3">
                  <div class="flex gap-2">
                    <button @click="handleQuickSelect(current.id, 'all')" class="px-2 py-0.5 rounded text-[10px] text-slate-300 cursor-pointer border border-[var(--color-border)] bg-[var(--color-secondary)]/50 hover:bg-[var(--color-secondary)]">全选</button>
                    <button @click="handleQuickSelect(current.id, 'clear')" class="px-2 py-0.5 rounded text-[10px] text-slate-300 cursor-pointer border border-[var(--color-border)] bg-[var(--color-secondary)]/50 hover:bg-[var(--color-secondary)]">清除</button>
                    <button v-show="current.id !== 'week'" @click="handleQuickSelect(current.id, 'odd')" class="px-2 py-0.5 rounded text-[10px] text-slate-300 cursor-pointer border border-[var(--color-border)] bg-[var(--color-secondary)]/50 hover:bg-[var(--color-secondary)]">奇数</button>
                    <button v-show="current.id !== 'week'" @click="handleQuickSelect(current.id, 'even')" class="px-2 py-0.5 rounded text-[10px] text-slate-300 cursor-pointer border border-[var(--color-border)] bg-[var(--color-secondary)]/50 hover:bg-[var(--color-secondary)]">偶数</button>
                  </div>
                  <div :class="['grid gap-1.5 max-h-48 overflow-y-auto select-none', current.id === 'week' ? 'grid-cols-2' : (current.id === 'month' ? 'grid-cols-3' : 'grid-cols-6')]">
                    <button v-for="val in (current.limit - current.start + 1)" :key="val" @click="toggleSpecificValue(current.config.value, (val - 1 + current.start))" :class="cn('py-1 text-xs rounded border transition-all cursor-pointer font-medium font-mono', current.config.value.specifics.includes((val - 1 + current.start)) ? 'bg-[var(--color-primary)] text-white border-blue-400' : 'bg-[var(--color-background)] text-slate-400 border-[var(--color-border)] hover:border-white/10')">
                      <template v-if="current.id === 'week'">{{ getWeekName(val - 1 + current.start) }}</template>
                      <template v-else-if="current.id === 'month'">{{ getMonthName(val - 1 + current.start) }}</template>
                      <template v-else>{{ val - 1 + current.start }}</template>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-[var(--color-border)] bg-[var(--color-card)]/50">
            <span class="text-[10px] text-[var(--color-muted-foreground)] uppercase">当前生成值:</span>
            <div class="font-mono text-sm text-emerald-400 font-bold break-all">{{ compiledExpression }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
