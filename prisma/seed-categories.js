// prisma/seeds-category.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_TREE = [
  // ============ WOMAN ============
  {
    name: 'Woman',
    slug: 'woman',
    isParent: true,
    children: [
      { name: 'New In', slug: 'woman-new-in' },
      { name: 'Ready to Wear', slug: 'woman-ready-to-wear' },
      {
        name: 'Unstitched',
        slug: 'woman-unstitched',
        children: [
          { name: "Pre-Fall '26", slug: 'woman-unstitched-pre-fall-26' },
          { name: "Festive '26", slug: 'woman-unstitched-festive-26' },
          { name: "Intermix '26", slug: 'woman-unstitched-intermix-26' },
          { name: 'Sukoon', slug: 'woman-unstitched-sukoon' },
          { name: 'Andaaz', slug: 'woman-unstitched-andaaz' },
          { name: 'Raunak', slug: 'woman-unstitched-raunak' },
          { name: '2 Piece', slug: 'woman-unstitched-2-piece' },
          { name: '3 Piece', slug: 'woman-unstitched-3-piece' },
        ],
      },
      {
        name: 'Winter',
        slug: 'woman-winter',
        children: [
          { name: 'Sweaters', slug: 'woman-winter-sweaters' },
          { name: 'Jackets', slug: 'woman-winter-jackets' },
          { name: 'Coats', slug: 'woman-winter-coats' },
          { name: 'Hoodies', slug: 'woman-winter-hoodies' },
        ],
      },
      { name: 'West', slug: 'woman-west' },
      { name: 'Modest Wear', slug: 'woman-modest' },
      { name: 'Accessories', slug: 'woman-accessories' },
      { name: 'Special Offers', slug: 'woman-sale' },
    ],
  },

  // ============ MAN ============
  {
    name: 'Man',
    slug: 'man',
    isParent: true,
    children: [
      { name: 'New In', slug: 'man-new-in' },
      { name: 'Ready to Wear', slug: 'man-ready-to-wear' },
      {
        name: 'Unstitched',
        slug: 'man-unstitched',
        children: [
          { name: 'Platinum', slug: 'man-unstitched-platinum' },
          { name: 'Gold', slug: 'man-unstitched-gold' },
          { name: 'Silver', slug: 'man-unstitched-silver' },
          { name: 'Latha', slug: 'man-unstitched-latha' },
          { name: 'Boski', slug: 'man-unstitched-boski' },
          { name: 'Khadar', slug: 'man-unstitched-khadar' },
        ],
      },
      {
        name: 'Winter',
        slug: 'man-winter',
        children: [
          { name: 'Sweaters', slug: 'man-winter-sweaters' },
          { name: 'Jackets', slug: 'man-winter-jackets' },
          { name: 'Coats', slug: 'man-winter-coats' },
        ],
      },
      { name: 'West', slug: 'man-west' },
      { name: 'Accessories', slug: 'man-accessories' },
    ],
  },

  // ============ FRAGRANCES ============
  {
    name: 'Fragrances',
    slug: 'fragrances',
    isParent: true,
    children: [
      {
        name: 'For Her',
        slug: 'fragrances-her',
        children: [
          { name: 'Perfumes', slug: 'fragrances-her-perfumes' },
          { name: 'Body Mists', slug: 'fragrances-her-mists' },
        ],
      },
      {
        name: 'For Him',
        slug: 'fragrances-him',
        children: [
          { name: 'Perfumes', slug: 'fragrances-him-perfumes' },
          { name: 'Body Mists', slug: 'fragrances-him-mists' },
        ],
      },
      { name: 'Sets', slug: 'fragrances-sets' },
    ],
  },

  // ============ BAGS ============
  {
    name: 'Bags',
    slug: 'bags',
    isParent: true,
    children: [
      { name: 'Handbags', slug: 'bags-handbags' },
      { name: 'Totes', slug: 'bags-totes' },
      { name: 'Clutches', slug: 'bags-clutches' },
    ],
  },
];

async function main() {
  console.log('🌱 ZAEM Category Seeder\n');
  console.log('='.repeat(50));

  // ==================== STEP 1: Clear ALL related data ====================
  console.log('\n📦 STEP 1: Clearing old data...\n');

  // Clear in correct order (children first)
  const clears = [
    { name: 'review helpful', fn: () => prisma.reviewHelpful.deleteMany({}) },
    { name: 'reviews', fn: () => prisma.review.deleteMany({}) },
    { name: 'wishlist', fn: () => prisma.wishlistItem.deleteMany({}) },
    { name: 'cart items', fn: () => prisma.cartItem.deleteMany({}) },
    { name: 'order items', fn: () => prisma.orderItem.deleteMany({}) },  // ← FIXED
    { name: 'orders', fn: () => prisma.order.deleteMany({}) },
    { name: 'products', fn: () => prisma.product.deleteMany({}) },
    { name: 'categories', fn: () => prisma.category.deleteMany({}) },
  ];

  for (const { name, fn } of clears) {
    try {
      const result = await fn();
      console.log(`   ✅ ${name}: ${result.count} deleted`);
    } catch (error) {
      console.log(`   ⚠️  ${name}: skipped (${error.message.substring(0, 60)})`);
    }
  }

  // ==================== STEP 2: Insert new tree ====================
  console.log('\n📦 STEP 2: Creating new category tree...\n');

  let parentCount = 0;
  let childCount = 0;
  let grandchildCount = 0;

  for (const parent of CATEGORY_TREE) {
    const createdParent = await prisma.category.create({
      data: {
        name: parent.name,
        slug: parent.slug,
        isParent: true,
      },
    });
    parentCount++;
    console.log(`\n📁 ${parent.name}`);

    if (parent.children) {
      for (const child of parent.children) {
        const createdChild = await prisma.category.create({
          data: {
            name: child.name,
            slug: child.slug,
            parentId: createdParent.id,
            isParent: false,
          },
        });
        childCount++;
        console.log(`   📂 ${child.name}`);

        if (child.children) {
          for (const grandchild of child.children) {
            await prisma.category.create({
              data: {
                name: grandchild.name,
                slug: grandchild.slug,
                parentId: createdChild.id,
                isParent: false,
              },
            });
            grandchildCount++;
            console.log(`      📄 ${grandchild.name}`);
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n🎉 SEED COMPLETE!\n');
  console.log(`   📁 Parents:       ${parentCount}`);
  console.log(`   📂 Children:      ${childCount}`);
  console.log(`   📄 Grandchildren: ${grandchildCount}`);
  console.log(`   ─────────────────────`);
  console.log(`   🌳 Total:         ${parentCount + childCount + grandchildCount}`);
  console.log('\n' + '='.repeat(50) + '\n');
}

main()
  .catch((e) => {
    console.error('\n❌ SEED FAILED:\n', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });