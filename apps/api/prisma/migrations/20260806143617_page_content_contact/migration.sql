-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "brandName" TEXT NOT NULL DEFAULT 'Reine Univers Business',
    "heroTitle" TEXT NOT NULL,
    "heroSubtitle" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL DEFAULT 'Commander',
    "deliveryEyebrow" TEXT NOT NULL DEFAULT 'Livraison',
    "deliveryTitle" TEXT NOT NULL,
    "deliveryText" TEXT NOT NULL,
    "deliveryFast" TEXT NOT NULL,
    "deliveryHours" TEXT NOT NULL,
    "deliveryZones" TEXT NOT NULL,
    "loyaltyEyebrow" TEXT NOT NULL DEFAULT 'Fidélité',
    "loyaltyTitle" TEXT NOT NULL,
    "loyaltyText" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);
