/**
 * 数据模拟刷新 Hook — 定时驱动数值变化
 */
import { useEffect, useState, useRef } from 'react';

interface SimulatedConfig {
  interval: number;
  variance: number;
  initial: number;
}

export function useSimulatedNumber(config: SimulatedConfig): {
  value: number;
  refreshKey: number;
} {
  const [value, setValue] = useState(config.initial);
  const [refreshKey, setRefreshKey] = useState(0);
  const directionRef = useRef(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setValue((prev) => {
        const change = Math.round(
          (Math.random() * config.variance * 2 - config.variance) * directionRef.current
        );
        const next = Math.max(0, prev + change);
        if (Math.random() < 0.15) directionRef.current *= -1;
        return next;
      });
      setRefreshKey((k) => k + 1);
    }, config.interval);

    return () => clearInterval(timer);
  }, [config.interval, config.variance]);

  return { value, refreshKey };
}
