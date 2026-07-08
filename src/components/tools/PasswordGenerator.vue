<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { toast as oninToast } from 'onin-sdk';
import { generateSafePassword, generateSafeKey, type PasswordOptions } from '../../utils/password';

// 兜底代理 toast，防止在非 Onin 运行时环境下抛出 Uncaught 异常
const toast = {
  success: (msg: string) => {
    try {
      oninToast.success(msg)?.catch?.((err: any) => console.log('Toast Success:', msg, err));
    } catch (e) {
      console.log('Toast Success:', msg);
    }
  },
  error: (msg: string) => {
    try {
      oninToast.error(msg)?.catch?.((err: any) => console.error('Toast Error:', msg, err));
    } catch (e) {
      console.error('Toast Error:', msg);
    }
  },
  info: (msg: string) => {
    try {
      oninToast.info(msg)?.catch?.((err: any) => console.log('Toast Info:', msg, err));
    } catch (e) {
      console.log('Toast Info:', msg);
    }
  }
};

// 标签页状态
const activeTab = ref<'password' | 'key'>('password');

// ==================== 随机密码生成器状态 ====================
const length = ref(16);
const includeUpper = ref(true);
const includeLower = ref(true);
const includeNumbers = ref(true);
const includeSymbols = ref(true);
const excludeSimilar = ref(false);
const quantity = ref(5); // 批量生成默认 5 个

const generatedPasswords = ref<string[]>([]);

const handleGeneratePasswords = () => {
  const options: PasswordOptions = {
    length: length.value,
    uppercase: includeUpper.value,
    lowercase: includeLower.value,
    numbers: includeNumbers.value,
    symbols: includeSymbols.value,
    excludeSimilar: excludeSimilar.value
  };

  const results: string[] = [];
  for (let i = 0; i < quantity.value; i++) {
    const pwd = generateSafePassword(options);
    if (pwd) results.push(pwd);
  }

  if (results.length === 0) {
    toast.error('生成密码失败，请至少选择一类字符集');
    return;
  }

  generatedPasswords.value = results;
};

const handleCopySingle = (pwd: string) => {
  navigator.clipboard.writeText(pwd).then(() => {
    toast.success('密码已成功复制');
  });
};

const handleCopyAll = () => {
  if (generatedPasswords.value.length === 0) return;
  const text = generatedPasswords.value.join('\n');
  navigator.clipboard.writeText(text).then(() => {
    toast.success('所有密码已复制到剪贴板');
  });
};

// 监听配置项的变化，实时自动刷新第一个（或者批量全部重新生成，体验更好）
watch([length, includeUpper, includeLower, includeNumbers, includeSymbols, excludeSimilar, quantity], () => {
  // 必须保证至少有一个字符集勾选
  if (includeUpper.value || includeLower.value || includeNumbers.value || includeSymbols.value) {
    handleGeneratePasswords();
  }
});

// ==================== 随机密钥生成器状态 ====================
const keyFormat = ref<'hex' | 'base64' | 'base64url'>('hex');
const keyBits = ref<128 | 256 | 512>(256); // 默认 256-bit

const generatedKey = ref('');

const handleGenerateKey = () => {
  // 比特换算字节大小：128 -> 16, 256 -> 32, 512 -> 64
  const bytes = keyBits.value / 8;
  generatedKey.value = generateSafeKey(keyFormat.value, bytes);
};

const handleCopyKey = () => {
  if (!generatedKey.value) return;
  navigator.clipboard.writeText(generatedKey.value).then(() => {
    toast.success('密钥已复制到剪贴板');
  });
};

// 监听密钥配置改变
watch([keyFormat, keyBits], handleGenerateKey);

