const SUPABASE_URL = 'https://rybwjbrtjkzyknvdxpjy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5YndqYnJ0amt6eWtudmR4cGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzM1OTYsImV4cCI6MjA5MDI0OTU5Nn0.2oAwiBnT82vskcK7NpkUvdozAZD-qjZ4_3ZdKUpoyuk';

async function checkRows() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const rows = await res.json();
        console.log(`Supabase has ${rows.length} products.`);
        for (let i = 0; i < Math.min(rows.length, 5); i++) {
            console.log(`- ${rows[i].name} (from Supabase)`);
        }
    } catch(e) { console.error("Error", e); }
}

checkRows();
