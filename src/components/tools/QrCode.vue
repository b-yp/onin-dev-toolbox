<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { toast as oninToast } from 'onin-sdk';

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
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import Editor from '../Editor.vue';
import { isValidUrl } from '../../utils/qrcode';

// 选项卡状态
const activeTab = ref<'generate' | 'decode'>('generate');

// ================= 生成器状态与逻辑 =================
const text = ref('https://github.com/b-yp/onin-dev-toolbox');
const qrCanvasRef = ref<HTMLCanvasElement | null>(null);
const errorCorrectionLevel = ref<'L' | 'M' | 'Q' | 'H'>('M');
const colorMode = ref<'classic' | 'dark'>('dark');
const size = ref(256);

// 渲染二维码的方法
const renderQRCode = async () => {
  if (!qrCanvasRef.value) return;
  if (!text.value.trim()) {
    // 输入为空时清空 Canvas
    const ctx = qrCanvasRef.value.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, qrCanvasRef.value.width, qrCanvasRef.value.height);
    return;
  }

  // 颜色定义
  const darkColor = colorMode.value === 'classic' ? '#000000' : '#60a5fa'; // 经典黑色，或者暗黑蓝色
  const lightColor = colorMode.value === 'classic' ? '#ffffff' : '#0d0d0d'; // 经典白色，或者暗黑背景色

  try {
    await QRCode.toCanvas(qrCanvasRef.value, text.value, {
      width: size.value,
      margin: 3,
      errorCorrectionLevel: errorCorrectionLevel.value,
      color: {
        dark: darkColor,
        light: lightColor
      }
    });
  } catch (err: any) {
    console.error('二维码渲染失败:', err);
  }
};

// 带有防抖的渲染触发器
let renderTimer: any = null;
const triggerRender = () => {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(renderQRCode, 100);
};

// 监听所有生成参数
watch([text, errorCorrectionLevel, colorMode, size], triggerRender);

// 快捷输入助手
const handleInsertLocalhost = () => {
  text.value = 'http://localhost:5173';
  toast.success('已载入本地调试模板');
};

const handleClearInput = () => {
  text.value = '';
};

// 导出与分享
const handleDownload = () => {
  if (!qrCanvasRef.value || !text.value.trim()) return;
  const url = qrCanvasRef.value.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `qrcode_${Date.now()}.png`;
  a.click();
  toast.success('已开始下载二维码');
};

const handleCopyImage = () => {
  if (!qrCanvasRef.value || !text.value.trim()) return;
  qrCanvasRef.value.toBlob((blob) => {
    if (!blob) return;
    try {
      const item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]).then(() => {
        toast.success('二维码已复制到剪贴板');
      }).catch((err) => {
        console.error(err);
        toast.error('浏览器不支持或无权写入剪贴板图片');
      });
    } catch (e) {
      toast.error('当前浏览器不支持直接复制图片');
    }
  }, 'image/png');
};

// ================= 解码器状态与逻辑 =================
const decodedText = ref<string | null>(null);
const decodeError = ref<string | null>(null);
const previewUrl = ref<string | null>(null);
const isDecoding = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

// 解析图片核心逻辑
const decodeImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    toast.error('请选择有效的图片文件');
    return;
  }

  isDecoding.value = true;
  decodedText.value = null;
  decodeError.value = null;

  const reader = new FileReader();
  reader.onload = (e) => {
    const url = e.target?.result as string;
    previewUrl.value = url;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        decodeError.value = '无法创建渲染上下文';
        isDecoding.value = false;
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          decodedText.value = code.data;
          toast.success('解码成功！');
        } else {
          decodeError.value = '未在图片中检测到有效的二维码';
        }
      } catch (err: any) {
        decodeError.value = '图像像素读取失败: ' + err.message;
      } finally {
        isDecoding.value = false;
      }
    };
    img.onerror = () => {
      decodeError.value = '加载图片失败';
      isDecoding.value = false;
    };
    img.src = url;
  };
  reader.onerror = () => {
    decodeError.value = '读取文件失败';
    isDecoding.value = false;
  };
  reader.readAsDataURL(file);
};

