import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useCurrentClient() {
  const [session, setSession] = useState(undefined);
  const [client,  setClient]  = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = useCallback(async (userId) => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("auth_user_id", userId)
      .maybeSingle();
    setClient(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchClient(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) fetchClient(session.user.id);
      else { setClient(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, [fetchClient]);

  const refetch = useCallback(() => {
    if (session) fetchClient(session.user.id);
  }, [session, fetchClient]);

  return { session, client, loading, refetch };
}
