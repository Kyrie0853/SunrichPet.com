'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FilterState {
  error: string;
  matchedKeyword: string;
  severity: number;
}

export function useKeywordFilter() {
  const [filter, setFilter] = useState<FilterState>({ error: '', matchedKeyword: '', severity: 0 });
  const [checking, setChecking] = useState(false);

  const checkContent = useCallback(async (text: string): Promise<boolean> => {
    if (!text || !text.trim()) {
      setFilter({ error: '', matchedKeyword: '', severity: 0 });
      return true;
    }
    setChecking(true);
    try {
      const supabase = createClient();
      const { data: keywords } = await supabase.from('blocked_keywords').select('keyword,category,severity');
      if (!keywords || keywords.length === 0) {
        setFilter({ error: '', matchedKeyword: '', severity: 0 });
        return true;
      }
      const lowerText = text.toLowerCase();
      for (const kw of keywords) {
        if (lowerText.includes(kw.keyword.toLowerCase())) {
          setFilter({ error: '内容包含违规词汇：' + kw.keyword + '，请修改后重新提交', matchedKeyword: kw.keyword, severity: kw.severity });
          return false;
        }
      }
      setFilter({ error: '', matchedKeyword: '', severity: 0 });
      return true;
    } catch {
      setFilter({ error: '', matchedKeyword: '', severity: 0 });
      return true;
    } finally {
      setChecking(false);
    }
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({ error: '', matchedKeyword: '', severity: 0 });
  }, []);

  return { filter, checking, checkContent, clearFilter };
}
