<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { toast as oninToast } from 'onin-sdk'
import { Copy, RefreshCw } from '@lucide/vue'
import Button from '../ui/button/Button.vue'
import Checkbox from '../ui/checkbox/Checkbox.vue'
import Slider from '../ui/slider/Slider.vue'
import Select from '../ui/select/Select.vue'
import SelectItem from '../ui/select/SelectItem.vue'
import RadioGroup from '../ui/radio-group/RadioGroup.vue'
import RadioGroupItem from '../ui/radio-group/RadioGroupItem.vue'
import Separator from '../ui/separator/Separator.vue'
import { generateSafePassword, generateSafeKey, type PasswordOptions } from '../../utils/password'

const toast = {
  success: (msg: string) => { try { oninToast.success(msg)?.catch?.((err: any) => console.log('Toast:', msg, err)) } catch { console.log(msg) } },
  error: (msg: string) => { try { oninToast.error(msg)?.catch?.((err: any) => console.error('Toast:', msg, err)) } catch { console.error(msg) } },
  info: (msg: string) => { try { oninToast.info(msg)?.catch?.((err: any) => console.log('Toast:', msg, err)) } catch { console.log(msg) } },
}

const activeTab = ref<'password' | 'key'>('password')
const length = ref(16)
const includeUpper = ref(true)
const includeLower = ref(true)
const includeNumbers = ref(true)
const includeSymbols = ref(true)
const excludeSimilar = ref(false)
const quantity = ref(5)
const generatedPasswords = ref<string[]>([])

const handleGeneratePasswords = () => {
  const options: PasswordOptions = { length: length.value, uppercase: includeUpper.value, lowercase: includeLower.value, numbers: includeNumbers.value, symbols: includeSymbols.value, excludeSimilar: excludeSimilar.value }
  const results: string[] = []
  for (let i = 0; i < quantity.value; i++) { const pwd = generateSafePassword(options); if (pwd) results.push(pwd) }
  if (results.length === 0) { toast.error('生成密码失败，请至少选择一类字符集'); return }
  generatedPasswords.value = results
}

const handleCopySingle = (pwd: string) => { navigator.clipboard.writeText(pwd).then(() => toast.success('密码已成功复制')) }
const handleCopyAll = () => { if (generatedPasswords.value.length === 0) return; navigator.clipboard.writeText(generatedPasswords.value.join('\n')).then(() => toast.success('所有密码已复制到剪贴板')) }

watch([length, includeUpper, includeLower, includeNumbers, includeSymbols, excludeSimilar, quantity], () => { if (includeUpper.value || includeLower.value || includeNumbers.value || includeSymbols.value) handleGeneratePasswords() })

const keyFormat = ref<'hex' | 'base64' | 'base64url'>('hex')
const keyBits = ref<128 | 256 | 512>(256)
const generatedKey = ref('')

const handleGenerateKey = () => { const bytes = keyBits.value / 8; generatedKey.value = generateSafeKey(keyFormat.value, bytes) }
const handleCopyKey = () => { if (!generatedKey.value) return; navigator.clipboard.writeText(generatedKey.value).then(() => toast.success('密钥已复制到剪贴板')) }

