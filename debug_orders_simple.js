const https = require('https');
const fs = require('fs');

// Use env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getSettingsFromSupabase() {
    const postData = JSON.stringify({
        select: 'key,value'
    });

    const options = {
        hostname: supabaseUrl.replace('https://', '').split('/')[0],
        port: 443,
        path: '/rest/v1/settings?select=key,value',
        method: 'GET',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.end();
    });
}

function fetchTrendyol(sellerId, auth, status) {
    const options = {
        hostname: 'api.trendyol.com',
        port: 443,
        path: `/integration/order/sellers/${sellerId}/orders?status=${status}&size=5&orderByField=OrderDate&orderByDirection=DESC`,
        method: 'GET',
        headers: {
            'Authorization': `Basic ${auth}`,
            'User-Agent': `${sellerId} - SelfIntegration`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(`Error ${res.statusCode}: ${body}`);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    try {
        const settings = await getSettingsFromSupabase();
        const sellerId = settings.find(s => s.key === 'trendyol_seller_id').value.trim();
        const apiKey = settings.find(s => s.key === 'trendyol_api_key').value.trim();
        const apiSecret = settings.find(s => s.key === 'trendyol_api_secret').value.trim();

        const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        const statuses = ['Created', 'Picking'];

        for (const status of statuses) {
            console.log(`Checking status: ${status}`);
            const data = await fetchTrendyol(sellerId, auth, status);
            console.log(`Found ${data.totalElements} orders for ${status}`);
            if (data.content && data.content.length > 0) {
                console.log(`Latest Order: ${data.content[0].orderNumber} (${data.content[0].orderDate})`);
            }
        }
    } catch (e) {
        console.error('Fatal:', e);
    }
}

main();
