<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { toast as oninToast } from 'onin-sdk'
import { Copy, Eraser, FileText, ArrowRight } from '@lucide/vue'
import Editor from '../Editor.vue'
import Button from '../ui/button/Button.vue'
import Checkbox from '../ui/checkbox/Checkbox.vue'
import Select from '../ui/select/Select.vue'
import SelectItem from '../ui/select/SelectItem.vue'
import { convertYamlToJson, convertJsonToYaml } from '../../utils/yamlConverter'

const toast = {
  success: (msg: string) => { try { oninToast.success(msg)?.catch?.(() => {}) } catch {} },
  error: (msg: string) => { try { oninToast.error(msg)?.catch?.(() => {}) } catch {} },
  info: (msg: string) => { try { oninToast.info(msg)?.catch?.(() => {}) } catch {} },
}

const SAMPLE_YAML = `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx-deployment\n  labels:\n    app: nginx\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: nginx\n  template:\n    metadata:\n      labels:\n        app: nginx\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:1.14.2\n        ports:\n        - containerPort: 80\n        env:\n        - name: NODE_ENV\n          value: production\n        resources:\n          limits:\n            cpu: 500m\n            memory: 512Mi`

const yamlText = ref('')
const jsonText = ref('')
const yamlIndent = ref<2 | 4>(2)
const jsonIndent = ref<2 | 4 | 0>(2)
const autoSync = ref(true)
const yamlError = ref('')
const jsonError = ref('')
let activeDirection: 'yaml2json' | 'json2yaml' | null = null
let debounceTimer: any = null

const performYamlToJson = () => { yamlError.value = ''; if (!yamlText.value.trim()) { jsonText.value = ''; return }; try { jsonText.value = convertYamlToJson(yamlText.value, jsonIndent.value) } catch (err: any) { yamlError.value = err.message || 'YAML 解析错误' } }
const performJsonToYaml = () => { jsonError.value = ''; if (!jsonText.value.trim()) { yamlText.value = ''; return }; try { yamlText.value = convertJsonToYaml(jsonText.value, yamlIndent.value) } catch (err: any) { jsonError.value = err.message || 'JSON 解析错误' } }

const triggerAutoSync = (dir: 'yaml2json' | 'json2yaml') => {
  if (!autoSync.value) return; activeDirection = dir
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { if (activeDirection === 'yaml2json') performYamlToJson(); else if (activeDirection === 'json2yaml') performJsonToYaml(); activeDirection = null }, 350)
}

watch(yamlText, () => { if (activeDirection === 'json2yaml') return; triggerAutoSync('yaml2json') })
watch(jsonText, () => { if (activeDirection === 'yaml2json') return; triggerAutoSync('json2yaml') })
watch([yamlIndent, jsonIndent], () => { if (yamlText.value && !yamlError.value) performYamlToJson(); else if (jsonText.value && !jsonError.value) performJsonToYaml() })

const loadSample = () => { activeDirection = 'yaml2json'; yamlText.value = SAMPLE_YAML; performYamlToJson(); activeDirection = null; toast.success('已载入 K8s Deployment 示例') }
const handleCopy = (type: 'yaml' | 'json') => { const c = type === 'yaml' ? yamlText.value : jsonText.value; if (!c) return; navigator.clipboard.writeText(c).then(() => toast.success(`已复制 ${type.toUpperCase()}`)) }
const handleClear = (type: 'yaml' | 'json' | 'all') => { if (type === 'yaml' || type === 'all') { yamlText.value = ''; yamlError.value = '' }; if (type === 'json' || type === 'all') { jsonText.value = ''; jsonError.value = '' }; toast.success('内容已清空') }

