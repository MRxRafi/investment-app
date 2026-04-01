import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Transaction } from '@/types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          assets (
            name,
            ticker
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      // Map DB response to Transaction interface
      const mappedTransactions = (data || []).map((item: any) => ({
        id: item.id,
        assetId: item.asset_id,
        type: item.type,
        quantity: Number(item.quantity) || 0,
        pricePerUnit: Number(item.price_per_unit) || 0,
        fee: Number(item.fee) || 0,
        date: item.date,
        assets: item.assets
      }));

      setTransactions(mappedTransactions);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions };
}
