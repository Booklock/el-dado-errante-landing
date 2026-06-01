import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useCurrentClient() {
  const [session, setSession] = useState(undefined);
  const [client,  setClient]  = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = useCallback(async (userId) => {
    if (!userId) { setClient(null); setLoading(false); return; }
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("auth_user_id", userId)
      .maybeSingle();
    setClient(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      fetchClient(s?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      fetchClient(s?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, [fetchClient]);

  const refetch = useCallback(() => {
    if (session?.user?.id) fetchClient(session.user.id);
  }, [session, fetchClient]);

  return { session, client, loading, refetch };
}
