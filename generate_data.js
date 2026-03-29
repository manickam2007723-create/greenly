const fs = require('fs');

const products = [
  {
    id: "mat-1",
    name: "Areca Palm Leaf Dinnerware",
    category: "Kitchen & Dining",
    price: 499,
    description: "100% biodegradable, disposable dinner plates made from naturally fallen Areca palm leaves.",
    image: "https://files.catbox.moe/9vuhe5.png",
    stock: 250
  },
  {
    id: "mat-2",
    name: "Sugarcane Bagasse Containers",
    category: "Kitchen & Dining",
    price: 350,
    description: "Eco-friendly, microwave-safe takeaway containers made from incredibly durable sugarcane bagasse.",
    image: "https://files.catbox.moe/uednry.png",
    stock: 500
  },
  {
    id: "mat-3",
    name: "Recycled Tetra Pak Notebook",
    category: "Stationery",
    price: 150,
    description: "A beautiful, water-resistant notebook bound with sheets made entirely from recycled Tetra paks.",
    image: "https://files.catbox.moe/6m55yl.png",
    stock: 120
  },
  {
    id: "mat-4",
    name: "Recycled PET Fabric Backpack",
    category: "Bags & Apparel",
    price: 1299,
    description: "A stylish, highly durable everyday backpack woven from 100% recycled PET plastic bottles.",
    image: "https://files.catbox.moe/6m55yl.png",
    stock: 80
  }
];

// Write exactly these 4 products to your data.js file
const fileContent = `window.initialProducts = ${JSON.stringify(products, null, 2)};\n`;
fs.writeFileSync('data.js', fileContent, 'utf-8');
console.log('Successfully generated exactly 4 eco-friendly products inside data.js!');