watch([keyFormat, keyBits], handleGenerateKey)
onMounted(() => { handleGeneratePasswords(); handleGenerateKey() })
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <div class="flex items-center gap-3">
        <div class="flex bg-[var(--color-muted)] p-0.5 rounded-lg">
          <Button variant="ghost" size="sm" :class="activeTab === 'password'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="activeTab = 'password'">密码生成器</Button>
          <Button variant="ghost" size="sm" :class="activeTab === 'key'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="activeTab = 'key'">密钥 Token 生成器</Button>
        </div>
      </div>
      <Button variant="default" size="sm" @click="activeTab === 'password' ? handleGeneratePasswords() : handleGenerateKey()"><RefreshCw class="size-3.5" /> 重新生成</Button>
    </div>

    <div class="flex-1 overflow-hidden relative">
      <div v-show="activeTab === 'password'" class="flex w-full h-full gap-3 max-md:flex-col">
        <div class="w-full md:w-72 shrink-0 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 gap-5 overflow-y-auto">
          <div class="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider pb-2 border-b border-[var(--color-border)]">配置参数</div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-[var(--color-muted-foreground)]">密码长度</span>
              <span class="text-xs font-mono text-[var(--color-primary)] font-bold">{{ length }} 位</span>
            </div>
            <Slider :model-value="[length]" @update:model-value="(v: number[]) => length = v[0]" :min="6" :max="64" :step="1" />
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
            <span class="text-xs text-[var(--color-muted-foreground)]">生成数量</span>
            <Select :model-value="String(quantity)" @update:model-value="(v) => quantity = Number(v)" class="w-28">
              <SelectItem value="1">1 个密码</SelectItem>
              <SelectItem value="5">5 个密码</SelectItem>
              <SelectItem value="10">10 个密码</SelectItem>
              <SelectItem value="15">15 个密码</SelectItem>
              <SelectItem value="20">20 个密码</SelectItem>
            </Select>
          </div>

          <div class="flex flex-col gap-2.5 pt-3 border-t border-[var(--color-border)]">
            <span class="text-xs text-[var(--color-muted-foreground)] mb-1">字符选项</span>
            <label class="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none"><Checkbox v-model="includeUpper" /> 大写字母 (A-Z)</label>
            <label class="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none"><Checkbox v-model="includeLower" /> 小写字母 (a-z)</label>
            <label class="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none"><Checkbox v-model="includeNumbers" /> 数字 (0-9)</label>
            <label class="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none"><Checkbox v-model="includeSymbols" /> 特殊字符 (!@#$等)</label>
            <label class="flex items-center gap-2.5 text-xs cursor-pointer select-none pt-3 border-t border-[var(--color-border)]" title="排除容易看错或读错的混淆字符">
              <Checkbox v-model="excludeSimilar" /> <span class="text-orange-400/90 font-medium">排除易混淆字符</span>
            </label>
          </div>
        </div>

        <div class="flex-1 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div class="px-4 py-2 text-xs font-medium text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider flex justify-between items-center">
            <span>生成的密码列表</span>
            <span class="text-[10px] text-slate-500 font-mono">CRYPTOGRAPHICALLY SECURE</span>
          </div>
          <div class="flex-1 flex flex-col p-4 justify-between min-h-0">
            <div class="flex-1 overflow-auto flex flex-col gap-2">
              <div v-for="(pwd, idx) in generatedPasswords" :key="idx" class="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:border-white/10 transition-all group">
                <div class="font-mono text-sm tracking-wider text-slate-200 select-all font-semibold break-all">{{ pwd }}</div>
                <Button variant="ghost" size="icon-sm" class="opacity-50 group-hover:opacity-100 shrink-0" @click="handleCopySingle(pwd)"><Copy class="size-3.5" /></Button>
              </div>
            </div>
            <div v-if="generatedPasswords.length > 1" class="pt-4 mt-4 border-t border-[var(--color-border)]">
              <Button variant="default" class="w-full" @click="handleCopyAll"><Copy class="size-3.5" /> 复制所有密码</Button>
            </div>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'key'" class="flex w-full h-full gap-3 max-md:flex-col">
        <div class="w-full md:w-72 shrink-0 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 gap-5">
          <div class="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider pb-2 border-b border-[var(--color-border)]">密钥参数</div>

          <div class="flex flex-col gap-2">
            <span class="text-xs text-[var(--color-muted-foreground)]">密钥格式</span>
            <RadioGroup v-model="keyFormat" class="flex flex-col gap-2">
              <div class="flex items-start gap-2.5 p-2 rounded border border-[var(--color-border)] bg-[var(--color-secondary)]/20 hover:bg-[var(--color-secondary)]/40 cursor-pointer select-none">
                <RadioGroupItem value="hex" />
                <div>
                  <span class="text-xs text-slate-200 font-medium">Hex (十六进制)</span>
                  <span class="text-[10px] text-slate-500 mt-0.5 block">常用于 AES Key / 哈希盐</span>
                </div>
              </div>
              <div class="flex items-start gap-2.5 p-2 rounded border border-[var(--color-border)] bg-[var(--color-secondary)]/20 hover:bg-[var(--color-secondary)]/40 cursor-pointer select-none">
                <RadioGroupItem value="base64" />
                <div>
                  <span class="text-xs text-slate-200 font-medium">Base64 (标准)</span>
                  <span class="text-[10px] text-slate-500 mt-0.5 block">兼容二进制数据的常规文本</span>
                </div>
              </div>
              <div class="flex items-start gap-2.5 p-2 rounded border border-[var(--color-border)] bg-[var(--color-secondary)]/20 hover:bg-[var(--color-secondary)]/40 cursor-pointer select-none">
                <RadioGroupItem value="base64url" />
                <div>
                  <span class="text-xs text-slate-200 font-medium">Base64URL (URL 安全)</span>
                  <span class="text-[10px] text-slate-500 mt-0.5 block">常用于 JWT 签名密钥</span>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div class="flex flex-col gap-2 pt-3 border-t border-[var(--color-border)]">
            <span class="text-xs text-[var(--color-muted-foreground)]">密钥强度</span>
            <div class="flex bg-[var(--color-muted)] p-0.5 rounded-lg">
              <button v-for="bits in [128, 256, 512]" :key="bits" :class="['flex-1 px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors border-none', keyBits === bits ? 'bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm' : 'bg-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]']" @click="keyBits = bits as any">{{ bits }}-bit</button>
            </div>
          </div>
        </div>

        <div class="flex-1 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div class="px-4 py-2 text-xs font-medium text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider flex justify-between items-center">
            <span>生成的随机密钥 Token</span>
            <span class="text-[10px] text-emerald-400 font-mono">HIGH ENTROPY KEY</span>
          </div>
          <div class="flex-1 flex flex-col p-4 justify-between min-h-0">
            <div class="flex-1 flex flex-col justify-center items-center gap-4">
              <div class="w-full p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] font-mono text-sm text-slate-100 break-all select-all text-center tracking-wide min-h-24 flex items-center justify-center font-bold">{{ generatedKey }}</div>
              <div class="text-[11px] text-[var(--color-muted-foreground)] text-center">该密钥由密码学安全的伪随机数生成器 (CSPRNG) 在您本地生成，数据绝不上传服务器。</div>
            </div>
            <div class="pt-4 mt-4 border-t border-[var(--color-border)]">
              <Button variant="default" class="w-full" @click="handleCopyKey"><Copy class="size-3.5" /> 复制密钥</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
