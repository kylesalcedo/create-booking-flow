import type { NextApiRequest, NextApiResponse } from 'next'

const ADMIN_ENDPOINT =
    process.env.BLVD_ADMIN_ENDPOINT ||
    'https://sandbox.joinblvd.com/api/2020-01/admin/graphql'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).end()
    }

    const qParam = req.query.q
    const queryText = Array.isArray(qParam) ? qParam[0] : qParam || ''

    if (!queryText) {
        return res.status(400).json({ error: 'Missing query parameter q' })
    }

    const businessId = process.env.NEXT_PUBLIC_BLVD_BUSINESS_ID as string
    const adminKey = process.env.BLVD_ADMIN_API_KEY || process.env.NEXT_PUBLIC_BLVD_API_KEY
    const adminSecret = process.env.BLVD_ADMIN_API_SECRET

    if (!businessId || !adminKey) {
        return res
            .status(500)
            .json({ error: 'Missing Boulevard credentials on server' })
    }

    // Build Authorization header. Prefer Basic auth with key:secret if secret provided, otherwise fallback to Bearer.
    let authHeader: string
    if (adminSecret) {
        const token = Buffer.from(`${adminKey}:${adminSecret}`).toString('base64')
        authHeader = `Basic ${token}`
    } else {
        authHeader = `Bearer ${adminKey}`
    }

    const graphQuery = `
        query SearchClients($businessId: ID!, $query: QueryString!, $first: Int!) {
            business(id: $businessId) {
                clients(query: $query, first: $first) {
                    edges {
                        node {
                            id
                            name
                            email
                            mobilePhone
                            active
                        }
                    }
                }
            }
        }`

    try {
        const gqlRes = await fetch(ADMIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
            body: JSON.stringify({
                query: graphQuery,
                variables: {
                    businessId: businessId,
                    query: queryText,
                    first: 10,
                },
            }),
        })

        if (!gqlRes.ok) {
            const text = await gqlRes.text()
            return res.status(gqlRes.status).json({ error: text })
        }

        const data = await gqlRes.json()
        const clients =
            data?.data?.business?.clients?.edges?.map((e: any) => e.node) || []

        return res.status(200).json({ clients })
    } catch (error) {
        console.error('Client search error', error)
        return res.status(500).json({ error: 'Internal error' })
    }
} 