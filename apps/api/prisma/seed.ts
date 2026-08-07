import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { id: 'poulet', label: 'Poulet', sortOrder: 1, description: 'Poulet cru frais du jour' },
  { id: 'oeuf', label: 'Œufs', sortOrder: 2, description: 'Œufs frais' },
  { id: 'mouton', label: 'Mouton', sortOrder: 3, description: 'Viande de mouton crue' },
  { id: 'veau', label: 'Veau', sortOrder: 4, description: 'Viande de veau crue' },
  { id: 'porc', label: 'Porc', sortOrder: 5, description: 'Viande de porc crue' },
];

const products: Array<{
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  categoryId: string;
  cut: string;
  image: string;
  badge?: string;
  popular?: boolean;
}> = [
  {
    id: 'poulet-entier',
    name: 'Poulet entier',
    cut: 'Entier',
    description: 'Poulet entier cru, prêt à préparer. Environ 1,2 à 1,5 kg.',
    price: 4500,
    unit: 'pièce',
    categoryId: 'poulet',
    image: '/products/poulet-entier.png',
    badge: 'Frais du jour',
    popular: true,
  },
  {
    id: 'poulet-cuisses',
    name: 'Cuisses de poulet',
    cut: 'Cuisses',
    description: 'Cuisses crues, avec os. Pour braiser ou griller.',
    price: 3500,
    unit: 'kg',
    categoryId: 'poulet',
    image: '/products/poulet-cuisses.jpg',
    popular: true,
  },
  {
    id: 'poulet-pilons',
    name: 'Pilons de poulet',
    cut: 'Pilons',
    description: 'Pilons crus, charnus. Idéals pour le barbecue.',
    price: 3200,
    unit: 'kg',
    categoryId: 'poulet',
    image: '/products/poulet-pilons.jpg',
  },
  {
    id: 'poulet-ailes',
    name: 'Ailes de poulet',
    cut: 'Ailes',
    description: 'Ailes crues, prêtes à assaisonner.',
    price: 3000,
    unit: 'kg',
    categoryId: 'poulet',
    image: '/products/poulet-ailes.jpg',
  },
  {
    id: 'poulet-blanc',
    name: 'Blanc / filet de poulet',
    cut: 'Blanc',
    description: 'Filets crus sans peau, maigres.',
    price: 5000,
    unit: 'kg',
    categoryId: 'poulet',
    image: '/products/poulet-blanc.jpg',
    badge: 'Premium',
  },
  {
    id: 'poulet-hauts-cuisse',
    name: 'Hauts de cuisse',
    cut: 'Hauts de cuisse',
    description: 'Hauts de cuisse crus, désossés ou avec os.',
    price: 3800,
    unit: 'kg',
    categoryId: 'poulet',
    image: '/products/poulet-hauts.jpg',
  },
  {
    id: 'poulet-decoupe',
    name: 'Poulet découpé (morceaux)',
    cut: 'Découpe complète',
    description: 'Poulet entier découpé en morceaux crus prêts à cuire.',
    price: 4800,
    unit: 'pièce',
    categoryId: 'poulet',
    image: '/products/poulet-decoupe.jpg',
    popular: true,
  },
  {
    id: 'poulet-abats',
    name: 'Foie & gésiers',
    cut: 'Abats',
    description: 'Abats crus frais du jour.',
    price: 2000,
    unit: 'kg',
    categoryId: 'poulet',
    image: '/products/poulet-abats.jpg',
  },
  {
    id: 'oeufs-plateau',
    name: 'Plateau d’œufs × 30',
    cut: 'Plateau',
    description: 'Œufs frais de poules élevées au grain.',
    price: 3500,
    unit: 'plateau',
    categoryId: 'oeuf',
    image: '/products/oeufs-plateau.png',
    badge: 'Best-seller',
    popular: true,
  },
  {
    id: 'oeufs-douzaine',
    name: 'Œufs × 12',
    cut: 'Douzaine',
    description: 'Douzaine d’œufs frais, calibre moyen.',
    price: 1500,
    unit: 'douzaine',
    categoryId: 'oeuf',
    image: '/products/oeufs-douzaine.jpg',
    popular: true,
  },
  {
    id: 'oeufs-boite',
    name: 'Œufs × 6',
    cut: 'Boîte',
    description: 'Petite boîte pour le quotidien.',
    price: 900,
    unit: 'boîte',
    categoryId: 'oeuf',
    image: '/products/oeufs-boite.jpg',
  },
  {
    id: 'mouton-gigot',
    name: 'Gigot de mouton',
    cut: 'Gigot',
    description: 'Gigot cru, tendre. Avec ou sans os.',
    price: 6500,
    unit: 'kg',
    categoryId: 'mouton',
    image: '/products/mouton-gigot.png',
    badge: 'Frais',
    popular: true,
  },
  {
    id: 'mouton-epaule',
    name: 'Épaule de mouton',
    cut: 'Épaule',
    description: 'Épaule crue, désossée ou avec os.',
    price: 6000,
    unit: 'kg',
    categoryId: 'mouton',
    image: '/products/mouton-epaule.jpg',
    popular: true,
  },
  {
    id: 'mouton-cotelettes',
    name: 'Côtelettes de mouton',
    cut: 'Côtelettes',
    description: 'Côtelettes crues pour griller ou mijoter.',
    price: 7000,
    unit: 'kg',
    categoryId: 'mouton',
    image: '/products/mouton-cotelettes.jpg',
  },
  {
    id: 'mouton-cotes',
    name: 'Côtes de mouton',
    cut: 'Côtes',
    description: 'Côtes crues, charnues.',
    price: 6800,
    unit: 'kg',
    categoryId: 'mouton',
    image: '/products/mouton-cotes.jpg',
  },
  {
    id: 'mouton-collier',
    name: 'Collier de mouton',
    cut: 'Collier',
    description: 'Collier cru, idéal pour les sauces et couscous.',
    price: 5500,
    unit: 'kg',
    categoryId: 'mouton',
    image: '/products/mouton-collier.jpg',
  },
  {
    id: 'mouton-poitrine',
    name: 'Poitrine de mouton',
    cut: 'Poitrine',
    description: 'Poitrine crue, pour mijoter.',
    price: 5000,
    unit: 'kg',
    categoryId: 'mouton',
    image: '/products/mouton-poitrine.jpg',
  },
  {
    id: 'mouton-hache',
    name: 'Viande hachée de mouton',
    cut: 'Haché',
    description: 'Haché cru du jour, sans additifs.',
    price: 5800,
    unit: 'kg',
    categoryId: 'mouton',
    image: '/products/mouton-hache.jpg',
  },
  {
    id: 'mouton-foie',
    name: 'Foie de mouton',
    cut: 'Abats',
    description: 'Foie cru frais.',
    price: 4000,
    unit: 'kg',
    categoryId: 'mouton',
    image: '/products/mouton-foie.jpg',
  },
  {
    id: 'veau-escalope',
    name: 'Escalopes de veau',
    cut: 'Escalopes',
    description: 'Escalopes crues fines, prêtes à paner ou saisir.',
    price: 8500,
    unit: 'kg',
    categoryId: 'veau',
    image: '/products/veau-escalope.jpg',
    badge: 'Premium',
    popular: true,
  },
  {
    id: 'veau-filet',
    name: 'Filet de veau',
    cut: 'Filet',
    description: 'Filet cru tendre, pièce noble.',
    price: 9500,
    unit: 'kg',
    categoryId: 'veau',
    image: '/products/veau-filet.png',
    badge: 'Premium',
  },
  {
    id: 'veau-jarret',
    name: 'Jarret de veau',
    cut: 'Jarret',
    description: 'Jarret cru, pour mijotage long.',
    price: 7000,
    unit: 'kg',
    categoryId: 'veau',
    image: '/products/veau-jarret.jpg',
    popular: true,
  },
  {
    id: 'veau-epaule',
    name: 'Épaule de veau',
    cut: 'Épaule',
    description: 'Épaule crue, à braiser.',
    price: 7200,
    unit: 'kg',
    categoryId: 'veau',
    image: '/products/veau-epaule.jpg',
  },
  {
    id: 'veau-cotes',
    name: 'Côtes de veau',
    cut: 'Côtes',
    description: 'Côtes crues, épaisses.',
    price: 8000,
    unit: 'kg',
    categoryId: 'veau',
    image: '/products/veau-cotes.jpg',
  },
  {
    id: 'veau-saute',
    name: 'Sauté de veau (morceaux)',
    cut: 'Sauté',
    description: 'Morceaux crus pour blanquette ou ragoût.',
    price: 7500,
    unit: 'kg',
    categoryId: 'veau',
    image: '/products/veau-saute.jpg',
  },
  {
    id: 'veau-foie',
    name: 'Foie de veau',
    cut: 'Abats',
    description: 'Foie cru frais.',
    price: 6500,
    unit: 'kg',
    categoryId: 'veau',
    image: '/products/veau-foie.jpg',
  },
  {
    id: 'porc-cotelettes',
    name: 'Côtelettes de porc',
    cut: 'Côtelettes',
    description: 'Côtelettes crues, charnues.',
    price: 4500,
    unit: 'kg',
    categoryId: 'porc',
    image: '/products/porc-cotelettes.jpg',
    popular: true,
  },
  {
    id: 'porc-travers',
    name: 'Travers de porc',
    cut: 'Travers',
    description: 'Travers crus, prêts à mariner.',
    price: 4200,
    unit: 'kg',
    categoryId: 'porc',
    image: '/products/porc-travers.jpg',
    popular: true,
  },
  {
    id: 'porc-echine',
    name: 'Échine de porc',
    cut: 'Échine',
    description: 'Échine crue, pièce pour le four.',
    price: 4800,
    unit: 'kg',
    categoryId: 'porc',
    image: '/products/porc-echine.jpg',
    badge: 'Week-end',
  },
  {
    id: 'porc-filet',
    name: 'Filet de porc',
    cut: 'Filet',
    description: 'Filet cru maigre, sans os.',
    price: 5200,
    unit: 'kg',
    categoryId: 'porc',
    image: '/products/porc-filet.jpg',
  },
  {
    id: 'porc-epaule',
    name: 'Épaule de porc',
    cut: 'Épaule',
    description: 'Épaule crue, pour braiser ou hacher.',
    price: 4000,
    unit: 'kg',
    categoryId: 'porc',
    image: '/products/porc-epaule.jpg',
  },
  {
    id: 'porc-poitrine',
    name: 'Poitrine de porc',
    cut: 'Poitrine',
    description: 'Poitrine crue, avec lard.',
    price: 3800,
    unit: 'kg',
    categoryId: 'porc',
    image: '/products/porc-poitrine.png',
  },
  {
    id: 'porc-hache',
    name: 'Viande hachée de porc',
    cut: 'Haché',
    description: 'Haché cru du jour.',
    price: 4300,
    unit: 'kg',
    categoryId: 'porc',
    image: '/products/porc-hache.jpg',
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        label: category.label,
        description: category.description,
        sortOrder: category.sortOrder,
        active: true,
      },
      create: {
        ...category,
        active: true,
      },
    });
  }
  console.log(`Seeded ${categories.length} categories`);

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        unit: product.unit,
        categoryId: product.categoryId,
        cut: product.cut,
        image: product.image,
        badge: product.badge ?? null,
        popular: product.popular ?? false,
        active: true,
      },
      create: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        unit: product.unit,
        categoryId: product.categoryId,
        cut: product.cut,
        image: product.image,
        badge: product.badge ?? null,
        popular: product.popular ?? false,
        active: true,
      },
    });
  }
  console.log(`Seeded ${products.length} products`);

  await prisma.siteContent.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      brandName: 'Reine Univers Business',
      heroTitle: 'Viande fraîche livrée chez vous',
      heroSubtitle: 'Poulet, œufs, mouton, veau et porc, toujours frais du jour',
      ctaLabel: 'Commander',
      deliveryEyebrow: 'Livraison',
      deliveryTitle: 'Viande fraîche jusqu’à votre porte',
      deliveryText:
        'Toujours frais du jour. Paiement à la livraison. Frais selon la distance, confirmés par téléphone avant envoi.',
      deliveryFast: 'Commandez avant 16h, recevez le jour même dans votre zone.',
      deliveryHours: 'Lundi à Samedi, 8h à 20h. Dimanche sur demande.',
      deliveryZones: 'Livraison à Dakar et dans les quartiers (Plateau, Almadies, Ouakam, Parcelles, Pikine…).',
      loyaltyEyebrow: 'Fidélité',
      loyaltyTitle: 'Gagnez à chaque commande',
      loyaltyText:
        'Plus vous commandez, plus vous êtes récompensé. Cumulez des points à chaque achat (1 point pour 250 F CFA) et profitez d’offres exclusives.',
      phone: '+221770000000',
      whatsapp: '221770000000',
      email: 'commande@reineunivers.sn',
    },
  });
  console.log('Seeded site content');

  const courierCount = await prisma.courier.count();
  if (courierCount === 0) {
    await prisma.courier.createMany({
      data: [
        { name: 'Moussa Diop', phone: '+221771234501', sortOrder: 1 },
        { name: 'Awa Ndiaye', phone: '+221771234502', sortOrder: 2 },
        { name: 'Ibrahima Sarr', phone: '+221771234503', sortOrder: 3 },
        { name: 'Fatou Ba', phone: '+221771234504', sortOrder: 4 },
        { name: 'Cheikh Fall', phone: '+221771234505', sortOrder: 5 },
        { name: 'Mariama Sy', phone: '+221771234506', sortOrder: 6 },
      ],
    });
    console.log('Seeded couriers');
  }

  const zoneCount = await prisma.deliveryZone.count();
  if (zoneCount === 0) {
    await prisma.deliveryZone.createMany({
      data: [
        {
          name: 'Plateau',
          keywords: 'plateau,centre ville,independence',
          fee: 500,
          durationMinutes: 20,
          prepMinutes: 8,
          sortOrder: 1,
        },
        {
          name: 'Almadies',
          keywords: 'almadies,ngor,yoff',
          fee: 1500,
          durationMinutes: 35,
          prepMinutes: 10,
          sortOrder: 2,
        },
        {
          name: 'Ouakam / Mermoz',
          keywords: 'ouakam,mermoz,sacré cœur,sacre coeur',
          fee: 1000,
          durationMinutes: 30,
          prepMinutes: 8,
          sortOrder: 3,
        },
        {
          name: 'Parcelles Assainies',
          keywords: "parcelles,patte d'oie,grand yoff",
          fee: 1500,
          durationMinutes: 40,
          prepMinutes: 10,
          sortOrder: 4,
        },
        {
          name: 'Pikine / Guédiawaye',
          keywords: 'pikine,guediawaye,guédiawaye,thiaroye',
          fee: 2000,
          durationMinutes: 50,
          prepMinutes: 12,
          sortOrder: 5,
        },
      ],
    });
    console.log('Seeded delivery zones');
  }

  await prisma.deliverySettings.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      defaultPrepMinutes: 8,
      defaultDurationMinutes: 25,
      defaultFee: 1000,
      useMapsEstimate: true,
    },
  });
  console.log('Seeded delivery settings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
