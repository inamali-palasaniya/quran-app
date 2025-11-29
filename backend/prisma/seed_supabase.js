const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Read local data
    const dataPath = path.join(__dirname, 'quran-data.json');
    if (!fs.existsSync(dataPath)) {
        console.error('Data file not found:', dataPath);
        return;
    }

    const quranData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Assuming quranData is an array of Kitabs or similar structure
    // Adjust based on your actual JSON structure

    // Example: If quranData is [ { kitabs: [...] } ] or just the array
    const kitabs = Array.isArray(quranData) ? quranData : (quranData.kitabs || []);

    for (const k of kitabs) {
        console.log(`Creating Kitab: ${k.name}`);
        const kitab = await prisma.kitab.upsert({
            where: { name: k.name },
            update: {},
            create: {
                name: k.name,
                nameArabic: k.nameArabic,
                description: k.description,
            },
        });

        if (k.surahs) {
            for (const s of k.surahs) {
                console.log(`  Creating Surah: ${s.name}`);
                const surah = await prisma.surah.upsert({
                    where: { surahNumber: s.surahNumber },
                    update: {},
                    create: {
                        kitabId: kitab.id,
                        surahNumber: s.surahNumber,
                        name: s.name,
                        nameArabic: s.nameArabic,
                        versesCount: s.versesCount || 0,
                        revelation: s.revelation || 'Meccan'
                    }
                });

                if (s.ayahs) {
                    for (const a of s.ayahs) {
                        await prisma.ayah.create({
                            data: {
                                kitabId: kitab.id,
                                surahId: surah.id,
                                surahNumber: surah.surahNumber,
                                ayahNumber: a.ayahNumber,
                                textArabic: a.textArabic,
                                // handle translation/tafsir if present in JSON
                            }
                        });
                    }
                }
            }
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
