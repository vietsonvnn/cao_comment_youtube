import { useState, useEffect, useRef } from 'react';

export default function useSSE(jobId) {
  const [progress, setProgress] = useState(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    if (!jobId) {
      setProgress(null);
      setConnected(false);
      return;
    }

    let retryCount = 0;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const es = new EventSource(`/api/scrape/progress?jobId=${jobId}`);
      esRef.current = es;

      es.addEventListener('progress', (e) => {
        try {
          const data = JSON.parse(e.data);
          setProgress(data);
          retryCount = 0;
        } catch {}
      });

      es.onopen = () => {
        setConnected(true);
        retryCount = 0;
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        if (!cancelled && retryCount < 10) {
          retryCount++;
          setTimeout(connect, 2000 * retryCount);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [jobId]);

  return { progress, connected };
}
