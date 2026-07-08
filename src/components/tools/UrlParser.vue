<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { toast as oninToast } from 'onin-sdk'
import { Copy, Eraser, Plus, Trash, ChevronUp, ChevronDown, X } from '@lucide/vue'
import Button from '../ui/button/Button.vue'
import Checkbox from '../ui/checkbox/Checkbox.vue'
import Input from '../ui/input/Input.vue'
import Textarea from '../ui/textarea/Textarea.vue'
import Select from '../ui/select/Select.vue'
import SelectItem from '../ui/select/SelectItem.vue'
import { parseUrlString, reconstructUrlString, type ParsedUrlStructure } from '../../utils/urlParser'

const toast = {
  success: (msg: string) => { try { oninToast.success(msg)?.catch?.(() => {}) } catch {} },
  error: (msg: string) => { try { oninToast.error(msg)?.catch?.(() => {}) } catch {} },
  info: (msg: string) => { try { oninToast.info(msg)?.catch?.(() => {}) } catch {} },
}

const SAMPLE_URLS = [
  { name: 'Google 复杂查询', value: 'https://www.google.com/search?q=vue3+reactive+ref&oq=vue3+reactive&sourceid=chrome&ie=UTF-8#readme' },
  { name: 'API 本地测试', value: 'http://localhost:8080/api/v1/users/details?id=99283&status=active&expand=profile,roles' },
  { name: '相对路径片段', value: '/products/list?category=electronics&sort=price_desc&limit=20#top' },
]

const rawUrl = ref('')
const parsedStructure = ref<ParsedUrlStructure>({ protocol: 'https:', hostname: '', port: '', pathname: '/', hash: '', params: [], isRelative: false, hadNoProtocol: false })
let isUpdating = false

const handleParse = (val: string) => { if (isUpdating) return; isUpdating = true; parsedStructure.value = parseUrlString(val); isUpdating = false }
const handleReconstruct = () => { if (isUpdating) return; isUpdating = true; rawUrl.value = reconstructUrlString(parsedStructure.value); isUpdating = false }

watch(rawUrl, (newVal) => { handleParse(newVal) })
watch(parsedStructure, () => { handleReconstruct() }, { deep: true })

const loadSample = (val: string) => { rawUrl.value = val; toast.success('已载入示例 URL') }
const handleCopyAll = () => { if (!rawUrl.value) return; navigator.clipboard.writeText(rawUrl.value).then(() => toast.success('URL 已复制到剪贴板')) }
const handleClear = () => { rawUrl.value = ''; parsedStructure.value = { protocol: 'https:', hostname: '', port: '', pathname: '/', hash: '', params: [], isRelative: false, hadNoProtocol: false }; toast.success('内容已清空') }

const addParam = () => { parsedStructure.value.params.push({ key: '', value: '', active: true }) }
const removeParam = (idx: number) => { parsedStructure.value.params.splice(idx, 1) }
const clearAllParams = () => { parsedStructure.value.params = []; toast.success('已清空所有参数') }
const moveParam = (idx: number, dir: 'up' | 'down') => {
  const l = parsedStructure.value.params
  if (dir === 'up' && idx > 0) { const t = l[idx]; l[idx] = l[idx - 1]; l[idx - 1] = t }
  else if (dir === 'down' && idx < l.length - 1) { const t = l[idx]; l[idx] = l[idx + 1]; l[idx + 1] = t }
}
const encodeParamValue = (idx: number) => { try { parsedStructure.value.params[idx].value = encodeURIComponent(parsedStructure.value.params[idx].value); toast.success('已编码') } catch { toast.error('编码失败') } }
const decodeParamValue = (idx: number) => { try { parsedStructure.value.params[idx].value = decodeURIComponent(parsedStructure.value.params[idx].value); toast.success('已解码') } catch { toast.error('解码失败') } }