// 初始化加载
onMounted(() => {
  handleGeneratePasswords();
  handleGenerateKey();
});
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border bg-[var(--bg-color)]">
    <!-- 头部菜单栏 -->
    <div class="flex items-center justify-between bg-white/[0.03] p-2 px-4 rounded-xl border border-white/[0.05] backdrop-blur-md">
      <div class="flex items-center gap-3">
        <!-- 选项卡切换 -->
        <div class="flex bg-white/[0.05] p-0.5 rounded-lg">
          <button 
            :class="['px-4 py-1 rounded-md text-xs font-medium cursor-pointer transition-all', activeTab === 'password' ? 'bg-white/[0.1] text-white shadow-sm' : 'bg-transparent text-[var(--text-secondary)] hover:text-white']"
            @click="activeTab = 'password'"
          >
            🔒 密码生成器
          </button>
          <button 
            :class="['px-4 py-1 rounded-md text-xs font-medium cursor-pointer transition-all', activeTab === 'key' ? 'bg-white/[0.1] text-white shadow-sm' : 'bg-transparent text-[var(--text-secondary)] hover:text-white']"
            @click="activeTab = 'key'"
          >
            🔑 密钥 Token 生成器
          </button>
        </div>
      </div>
      
      <!-- 统一重新生成按钮 -->
      <button 
        @click="activeTab === 'password' ? handleGeneratePasswords() : handleGenerateKey()"
        class="bg-[var(--accent-color)] border border-blue-500/20 text-white px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5"
      >
        🔄 重新生成
      </button>
    </div>

    <!-- 主工作区 -->
    <div class="flex-1 overflow-hidden relative">
      
      <!-- 1. 密码生成模式 -->
      <div v-show="activeTab === 'password'" class="flex w-full h-full gap-3 md:flex-row flex-col">
        <!-- 侧边配置面板 -->
        <div class="w-full md:w-80 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 gap-5">
          <div class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-white/5 pb-2">
            配置参数
          </div>

          <div class="flex flex-col gap-4">
            <!-- 密码长度配置 -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-[var(--text-secondary)]">密码长度</span>
                <span class="text-xs font-mono text-blue-400 font-bold">{{ length }} 位</span>
              </div>
              <div class="flex items-center gap-2">
                <input 
                  type="range" 
                  min="6" 
                  max="64" 
                  step="1" 
                  v-model.number="length" 
                  class="h-1 accent-[var(--accent-color)] cursor-pointer flex-1 bg-white/10 rounded-lg appearance-none" 
                />
              </div>
            </div>

            <!-- 批量生成数量 -->
            <div class="flex items-center justify-between border-t border-white/5 pt-3">
              <span class="text-xs text-[var(--text-secondary)]">生成数量</span>
              <select 
                v-model.number="quantity" 
                class="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-slate-200 outline-none cursor-pointer focus:border-[var(--accent-color)]"
              >
                <option :value="1">1 个密码</option>
                <option :value="5">5 个密码</option>
                <option :value="10">10 个密码</option>
                <option :value="15">15 个密码</option>
                <option :value="20">20 个密码</option>
              </select>
            </div>

            <!-- 字符集勾选列表 -->
            <div class="flex flex-col gap-2.5 border-t border-white/5 pt-3">
              <span class="text-xs text-[var(--text-secondary)] mb-1">字符选项</span>
              
              <label class="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input type="checkbox" v-model="includeUpper" class="accent-[var(--accent-color)] rounded" />
                <span>大写字母 (A-Z)</span>
              </label>

              <label class="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input type="checkbox" v-model="includeLower" class="accent-[var(--accent-color)] rounded" />
                <span>小写字母 (a-z)</span>
              </label>

              <label class="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input type="checkbox" v-model="includeNumbers" class="accent-[var(--accent-color)] rounded" />
                <span>数字 (0-9)</span>
              </label>

              <label class="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input type="checkbox" v-model="includeSymbols" class="accent-[var(--accent-color)] rounded" />
                <span>特殊字符 (!@#$等)</span>
              </label>

              <label class="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none border-t border-white/5 pt-3" title="排除容易看错或读错的混淆字符，如 o、O、0、1、i、l、I">
                <input type="checkbox" v-model="excludeSimilar" class="accent-[var(--accent-color)] rounded" />
                <span class="text-orange-400/90 font-medium">排除易混淆字符</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 密码展示面板 -->
        <div class="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
          <div class="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] bg-white/[0.03] border-b border-white/[0.05] uppercase tracking-wider flex justify-between items-center">
            <span>生成的密码列表</span>
            <span class="text-[10px] text-slate-500 font-mono">CRYPTOGRAPHICALLY SECURE</span>
          </div>

          <div class="flex-1 flex flex-col p-4 justify-between min-h-0">
            <!-- 密码排布列表 -->
            <div class="flex-1 overflow-auto flex flex-col gap-2 pr-1">
              <div 
                v-for="(pwd, idx) in generatedPasswords" 
                :key="idx"
                class="flex items-center justify-between p-3 bg-zinc-900 border border-white/[0.03] hover:border-white/10 rounded-lg group transition-all"
              >
                <!-- 支持等宽字体显示，便于区分字符 -->
                <div class="font-mono text-sm tracking-wider text-slate-200 select-all font-semibold break-all">
                  {{ pwd }}
                </div>
                <button 
                  @click="handleCopySingle(pwd)"
                  class="ml-4 opacity-50 group-hover:opacity-100 bg-white/5 hover:bg-[var(--accent-color)] text-white px-2.5 py-1 rounded text-xs cursor-pointer transition-all shrink-0"
                >
                  复制
                </button>
              </div>
            </div>

            <!-- 批量复制按钮 -->
            <div v-if="generatedPasswords.length > 1" class="border-t border-white/5 pt-4 mt-4">
              <button 
                @click="handleCopyAll"
                class="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-semibold cursor-pointer bg-[var(--accent-color)] text-white hover:opacity-95 transition-all"
              >
                📋 复制所有密码
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 密钥 Token 生成模式 -->
      <div v-show="activeTab === 'key'" class="flex w-full h-full gap-3 md:flex-row flex-col">
        <!-- 侧边配置面板 -->
        <div class="w-full md:w-80 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 gap-5">
          <div class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-white/5 pb-2">
            密钥参数
          </div>

          <div class="flex flex-col gap-4">
            <!-- 密钥格式 -->
            <div class="flex flex-col gap-2">
              <span class="text-xs text-[var(--text-secondary)]">密钥格式</span>
              <div class="flex flex-col gap-2">
                <label 
                  v-for="format in [
                    { id: 'hex', label: 'Hex (十六进制)', desc: '常用于 AES Key / 哈希盐' },
                    { id: 'base64', label: 'Base64 (标准)', desc: '兼容二进制数据的常规文本' },
                    { id: 'base64url', label: 'Base64URL (URL 安全)', desc: '常用于 JWT 签名密钥' }
                  ]" 
                  :key="format.id"
                  class="flex items-start gap-2.5 p-2 rounded bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] cursor-pointer select-none"
                >
                  <input 
                    type="radio" 
                    :value="format.id" 
                    v-model="keyFormat" 
                    class="mt-1 accent-[var(--accent-color)]" 
                  />
                  <div class="flex flex-col">
                    <span class="text-xs text-slate-200 font-medium">{{ format.label }}</span>
                    <span class="text-[10px] text-slate-500 mt-0.5">{{ format.desc }}</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- 密钥长度位大小 -->
            <div class="flex flex-col gap-2 border-t border-white/5 pt-3">
              <span class="text-xs text-[var(--text-secondary)]">密钥强度</span>
              <div class="flex bg-white/[0.05] p-0.5 rounded-lg">
                <button 
                  v-for="bits in [128, 256, 512]" 
                  :key="bits"
                  :class="['flex-1 px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-all', keyBits === bits ? 'bg-white/[0.1] text-white shadow-sm' : 'bg-transparent text-[var(--text-secondary)] hover:text-white']"
                  @click="keyBits = bits as any"
                >
                  {{ bits }}-bit ({{ bits / 8 }}B)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 密钥展示面板 -->
        <div class="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
          <div class="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] bg-white/[0.03] border-b border-white/[0.05] uppercase tracking-wider flex justify-between items-center">
            <span>生成的随机密钥 Token</span>
            <span class="text-[10px] text-emerald-400 font-mono">HIGH ENTROPY KEY</span>
          </div>

          <div class="flex-1 flex flex-col p-4 justify-between min-h-0">
            <!-- 密钥展示框 -->
            <div class="flex-1 flex flex-col justify-center items-center gap-4">
              <div class="w-full p-4 bg-zinc-900 border border-white/[0.04] rounded-xl font-mono text-sm text-slate-100 break-all select-all text-center tracking-wide min-h-24 flex items-center justify-center font-bold">
                {{ generatedKey }}
              </div>
              <div class="text-[11px] text-[var(--text-secondary)]">
                该密钥由密码学安全的伪随机数生成器 (CSPRNG) 在您本地生成，数据绝不上传服务器。
              </div>
            </div>

            <!-- 复制按钮 -->
            <div class="border-t border-white/5 pt-4 mt-4">
              <button 
                @click="handleCopyKey"
                class="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-semibold cursor-pointer bg-[var(--accent-color)] text-white hover:opacity-95 transition-all"
              >
                📋 复制密钥
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 滚动条在暗色模式下的美观 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* 范围滑块自定义 */
input[type="range"]::-webkit-slider-runnable-track {
  background: rgba(255, 255, 255, 0.08);
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  background: var(--accent-color);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  appearance: none;
  margin-top: -4px;
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.5);
  transition: transform 0.1s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}
</style>
