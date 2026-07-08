import { describe, it, expect } from 'vitest';
import { computeSplitDiff, computeInlineDiff } from '../src/utils/diff';

describe('文本对比差异 (Text Diff) 工具函数测试', () => {
  describe('computeSplitDiff (双栏对齐)', () => {
    it('应正确处理没有差异的文本', () => {
      const original = 'line 1\nline 2';
      const modified = 'line 1\nline 2';
      const result = computeSplitDiff(original, modified);
      
      expect(result.leftRows).toHaveLength(2);
      expect(result.rightRows).toHaveLength(2);
      
      expect(result.leftRows[0]).toEqual({ lineNum: 1, text: 'line 1', type: 'normal' });
      expect(result.rightRows[0]).toEqual({ lineNum: 1, text: 'line 1', type: 'normal' });
    });

    it('应正确处理删除行与新增行对齐，并在左右留空占位', () => {
      const original = 'line 1\nline 2\nline 3';
      const modified = 'line 1\nline 3'; // 删除了第 2 行
      const result = computeSplitDiff(original, modified);
      
      // leftRows: [line 1 (normal), line 2 (removed), line 3 (normal)]
      // rightRows: [line 1 (normal), (empty), line 3 (normal)]
      expect(result.leftRows).toHaveLength(3);
      expect(result.rightRows).toHaveLength(3);
      
      expect(result.leftRows[1]).toEqual({ lineNum: 2, text: 'line 2', type: 'removed' });
      expect(result.rightRows[1]).toEqual({ lineNum: null, text: '', type: 'empty' });
    });

    it('应正确对比修改行并生成行内细粒度字符高亮', () => {
      const original = 'hello world';
      const modified = 'hello vue';
      const result = computeSplitDiff(original, modified);
      
      expect(result.leftRows).toHaveLength(1);
      expect(result.rightRows).toHaveLength(1);
      
      const leftRow = result.leftRows[0];
      const rightRow = result.rightRows[0];
      
      expect(leftRow.type).toBe('removed');
      expect(rightRow.type).toBe('added');
      
      // 检查行内差异
      // hello 是一样的 (normal)，world 变成了 vue
      expect(leftRow.inlineDiffs).toEqual([
        { type: 'normal', text: 'hello ' },
        { type: 'removed', text: 'world' }
      ]);
      expect(rightRow.inlineDiffs).toEqual([
        { type: 'normal', text: 'hello ' },
        { type: 'added', text: 'vue' }
      ]);
    });

    it('能支持 ignoreWhitespace 忽略空白选项', () => {
      const original = 'hello';
      const modified = 'hello   ';
      
      // 不忽略空白：应该识别出修改
      const diff1 = computeSplitDiff(original, modified, { ignoreWhitespace: false });
      expect(diff1.leftRows[0].type).toBe('removed');
      
      // 忽略空白：应该识别为没有变化 (normal)
      const diff2 = computeSplitDiff(original, modified, { ignoreWhitespace: true });
      expect(diff2.leftRows[0].type).toBe('normal');
    });
  });

  describe('computeInlineDiff (单栏混合)', () => {
    it('应顺序排列普通、删除和新增行', () => {
      const original = 'hello\nworld';
      const modified = 'hello\nvue';
      const result = computeInlineDiff(original, modified);
      
      // 应为 3 行：hello (normal), world (removed), vue (added)
      expect(result).toHaveLength(3);
      
      expect(result[0]).toEqual({
        leftLineNum: 1,
        rightLineNum: 1,
        text: 'hello',
        type: 'normal'
      });
      
      expect(result[1].type).toBe('removed');
      expect(result[1].leftLineNum).toBe(2);
      expect(result[1].rightLineNum).toBeNull();
      
      expect(result[2].type).toBe('added');
      expect(result[2].leftLineNum).toBeNull();
      expect(result[2].rightLineNum).toBe(2);
    });
  });
});
