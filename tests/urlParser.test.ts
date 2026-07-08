import { describe, it, expect } from 'vitest';
import { parseUrlString, reconstructUrlString } from '../src/utils/urlParser';

describe('URL 解析与重构器工具函数测试', () => {
  describe('parseUrlString (URL 拆解解析)', () => {
    it('应能正确解析标准的完整 URL', () => {
      const url = 'https://example.com:8080/path/to/page?q=vue3&limit=10#readme';
      const parsed = parseUrlString(url);

      expect(parsed.protocol).toBe('https:');
      expect(parsed.hostname).toBe('example.com');
      expect(parsed.port).toBe('8080');
      expect(parsed.pathname).toBe('/path/to/page');
      expect(parsed.hash).toBe('#readme');
      expect(parsed.isRelative).toBe(false);
      expect(parsed.hadNoProtocol).toBe(false);
      
      expect(parsed.params).toHaveLength(2);
      expect(parsed.params[0]).toEqual({ key: 'q', value: 'vue3', active: true });
      expect(parsed.params[1]).toEqual({ key: 'limit', value: '10', active: true });
    });

    it('应能兼容解析无协议的地址并设置 hadNoProtocol 标识', () => {
      const url = 'github.com/b-yp/onin-dev-toolbox?branch=dev';
      const parsed = parseUrlString(url);

      expect(parsed.hostname).toBe('github.com');
      expect(parsed.pathname).toBe('/b-yp/onin-dev-toolbox');
      expect(parsed.hadNoProtocol).toBe(true);
      expect(parsed.isRelative).toBe(false);
      expect(parsed.params).toHaveLength(1);
      expect(parsed.params[0].key).toBe('branch');
    });

    it('应能兼容解析相对路径片段并设置 isRelative 标识', () => {
      const url = '/api/v1/users?id=123&token=abc#top';
      const parsed = parseUrlString(url);

      expect(parsed.pathname).toBe('/api/v1/users');
      expect(parsed.hash).toBe('#top');
      expect(parsed.isRelative).toBe(true);
      expect(parsed.params).toHaveLength(2);
    });

    it('对空白或无效输入应安全返回空结构', () => {
      const parsed = parseUrlString('');
      expect(parsed.pathname).toBe('');
      expect(parsed.params).toHaveLength(0);
    });
  });

  describe('reconstructUrlString (URL 重建拼装)', () => {
    it('应对标准结构拼装回完全一致的 URL', () => {
      const url = 'https://example.com:8080/path/to/page?q=vue3&limit=10#readme';
      const parsed = parseUrlString(url);
      const rebuilt = reconstructUrlString(parsed);
      expect(rebuilt).toBe(url);
    });

    it('应在停用某些参数时在拼接中排除它们', () => {
      const url = 'https://example.com/api?a=1&b=2&c=3';
      const parsed = parseUrlString(url);
      
      // 停用第二个参数
      parsed.params[1].active = false;
      
      const rebuilt = reconstructUrlString(parsed);
      expect(rebuilt).toBe('https://example.com/api?a=1&c=3');
    });

    it('应能正确处理无参数、无锚点的重建', () => {
      const url = 'https://google.com/search';
      const parsed = parseUrlString(url);
      const rebuilt = reconstructUrlString(parsed);
      expect(rebuilt).toBe(url);
    });

    it('应能正确重建无协议地址', () => {
      const url = 'example.com/path?a=1';
      const parsed = parseUrlString(url);
      const rebuilt = reconstructUrlString(parsed);
      expect(rebuilt).toBe(url);
    });

    it('应能正确重建相对路径片段', () => {
      const url = '/home?user=admin#main';
      const parsed = parseUrlString(url);
      const rebuilt = reconstructUrlString(parsed);
      expect(rebuilt).toBe(url);
    });
  });
});
