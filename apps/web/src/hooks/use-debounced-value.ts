"use client";

import { useEffect, useState } from "react";

/**
 * Hook that returns a debounced version of the provided value.
 * The debounced value will only update after the specified delay
 * has passed without the value changing.
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
