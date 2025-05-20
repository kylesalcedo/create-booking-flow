import type { NextApiRequest, NextApiResponse } from 'next'
const crypto = require('crypto')

const ADMIN_ENDPOINT =
    process.env.BLVD_ADMIN_ENDPOINT ||
    'https://sandbox.joinblvd.com/api/2020-01/admin/graphql'

//API Info
const BUSINESS_ID = process.env.NEXT_PUBLIC_BLVD_BUSINESS_ID;
const API_SECRET = process.env.BLVD_API_SECRET;
const API_KEY = process.env.BLVD_ADMIN_API_KEY;

function generate_auth_header(business_id, api_secret, api_key) {
  const prefix = 'blvd-admin-v1'
  const timestamp = Math.floor(Date.now() / 1000)

  const payload = `${prefix}${business_id}${timestamp}`
  const raw_key = Buffer.from(api_secret, 'base64')
  const signature = crypto
    .createHmac('sha256', raw_key)
    .update(payload, 'utf8')
    .digest('base64')
  const token = `${signature}${payload}`
  const http_basic_payload = `${api_key}:${token}`
  const http_basic_credentials = Buffer.from(http_basic_payload, 'utf8').toString('base64')

  return http_basic_credentials
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).end()
    }

    const { q: queryTextUntrusted } = req.body

    if (!queryTextUntrusted || typeof queryTextUntrusted !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid query parameter q in request body' })
    }

    // Basic sanitization: escape single quotes for GQL string
    const queryText = queryTextUntrusted.replace(/'/g, "\\\\'");

    if (!BUSINESS_ID || !API_KEY || !API_SECRET) {
        return res
            .status(500)
            .json({ error: 'Missing Boulevard Admin credentials on server (Business ID, Admin API Key, or Admin API Secret)' })
    }

    const authHeader = `Basic ${generate_auth_header(BUSINESS_ID, API_SECRET, API_KEY)}`

    const gqlQueryValue = `name:'%${queryText}%'`;

    const graphQuery = `
        query Clients($first: Int!) {
            clients(query: "${gqlQueryValue}", first: $first) {
                edges {
                    node {
                        id
                        name
                        email
                        mobilePhone
                        active
                        externalId
                        createdAt
                        updatedAt
                    }
                }
            }
        }`

    try {
        console.log(`Fetching from Admin GraphQL endpoint: ${ADMIN_ENDPOINT}`);
        console.log(`Using businessId: ${BUSINESS_ID}, query: ${queryText}`);
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