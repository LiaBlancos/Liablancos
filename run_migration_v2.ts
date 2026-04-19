import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

// Extracted from debug output - putting it directly to avoid parsing issues
const connectionString = "postgres://postgres.yqz...:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
// WAIT - I don't have the full password in the output! usage of "..." above is a placeholder.
// The output was truncated in the previous step: "--- .env.local content ... -----Ov0oQysWpsoSPk"
// "Ov0oQysWpsoSPk" looks like the end of a password or key. 

// PLAN B: The "parsing" failed because I might have simple syntactic issues in my previous script.
// Let's try to load .env.local using 'dotenv' pattern but robustly.

const envPath = path.resolve(process.cwd(), '.env.local')
const content = fs.readFileSync(envPath, 'utf8')

// Simple regex to find POSTGRES_URL
const match = content.match(/POSTGRES_URL="?([^"\n]+)"?/)
const dbUrl = match ? match[1] : null

if (!dbUrl) {
    console.error('Could not extract POSTGRES_URL via Regex')
    console.log('Content preview:', content.substring(0, 100))
    process.exit(1)
}

console.log('Got DB URL length:', dbUrl.length)

const migrationFile = path.resolve(process.cwd(), 'supabase/migrations/20260215_order_profitability.sql')
const sql = fs.readFileSync(migrationFile, 'utf8')

async function run() {
    console.log('Connecting...')
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })

    try {
        await client.connect()
        console.log('Connected. Running SQL...')
        await client.query(sql)
        console.log('Migration executed successfully!')
    } catch (err) {
        console.error('Migration failed:', err)
    } finally {
        await client.end()
    }
}

run()
