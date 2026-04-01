import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Asset } from '@/types';

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAssets() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .order('name');

        if (error) throw error;

        // Map DB response to Asset interface
        // Note: DB columns were renamed to match English keys
        const mappedAssets: Asset[] = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          ticker: item.ticker,
          currentPrice: Number(item.current_price) || 0, // Keep current_price if it wasn't renamed in DB yet (I renamed it to currentPrice in TS, let's check DB)
          category: item.category, // Renamed from tipo
        }));

        setAssets(mappedAssets);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();
  }, []);

  return { assets, loading, error };
}
