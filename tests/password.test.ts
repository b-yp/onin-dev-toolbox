import { beforeAll, describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { generateSafePassword, generateSafeKey } from '../src/utils/password';

beforeAll(() => {
  // 在 Node.js/Vitest 运行环境下挂载原生的 Web Crypto 实现到全局
  if (typeof window !== 'undefined' && !window.crypto) {
    Object.defineProperty(window, 'crypto', {
      value: crypto.webcrypto,
      writable: true
    });
  }
});

describe('密码与密钥生成器工具函数测试', () => {
  describe('generateSafePassword (强密码生成)', () => {
    it('密码长度应该和配置选项一致', () => {
      const lengths = [8, 16, 24, 32, 64];
      lengths.forEach(len => {
        const pwd = generateSafePassword({
          length: len,
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: true,
          excludeSimilar: false
        });
        expect(pwd).toHaveLength(len);
      });
    });

    it('密码应该成功包含勾选的字符集类型', () => {
      // 仅包含大写字母
      const pwdUpper = generateSafePassword({
        length: 20,
        uppercase: true,
        lowercase: false,
        numbers: false,
        symbols: false,
        excludeSimilar: false
      });
      expect(pwdUpper).toMatch(/^[A-Z]+$/);

      // 仅包含数字
      const pwdNum = generateSafePassword({
        length: 20,
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false,
        excludeSimilar: false
      });
      expect(pwdNum).toMatch(/^[0-9]+$/);
    });

    it('应成功过滤掉易混淆字符', () => {
      // 易混淆字符有：0, O, o, 1, l, I, L, i
      // 我们生成多组长密码，确保混淆字符绝对不会出现在结果里
      for (let k = 0; k < 10; k++) {
        const pwd = generateSafePassword({
          length: 50,
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: false,
          excludeSimilar: true
        });
        
        // 每个密码里绝对不包含任何混淆字
        const similarChars = ['0', 'O', 'o', '1', 'l', 'I', 'L', 'i'];
        similarChars.forEach(char => {
          expect(pwd).not.toContain(char);
        });
      }
    });
  });

  describe('generateSafeKey (安全密钥 Token 生成)', () => {
    it('应能正确生成对应格式的 Hex 密钥', () => {
      // 16 字节 -> 32 字符十六进制
      const key128 = generateSafeKey('hex', 16);
      expect(key128).toHaveLength(32);
      expect(key128).toMatch(/^[0-9a-f]{32}$/);

      // 32 字节 -> 64 字符十六进制
      const key256 = generateSafeKey('hex', 32);
      expect(key256).toHaveLength(64);
      expect(key256).toMatch(/^[0-9a-f]{64}$/);
    });

    it('应能正确生成标准 Base64 密钥', () => {
      const key = generateSafeKey('base64', 32);
      // 解码回来的字符 byteLength 应该是 32 字节
      const raw = Buffer.from(key, 'base64');
      expect(raw.length).toBe(32);
    });

    it('应能正确生成 URL 安全的 Base64URL 密钥', () => {
      // Base64URL 中不能包含 +、/ 或 = 符号
      for (let k = 0; k < 10; k++) {
        const key = generateSafeKey('base64url', 64);
        expect(key).not.toContain('+');
        expect(key).not.toContain('/');
        expect(key).not.toContain('=');
      }
    });
  });
});
