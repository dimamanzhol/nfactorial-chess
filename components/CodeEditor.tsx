"use client";

import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";

const knightDark = createTheme({
  theme: "dark",
  settings: {
    background: "#160f2e",
    backgroundImage: "",
    foreground: "#e8e0f5",
    caret: "#a78bfa",
    selection: "#3d2b6e",
    selectionMatch: "#3d2b6e",
    lineHighlight: "#1f1640",
    gutterBackground: "#1a1535",
    gutterForeground: "#5e4f8a",
    gutterBorder: "#2d2250",
    gutterActiveForeground: "#a78bfa",
    fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
  },
  styles: [
    { tag: t.comment,                    color: "#5e4f8a", fontStyle: "italic" },
    { tag: t.keyword,                    color: "#a78bfa", fontWeight: "600" },
    { tag: t.string,                     color: "#22c55e" },
    { tag: t.number,                     color: "#f59e0b" },
    { tag: t.bool,                       color: "#a78bfa" },
    { tag: t.null,                       color: "#a78bfa" },
    { tag: t.variableName,               color: "#e8e0f5" },
    { tag: t.definition(t.variableName), color: "#c4b5fd" },
    { tag: t.function(t.variableName),   color: "#60a5fa" },
    { tag: t.typeName,                   color: "#60a5fa" },
    { tag: t.propertyName,               color: "#a89cc8" },
    { tag: t.operator,                   color: "#a89cc8" },
    { tag: t.punctuation,                color: "#a89cc8" },
  ],
});

const baseTheme = EditorView.theme({
  "&":                                          { height: "100%", fontSize: "12.5px" },
  ".cm-scroller":                               { overflow: "auto", lineHeight: "1.65" },
  ".cm-content":                                { padding: "12px 0" },
  ".cm-gutters":                                { borderRight: "1px solid #2d2250" },
  ".cm-lineNumbers .cm-gutterElement":          { minWidth: "40px", paddingRight: "12px" },
  ".cm-focused":                                { outline: "none" },
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
      theme={knightDark}
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
