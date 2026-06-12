import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/user.model';
import { Store } from '../models/store.model';
import { Product } from '../models/product.model';
import { Sale } from '../models/sale.model';
import { Forecast } from '../models/forecast.model';
import { Notification } from '../models/notification.model';
import { Subscription } from '../models/subscription.model';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stocksense';

// ─── Helpers ────────────────────────────────────────────────────────────────
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// ─── Product Catalog (realistic kirana / grocery store) ─────────────────────
const productCatalog = [
  // Staples & Grains
  { name: 'Toor Dal', category: 'Staples', subcategory: 'Pulses', unit: 'kg' as const, cost: 120, sell: 145, mrp: 150, tags: ['dal', 'pulses'] },
  { name: 'Moong Dal', category: 'Staples', subcategory: 'Pulses', unit: 'kg' as const, cost: 100, sell: 125, mrp: 130, tags: ['dal', 'pulses'] },
  { name: 'Chana Dal', category: 'Staples', subcategory: 'Pulses', unit: 'kg' as const, cost: 80, sell: 100, mrp: 110, tags: ['dal', 'pulses'] },
  { name: 'Basmati Rice (1kg)', category: 'Staples', subcategory: 'Rice', unit: 'pack' as const, cost: 85, sell: 110, mrp: 120, tags: ['rice', 'basmati'] },
  { name: 'Sona Masoori Rice (5kg)', category: 'Staples', subcategory: 'Rice', unit: 'pack' as const, cost: 280, sell: 350, mrp: 380, tags: ['rice'] },
  { name: 'Aashirvaad Atta (5kg)', category: 'Staples', subcategory: 'Flour', unit: 'pack' as const, cost: 220, sell: 270, mrp: 290, tags: ['atta', 'flour', 'wheat'] },
  { name: 'Maida (1kg)', category: 'Staples', subcategory: 'Flour', unit: 'pack' as const, cost: 35, sell: 45, mrp: 50, tags: ['flour', 'maida'] },
  { name: 'Sooji (1kg)', category: 'Staples', subcategory: 'Flour', unit: 'pack' as const, cost: 40, sell: 52, mrp: 55, tags: ['semolina'] },
  { name: 'Sugar (1kg)', category: 'Staples', subcategory: 'Sugar', unit: 'kg' as const, cost: 38, sell: 48, mrp: 50, tags: ['sugar'] },
  { name: 'Salt (Tata, 1kg)', category: 'Staples', subcategory: 'Salt', unit: 'pack' as const, cost: 18, sell: 22, mrp: 22, tags: ['salt', 'tata'] },

  // Cooking Oils & Ghee
  { name: 'Fortune Sunflower Oil (1L)', category: 'Oils & Ghee', subcategory: 'Cooking Oil', unit: 'litre' as const, cost: 130, sell: 160, mrp: 170, tags: ['oil', 'sunflower'] },
  { name: 'Fortune Mustard Oil (1L)', category: 'Oils & Ghee', subcategory: 'Cooking Oil', unit: 'litre' as const, cost: 145, sell: 175, mrp: 185, tags: ['oil', 'mustard'] },
  { name: 'Saffola Gold Oil (1L)', category: 'Oils & Ghee', subcategory: 'Cooking Oil', unit: 'litre' as const, cost: 170, sell: 210, mrp: 220, tags: ['oil', 'saffola'] },
  { name: 'Amul Ghee (500ml)', category: 'Oils & Ghee', subcategory: 'Ghee', unit: 'pack' as const, cost: 280, sell: 330, mrp: 345, tags: ['ghee', 'amul'] },
  { name: 'Coconut Oil (500ml)', category: 'Oils & Ghee', subcategory: 'Cooking Oil', unit: 'pack' as const, cost: 90, sell: 115, mrp: 120, tags: ['oil', 'coconut'] },

  // Spices & Masala
  { name: 'MDH Garam Masala (100g)', category: 'Spices', subcategory: 'Blended Spices', unit: 'pack' as const, cost: 55, sell: 72, mrp: 75, tags: ['masala', 'mdh'] },
  { name: 'Everest Turmeric Powder (200g)', category: 'Spices', subcategory: 'Ground Spices', unit: 'pack' as const, cost: 42, sell: 55, mrp: 60, tags: ['turmeric', 'haldi'] },
  { name: 'Red Chilli Powder (200g)', category: 'Spices', subcategory: 'Ground Spices', unit: 'pack' as const, cost: 50, sell: 65, mrp: 70, tags: ['chilli', 'mirchi'] },
  { name: 'Coriander Powder (200g)', category: 'Spices', subcategory: 'Ground Spices', unit: 'pack' as const, cost: 35, sell: 48, mrp: 52, tags: ['dhania'] },
  { name: 'Cumin Seeds (100g)', category: 'Spices', subcategory: 'Whole Spices', unit: 'pack' as const, cost: 45, sell: 60, mrp: 65, tags: ['jeera', 'cumin'] },
  { name: 'Black Pepper (50g)', category: 'Spices', subcategory: 'Whole Spices', unit: 'pack' as const, cost: 55, sell: 70, mrp: 75, tags: ['pepper', 'kali mirch'] },
  { name: 'Kitchen King Masala (100g)', category: 'Spices', subcategory: 'Blended Spices', unit: 'pack' as const, cost: 48, sell: 62, mrp: 68, tags: ['masala'] },

  // Dairy
  { name: 'Amul Butter (100g)', category: 'Dairy', subcategory: 'Butter', unit: 'pack' as const, cost: 48, sell: 56, mrp: 57, tags: ['butter', 'amul'] },
  { name: 'Amul Cheese Slices (10pc)', category: 'Dairy', subcategory: 'Cheese', unit: 'pack' as const, cost: 95, sell: 115, mrp: 120, tags: ['cheese', 'amul'] },
  { name: 'Paneer (200g)', category: 'Dairy', subcategory: 'Paneer', unit: 'pack' as const, cost: 60, sell: 80, mrp: 85, tags: ['paneer'] },
  { name: 'Curd (400g)', category: 'Dairy', subcategory: 'Curd', unit: 'pack' as const, cost: 25, sell: 32, mrp: 35, tags: ['dahi', 'curd'] },

  // Beverages
  { name: 'Tata Tea Gold (500g)', category: 'Beverages', subcategory: 'Tea', unit: 'pack' as const, cost: 180, sell: 220, mrp: 230, tags: ['tea', 'tata'] },
  { name: 'Nescafe Classic (100g)', category: 'Beverages', subcategory: 'Coffee', unit: 'pack' as const, cost: 210, sell: 260, mrp: 275, tags: ['coffee', 'nescafe'] },
  { name: 'Bournvita (500g)', category: 'Beverages', subcategory: 'Health Drink', unit: 'pack' as const, cost: 190, sell: 235, mrp: 250, tags: ['bournvita', 'health drink'] },
  { name: 'Frooti Mango (200ml x 6)', category: 'Beverages', subcategory: 'Juice', unit: 'pack' as const, cost: 50, sell: 65, mrp: 72, tags: ['juice', 'frooti'] },
  { name: 'Coca-Cola (750ml)', category: 'Beverages', subcategory: 'Soft Drink', unit: 'piece' as const, cost: 28, sell: 38, mrp: 40, tags: ['cola', 'soft drink'] },
  { name: 'Pepsi (750ml)', category: 'Beverages', subcategory: 'Soft Drink', unit: 'piece' as const, cost: 28, sell: 38, mrp: 40, tags: ['pepsi', 'soft drink'] },

  // Snacks & Biscuits
  { name: 'Parle-G Biscuit (800g)', category: 'Snacks', subcategory: 'Biscuits', unit: 'pack' as const, cost: 65, sell: 82, mrp: 85, tags: ['biscuit', 'parle'] },
  { name: 'Britannia Good Day (200g)', category: 'Snacks', subcategory: 'Biscuits', unit: 'pack' as const, cost: 32, sell: 42, mrp: 45, tags: ['biscuit', 'britannia'] },
  { name: 'Lays Classic Salted (52g)', category: 'Snacks', subcategory: 'Chips', unit: 'piece' as const, cost: 15, sell: 20, mrp: 20, tags: ['chips', 'lays'] },
  { name: 'Kurkure Masala Munch (90g)', category: 'Snacks', subcategory: 'Namkeen', unit: 'piece' as const, cost: 15, sell: 20, mrp: 20, tags: ['kurkure', 'namkeen'] },
  { name: 'Haldiram Bhujia (200g)', category: 'Snacks', subcategory: 'Namkeen', unit: 'pack' as const, cost: 55, sell: 72, mrp: 78, tags: ['namkeen', 'haldiram'] },
  { name: 'Maggi Noodles (4-pack)', category: 'Snacks', subcategory: 'Instant Food', unit: 'pack' as const, cost: 42, sell: 52, mrp: 56, tags: ['maggi', 'noodles'] },
  { name: 'Oreo Biscuit (120g)', category: 'Snacks', subcategory: 'Biscuits', unit: 'pack' as const, cost: 25, sell: 32, mrp: 35, tags: ['oreo', 'biscuit'] },

  // Personal Care
  { name: 'Dove Soap (100g)', category: 'Personal Care', subcategory: 'Soap', unit: 'piece' as const, cost: 42, sell: 55, mrp: 58, tags: ['soap', 'dove'] },
  { name: 'Head & Shoulders Shampoo (340ml)', category: 'Personal Care', subcategory: 'Shampoo', unit: 'piece' as const, cost: 220, sell: 280, mrp: 295, tags: ['shampoo'] },
  { name: 'Colgate MaxFresh (150g)', category: 'Personal Care', subcategory: 'Toothpaste', unit: 'piece' as const, cost: 70, sell: 90, mrp: 95, tags: ['toothpaste', 'colgate'] },
  { name: 'Dettol Handwash (200ml)', category: 'Personal Care', subcategory: 'Handwash', unit: 'piece' as const, cost: 55, sell: 72, mrp: 78, tags: ['handwash', 'dettol'] },
  { name: 'Nivea Body Lotion (200ml)', category: 'Personal Care', subcategory: 'Lotion', unit: 'piece' as const, cost: 160, sell: 199, mrp: 210, tags: ['lotion', 'nivea'] },

  // Cleaning & Household
  { name: 'Surf Excel Matic (1kg)', category: 'Household', subcategory: 'Detergent', unit: 'pack' as const, cost: 175, sell: 220, mrp: 235, tags: ['detergent', 'surf'] },
  { name: 'Vim Liquid (500ml)', category: 'Household', subcategory: 'Dishwash', unit: 'piece' as const, cost: 68, sell: 88, mrp: 95, tags: ['dishwash', 'vim'] },
  { name: 'Harpic Toilet Cleaner (500ml)', category: 'Household', subcategory: 'Cleaner', unit: 'piece' as const, cost: 82, sell: 105, mrp: 112, tags: ['cleaner', 'harpic'] },
  { name: 'Lizol Floor Cleaner (500ml)', category: 'Household', subcategory: 'Cleaner', unit: 'piece' as const, cost: 95, sell: 120, mrp: 130, tags: ['cleaner', 'lizol'] },
  { name: 'Garbage Bags (30pc)', category: 'Household', subcategory: 'Bags', unit: 'pack' as const, cost: 40, sell: 55, mrp: 60, tags: ['bags', 'garbage'] },

  // Packaged Food
  { name: 'MTR Ready to Eat Rajma (300g)', category: 'Packaged Food', subcategory: 'Ready to Eat', unit: 'pack' as const, cost: 85, sell: 105, mrp: 110, tags: ['mtr', 'ready to eat'] },
  { name: 'Kissan Tomato Ketchup (500g)', category: 'Packaged Food', subcategory: 'Sauce', unit: 'pack' as const, cost: 95, sell: 118, mrp: 125, tags: ['ketchup', 'kissan'] },
  { name: 'Saffola Oats (1kg)', category: 'Packaged Food', subcategory: 'Breakfast', unit: 'pack' as const, cost: 130, sell: 165, mrp: 175, tags: ['oats', 'breakfast'] },
  { name: 'Cornflakes (500g)', category: 'Packaged Food', subcategory: 'Breakfast', unit: 'pack' as const, cost: 140, sell: 175, mrp: 185, tags: ['cornflakes', 'breakfast'] },
  { name: 'Peanut Butter (350g)', category: 'Packaged Food', subcategory: 'Spread', unit: 'pack' as const, cost: 150, sell: 190, mrp: 199, tags: ['peanut butter'] },

  // Baby & Kids
  { name: 'Cerelac (300g)', category: 'Baby Care', subcategory: 'Baby Food', unit: 'pack' as const, cost: 220, sell: 270, mrp: 285, tags: ['cerelac', 'baby food'] },
  { name: 'Pampers Diapers (S, 22pc)', category: 'Baby Care', subcategory: 'Diapers', unit: 'pack' as const, cost: 350, sell: 420, mrp: 440, tags: ['diapers', 'pampers'] },

  // Dry Fruits
  { name: 'Almonds (250g)', category: 'Dry Fruits', subcategory: 'Nuts', unit: 'pack' as const, cost: 200, sell: 260, mrp: 280, tags: ['almonds', 'badam'] },
  { name: 'Cashew Nuts (250g)', category: 'Dry Fruits', subcategory: 'Nuts', unit: 'pack' as const, cost: 240, sell: 310, mrp: 330, tags: ['cashew', 'kaju'] },
  { name: 'Raisins (250g)', category: 'Dry Fruits', subcategory: 'Dried Fruit', unit: 'pack' as const, cost: 80, sell: 105, mrp: 115, tags: ['raisins', 'kishmish'] },
];

