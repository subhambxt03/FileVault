import { useEffect, useRef, useState } from "react";

export default function usePolling(fn, interval = 3000, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const timer = useRef(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const result = await fnRef.current();
        if (alive) setData(result);
      } catch (e) {
        if (alive) setError(e);
      }
    };
    tick();
    timer.current = setInterval(tick, interval);
    return () => {
      alive = false;
      clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error };
}