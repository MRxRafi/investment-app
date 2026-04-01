import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useCategoryColors() {
  const [colors, setColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchColors = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('category_colors').select('category, color');
      if (error) throw error;
      
      const colorsMap: Record<string, string> = {};
      if (data) {
        data.forEach(item => {
          colorsMap[item.category] = item.color;
        });
      }
      setColors(colorsMap);
    } catch (e) {
      console.error('Error fetching category colors:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateColor = async (category: string, color: string) => {
    try {
      // Optimistic update
      setColors(prev => ({ ...prev, [category]: color }));
      
      const { error } = await supabase
        .from('category_colors')
        .upsert({ category, color });
        
      if (error) throw error;
    } catch (e) {
      console.error('Error updating category color:', e);
      // Revert if needed, but for now we just log
      await fetchColors();
    }
  };

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  return { colors, updateColor, refreshColors: fetchColors, loading };
}
