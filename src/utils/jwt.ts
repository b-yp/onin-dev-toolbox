import { decodeBase64 } from './base64';

/**
 * Base64Url 解码 (支持中文 UTF-8)
 */
export function base64UrlDecode(str: string): string {
  return decodeBase64(str, true);
}

export interface DecodedJwt {
  header: any;
  payload: any;
  signature: string;
}

/**
 * 核心 JWT 解析逻辑
 * @param token JWT 令牌字符串
 */
export function parseJwt(token: string): DecodedJwt {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error('JWT 令牌不能为空');
  }

  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    throw new Error('无效的 JWT 格式：JWT 必须包含由点 (.) 分隔的三部分。');
  }

  let header: any;
  let payload: any;

  try {
    const decodedHeader = base64UrlDecode(parts[0]);
    header = JSON.parse(decodedHeader);
  } catch (e: any) {
    throw new Error('Header 解码或 JSON 解析失败: ' + e.message);
  }

  try {
    const decodedPayload = base64UrlDecode(parts[1]);
    payload = JSON.parse(decodedPayload);
  } catch (e: any) {
    throw new Error('Payload 解码或 JSON 解析失败: ' + e.message);
  }

  return {
    header,
    payload,
    signature: parts[2]
  };
}

/**
 * 将 JWT 中的秒级时间戳转换为格式化本地时间
 * @param timestamp 秒级时间戳
 */
export function formatJwtTimestamp(timestamp: number): string | null {
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
}
