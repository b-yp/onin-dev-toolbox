/**
 * 将文本编码为 Base64
 * @param input 输入字符串
 * @param urlSafe 是否为 URL 安全格式 (把 + / 替换为 - _ 并去掉末尾的 = )
 */
export function encodeBase64(input: string, urlSafe = false): string {
  if (!input) return '';
  const uint8 = new TextEncoder().encode(input);
  let b64 = btoa(String.fromCharCode(...uint8));
  if (urlSafe) {
    b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return b64;
}

/**
 * 将 Base64 解码为文本
 * @param input Base64 编码的字符串
 * @param urlSafe 是否为 URL 安全格式
 */
export function decodeBase64(input: string, urlSafe = false): string {
  if (!input) return '';
  let b64 = input;
  if (urlSafe) {
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
  }
  const binStr = atob(b64);
  const uint8 = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    uint8[i] = binStr.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(uint8);
}
