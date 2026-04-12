<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

const props = defineProps<{
  modelValue: string;
  readonly?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const editorRef = ref<HTMLElement | null>(null);
let view: EditorView | null = null;

onMounted(() => {
  if (!editorRef.value) return;

  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter({
        markerDOM: (open) => {
          const dom = document.createElement("div");
          dom.style.cssText = "cursor: pointer; display: flex; align-items: center; justify-content: center; height: 100%; opacity: 0.5;";
          dom.innerHTML = open 
            ? `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>`
            : `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>`;
          
          dom.onmouseenter = () => dom.style.opacity = "1";
          dom.onmouseleave = () => dom.style.opacity = "0.5";
          return dom;
        }
      }),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      rectangularSelection(),
      crosshairCursor(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
      ]),
      json(),
      oneDark,
      EditorView.lineWrapping,
      EditorState.readOnly.of(!!props.readonly),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString());
        }
      }),
      EditorView.theme({
        '&': {
          height: '100%',
          backgroundColor: 'transparent !important',
        },
        '.cm-scroller': {
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontSize: '14px',
        },
        '.cm-gutters': {
          backgroundColor: 'transparent !important',
          border: 'none !important',
          color: '#4b5563',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'rgba(255, 255, 255, 0.05) !important',
        }
      })
    ],
  });

  view = new EditorView({
    state: startState,
    parent: editorRef.value,
  });
});

watch(() => props.modelValue, (newValue) => {
  if (view && newValue !== view.state.doc.toString()) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newValue }
    });
  }
});

onBeforeUnmount(() => {
  if (view) {
    view.destroy();
  }
});
</script>

<template>
  <div class="editor-wrapper" ref="editorRef"></div>
</template>

<style scoped>
.editor-wrapper {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

:deep(.cm-editor) {
  outline: none !important;
}

/* 即使在深色模式下也要确保滚动条好看 */
:deep(.cm-scroller::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.cm-scroller::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.cm-scroller::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

:deep(.cm-scroller::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.2);
}
</style>
