import { useEffect, useState, useRef } from 'react';

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd';

export default function useBnbPrice(pollInterval = 15000) {
  const [price, setPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchPrice = async () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        setIsLoading(true);
        const res = await fetch(COINGECKO_URL, { signal: ac.signal });
        if (!res.ok) throw new Error('Failed to fetch price');
        const data = await res.json();
        const bnbUsd = data?.binancecoin?.usd;
        if (mounted && typeof bnbUsd === 'number') {
          setPrice(bnbUsd);
        }
      } catch (err) {
        console.debug('useBnbPrice fetch error', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchPrice();
    const id = setInterval(fetchPrice, pollInterval);
    return () => {
      mounted = false;
      clearInterval(id);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [pollInterval]);

  return { price, isLoading };
}
