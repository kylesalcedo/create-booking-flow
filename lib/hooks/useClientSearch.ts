import { useEffect, useState } from 'react'

interface Client {
    id: string
    name: string
    email?: string
    mobilePhone?: string
    active?: boolean
}

export function useClientSearch(term: string) {
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<Client[]>([])

    useEffect(() => {
        if (!term || term.length < 2) {
            setResults([])
            return
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => {
            setLoading(true)
            fetch(`/api/clients/search?q=${encodeURIComponent(term)}`, {
                signal: controller.signal,
            })
                .then((res) => res.json())
                .then((data) => {
                    setResults(data.clients ?? [])
                })
                .catch((err) => {
                    if (err.name !== 'AbortError') {
                        console.error(err)
                    }
                })
                .finally(() => setLoading(false))
        }, 300)

        return () => {
            clearTimeout(timeout)
            controller.abort()
        }
    }, [term])

    return { loading, results }
} 