// 文件上传处理器
const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) decodeImageFile(file);
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (file) decodeImageFile(file);
};

// 剪贴板粘贴直接解码 (高频极佳体验)
const handlePaste = (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) {
        decodeImageFile(file);
        toast.info('已自动读取并解析剪贴板截图');
        break;
      }
    }
  }
};

// 一键打开链接
const isUrl = computed(() => {
  return decodedText.value ? isValidUrl(decodedText.value) : false;
});

const handleOpenUrl = () => {
  if (decodedText.value) {
    window.open(decodedText.value, '_blank');
  }
};

const handleCopyDecoded = () => {
  if (!decodedText.value) return;
  navigator.clipboard.writeText(decodedText.value).then(() => {
    toast.success('已复制解析内容');
  });
};

const handleResetDecoder = () => {
  decodedText.value = null;
  decodeError.value = null;
  previewUrl.value = null;
};

// 生命周期集成
onMounted(() => {
  if (activeTab.value === 'generate') {
    renderQRCode();
  }
  // 在全局添加 Paste 监听，只要页面处于激活且在解码 tab
  window.addEventListener('paste', handlePaste);
});

onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste);
  if (renderTimer) clearTimeout(renderTimer);
});

// 当切换标签页时，如果是生成重新渲染一次以防 Canvas 未加载
watch(activeTab, (newTab) => {
  if (newTab === 'generate') {
    setTimeout(renderQRCode, 50);
  }
});
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border bg-[var(--bg-color)]">
    <!-- 头部菜单栏 -->
    <div class="flex items-center justify-between bg-white/[0.03] p-2 px-4 rounded-xl border border-white/[0.05] backdrop-blur-md">
      <div class="flex items-center gap-3">
        <!-- 标签页切换 -->
        <div class="flex bg-white/[0.05] p-0.5 rounded-lg">
          <button 
            :class="['px-4 py-1 rounded-md text-xs font-medium cursor-pointer transition-all', activeTab === 'generate' ? 'bg-white/[0.1] text-white shadow-sm' : 'bg-transparent text-[var(--text-secondary)] hover:text-white']"
            @click="activeTab = 'generate'"
          >
            🎨 生成二维码
          </button>
          <button 
            :class="['px-4 py-1 rounded-md text-xs font-medium cursor-pointer transition-all', activeTab === 'decode' ? 'bg-white/[0.1] text-white shadow-sm' : 'bg-transparent text-[var(--text-secondary)] hover:text-white']"
            @click="activeTab = 'decode'"
          >
            🔍 解码二维码
          </button>
        </div>
      </div>
      
      <!-- 生成模式右侧控制 -->
      <div v-if="activeTab === 'generate'" class="flex items-center gap-3">
        <button @click="handleInsertLocalhost" class="bg-white/[0.05] border border-white/[0.1] text-white px-3.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/[0.1]">
          本机调试模板
        </button>
        <button @click="handleClearInput" class="bg-white/[0.05] border border-white/[0.1] px-3.5 py-1.5 rounded-lg text-xs cursor-pointer hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20">
          清空输入
        </button>
      </div>

      <!-- 解码模式右侧控制 -->
      <div v-if="activeTab === 'decode'" class="flex items-center gap-3">
        <button @click="handleResetDecoder" class="bg-white/[0.05] border border-white/[0.1] px-3.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/[0.1]">
          重置解码器
        </button>
      </div>
    </div>

    <!-- 主工作区 -->
    <div class="flex-1 overflow-hidden relative">
      
      <!-- 1. 二维码生成模式 -->
      <div v-show="activeTab === 'generate'" class="flex w-full h-full gap-3 md:flex-row flex-col">
        <!-- 输入框面板 -->
        <div class="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
          <div class="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] bg-white/[0.03] border-b border-white/[0.05] uppercase tracking-wider">
            输入文本或链接 (URL)
          </div>
          <div class="flex-1 min-h-0">
            <Editor v-model="text" placeholder="输入你想转换为二维码的内容..." />
          </div>
        </div>

        <!-- 渲染配置与展示面板 -->
        <div class="w-full md:w-96 flex flex-col gap-3">
          <!-- 二维码画布展示 -->
          <div class="flex flex-col items-center justify-center bg-[#0d0d0d] border border-white/[0.05] rounded-xl p-6 w-72 h-72 mx-auto relative overflow-hidden">
            <div class="bg-white/[0.01] p-3 rounded-lg border border-white/[0.03] flex items-center justify-center max-w-full max-h-[85%] overflow-hidden">
              <canvas ref="qrCanvasRef" class="max-w-full max-h-full aspect-square rounded-md shadow-lg object-contain"></canvas>
            </div>
            <div v-if="!text.trim()" class="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl text-xs text-[var(--text-secondary)]">
              请输入文本以渲染二维码
            </div>
          </div>

          <!-- 配置面板 -->
          <div class="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 gap-4 justify-between">
            <div class="flex flex-col gap-3">
              <!-- 纠错等级 -->
              <div class="flex items-center justify-between">
                <span class="text-xs text-[var(--text-secondary)]">纠错等级 (ECL)</span>
                <div class="flex bg-white/[0.05] p-0.5 rounded-md">
                  <button 
                    v-for="level in ['L', 'M', 'Q', 'H']" 
                    :key="level"
                    :class="['px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all', errorCorrectionLevel === level ? 'bg-white/[0.1] text-white' : 'bg-transparent text-slate-400 hover:text-white']"
                    @click="errorCorrectionLevel = level as any"
                  >
                    {{ level }}
                  </button>
                </div>
              </div>

              <!-- 颜色模式 -->
              <div class="flex items-center justify-between">
                <span class="text-xs text-[var(--text-secondary)]">配色主题</span>
                <div class="flex bg-white/[0.05] p-0.5 rounded-md">
                  <button 
                    :class="['px-2.5 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-all', colorMode === 'dark' ? 'bg-white/[0.1] text-white' : 'bg-transparent text-slate-400 hover:text-white']"
                    @click="colorMode = 'dark'"
                  >
                    暗色科技
                  </button>
                  <button 
                    :class="['px-2.5 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-all', colorMode === 'classic' ? 'bg-white/[0.1] text-white' : 'bg-transparent text-slate-400 hover:text-white']"
                    @click="colorMode = 'classic'"
                  >
                    经典黑白
                  </button>
                </div>
              </div>

              <!-- 二维码尺寸 -->
              <div class="flex items-center justify-between">
                <span class="text-xs text-[var(--text-secondary)]">图片尺寸</span>
                <div class="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="128" 
                    max="512" 
                    step="32" 
                    v-model.number="size" 
                    class="h-1 accent-[var(--accent-color)] cursor-pointer w-24 bg-white/10 rounded-lg appearance-none" 
                  />
                  <span class="text-[11px] font-mono text-slate-400 w-10 text-right">{{ size }}px</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2">
              <button 
                @click="handleCopyImage" 
                :disabled="!text.trim()"
                class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium cursor-pointer border border-white/[0.05] bg-white/[0.05] text-white hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                📋 复制图片
              </button>
              <button 
                @click="handleDownload" 
                :disabled="!text.trim()"
                class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium cursor-pointer bg-[var(--accent-color)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                📥 下载 PNG
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 二维码解码模式 -->
      <div v-show="activeTab === 'decode'" class="flex w-full h-full gap-3 md:flex-row flex-col">
        <!-- 上传拖拽与粘贴区 -->
        <div 
          class="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/[0.08] hover:border-[var(--accent-color)] bg-white/[0.01] hover:bg-white/[0.02] rounded-xl p-8 cursor-pointer transition-all relative overflow-hidden"
          @dragover="handleDragOver"
          @drop="handleDrop"
          @click="fileInputRef?.click()"
        >
          <input 
            type="file" 
            ref="fileInputRef" 
            class="hidden" 
            accept="image/*" 
            @change="handleFileChange" 
          />
          
          <!-- 上传提示 UI -->
          <div v-if="!previewUrl" class="flex flex-col items-center text-center">
            <span class="text-5xl mb-4 opacity-70">📷</span>
            <h3 class="text-sm font-medium text-white mb-2">选择或拖拽图片到这里</h3>
            <p class="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs">
              支持主流格式的图片，亦可在页面内直接按 <kbd class="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-white border border-white/20">Ctrl + V</kbd> 粘贴您截好的屏幕图片。
            </p>
          </div>

          <!-- 图片预览 UI -->
          <div v-else class="flex flex-col items-center justify-center w-full h-full relative">
            <img :src="previewUrl" class="max-h-72 rounded-lg border border-white/[0.05] shadow-lg mb-2 object-contain" />
            <div class="text-[11px] text-[var(--text-secondary)]">
              拖拽新图片或直接 Ctrl+V 粘贴进行更换
            </div>
            
            <!-- 解码中的遮罩 -->
            <div v-if="isDecoding" class="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div class="flex flex-col items-center gap-2">
                <span class="text-2xl animate-spin">🔄</span>
                <span class="text-xs text-slate-300">正在分析图像二维码...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 结果展示面板 -->
        <div class="w-full md:w-96 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
          <div class="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] bg-white/[0.03] border-b border-white/[0.05] uppercase tracking-wider">
            解码分析结果
          </div>
          
          <div class="flex-1 flex flex-col p-4 justify-between min-h-0">
            <!-- 结果文本区 -->
            <div class="flex-1 min-h-0 overflow-auto flex flex-col">
              <template v-if="decodedText">
                <div class="flex-1 p-3 bg-[#0d0d0d] border border-white/[0.05] rounded-lg text-xs font-mono text-slate-200 break-all select-all whitespace-pre-wrap">
                  {{ decodedText }}
                </div>
              </template>
              
              <template v-else-if="decodeError">
                <div class="flex-1 flex flex-col items-center justify-center p-6 border border-red-500/10 bg-red-500/[0.02] text-red-400 rounded-lg text-center gap-2">
                  <span class="text-2xl">⚠️</span>
                  <div class="text-xs">{{ decodeError }}</div>
                  <div class="text-[11px] text-slate-500">请尝试截取更加清晰、完整的二维码区域</div>
                </div>
              </template>
              
              <template v-else>
                <div class="flex-1 flex flex-col items-center justify-center p-6 border border-white/5 bg-white/[0.002] text-[var(--text-secondary)] rounded-lg text-center gap-1.5">
                  <span class="text-3xl opacity-50">📥</span>
                  <div class="text-xs">等待读取图像文件</div>
                  <div class="text-[10px] text-slate-500">在左侧上传或粘贴图片后，结果将在此处展示</div>
                </div>
              </template>
            </div>

            <!-- 控制按钮 -->
            <div v-if="decodedText" class="flex gap-2 mt-4">
              <button 
                @click="handleCopyDecoded"
                class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium cursor-pointer border border-white/[0.05] bg-white/[0.05] text-white hover:bg-white/[0.1] transition-all"
              >
                📋 复制原文
              </button>
              <button 
                v-if="isUrl"
                @click="handleOpenUrl"
                class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium cursor-pointer bg-[var(--accent-color)] text-white hover:opacity-90 transition-all"
              >
                🌐 打开链接
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 二维码虚线斜条纹样式，用于装饰 */
.diff-empty-stripe {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.01) 0px,
    rgba(255, 255, 255, 0.01) 2px,
    transparent 2px,
    transparent 8px
  );
}

/* 确保范围滑块的原生暗黑样式优雅 */
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
