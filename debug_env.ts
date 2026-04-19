import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    console.log('--- .env.local content ---')
    console.log(content)
    console.log('--------------------------')
} else {
    console.log('.env.local not found')
}
