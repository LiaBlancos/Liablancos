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
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject('Failed to parse Supabase JSON: ' + body);
                }
            });
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
        const sellerIdSetting = settings.find(s => s.key === 'trendyol_seller_id');
        const apiKeySetting = settings.find(s => s.key === 'trendyol_api_key');
        const apiSecretSetting = settings.find(s => s.key === 'trendyol_api_secret');

        if (!sellerIdSetting || !apiKeySetting || !apiSecretSetting) {
            console.error('Missing settings in Supabase');
            return;
        }

        const sellerId = sellerIdSetting.value.trim();
        const apiKey = apiKeySetting.value.trim();
        const apiSecret = apiSecretSetting.value.trim();

        const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

        // Let's check more possible "active" statuses
        const statuses = ['Created', 'Picking', 'Picked', 'Invoiced'];

        console.log('--- EXTENDED STATUS CHECK ---');
        for (const status of statuses) {
            try {
                const data = await fetchTrendyol(sellerId, auth, status);
                console.log(`Status: ${status} | Total: ${data.totalElements}`);
                if (data.content && data.content.length > 0) {
                    console.log(`  Sample: ${data.content[0].orderNumber} | Date: ${data.content[0].orderDate}`);
                }
            } catch (err) {
                console.log(`Status: ${status} | Error: ${err}`);
            }
        }
    } catch (e) {
        console.error('Fatal:', e);
    }
}

main();
