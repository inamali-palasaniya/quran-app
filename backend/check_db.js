const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const count = await prisma.ayah.count();
    console.log('Total Ayahs:', count);

    const firstAyah = await prisma.ayah.findFirst();
    console.log('First Ayah:', firstAyah);
}

check();
