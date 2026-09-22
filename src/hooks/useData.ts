import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/supabase';
import type { Loan, LedgerEntry, MoiEntry } from '../types';

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db()
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setLoans(data as Loan[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { loans, loading, refresh };
}

export function useLoan(id: string | undefined) {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await db().from('loans').select('*').eq('id', id).maybeSingle();
    setLoan((data as Loan | null) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { loan, loading, refresh };
}

export function useLedger(loanId?: string) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = db().from('ledger_entries').select('*');
    if (loanId) q = q.eq('loan_id', loanId);
    const { data, error } = await q.order('entry_date', { ascending: false }).order('created_at', { ascending: false });
    if (!error && data) setEntries(data as LedgerEntry[]);
    setLoading(false);
  }, [loanId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entries, loading, refresh };
}

/** Ledger entries across all loans, joined with the client name. */
export interface FeedEntry extends LedgerEntry {
  client_name: string;
}

export function useActivityFeed() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db()
      .from('ledger_entries')
      .select('*, loans!inner(client_name)')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) {
      setEntries(
        (data as Array<LedgerEntry & { loans: { client_name: string } }>).map((e) => ({
          ...e,
          client_name: e.loans.client_name,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entries, loading, refresh };
}

export function useMoiEntries() {
  const [moiEntries, setMoiEntries] = useState<MoiEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db()
      .from('moi_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && data) setMoiEntries(data as MoiEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { moiEntries, loading, refresh };
}

export function useMoiEntry(id: string | undefined) {
  const [entry, setEntry] = useState<MoiEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await db().from('moi_entries').select('*').eq('id', id).maybeSingle();
    setEntry((data as MoiEntry | null) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entry, loading, refresh };
}
