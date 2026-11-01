import { useState } from 'preact/hooks';

export function useJsonStudioOptions() {
  const [indent, setIndent] = useState<'2' | '4' | 'tab' | 'min'>('2');
  const [action, setAction] = useState<'format' | 'minify' | 'validate'>('format');
  const [keySorting, setKeySorting] = useState<'original' | 'asc' | 'desc'>('original');
  const [syntaxHighlight, setSyntaxHighlight] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [autoFormatOnPaste, setAutoFormatOnPaste] = useState(false);
  const [activeTab, setActiveTab] = useState<'tree' | 'table' | 'raw'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchCase, setSearchMatchCase] = useState(false);
  const [searchRegex, setSearchRegex] = useState(false);

  const [detectDuplicates, setDetectDuplicates] = useState(true);
  const [validateSchema, setValidateSchema] = useState(false);
  const [allowJson5, setAllowJson5] = useState(false);
  const [safeBigInt, setSafeBigInt] = useState(true);

  return {
    indent,
    setIndent,
    action,
    setAction,
    keySorting,
    setKeySorting,
    syntaxHighlight,
    setSyntaxHighlight,
    lineNumbers,
    setLineNumbers,
    autoFormatOnPaste,
    setAutoFormatOnPaste,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    searchMatchCase,
    setSearchMatchCase,
    searchRegex,
    setSearchRegex,
    detectDuplicates,
    setDetectDuplicates,
    validateSchema,
    setValidateSchema,
    allowJson5,
    setAllowJson5,
    safeBigInt,
    setSafeBigInt,
  };
}
