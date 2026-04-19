import path from 'path'
import fs from 'fs'
import { Client } from 'pg'
import dotenv from 'dotenv'

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const result = dotenv.config({ path: envPath })

if (result.error) {
    console.error('Error loading .env.local via dotenv:', result.error)
    process.exit(1)
}

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!connectionString) {
    console.error('No connection string found in environment variables.')
    console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('URL') || k.includes('DB')))
    process.exit(1)
}

console.log('Found connection string.')

const migrationFile = path.resolve(process.cwd(), 'supabase/migrations/20260215_order_profitability.sql')
const sql = fs.readFileSync(migrationFile, 'utf8')

async function run() {
    console.log('Connecting...')
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

    try {
        await client.connect()
        console.log('Connected. Running SQL...')
        await client.query(sql)
        console.log('Migration executed successfully!')
    } catch (err) {
        console.error('Migration failed:', err)
    } finally {
        await client.end()
        process.exit(0)
    }
}

run()
