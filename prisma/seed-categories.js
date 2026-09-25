import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  // ============ PARENTS ============
  {
    name: "Woman",
    slug: "woman",
    description: "Timeless elegance for the modern woman.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
    isParent: true,
  },
  {
    name: "Man",
    slug: "man",
    description: "Tailored for the modern man.",
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1200&q=80",
    isParent: true,
  },
  {
    name: "Fragrances",
    slug: "fragrances",
    description: "Signature scents for every mood.",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&q=80",
    isParent: true,
  },
  {
    name: "Bags",
    slug: "bags",
    description: "Artisan-crafted. Everyday luxury.",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=80",
    isParent: true,
  },

  // ============ WOMAN — LEVEL 2 ============
  { name: "New In", slug: "woman-new-in", parentSlug: "woman",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80" },
  { name: "Ready to Wear", slug: "woman-ready-to-wear", parentSlug: "woman",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80" },
  { name: "Unstitched", slug: "woman-unstitched", parentSlug: "woman",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80" },
  { name: "Winter", slug: "woman-winter", parentSlug: "woman",
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80" },
  { name: "West", slug: "woman-west", parentSlug: "woman",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80" },
  { name: "Modest Wear", slug: "woman-modest", parentSlug: "woman",
    image: "https://images.unsplash.com/photo-1583505514954-8df8f8a10cf7?w=800&q=80" },
  { name: "Accessories", slug: "woman-accessories", parentSlug: "woman",
    image: "https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?w=800&q=80" },
  { name: "Special Offers", slug: "woman-sale", parentSlug: "woman",
    image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&q=80" },

  // ============ WOMAN — UNSTITCHED (11 ITEMS ONLY) ============
  { name: "Pre-Fall '26", slug: "woman-unstitched-pre-fall-26", parentSlug: "woman-unstitched" },
  { name: "Festive '26", slug: "woman-unstitched-festive-26", parentSlug: "woman-unstitched" },
  { name: "Intermix '26", slug: "woman-unstitched-intermix-26", parentSlug: "woman-unstitched" },
  { name: "Sukoon", slug: "woman-unstitched-sukoon", parentSlug: "woman-unstitched" },
  { name: "Andaaz", slug: "woman-unstitched-andaaz", parentSlug: "woman-unstitched" },
  { name: "Raunak", slug: "woman-unstitched-raunak", parentSlug: "woman-unstitched" },
  { name: "2 Piece", slug: "woman-unstitched-2-piece", parentSlug: "woman-unstitched" },
  { name: "3 Piece", slug: "woman-unstitched-3-piece", parentSlug: "woman-unstitched" },
  { name: "Festive '26 Catalogue", slug: "woman-unstitched-festive-catalogue", parentSlug: "woman-unstitched" },
  { name: "Unstitched Pre-Fall '26", slug: "woman-unstitched-pre-fall-catalogue", parentSlug: "woman-unstitched" },
  { name: "Fabric Glossary", slug: "woman-unstitched-fabric-glossary", parentSlug: "woman-unstitched" },

  // ============ WOMAN — WINTER (Level 3) ============
  { name: "Sweaters", slug: "woman-winter-sweaters", parentSlug: "woman-winter" },
  { name: "Jackets", slug: "woman-winter-jackets", parentSlug: "woman-winter" },
  { name: "Coats", slug: "woman-winter-coats", parentSlug: "woman-winter" },
  { name: "Hoodies", slug: "woman-winter-hoodies", parentSlug: "woman-winter" },
  { name: "Trench Coats", slug: "woman-winter-trench", parentSlug: "woman-winter" },
  { name: "Over Coats", slug: "woman-winter-overcoat", parentSlug: "woman-winter" },
  { name: "Caps & Shawls", slug: "woman-winter-caps-shawls", parentSlug: "woman-winter" },

  // ============ MAN — LEVEL 2 ============
  { name: "New In", slug: "man-new-in", parentSlug: "man",
    image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&q=80" },
  { name: "Ready to Wear", slug: "man-ready-to-wear", parentSlug: "man",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80" },
  { name: "Unstitched", slug: "man-unstitched", parentSlug: "man",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80" },
  { name: "Winter", slug: "man-winter", parentSlug: "man",
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80" },
  { name: "West", slug: "man-west", parentSlug: "man",
    image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80" },
  { name: "Accessories", slug: "man-accessories", parentSlug: "man",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80" },

  // ============ MAN — UNSTITCHED (10 COTTON ITEMS) ============
{ name: "Platinum", slug: "man-unstitched-platinum", parentSlug: "man-unstitched" },
{ name: "Gold", slug: "man-unstitched-gold", parentSlug: "man-unstitched" },
{ name: "Silver", slug: "man-unstitched-silver", parentSlug: "man-unstitched" },
{ name: "Latha", slug: "man-unstitched-latha", parentSlug: "man-unstitched" },
{ name: "Boski", slug: "man-unstitched-boski", parentSlug: "man-unstitched" },
{ name: "Khadar", slug: "man-unstitched-khadar", parentSlug: "man-unstitched" },
{ name: "Silk Boski", slug: "man-unstitched-silk-boski", parentSlug: "man-unstitched" },
{ name: "Cotton", slug: "man-unstitched-cotton", parentSlug: "man-unstitched" },
{ name: "Cotton Silk", slug: "man-unstitched-cotton-silk", parentSlug: "man-unstitched" },
{ name: "Raw Silk", slug: "man-unstitched-raw-silk", parentSlug: "man-unstitched" },
 
  // ============ MAN — WINTER (Level 3) — Caps & Shawls REMOVED ============
  { name: "Sweaters", slug: "man-winter-sweaters", parentSlug: "man-winter" },
  { name: "Jackets", slug: "man-winter-jackets", parentSlug: "man-winter" },
  { name: "Coats", slug: "man-winter-coats", parentSlug: "man-winter" },
  { name: "Hoodies", slug: "man-winter-hoodies", parentSlug: "man-winter" },
  { name: "Trench Coats", slug: "man-winter-trench", parentSlug: "man-winter" },
  { name: "Over Coats", slug: "man-winter-overcoat", parentSlug: "man-winter" },

  // ============ FRAGRANCES ============
  { name: "For Her", slug: "fragrances-her", parentSlug: "fragrances",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80" },
  { name: "For Him", slug: "fragrances-him", parentSlug: "fragrances",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80" },
  { name: "Sets", slug: "fragrances-sets", parentSlug: "fragrances",
    image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800&q=80" },
  { name: "Shop by Scent", slug: "fragrances-by-scent", parentSlug: "fragrances",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80" },

  { name: "Perfumes", slug: "fragrances-her-perfumes", parentSlug: "fragrances-her" },
  { name: "Body Mists", slug: "fragrances-her-mists", parentSlug: "fragrances-her" },
  { name: "Perfumes", slug: "fragrances-him-perfumes", parentSlug: "fragrances-him" },
  { name: "Body Mists", slug: "fragrances-him-mists", parentSlug: "fragrances-him" },

  // ============ BAGS ============
  { name: "Handbags", slug: "bags-handbags", parentSlug: "bags",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80" },
  { name: "Totes", slug: "bags-totes", parentSlug: "bags",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80" },
  { name: "Clutches", slug: "bags-clutches", parentSlug: "bags",
    image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80" },
];

async function main() {
  console.log("🌱 Seeding categories...\n");

  for (const cat of CATEGORIES.filter((c) => c.isParent)) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          isParent: true,
        },
      });
      console.log(`✅ Parent: ${cat.name}`);
    } else console.log(`⏩ Skipped: ${cat.name}`);
  }

  for (const cat of CATEGORIES.filter((c) => !c.isParent)) {
    const parent = await prisma.category.findUnique({ where: { slug: cat.parentSlug } });
    if (!parent) { console.log(`⚠️  Parent not found: ${cat.name}`); continue; }

    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          image: cat.image || null,
          parentId: parent.id,
          isParent: false,
        },
      });
      console.log(`  ↳ ${cat.name} (under ${parent.name})`);
    } else console.log(`  ⏩ Skipped: ${cat.name}`);
  }

  console.log("\n🎉 Done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });