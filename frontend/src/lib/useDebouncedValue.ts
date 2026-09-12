import { useEffect, useState } from "react"

// Espera a pessoa parar de digitar antes de buscar (senão cada letra vira uma chamada na API)
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
