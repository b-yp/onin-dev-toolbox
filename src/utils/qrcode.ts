/**
 * 校验输入文本是否是有效的 URL
 * 支持标准的 new URL 解析以及基于正则的模糊检查
 */
export function isValidUrl(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  try {
    new URL(trimmed);
    return true;
  } catch (_) {
    // 兼容部分不包含协议头但看起来像网址的正则检查，或者相对松散的 http 匹配
    return /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed);
  }
}
