/**
 * 对文本进行 URL 编码
 * @param input 输入内容
 * @param mode 'component' (使用 encodeURIComponent) 或 'uri' (使用 encodeURI)
 */
export function encodeUrl(input: string, mode: 'component' | 'uri' = 'component'): string {
  if (!input) return '';
  if (mode === 'component') {
    return encodeURIComponent(input);
  }
  return encodeURI(input);
}

/**
 * 对 URL 编码文本进行解码
 * @param input 编码内容
 * @param mode 'component' (使用 decodeURIComponent) 或 'uri' (使用 decodeURI)
 */
export function decodeUrl(input: string, mode: 'component' | 'uri' = 'component'): string {
  if (!input) return '';
  if (mode === 'component') {
    return decodeURIComponent(input);
  }
  return decodeURI(input);
}
