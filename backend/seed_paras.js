const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const paraStarts = [
    { para: 1, surah: 1, ayah: 1 },
    { para: 2, surah: 2, ayah: 142 },
    { para: 3, surah: 2, ayah: 253 },
    { para: 4, surah: 3, ayah: 93 },
    { para: 5, surah: 4, ayah: 24 },
    { para: 6, surah: 4, ayah: 148 },
    { para: 7, surah: 5, ayah: 82 },
    { para: 8, surah: 6, ayah: 111 },
    { para: 9, surah: 7, ayah: 88 },
    { para: 10, surah: 8, ayah: 41 },
    { para: 11, surah: 9, ayah: 93 },
    { para: 12, surah: 11, ayah: 6 },
    { para: 13, surah: 12, ayah: 53 },
    { para: 14, surah: 15, ayah: 1 },
    { para: 15, surah: 17, ayah: 1 },
    { para: 16, surah: 18, ayah: 75 },
    { para: 17, surah: 21, ayah: 1 },
    { para: 18, surah: 23, ayah: 1 },
    { para: 19, surah: 25, ayah: 21 },
    { para: 20, surah: 27, ayah: 56 },
    { para: 21, surah: 29, ayah: 46 },
    { para: 22, surah: 33, ayah: 31 },
    { para: 23, surah: 36, ayah: 28 },
    { para: 24, surah: 39, ayah: 32 },
    { para: 25, surah: 41, ayah: 47 },
    { para: 26, surah: 46, ayah: 1 },
    { para: 27, surah: 51, ayah: 31 },
    { para: 28, surah: 58, ayah: 1 },
    { para: 29, surah: 67, ayah: 1 },
    { para: 30, surah: 78, ayah: 1 }
];

async function main() {
    console.log('Seeding Paras...');

    // 1. Create Paras
    for (let i = 1; i <= 30; i++) {
        const para = await prisma.para.upsert({
            where: { paraNumber: i },
            update: {},
            create: {
                kitabId: 1, // Assuming Quran is ID 1
                paraNumber: i,
                name: `Juz ${i}`
            }
        });
        console.log(`Created/Updated Para ${i}`);
    }

    // 2. Update Ayahs
    console.log('Updating Ayahs with Para IDs...');

    // Fetch all ayahs ordered by surah and ayah number
    const ayahs = await prisma.ayah.findMany({
        orderBy: [
            { surahNumber: 'asc' },
            { ayahNumber: 'asc' }
        ]
    });

    let currentParaIndex = 0;

    for (const ayah of ayahs) {
        // Check if we moved to next para
        if (currentParaIndex < paraStarts.length - 1) {
            const nextPara = paraStarts[currentParaIndex + 1];
            if (ayah.surahNumber > nextPara.surah || (ayah.surahNumber === nextPara.surah && ayah.ayahNumber >= nextPara.ayah)) {
                currentParaIndex++;
            }
        }

        const paraNumber = paraStarts[currentParaIndex].para;

        // Only update if needed to save DB calls
        if (ayah.paraNumber !== paraNumber) {
            // Find para ID
            const para = await prisma.para.findUnique({ where: { paraNumber } });
            if (para) {
                await prisma.ayah.update({
                    where: { id: ayah.id },
                    data: {
                        paraNumber: paraNumber,
                        paraId: para.id
                    }
                });
            }
        }
    }

    console.log('Finished seeding Paras and updating Ayahs.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
