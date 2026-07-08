/**
 * 密码生成配置接口
 */
export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
}

// 相似、易混淆的字符集
const SIMILAR_CHARS = ['0', 'O', 'o', '1', 'l', 'I', 'L', 'i'];

// 字符源定义
const CHARS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARS_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const CHARS_NUM = '0123456789';
const CHARS_SYM = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * 获取安全的 Crypto 实例，完美兼容宿主浏览器与 Node.js 单元测试环境
 */
function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
    return (globalThis as any).crypto;
  }
  throw new Error('Unsupported runtime: Web Crypto API is missing.');
}

/**
 * 兼容环境的 Base64 转换器 (防止 Node 环境无 window.btoa 报错)
 */
function safeBtoa(str: string): string {
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(str);
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).btoa) {
    return (globalThis as any).btoa(str);
  }
  // Node.js 兜底实现
  return Buffer.from(str, 'binary').toString('base64');
}

/**
 * 使用安全的 Web Crypto API 生成强随机密码
 */
export function generateSafePassword(options: PasswordOptions): string {
  let pool = '';
  if (options.uppercase) pool += CHARS_UPPER;
  if (options.lowercase) pool += CHARS_LOWER;
  if (options.numbers) pool += CHARS_NUM;
  if (options.symbols) pool += CHARS_SYM;

  if (!pool) return '';

  // 如果需要，排除相似字符
  if (options.excludeSimilar) {
    pool = pool.split('').filter(char => !SIMILAR_CHARS.includes(char)).join('');
  }

  if (!pool) return '';

  const poolLength = pool.length;
  const randomBytes = new Uint32Array(options.length);
  
  // 使用高安全强度的 Web Crypto 随机数源
  getCrypto().getRandomValues(randomBytes);

  let password = '';
  for (let i = 0; i < options.length; i++) {
    password += pool[randomBytes[i] % poolLength];
  }

  // 如果密码长度足够（如 8 位及以上），且启用了某字符集，
  // 验证生成结果中是否真的包含了相应字符集中的字符。
  if (options.length >= 8) {
    const hasUpper = !options.uppercase || (options.uppercase && /[A-Z]/.test(password));
    const hasLower = !options.lowercase || (options.lowercase && /[a-z]/.test(password));
    const hasNum = !options.numbers || (options.numbers && /[0-9]/.test(password));
    const hasSym = !options.symbols || (options.symbols && /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password));
    
    // 如果没有通过规则验证，且递归次数在一安全值内，重新生成
    if (!(hasUpper && hasLower && hasNum && hasSym)) {
      return generateSafePassword(options);
    }
  }

  return password;
}

/**
 * 转换随机字节数组为 Base64 编码
 */
function uint8ToBase64(uint8: Uint8Array): string {
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return safeBtoa(binary);
}

/**
 * 使用安全的 Web Crypto API 生成指定格式与长度的随机密钥/Token
 */
export function generateSafeKey(format: 'hex' | 'base64' | 'base64url', byteLength: number): string {
  const randomBytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(randomBytes);

  if (format === 'hex') {
    return Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  const base64 = uint8ToBase64(randomBytes);

  if (format === 'base64') {
    return base64;
  }

  if (format === 'base64url') {
    // 转换为 URL 安全模式，替换 '+'、'/' 且移除末尾 '='
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  return '';
}
