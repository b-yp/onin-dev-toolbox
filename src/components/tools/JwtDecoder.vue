<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { toast } from 'onin-sdk';
import Editor from '../Editor.vue';

const input = ref('');
const error = ref<string | null>(null);

// 解析出的对象
const headerData = ref<Record<string, any> | null>(null);
const payloadData = ref<Record<string, any> | null>(null);
const signatureHex = ref<string | null>(null);

// 格式化的字符串形式（用于只读 Editor 展示）
const headerJsonStr = ref('');
const payloadJsonStr = ref('');

// 清空所有状态
const handleClear = () => {
  input.value = '';
  error.value = null;
  headerData.value = null;
  payloadData.value = null;
  signatureHex.value = null;
  headerJsonStr.value = '';
  payloadJsonStr.value = '';
};

// 复制
const handleCopy = (text: string, label: string) => {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`已复制 ${label} 到剪贴板`);
  });
};

// 原生 Base64Url 安全解码（支持中文 UTF-8）
const base64UrlDecode = (str: string): string => {
  // 1. 将 Base64Url 转换为标准 Base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // 2. 补齐末尾等号
  while (base64.length % 4) {
    base64 += '=';
  }
  // 3. 解码为二进制字符串
  const binaryString = atob(base64);
  // 4. 将二进制字符串编码为 Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  // 5. 使用 TextDecoder 支持多字节 UTF-8 字符（如中文 claims）
  return new TextDecoder('utf-8').decode(bytes);
};

// 核心解析逻辑
const parseJwt = (token: string) => {
  const trimmed = token.trim();
  if (!trimmed) {
    handleClear();
    return;
  }

  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    error.value = '无效的 JWT 格式：JWT 必须包含由点 (.) 分隔的三部分。';
    headerData.value = null;
    payloadData.value = null;
    signatureHex.value = null;
    return;
  }

  try {
    // 1. 解密并解析 Header
    const decodedHeader = base64UrlDecode(parts[0]);
    headerData.value = JSON.parse(decodedHeader);
    headerJsonStr.value = JSON.stringify(headerData.value, null, 2);

    // 2. 解密并解析 Payload
    const decodedPayload = base64UrlDecode(parts[1]);
    payloadData.value = JSON.parse(decodedPayload);
    payloadJsonStr.value = JSON.stringify(payloadData.value, null, 2);

    // 3. 提取 Signature 占位
    signatureHex.value = parts[2];
    error.value = null;
  } catch (err: any) {
    error.value = '解析失败：' + err.message;
    headerData.value = null;
    payloadData.value = null;
    signatureHex.value = null;
  }
};

// 监听输入
watch(input, (newVal) => {
  parseJwt(newVal);
});

// 格式化时间戳辅助函数
const formatTimestamp = (timestamp: number) => {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) return null;
  try {
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) return null;
    
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  } catch {
    return null;
  }
};

// 智能提取和翻译时间声明
const timeClaims = computed(() => {
  if (!payloadData.value) return [];
  const claims = [
    { key: 'iat', label: '签发时间 (iat)', val: payloadData.value.iat },
    { key: 'exp', label: '过期时间 (exp)', val: payloadData.value.exp },
    { key: 'nbf', label: '生效时间 (nbf)', val: payloadData.value.nbf },
  ];

  return claims
    .filter(c => typeof c.val === 'number')
    .map(c => {
      const formatted = formatTimestamp(c.val);
      let status = '';
      let isWarning = false;

      if (c.key === 'exp') {
        const now = Math.floor(Date.now() / 1000);
        if (now > c.val) {
          status = '已过期 ⚠️';
          isWarning = true;
        } else {
          const diffMin = Math.round((c.val - now) / 60);
          if (diffMin < 60) {
            status = `剩余 ${diffMin} 分钟有效`;
          } else {
            status = `剩余 ${(diffMin / 60).toFixed(1)} 小时有效`;
          }
        }
      }

      return {
        ...c,
        formatted,
        status,
        isWarning
      };
    });
});