onMounted(() => loadSample())
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2.5 px-4 rounded-xl border border-[var(--color-border)] shrink-0 flex-wrap gap-2">
      <div class="flex items-center gap-4 flex-wrap text-xs">
        <label class="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
          <Checkbox v-model="autoSync" />
          <span class="font-medium">实时自动联动</span>
        </label>
        <div class="w-px h-4 bg-[var(--color-border)]" />
        <div class="flex items-center gap-2 text-slate-400"><span>YAML 缩进:</span>
          <Select :model-value="String(yamlIndent)" @update:model-value="(v) => yamlIndent = Number(v) as 2 | 4" class="w-24">
            <SelectItem value="2">2 空格</SelectItem>
            <SelectItem value="4">4 空格</SelectItem>
          </Select>
        </div>
        <div class="w-px h-4 bg-[var(--color-border)]" />
        <div class="flex items-center gap-2 text-slate-400"><span>JSON 缩进:</span>
          <Select :model-value="String(jsonIndent)" @update:model-value="(v) => jsonIndent = Number(v) as 2 | 4 | 0" class="w-24">
            <SelectItem value="2">2 空格</SelectItem>
            <SelectItem value="4">4 空格</SelectItem>
            <SelectItem value="0">压缩一行</SelectItem>
          </Select>
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="loadSample"><FileText class="size-3.5" /> 载入示例</Button>
        <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear('all')"><Eraser class="size-3.5" /> 全部清空</Button>
      </div>
    </div>

    <div class="flex-1 flex gap-3 flex-col md:flex-row min-h-0 relative">
      <div class="flex-1 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden min-h-0">
        <div class="px-4 py-2 text-xs font-semibold text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] flex justify-between items-center shrink-0">
          <span class="tracking-wide">YAML 配置文件</span>
          <div class="flex gap-1.5">
            <Button variant="ghost" size="sm" class="h-6 text-[10px]" :disabled="!yamlText" @click="handleCopy('yaml')"><Copy class="size-3" /> 复制</Button>
            <Button variant="ghost" size="sm" class="h-6 text-[10px]" :disabled="!yamlText" @click="handleClear('yaml')"><Eraser class="size-3" /> 清空</Button>
          </div>
        </div>
        <div class="flex-1 min-h-0 relative flex flex-col">
          <Editor v-model="yamlText" language="yaml" placeholder="在此处输入或粘贴 YAML 配置..." />
          <div v-show="yamlError" class="bg-red-500/10 border-t border-red-500/20 text-red-400 text-[11px] p-3 font-mono shrink-0 flex items-start gap-2 max-h-20 overflow-y-auto"><span class="text-sm select-none">⚠️</span><div class="flex-1 leading-normal break-all">{{ yamlError }}</div></div>
        </div>
      </div>

      <div
        v-if="!autoSync"
        class="shrink-0 flex gap-2 items-center justify-center py-2 md:py-0 md:flex-col"
      >
        <Button variant="outline" size="sm" class="gap-1" @click="performYamlToJson" title="YAML 转 JSON">
          <ArrowRight class="size-3.5" />
        </Button>
        <Button variant="outline" size="sm" class="gap-1" @click="performJsonToYaml" title="JSON 转 YAML">
          <ArrowRight class="size-3.5 rotate-180" />
        </Button>
      </div>

      <div class="flex-1 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden min-h-0">
        <div class="px-4 py-2 text-xs font-semibold text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] flex justify-between items-center shrink-0">
          <span class="tracking-wide">JSON 配置文件</span>
          <div class="flex gap-1.5">
            <Button variant="ghost" size="sm" class="h-6 text-[10px]" :disabled="!jsonText" @click="handleCopy('json')"><Copy class="size-3" /> 复制</Button>
            <Button variant="ghost" size="sm" class="h-6 text-[10px]" :disabled="!jsonText" @click="handleClear('json')"><Eraser class="size-3" /> 清空</Button>
          </div>
        </div>
        <div class="flex-1 min-h-0 relative flex flex-col">
          <Editor v-model="jsonText" language="json" placeholder="在此处输入或粘贴 JSON 配置..." />
          <div v-show="jsonError" class="bg-red-500/10 border-t border-red-500/20 text-red-400 text-[11px] p-3 font-mono shrink-0 flex items-start gap-2 max-h-20 overflow-y-auto"><span class="text-sm select-none">⚠️</span><div class="flex-1 leading-normal break-all">{{ jsonError }}</div></div>
        </div>
      </div>
    </div>
  </div>
</template>
