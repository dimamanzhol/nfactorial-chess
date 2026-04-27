"use client";

import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";

const knightLight = createTheme({
  theme: "light",
  settings: {
    background: "#f7f3ee",
    backgroundImage: "",
    foreground: "#0f0f0d",
    caret: "#0f0f0d",
    selection: "#d9d2c8",
    selectionMatch: "#d9d2c8",
    lineHighlight: "#edeae4",
    gutterBackground: "#efebe4",
    gutterForeground: "#9e9e92",
    gutterBorder: "#e5e1d8",
    gutterActiveForeground: "#0f0f0d",
    fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
  },
  styles: [
    { tag: t.comment, color: "#9e9e92", fontStyle: "italic" },
    { tag: t.keyword, color: "#6b4fbb", fontWeight: "600" },
    { tag: t.string, color: "#126d3e" },
    { tag: t.number, color: "#c2410c" },
    { tag: t.bool, color: "#6b4fbb" },
    { tag: t.null, color: "#6b4fbb" },
    { tag: t.variableName, color: "#0f0f0d" },
    { tag: t.definition(t.variableName), color: "#1d4ed8" },
    { tag: t.function(t.variableName), color: "#0e6f91" },
    { tag: t.typeName, color: "#0e6f91" },
    { tag: t.propertyName, color: "#374151" },
    { tag: t.operator, color: "#374151" },
    { tag: t.punctuation, color: "#374151" },
  ],
});

const baseTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "12.5px" },
  ".cm-scroller": { overflow: "auto", lineHeight: "1.65" },
  ".cm-content": { padding: "12px 0" },
  ".cm-gutters": { borderRight: "1px solid #e5e1d8" },
  ".cm-lineNumbers .cm-gutterElement": { minWidth: "40px", paddingRight: "12px" },
  ".cm-focused": { outline: "none" },
});

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ value, onChange }: Props) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={knightLight}
      extensions={[python(), baseTheme]}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: true,
        syntaxHighlighting: true,
        autocompletion: false,
        highlightActiveLine: true,
        highlightSelectionMatches: false,
      }}
    />
  );
}