// 计算是否已过期
const isExpired = computed(() => {
  if (!payloadData.value || typeof payloadData.value.exp !== 'number') return false;
  return Math.floor(Date.now() / 1000) > payloadData.value.exp;
});
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <!-- 工具栏 -->
    <div class="flex items-center justify-between bg-white/[0.03] p-2 px-4 rounded-xl border border-white/5 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold text-white/50">JWT 令牌解码</span>
      </div>
      <div class="flex items-center gap-3">
        <button @click="handleClear" class="action-btn ghost danger">清空</button>
      </div>
    </div>

    <!-- 主布局 -->
    <div class="flex-1 flex gap-3 min-h-0 items-stretch md:flex-row flex-col">
      <!-- 输入面板 -->
      <div class="flex-1 flex flex-col bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
        <div class="px-4 py-2 text-xs text-white/50 bg-white/[0.03] border-b border-white/5 uppercase tracking-wider h-9 flex items-center">
          <span>输入 JWT 令牌 (Token)</span>
        </div>
        <div class="flex-1 overflow-hidden">
          <Editor v-model="input" placeholder="请在此处粘贴或输入以 eyJ... 开头的 JWT Token 字符串" />
        </div>
      </div>

      <!-- 输出面板 -->
      <div class="flex-1 flex flex-col bg-white/[0.015] rounded-xl border border-white/5 overflow-hidden">
        <div class="px-4 py-2 text-xs text-white/50 bg-white/[0.03] border-b border-white/5 uppercase tracking-wider h-9 flex justify-between items-center">
          <span>解析结果</span>
          <!-- 状态标识 -->
          <div class="flex items-center gap-2" v-if="payloadData">
            <span v-if="isExpired" class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">Token 已过期 ⚠️</span>
            <span v-else class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Token 未过期 ✅</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto scroll-smooth">
          <!-- 错误展示 -->
          <div v-if="error" class="p-8 px-6 flex flex-col items-center justify-center text-red-500 text-center gap-3">
            <div class="text-3xl">❌</div>
            <div class="font-mono text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 word-break: break-all">
              {{ error }}
            </div>
          </div>

          <!-- 无输入提示 -->
          <div v-else-if="!payloadData" class="h-full flex flex-col items-center justify-center text-white/50 opacity-50 gap-3">
            <div class="text-5xl">🔑</div>
            <p>等待输入有效的 JWT Token...</p>
          </div>

          <!-- 解密展示 -->
          <div v-else class="flex flex-col gap-4 p-4">
            <!-- 1. Header 卡片 -->
            <div class="bg-gradient-to-br from-blue-500/5 to-transparent border border-white/5 border-l-3 border-l-blue-500 rounded-xl p-3.5 px-4 flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300">头部 (Header)</span>
                <button @click="handleCopy(headerJsonStr, 'Header')" class="bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 text-[11px] rounded cursor-pointer transition-all hover:bg-blue-500 hover:border-blue-500 hover:text-white">复制 Header 📋</button>
              </div>
              <div class="h-[180px] border border-white/[0.03] rounded-lg bg-black/20 overflow-hidden">
                <Editor v-model="headerJsonStr" readonly />
              </div>
            </div>

            <!-- 2. Payload 卡片 -->
            <div class="bg-gradient-to-br from-violet-500/5 to-transparent border border-white/5 border-l-3 border-l-violet-500 rounded-xl p-3.5 px-4 flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-300">载荷 (Payload / Claims)</span>
                <button @click="handleCopy(payloadJsonStr, 'Payload')" class="bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 text-[11px] rounded cursor-pointer transition-all hover:bg-blue-500 hover:border-blue-500 hover:text-white">复制 Payload 📋</button>
              </div>
              <div class="h-[180px] border border-white/[0.03] rounded-lg bg-black/20 overflow-hidden">
                <Editor v-model="payloadJsonStr" readonly />
              </div>
            </div>

            <!-- 3. 智能时间翻译区 -->
            <div class="bg-gradient-to-br from-emerald-500/5 to-transparent border border-white/5 border-l-3 border-l-emerald-500 rounded-xl p-3.5 px-4 flex flex-col gap-3" v-if="timeClaims.length > 0">
              <div class="flex justify-between items-center">
                <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">时间戳翻译 (Claims Time)</span>
              </div>
              <div class="flex flex-col gap-2">
                <div 
                  v-for="claim in timeClaims" 
                  :key="claim.key" 
                  class="flex items-center justify-between p-2 px-3 bg-white/2 border border-white/[0.03] rounded-lg text-sm"
                  :class="{ 'border-red-500/15 bg-red-500/[0.02]': claim.isWarning }"
                >
                  <span class="font-medium text-white/50 w-[120px]">{{ claim.label }}</span>
                  <span class="font-mono text-white/85 flex-1 text-left">{{ claim.formatted }}</span>
                  <span class="text-xs font-semibold text-emerald-500" :class="{ 'text-red-400': claim.isWarning }" v-if="claim.status">{{ claim.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
