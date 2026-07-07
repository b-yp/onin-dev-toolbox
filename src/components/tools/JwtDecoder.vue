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
  <div class="jwt-decoder">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">JWT 令牌解码</span>
      </div>
      <div class="toolbar-right">
        <button @click="handleClear" class="action-btn ghost danger">清空</button>
      </div>
    </div>

    <!-- 主布局 -->
    <div class="main-layout">
      <!-- 输入面板 -->
      <div class="pane">
        <div class="pane-header">
          <span>输入 JWT 令牌 (Token)</span>
        </div>
        <div class="pane-content">
          <Editor v-model="input" placeholder="请在此处粘贴或输入以 eyJ... 开头的 JWT Token 字符串" />
        </div>
      </div>

      <!-- 输出面板 -->
      <div class="pane result-pane">
        <div class="pane-header">
          <span>解析结果</span>
          <!-- 状态标识 -->
          <div class="status-indicators" v-if="payloadData">
            <span v-if="isExpired" class="status-tag expired-tag">Token 已过期 ⚠️</span>
            <span v-else class="status-tag active-tag">Token 未过期 ✅</span>
          </div>
        </div>

        <div class="pane-content results-scroll-area">
          <!-- 错误展示 -->
          <div v-if="error" class="error-state-box">
            <div class="error-icon">❌</div>
            <div class="error-message">{{ error }}</div>
          </div>

          <!-- 无输入提示 -->
          <div v-else-if="!payloadData" class="welcome-state-box">
            <div class="welcome-icon">🔑</div>
            <p>等待输入有效的 JWT Token...</p>
          </div>

          <!-- 解密展示 -->
          <div v-else class="jwt-output-container">
            <!-- 1. Header 卡片 -->
            <div class="jwt-card header-card">
              <div class="card-title-row">
                <span class="card-badge header-badge">头部 (Header)</span>
                <button @click="handleCopy(headerJsonStr, 'Header')" class="copy-btn">复制 Header 📋</button>
              </div>
              <div class="card-body-editor">
                <Editor v-model="headerJsonStr" readonly />
              </div>
            </div>

            <!-- 2. Payload 卡片 -->
            <div class="jwt-card payload-card">
              <div class="card-title-row">
                <span class="card-badge payload-badge">载荷 (Payload / Claims)</span>
                <button @click="handleCopy(payloadJsonStr, 'Payload')" class="copy-btn">复制 Payload 📋</button>
              </div>
              <div class="card-body-editor">
                <Editor v-model="payloadJsonStr" readonly />
              </div>
            </div>

            <!-- 3. 智能时间翻译区 -->
            <div class="jwt-card time-card" v-if="timeClaims.length > 0">
              <div class="card-title-row">
                <span class="card-badge time-badge">时间戳翻译 (Claims Time)</span>
              </div>
              <div class="time-list-container">
                <div 
                  v-for="claim in timeClaims" 
                  :key="claim.key" 
                  class="time-item-row"
                  :class="{ 'warning-row': claim.isWarning }"
                >
                  <span class="time-label">{{ claim.label }}</span>
                  <span class="time-value">{{ claim.formatted }}</span>
                  <span class="time-status" v-if="claim.status">{{ claim.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jwt-decoder {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 16px;
  box-sizing: border-box;
}

.toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.result-pane {
  background: rgba(255, 255, 255, 0.01);
}

.results-scroll-area {
  overflow-y: auto;
  height: calc(100% - 36px);
}

/* 错误与空状态 */
.error-state-box {
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  text-align: center;
  gap: 12px;
}

.error-icon {
  font-size: 32px;
}

.error-message {
  font-family: monospace;
  font-size: 13px;
  background: rgba(239, 68, 68, 0.1);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  word-break: break-all;
}

.welcome-state-box {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  opacity: 0.5;
  gap: 12px;
}

.welcome-icon {
  font-size: 48px;
}

/* 输出卡片容器 */
.jwt-output-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.jwt-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.005) 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-card {
  border-left: 3px solid #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%);
}

.payload-card {
  border-left: 3px solid #8b5cf6;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%);
}

.time-card {
  border-left: 3px solid #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%);
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.header-badge {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
}

.payload-badge {
  background: rgba(139, 92, 246, 0.15);
  color: #c084fc;
}

.time-badge {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.copy-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  padding: 3px 10px;
  font-size: 11px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: #fff;
}

.card-body-editor {
  height: 180px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

/* 状态标签 */
.status-indicators {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}

.active-tag {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.expired-tag {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* 时间列表样式 */
.time-list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 13px;
}

.time-item-row.warning-row {
  border-color: rgba(239, 68, 68, 0.15);
  background: rgba(239, 68, 68, 0.02);
}

.time-label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  width: 120px;
}

.time-value {
  font-family: monospace;
  color: rgba(255, 255, 255, 0.85);
  flex: 1;
  text-align: left;
}

.time-status {
  font-size: 12px;
  font-weight: 600;
  color: #10b981;
}

.warning-row .time-status {
  color: #f87171;
}
</style>
