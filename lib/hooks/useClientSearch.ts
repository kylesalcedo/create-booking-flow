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
            fetch(`/api/clients/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ q: term }),
                signal: controller.signal,
            })
                .then((res) => {
                    if (!res.ok) {
                        return res.text().then(text => {
                            console.error('Error from API route:', res.status, text);
                            throw new Error(`API responded with ${res.status}: ${text}`);
                        });
                    }
                    return res.json();
                })
                .then((data) => {
                    if (data.error) {
                        console.error('API returned an error object:', data.error, data.details);
                        setResults([]);
                    } else {
                        setResults(data.clients ?? [])
                    }
                })
                .catch((err) => {
                    if (err.name !== 'AbortError') {
                        console.error('Client search fetch error:', err)
                        setResults([]);
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