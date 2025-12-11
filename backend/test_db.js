const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing DB connection...');
    try {
        const surah = await prisma.surah.findUnique({ where: { surahNumber: 1 } });
        console.log('Connection successful!');
        console.log('Surah 1:', surah);
    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
