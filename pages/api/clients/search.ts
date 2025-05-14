import type { NextApiRequest, NextApiResponse } from 'next'

// const ADMIN_ENDPOINT =
//     process.env.BLVD_ADMIN_ENDPOINT ||
//     'https://sandbox.joinblvd.com/api/2020-01/admin/graphql'

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

    const businessId = process.env.NEXT_PUBLIC_BLVD_BUSINESS_ID
    const clientApiKey = process.env.BLVD_CLIENT_API_KEY

    if (!businessId || !clientApiKey) {
        return res
            .status(500)
            .json({ error: 'Missing Boulevard credentials on server (Business ID or Client API Key)' })
    }

    const clientApiEndpoint = `https://sandbox.joinblvd.com/api/2020-01/${businessId}/client`
    const searchUrl = `${clientApiEndpoint}?q=${encodeURIComponent(queryText)}`

    // Build Authorization header for Client API (API Key + colon, base64 encoded)
    const token = Buffer.from(`${clientApiKey}:`).toString('base64')
    const authHeader = `Basic ${token}`

    // const graphQuery = `
    //     query SearchClients($businessId: ID!, $query: QueryString!, $first: Int!) {
    //         business(id: $businessId) {
    //             clients(query: $query, first: $first) {
    //                 edges {
    //                     node {
    //                         id
    //                         name
    //                         email
    //                         mobilePhone
    //                         active
    //                     }
    //                 }
    //             }
    //         }
    //     }`

    try {
        console.log(`Fetching from client API endpoint: ${searchUrl}`);
        console.log(`Client API Authorization header used: ${authHeader.substring(0, 15)}...`); // Log prefix only

        const apiRes = await fetch(searchUrl, {
            method: 'GET', // Assuming GET for client search, adjust if different
            headers: {
                // 'Content-Type': 'application/json', // Usually not needed for GET if not sending a body
                'Accept': 'application/json',
                Authorization: authHeader,
            },
            // body: JSON.stringify({ // Assuming no body for GET, adjust if it's a POST
            //     query: graphQuery,
            //     variables: {
            //         businessId: businessId,
            //         query: queryText,
            //         first: 10,
            //     },
            // }),
        })

        if (!apiRes.ok) {
            const text = await apiRes.text()
            console.error(`Boulevard Client API returned error ${apiRes.status}:`, text);
            return res.status(apiRes.status).json({ error: text })
        }

        console.log(`Boulevard Client API response status: ${apiRes.status}`);
        console.log(`Boulevard Client API response content-type: ${apiRes.headers.get('content-type')}`);

        const data = await apiRes.json()
        // Adapt this part based on the actual structure of the Client API response
        // For example, if it's a direct array: const clients = data
        // If it's an object like { results: [...] }: const clients = data.results
        // If it's an object like { clients: [...] }: const clients = data.clients
        // For now, let's assume it might be directly an array or an object with a 'clients' property
        const clients = Array.isArray(data) ? data : data?.clients || []


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