const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRelations() {
    try {
        console.log('Fetching all Surahs...');
        const surahs = await prisma.surah.findMany();

        console.log(`Found ${surahs.length} Surahs. Updating Ayahs...`);

        for (const surah of surahs) {
            const result = await prisma.ayah.updateMany({
                where: {
                    surahNumber: surah.surahNumber,
                    surahId: null // Only update if currently null
                },
                data: {
                    surahId: surah.id
                }
            });
            console.log(`Updated ${result.count} Ayahs for Surah ${surah.surahNumber}`);
        }

        console.log('Relation fix completed!');
    } catch (error) {
        console.error('Error fixing relations:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixRelations();
