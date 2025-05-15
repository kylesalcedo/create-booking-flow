import type { NextApiRequest, NextApiResponse } from 'next'

// const ADMIN_ENDPOINT =
//     process.env.BLVD_ADMIN_ENDPOINT ||
//     'https://sandbox.joinblvd.com/api/2020-01/admin/graphql'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).end()
    }

    // const qParam = req.query.q // For POST, expect query in body
    // const queryText = Array.isArray(qParam) ? qParam[0] : qParam || ''
    const { q: queryText } = req.body // Assuming 'q' will be in the POST body

    if (!queryText || typeof queryText !== 'string') { // Added type check
        return res.status(400).json({ error: 'Missing or invalid query parameter q in request body' })
    }

    const businessId = process.env.NEXT_PUBLIC_BLVD_BUSINESS_ID
    const clientApiKey = process.env.BLVD_CLIENT_API_KEY

    if (!businessId || !clientApiKey) {
        return res
            .status(500)
            .json({ error: 'Missing Boulevard credentials on server (Business ID or Client API Key)' })
    }

    const clientApiGraphQLEndpoint = `https://sandbox.joinblvd.com/api/2020-01/${businessId}/client` // This is now treated as a GraphQL endpoint

    const token = Buffer.from(`${clientApiKey}:`).toString('base64')
    const authHeader = `Basic ${token}`

    const graphQuery = `
        query SearchClients($queryString: String!, $first: Int!) {
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
        }`

    try {
        console.log(`Fetching from Client GraphQL endpoint: ${clientApiGraphQLEndpoint}`);
        console.log(`Using query: ${queryText}`);
        console.log(`Client API Authorization header used: ${authHeader.substring(0, 15)}...`);

        const apiRes = await fetch(clientApiGraphQLEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Essential for POST with JSON body
                'Accept': 'application/json',
                Authorization: authHeader,
            },
            body: JSON.stringify({
                query: graphQuery,
                variables: {
                    queryString: queryText,
                    first: 10, // Or some other limit
                },
            }),
        })

        if (!apiRes.ok) {
            const errorText = await apiRes.text()
            console.error(`Boulevard Client GraphQL API returned error ${apiRes.status}:`, errorText);
            return res.status(apiRes.status).json({ error: `Boulevard API Error: ${errorText}` })
        }

        console.log(`Boulevard Client GraphQL API response status: ${apiRes.status}`);
        const contentType = apiRes.headers.get('content-type');
        console.log(`Boulevard Client GraphQL API response content-type: ${contentType}`);

        if (!contentType || !contentType.includes('application/json')) {
            const responseText = await apiRes.text();
            console.error('Received non-JSON response from Client GraphQL API:', responseText);
            return res.status(500).json({ error: 'Received non-JSON response from API', details: responseText });
        }
        
        const data = await apiRes.json()

        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            return res.status(400).json({ error: 'GraphQL query errors', details: data.errors });
        }
        
        const clients = data?.data?.clients?.edges?.map((e: any) => e.node) || []

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