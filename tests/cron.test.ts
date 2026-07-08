import { describe, it, expect } from 'vitest';
import { translateCron, predictNextRuns } from '../src/utils/cron';

describe('Cron 表达式助手工具函数测试', () => {
  describe('translateCron (表达式翻译)', () => {
    it('应能正确翻译标准的五位 Cron 表达式', () => {
      const translation = translateCron('*/5 * * * *');
      expect(translation).toContain('每隔 5 分钟');
    });

    it('应能正确翻译带秒级的六位 Cron 表达式', () => {
      const translation = translateCron('0 0 12 * * ?');
      expect(translation).toContain('在下午 12:00');
    });

    it('应能对于非法格式返回友好的错误提示', () => {
      const badTranslation = translateCron('invalid_cron_expression');
      expect(badTranslation).not.toBe('invalid_cron_expression');
      expect(badTranslation.length).toBeGreaterThan(5);
    });

    it('空表达式或空串应返回基本提示', () => {
      expect(translateCron('')).toBe('请输入 Cron 表达式');
    });
  });

  describe('predictNextRuns (未来执行时刻预测)', () => {
    it('应对合法 Cron 返回格式正确的未来时刻列表', () => {
      const runs = predictNextRuns('0 0 12 * * *', 5);
      expect(runs).toHaveLength(5);
      runs.forEach(run => {
        // 时间格式应为：YYYY-MM-DD HH:mm:ss
        expect(run).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      });
    });

    it('对非法 Cron 预测应当抛出异常', () => {
      expect(() => {
        predictNextRuns('abc * * * *', 3);
      }).toThrow();
    });
  });
});