// ─── Team members ───────────────────────────────────────────────────────────
const teamMembers = [
  { firstName: 'Rahul', lastName: 'Kumar', email: 'rahul.kumar@stocksense.test', role: 'manager' as const },
  { firstName: 'Priya', lastName: 'Singh', email: 'priya.singh@stocksense.test', role: 'staff' as const },
  { firstName: 'Amit', lastName: 'Patel', email: 'amit.patel@stocksense.test', role: 'staff' as const },
];

// ─── Main seed ──────────────────────────────────────────────────────────────
async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!\n');

  // ── Clean existing data for this user ──────────────────────────────────
  const existingUser = await User.findOne({ email: 'imsurajchahar@gmail.com' });
  if (existingUser) {
    const existingStores = await Store.find({ ownerId: existingUser._id });
    const storeIds = existingStores.map((s) => s._id);

    await Promise.all([
      Sale.deleteMany({ storeId: { $in: storeIds } }),
      Product.deleteMany({ storeId: { $in: storeIds } }),
      Forecast.deleteMany({ storeId: { $in: storeIds } }),
      Notification.deleteMany({ userId: existingUser._id }),
      Subscription.deleteMany({ userId: existingUser._id }),
      Store.deleteMany({ ownerId: existingUser._id }),
    ]);

    // Delete team members
    for (const tm of teamMembers) {
      await User.deleteOne({ email: tm.email });
    }
    await User.deleteOne({ _id: existingUser._id });
    console.log('Cleaned existing data for imsurajchahar.\n');
  }

  // ── 1. Create Owner User ──────────────────────────────────────────────
  console.log('Creating user...');
  const user = await User.create({
    email: 'imsurajchahar@gmail.com',
    passwordHash: 'Suraj@1234',
    firstName: 'Suraj',
    lastName: 'Chahar',
    phone: '+91-9876543210',
    role: 'owner',
    isEmailVerified: true,
    lastLoginAt: new Date(),
    stores: [],
  });

  // ── 2. Create Subscription (Pro plan) ────────────────────────────────
  console.log('Creating subscription...');
  const subscription = await Subscription.create({
    userId: user._id,
    plan: 'pro',
    status: 'active',
    limits: { maxStores: 5, maxSkusPerStore: 500 },
    currentPeriodStart: daysAgo(15),
    currentPeriodEnd: daysFromNow(15),
  });

  // ── 3. Create Stores ──────────────────────────────────────────────────
  console.log('Creating stores...');
  const store1 = await Store.create({
    ownerId: user._id,
    name: 'Chahar General Store',
    category: 'grocery',
    address: { line1: '42, Main Market Road', line2: 'Near Bus Stand', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
    phone: '+91-141-2567890',
    gstNumber: '08AABCS1234F1ZP',
    settings: { currency: 'INR', timezone: 'Asia/Kolkata', lowStockThreshold: 10, defaultLeadTimeDays: 3 },
  });

  const store2 = await Store.create({
    ownerId: user._id,
    name: 'Chahar Supermart',
    category: 'grocery',
    address: { line1: '15, MG Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302015' },
    phone: '+91-141-2890123',
    settings: { currency: 'INR', timezone: 'Asia/Kolkata', lowStockThreshold: 15, defaultLeadTimeDays: 2 },
  });

  // Update user with stores
  user.stores = [
    { storeId: store1._id, role: 'owner' },
    { storeId: store2._id, role: 'owner' },
  ];
  user.activeStoreId = store1._id;
  user.subscriptionId = subscription._id;
  await user.save();

  // ── 4. Create Team Members ────────────────────────────────────────────
  console.log('Creating team members...');
  for (const tm of teamMembers) {
    const member = await User.create({
      email: tm.email,
      passwordHash: 'Team@1234',
      firstName: tm.firstName,
      lastName: tm.lastName,
      role: tm.role,
      isEmailVerified: true,
      stores: [{ storeId: store1._id, role: tm.role }],
      activeStoreId: store1._id,
    });
    console.log(`  - ${member.firstName} ${member.lastName} (${tm.role})`);
  }

  // ── 5. Create Products for Store 1 (all 58 products) ─────────────────
  console.log('\nCreating products for Store 1...');
  const store1Products = [];
  for (let i = 0; i < productCatalog.length; i++) {
    const p = productCatalog[i];
    const product = await Product.create({
      storeId: store1._id,
      sku: `CG-${String(i + 1).padStart(4, '0')}`,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      unit: p.unit,
      price: { costPrice: p.cost, sellingPrice: p.sell, mrp: p.mrp },
      currentStock: rand(5, 200),
      reorderLevel: rand(8, 25),
      reorderQuantity: rand(30, 100),
      leadTimeDays: rand(1, 5),
      barcode: `89000${String(rand(10000000, 99999999))}`,
      isActive: true,
      tags: p.tags,
    });
    store1Products.push(product);
  }
  console.log(`  Created ${store1Products.length} products`);

  // ── 6. Create Products for Store 2 (subset - 35 products) ────────────
  console.log('Creating products for Store 2...');
  const store2Products = [];
  const store2Catalog = productCatalog.slice(0, 35);
  for (let i = 0; i < store2Catalog.length; i++) {
    const p = store2Catalog[i];
    const product = await Product.create({
      storeId: store2._id,
      sku: `CS-${String(i + 1).padStart(4, '0')}`,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      unit: p.unit,
      price: { costPrice: p.cost, sellingPrice: p.sell, mrp: p.mrp },
      currentStock: rand(3, 150),
      reorderLevel: rand(8, 20),
      reorderQuantity: rand(25, 80),
      leadTimeDays: rand(1, 4),
      barcode: `89001${String(rand(10000000, 99999999))}`,
      isActive: true,
      tags: p.tags,
    });
    store2Products.push(product);
  }
  console.log(`  Created ${store2Products.length} products`);

  // ── 7. Generate Sales History (90 days, ~15-30 sales/day for Store 1) ─
  console.log('\nGenerating sales history (90 days)...');
  let totalSales = 0;

  for (let day = 90; day >= 0; day--) {
    const saleDate = daysAgo(day);
    // Weekend gets more sales
    const isWeekend = saleDate.getDay() === 0 || saleDate.getDay() === 6;
    const salesCount = isWeekend ? rand(20, 35) : rand(12, 25);

    for (let s = 0; s < salesCount; s++) {
      const itemCount = rand(1, 5);
      const items = [];
      const usedProducts = new Set<string>();

      for (let i = 0; i < itemCount; i++) {
        const product = pick(store1Products);
        if (usedProducts.has(product._id.toString())) continue;
        usedProducts.add(product._id.toString());

        const qty = rand(1, 6);
        items.push({
          productId: product._id,
          sku: product.sku,
          name: product.name,
          quantity: qty,
          unitPrice: product.price.sellingPrice,
          total: qty * product.price.sellingPrice,
        });
      }

      if (items.length === 0) continue;

      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      const saleHour = rand(8, 21);
      const saleMinute = rand(0, 59);
      const exactDate = new Date(saleDate);
      exactDate.setHours(saleHour, saleMinute, rand(0, 59));

      await Sale.create({
        storeId: store1._id,
        items,
        totalAmount,
        saleDate: exactDate,
        recordedBy: user._id,
        source: pick(['manual', 'manual', 'manual', 'pos', 'pos']),
      });
      totalSales++;
    }
  }
  console.log(`  Store 1: ${totalSales} sales over 90 days`);

  // Store 2 sales (60 days, fewer sales)
  let store2SalesCount = 0;
  for (let day = 60; day >= 0; day--) {
    const saleDate = daysAgo(day);
    const salesCount = rand(8, 18);

    for (let s = 0; s < salesCount; s++) {
      const itemCount = rand(1, 4);
      const items = [];
      const usedProducts = new Set<string>();

      for (let i = 0; i < itemCount; i++) {
        const product = pick(store2Products);
        if (usedProducts.has(product._id.toString())) continue;
        usedProducts.add(product._id.toString());

        const qty = rand(1, 4);
        items.push({
          productId: product._id,
          sku: product.sku,
          name: product.name,
          quantity: qty,
          unitPrice: product.price.sellingPrice,
          total: qty * product.price.sellingPrice,
        });
      }

      if (items.length === 0) continue;

      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      const exactDate = new Date(saleDate);
      exactDate.setHours(rand(9, 20), rand(0, 59), rand(0, 59));

      await Sale.create({
        storeId: store2._id,
        items,
        totalAmount,
        saleDate: exactDate,
        recordedBy: user._id,
        source: 'pos',
      });
      store2SalesCount++;
    }
  }
  console.log(`  Store 2: ${store2SalesCount} sales over 60 days`);

  // ── 8. Generate Forecasts for Store 1 products ────────────────────────
  console.log('\nGenerating forecasts...');
  const methods: ('moving_avg' | 'exp_smoothing' | 'holt_winters' | 'hybrid')[] = [
    'moving_avg', 'exp_smoothing', 'holt_winters', 'hybrid',
  ];

  for (const product of store1Products) {
    const method = pick(methods);
    const predictions = [];
    const baseDemand = rand(3, 20);

    for (let d = 1; d <= 14; d++) {
      const predicted = Math.max(1, baseDemand + randFloat(-3, 3));
      predictions.push({
        date: daysFromNow(d),
        predictedDemand: predicted,
        confidenceLow: Math.max(0, predicted - randFloat(2, 5)),
        confidenceHigh: predicted + randFloat(2, 5),
      });
    }

    const avgDemand = predictions.reduce((s, p) => s + p.predictedDemand, 0) / predictions.length;
    const daysUntilStockout = avgDemand > 0 ? Math.floor(product.currentStock / avgDemand) : 999;

    let priority: 'critical' | 'warning' | 'ok' = 'ok';
    if (product.currentStock <= product.reorderLevel || daysUntilStockout < 2) {
      priority = 'critical';
    } else if (daysUntilStockout < 7) {
      priority = 'warning';
    }

    await Forecast.create({
      storeId: store1._id,
      productId: product._id,
      generatedAt: new Date(),
      method,
      parameters: {
        windowSize: method === 'moving_avg' ? 7 : undefined,
        alpha: method !== 'moving_avg' ? randFloat(0.1, 0.5) : undefined,
        beta: method === 'holt_winters' ? randFloat(0.05, 0.3) : undefined,
        gamma: method === 'holt_winters' ? randFloat(0.1, 0.4) : undefined,
      },
      predictions,
      metrics: {
        mae: randFloat(1, 8),
        mape: randFloat(5, 35),
        rmse: randFloat(2, 10),
      },
      reorderPoint: Math.ceil(avgDemand * product.leadTimeDays * 1.2),
      safetyStock: Math.ceil(avgDemand * 2),
      suggestedOrderQty: product.reorderQuantity,
      suggestedOrderDate: daysFromNow(Math.max(1, daysUntilStockout - product.leadTimeDays)),
      priority,
      expiresAt: daysFromNow(7),
    });
  }
  console.log(`  Created forecasts for ${store1Products.length} products`);

  // ── 9. Generate Notifications ─────────────────────────────────────────
  console.log('\nGenerating notifications...');
  const notificationTemplates: {
    type: 'low_stock' | 'reorder_reminder' | 'forecast_ready' | 'subscription' | 'system';
    title: string;
    message: string;
    daysAgo: number;
    isRead: boolean;
  }[] = [
    { type: 'low_stock', title: 'Low Stock Alert: Toor Dal', message: 'Toor Dal stock has dropped below reorder level (8 units remaining). Consider restocking soon.', daysAgo: 0, isRead: false },
    { type: 'low_stock', title: 'Low Stock Alert: Amul Butter', message: 'Amul Butter stock is critically low (3 units remaining). Immediate reorder recommended.', daysAgo: 0, isRead: false },
    { type: 'low_stock', title: 'Low Stock Alert: Maggi Noodles', message: 'Maggi Noodles stock has dropped below reorder level (5 units remaining).', daysAgo: 1, isRead: false },
    { type: 'reorder_reminder', title: 'Reorder Reminder: Cooking Oils', message: 'Multiple cooking oil products are running low. Place a bulk order to your supplier.', daysAgo: 1, isRead: false },
    { type: 'forecast_ready', title: 'New Forecasts Generated', message: 'Demand forecasts have been updated for all 58 products in Chahar General Store.', daysAgo: 0, isRead: false },
    { type: 'forecast_ready', title: 'Weekly Forecast Update', message: 'Weekly demand predictions are ready. 8 products show increasing demand trend.', daysAgo: 7, isRead: true },
    { type: 'system', title: 'Welcome to DukaanSathi!', message: 'Your account is set up and ready. Start by adding your products and recording sales to get AI-powered forecasts.', daysAgo: 30, isRead: true },
    { type: 'subscription', title: 'Pro Plan Activated', message: 'Your Pro plan is now active. You can manage up to 5 stores and 500 SKUs per store.', daysAgo: 15, isRead: true },
    { type: 'system', title: 'New Feature: Export Reports', message: 'You can now export sales reports and inventory data as CSV files from the Reports page.', daysAgo: 10, isRead: true },
    { type: 'reorder_reminder', title: 'Reorder Due: Staples Category', message: '5 products in the Staples category need restocking within the next 3 days based on demand forecasts.', daysAgo: 2, isRead: false },
    { type: 'low_stock', title: 'Low Stock Alert: Curd', message: 'Curd (400g) is down to 4 units. This is a fast-moving perishable item.', daysAgo: 3, isRead: true },
    { type: 'forecast_ready', title: 'Accuracy Report Ready', message: 'Last week\'s forecast accuracy: 87.3% average across all products. Top performer: Basmati Rice (94.2%).', daysAgo: 5, isRead: true },
    { type: 'low_stock', title: 'Critical: 3 Products Out of Stock', message: 'Salt, Cumin Seeds, and Garbage Bags are currently out of stock in Chahar General Store.', daysAgo: 8, isRead: true },
    { type: 'system', title: 'Team Member Added', message: 'Rahul Kumar has been added as a manager to Chahar General Store.', daysAgo: 20, isRead: true },
    { type: 'system', title: 'Store Created: Chahar Supermart', message: 'Your second store "Chahar Supermart" has been set up. Start adding inventory.', daysAgo: 25, isRead: true },
  ];

  for (const n of notificationTemplates) {
    await Notification.create({
      userId: user._id,
      storeId: store1._id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      emailSent: n.isRead,
      createdAt: daysAgo(n.daysAgo),
    });
  }
  console.log(`  Created ${notificationTemplates.length} notifications`);

  // ── 10. Set some products to low stock for restock page ───────────────
  console.log('\nSetting low-stock products for realistic restock alerts...');
  const lowStockProducts = store1Products.slice(0, 12);
  for (let i = 0; i < lowStockProducts.length; i++) {
    const stock = i < 4 ? rand(0, 3) : rand(4, 9);
    await Product.updateOne({ _id: lowStockProducts[i]._id }, { currentStock: stock });
  }
  console.log(`  Set ${lowStockProducts.length} products to low stock`);

  // ── Summary ───────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log('  SEED COMPLETE!');
  console.log('══════════════════════════════════════════════════');
  console.log(`  User:           imsurajchahar@gmail.com`);
  console.log(`  Password:       Suraj@1234`);
  console.log(`  Stores:         2 (Chahar General Store, Chahar Supermart)`);
  console.log(`  Products:       ${store1Products.length} + ${store2Products.length} = ${store1Products.length + store2Products.length}`);
  console.log(`  Sales:          ${totalSales + store2SalesCount} (over 90 days)`);
  console.log(`  Forecasts:      ${store1Products.length}`);
  console.log(`  Notifications:  ${notificationTemplates.length}`);
  console.log(`  Team Members:   ${teamMembers.length}`);
  console.log(`  Subscription:   Pro (active)`);
  console.log('══════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