onMounted(() => loadSample(SAMPLE_URLS[0].value))
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)] shrink-0">
      <div class="flex items-center gap-3 overflow-x-auto">
        <span class="text-xs text-[var(--color-muted-foreground)] shrink-0">示例:</span>
        <div class="flex gap-1.5 overflow-x-auto">
          <button v-for="tpl in SAMPLE_URLS" :key="tpl.name" @click="loadSample(tpl.value)" class="px-2 py-1 rounded text-[11px] font-medium text-slate-300 transition-colors cursor-pointer whitespace-nowrap border border-[var(--color-border)] bg-[var(--color-secondary)]/50 hover:bg-[var(--color-secondary)]">{{ tpl.name }}</button>
        </div>
      </div>
      <div class="flex gap-2 shrink-0">
        <Button variant="default" size="sm" @click="handleCopyAll"><Copy class="size-3.5" /> 复制完整 URL</Button>
        <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear"><Eraser class="size-3.5" /> 清空</Button>
      </div>
    </div>

    <div class="flex-1 overflow-hidden flex flex-col gap-3 min-h-0">
      <div class="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-2 shrink-0">
        <div class="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">完整 URL 地址</div>
        <Textarea v-model="rawUrl" class="h-20 text-xs font-mono resize-none" placeholder="在此输入需要解析的 URL..." />
      </div>

      <div class="flex-1 flex gap-3 max-md:flex-col min-h-0">
        <div class="w-full md:w-72 shrink-0 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 gap-4 overflow-y-auto">
          <div class="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider pb-2 border-b border-[var(--color-border)]">URL 基础结构</div>
          <label class="flex items-center gap-2.5 p-2 rounded border border-[var(--color-border)] bg-[var(--color-secondary)]/20 cursor-pointer select-none text-xs text-slate-300">
            <Checkbox v-model="parsedStructure.isRelative" /> 标记为相对路径片段
          </label>
          <div v-show="!parsedStructure.isRelative" class="flex flex-col gap-1.5">
            <span class="text-xs text-[var(--color-muted-foreground)]">协议</span>
            <Select v-model="parsedStructure.protocol" class="w-full">
              <SelectItem value="https:">https://</SelectItem>
              <SelectItem value="http:">http://</SelectItem>
              <SelectItem value="ftp:">ftp://</SelectItem>
              <SelectItem value="file:">file:///</SelectItem>
            </Select>
          </div>
          <div v-show="!parsedStructure.isRelative" class="flex flex-col gap-1.5">
            <span class="text-xs text-[var(--color-muted-foreground)]">域名</span>
            <Input v-model="parsedStructure.hostname" class="text-xs font-mono h-8" placeholder="www.google.com" />
          </div>
          <div v-show="!parsedStructure.isRelative" class="flex flex-col gap-1.5">
            <span class="text-xs text-[var(--color-muted-foreground)]">端口</span>
            <Input v-model="parsedStructure.port" class="text-xs font-mono h-8" placeholder="默认端口留空" />
          </div>
          <div class="flex flex-col gap-1.5 pt-3 border-t border-[var(--color-border)]">
            <span class="text-xs text-[var(--color-muted-foreground)]">路径</span>
            <Input v-model="parsedStructure.pathname" class="text-xs font-mono h-8" placeholder="/search" />
          </div>
          <div class="flex flex-col gap-1.5">
            <span class="text-xs text-[var(--color-muted-foreground)]">哈希 (Fragment)</span>
            <Input v-model="parsedStructure.hash" class="text-xs font-mono h-8" placeholder="#readme" />
          </div>
        </div>

        <div class="flex-1 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden min-h-0">
          <div class="px-4 py-2.5 text-xs font-medium text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider flex justify-between items-center shrink-0">
            <span>查询参数列表</span>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" class="h-6 text-[11px] text-emerald-400" @click="addParam"><Plus class="size-3" /> 添加参数</Button>
              <Button variant="ghost" size="sm" class="h-6 text-[11px] text-red-400 hover:text-red-300" @click="clearAllParams"><Trash class="size-3" /> 清空</Button>
            </div>
          </div>
          <div class="flex-1 overflow-auto p-4 flex flex-col gap-2 min-h-0">
            <template v-if="parsedStructure.params.length > 0">
              <div v-for="(item, idx) in parsedStructure.params" :key="idx" class="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:border-white/5 p-2.5 transition-all group">
                <Checkbox v-model="item.active" class="shrink-0" />
                <Input v-model="item.key" class="w-1/3 text-xs font-mono h-8" placeholder="键 (Key)" />
                <Input v-model="item.value" class="flex-1 text-xs font-mono h-8" placeholder="值 (Value)" />
                <div class="flex items-center gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-all">
                  <Button variant="ghost" size="icon-sm" class="h-6 w-6" :disabled="idx === 0" @click="moveParam(idx, 'up')"><ChevronUp class="size-3" /></Button>
                  <Button variant="ghost" size="icon-sm" class="h-6 w-6" :disabled="idx === parsedStructure.params.length - 1" @click="moveParam(idx, 'down')"><ChevronDown class="size-3" /></Button>
                  <Button variant="ghost" size="sm" class="h-6 text-[10px] px-1.5" @click="encodeParamValue(idx)">Enc</Button>
                  <Button variant="ghost" size="sm" class="h-6 text-[10px] px-1.5" @click="decodeParamValue(idx)">Dec</Button>
                  <Button variant="ghost" size="icon-sm" class="h-6 w-6 text-red-400 hover:bg-red-500/20" @click="removeParam(idx)"><X class="size-3" /></Button>
                </div>
              </div>
            </template>
            <div v-else class="flex-1 flex flex-col items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] text-center gap-1.5">
              <span class="text-3xl opacity-50">🌐</span>
              <div class="text-xs">当前无查询参数</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
