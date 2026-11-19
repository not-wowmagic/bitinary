import { useCallback, useEffect, useState } from 'react'

export type DbResult<T> = { data: T | null; error: string | null }

export async function execute<T>(operation: () => Promise<T>): Promise<DbResult<T>> {
  try {
    return { data: await operation(), error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'The database request failed.',
    }
  }
}

export function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

export function useDbResource<T>(load: () => Promise<DbResult<T>>, dependencies: readonly unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await load()
    setData(result.data)
    setError(result.error)
    setLoading(false)
  }, dependencies)

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}
