import { diffLines, diffChars } from 'diff';

export interface InlineDiffItem {
  type: 'added' | 'removed' | 'normal';
  text: string;
}

export interface DiffRow {
  lineNum: number | null;
  text: string;
  type: 'added' | 'removed' | 'normal' | 'empty';
  inlineDiffs?: InlineDiffItem[];
}

export interface InlineRow {
  leftLineNum: number | null;
  rightLineNum: number | null;
  text: string;
  type: 'added' | 'removed' | 'normal';
  inlineDiffs?: InlineDiffItem[];
}

/**
 * 计算双栏对比数据
 */
export function computeSplitDiff(oldStr: string, newStr: string, options: { ignoreWhitespace?: boolean } = {}) {
  const changes = diffLines(oldStr, newStr, { ignoreWhitespace: options.ignoreWhitespace });
  
  const lineChanges: { type: 'added' | 'removed' | 'normal'; text: string }[] = [];
  for (const change of changes) {
    let lines = change.value.split(/\r?\n/);
    if (lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    const type = change.added ? 'added' : (change.removed ? 'removed' : 'normal');
    for (const line of lines) {
      lineChanges.push({ type, text: line });
    }
  }

  const leftRows: DiffRow[] = [];
  const rightRows: DiffRow[] = [];
  
  let leftLineNum = 1;
  let rightLineNum = 1;
  
  let i = 0;
  while (i < lineChanges.length) {
    if (lineChanges[i].type === 'normal') {
      leftRows.push({ lineNum: leftLineNum++, text: lineChanges[i].text, type: 'normal' });
      rightRows.push({ lineNum: rightLineNum++, text: lineChanges[i].text, type: 'normal' });
      i++;
    } else {
      const removedGroup: string[] = [];
      const addedGroup: string[] = [];
      
      while (i < lineChanges.length && lineChanges[i].type !== 'normal') {
        if (lineChanges[i].type === 'removed') {
          removedGroup.push(lineChanges[i].text);
        } else if (lineChanges[i].type === 'added') {
          addedGroup.push(lineChanges[i].text);
        }
        i++;
      }
      
      const maxLen = Math.max(removedGroup.length, addedGroup.length);
      for (let j = 0; j < maxLen; j++) {
        const hasRemoved = j < removedGroup.length;
        const hasAdded = j < addedGroup.length;
        
        const removedText = hasRemoved ? removedGroup[j] : '';
        const addedText = hasAdded ? addedGroup[j] : '';
        
        if (hasRemoved && hasAdded) {
          const charDiffs = diffChars(removedText, addedText);
          const leftInline: InlineDiffItem[] = [];
          const rightInline: InlineDiffItem[] = [];
          
          for (const cd of charDiffs) {
            if (cd.added) {
              rightInline.push({ type: 'added', text: cd.value });
            } else if (cd.removed) {
              leftInline.push({ type: 'removed', text: cd.value });
            } else {
              leftInline.push({ type: 'normal', text: cd.value });
              rightInline.push({ type: 'normal', text: cd.value });
            }
          }
          
          leftRows.push({
            lineNum: leftLineNum++,
            text: removedText,
            type: 'removed',
            inlineDiffs: leftInline
          });
          rightRows.push({
            lineNum: rightLineNum++,
            text: addedText,
            type: 'added',
            inlineDiffs: rightInline
          });
        } else if (hasRemoved) {
          leftRows.push({ lineNum: leftLineNum++, text: removedText, type: 'removed' });
          rightRows.push({ lineNum: null, text: '', type: 'empty' });
        } else if (hasAdded) {
          leftRows.push({ lineNum: null, text: '', type: 'empty' });
          rightRows.push({ lineNum: rightLineNum++, text: addedText, type: 'added' });
        }
      }
    }
  }
  
  return { leftRows, rightRows };
}

/**
 * 计算单栏混合对比数据
 */
export function computeInlineDiff(oldStr: string, newStr: string, options: { ignoreWhitespace?: boolean } = {}) {
  const changes = diffLines(oldStr, newStr, { ignoreWhitespace: options.ignoreWhitespace });
  const rows: InlineRow[] = [];
  
  const lineChanges: { type: 'added' | 'removed' | 'normal'; text: string }[] = [];
  for (const change of changes) {
    let lines = change.value.split(/\r?\n/);
    if (lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    const type = change.added ? 'added' : (change.removed ? 'removed' : 'normal');
    for (const line of lines) {
      lineChanges.push({ type, text: line });
    }
  }
  
  let leftLineNum = 1;
  let rightLineNum = 1;
  let i = 0;
  
  while (i < lineChanges.length) {
    if (lineChanges[i].type === 'normal') {
      rows.push({
        leftLineNum: leftLineNum++,
        rightLineNum: rightLineNum++,
        text: lineChanges[i].text,
        type: 'normal'
      });
      i++;
    } else {
      const removedGroup: string[] = [];
      const addedGroup: string[] = [];
      
      while (i < lineChanges.length && lineChanges[i].type !== 'normal') {
        if (lineChanges[i].type === 'removed') {
          removedGroup.push(lineChanges[i].text);
        } else if (lineChanges[i].type === 'added') {
          addedGroup.push(lineChanges[i].text);
        }
        i++;
      }
      
      const maxLen = Math.max(removedGroup.length, addedGroup.length);
      for (let j = 0; j < maxLen; j++) {
        const hasRemoved = j < removedGroup.length;
        const hasAdded = j < addedGroup.length;
        
        const removedText = hasRemoved ? removedGroup[j] : '';
        const addedText = hasAdded ? addedGroup[j] : '';
        
        if (hasRemoved && hasAdded) {
          const charDiffs = diffChars(removedText, addedText);
          const leftInline: InlineDiffItem[] = [];
          const rightInline: InlineDiffItem[] = [];
          
          for (const cd of charDiffs) {
            if (cd.added) {
              rightInline.push({ type: 'added', text: cd.value });
            } else if (cd.removed) {
              leftInline.push({ type: 'removed', text: cd.value });
            } else {
              leftInline.push({ type: 'normal', text: cd.value });
              rightInline.push({ type: 'normal', text: cd.value });
            }
          }
          
          rows.push({
            leftLineNum: leftLineNum++,
            rightLineNum: null,
            text: removedText,
            type: 'removed',
            inlineDiffs: leftInline
          });
          rows.push({
            leftLineNum: null,
            rightLineNum: rightLineNum++,
            text: addedText,
            type: 'added',
            inlineDiffs: rightInline
          });
        } else if (hasRemoved) {
          rows.push({
            leftLineNum: leftLineNum++,
            rightLineNum: null,
            text: removedText,
            type: 'removed'
          });
        } else if (hasAdded) {
          rows.push({
            leftLineNum: null,
            rightLineNum: rightLineNum++,
            text: addedText,
            type: 'added'
          });
        }
      }
    }
  }
  
  return rows;
}
