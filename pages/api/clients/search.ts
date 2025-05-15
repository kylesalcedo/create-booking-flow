import type { NextApiRequest, NextApiResponse } from 'next'

const ADMIN_ENDPOINT =
    process.env.BLVD_ADMIN_ENDPOINT ||
    'https://sandbox.joinblvd.com/api/2020-01/admin/graphql'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).end()
    }

    const { q: queryText } = req.body

    if (!queryText || typeof queryText !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid query parameter q in request body' })
    }

    const businessId = process.env.NEXT_PUBLIC_BLVD_BUSINESS_ID
    // Admin credentials from environment variables
    const adminKey = process.env.BLVD_ADMIN_API_KEY || process.env.NEXT_PUBLIC_BLVD_API_KEY
    const adminSecret = process.env.BLVD_ADMIN_API_SECRET || process.env.BLVD_API_SECRET || process.env.NEXT_PUBLIC_BLVD_API_SECRET

    if (!businessId || !adminKey) {
        return res
            .status(500)
            .json({ error: 'Missing Boulevard Admin credentials on server (Business ID or Admin API Key)' })
    }

    let authHeader: string
    if (adminSecret) {
        const token = Buffer.from(`${adminKey}:${adminSecret}`).toString('base64')
        authHeader = `Basic ${token}`
    } else {
        authHeader = `Bearer ${adminKey}`
    }

    const graphQuery = `
        query SearchClients($businessId: ID!, $queryString: QueryString!, $first: Int!) {
            business(id: $businessId) {
                clients(query: $queryString, first: $first) {
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
        console.log(`Fetching from Admin GraphQL endpoint: ${ADMIN_ENDPOINT}`);
        console.log(`Using businessId: ${businessId}, query: ${queryText}`);
        console.log(`Admin API Authorization header used: ${authHeader.substring(0, 15)}...`);

        const apiRes = await fetch(ADMIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                Authorization: authHeader,
            },
            body: JSON.stringify({
                query: graphQuery,
                variables: {
                    businessId: businessId,
                    queryString: queryText,
                    first: 10,
                },
            }),
        })

        if (!apiRes.ok) {
            const errorText = await apiRes.text()
            console.error(`Boulevard Admin GraphQL API returned error ${apiRes.status}:`, errorText);
            return res.status(apiRes.status).json({ error: `Boulevard API Error: ${errorText}` })
        }

        console.log(`Boulevard Admin GraphQL API response status: ${apiRes.status}`);
        const contentType = apiRes.headers.get('content-type');
        console.log(`Boulevard Admin GraphQL API response content-type: ${contentType}`);

        if (!contentType || !contentType.includes('application/json')) {
            const responseText = await apiRes.text();
            console.error('Received non-JSON response from Admin GraphQL API:', responseText);
            return res.status(500).json({ error: 'Received non-JSON response from API', details: responseText });
        }
        
        const data = await apiRes.json()

        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            return res.status(400).json({ error: 'GraphQL query errors', details: data.errors });
        }
        
        const clients = data?.data?.business?.clients?.edges?.map((e: any) => e.node) || []

        return res.status(200).json({ clients })
    } catch (error) {
        console.error('Client search error', error)
        // Log the detailed error
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return res.status(500).json({ error: 'Internal error' })
    }
} 