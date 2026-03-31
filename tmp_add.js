const SUPABASE_URL = 'https://rybwjbrtjkzyknvdxpjy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5YndqYnJ0amt6eWtudmR4cGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzM1OTYsImV4cCI6MjA5MDI0OTU5Nn0.2oAwiBnT82vskcK7NpkUvdozAZD-qjZ4_3ZdKUpoyuk';

const links = [
  "https://th.bing.com/th/id/OPAC.WSoBu83bMRwgWQ474C474?w=592&h=550&o=5&dpr=1.3&pid=21.1",
  "https://cdn.fcglcdn.com/brainbees/images/products/583x720/13153542a.webp",
  "https://th.bing.com/th?id=OPAC.Zs%2bRo4LHf2jU%2fg474C474&w=592&h=550&o=5&dpr=1.3&pid=21.1",
  "https://th.bing.com/th/id/OPAC.z3F6998Z65wpFA474C474?w=592&h=550&o=5&dpr=1.3&pid=21.1",
  "https://images.unsplash.com/photo-1610419358249-166fbff373aa?w=592&h=550&fit=crop", 
  "https://th.bing.com/th/id/OPAC.0BuyXeu3Omifxw474C474?w=592&h=550&o=5&dpr=1.3&pid=21.1",
  "https://th.bing.com/th/id/OPAC.sbLHuLYXkTzFPQ474C474?w=592&h=550&o=5&dpr=1.3&pid=21.1",
  "https://cdn.fcglcdn.com/brainbees/images/products/583x720/10295495a.webp",
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=592&h=550&fit=crop",
  "https://images.unsplash.com/photo-1605600659929-2de18de46da3?w=592&h=550&fit=crop"
];

const names = [
    "Bamboo Fiber Coffee Cup",
    "Organic Cotton Baby Onesie",
    "Natural Wood Toothbrush Set",
    "Eco-Friendly Cleaning Brush",
    "Sustainable Wooden Utensils",
    "Reusable Beeswax Food Wrap",
    "Hemp Fabric Tote Bag",
    "Biodegradable Baby Wipes",
    "Recycled Paper Notebook",
    "Organic Essential Oil Soap"
];

const products = links.map((img, i) => ({
    id: 'prod-' + Date.now() + i,
    name: names[i],
    category: i % 2 === 0 ? 'Home & Living' : 'Baby & Care',
    price: parseFloat((Math.random() * 500 + 100).toFixed(2)),
    stock: Math.floor(Math.random() * 50) + 10,
    description: 'A beautiful, highly sustainable product guaranteed to be gentle on our environment. Perfect for daily use, keeping sustainability in mind.',
    image: img
}));

async function addProducts() {
    for (const p of products) {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(p)
            });
            if (!res.ok) {
                console.error('Failed to add ' + p.name, await res.text());
            } else {
                console.log('Added ' + p.name);
            }
        } catch (e) {
            console.error('Fetch error:', e);
        }
    }
}

addProducts().catch(console.error);
