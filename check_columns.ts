import { supabase } from './src/lib/supabase'

async function checkSchema() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Direct select error:', error)
    } else {
        console.log('Columns in products:', Object.keys(data[0] || {}))
    }
}

checkSchema()
