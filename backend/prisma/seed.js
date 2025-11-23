// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const quranData = require('./quran-data.json'); // Now works in JS!

const prisma = new PrismaClient();

async function main() {
    // Create Quran Kitab
    const quran = await prisma.kitab.upsert({
        where: { name: 'Quran' },
        update: {},
        create: {
            name: 'Quran',
            nameArabic: 'القرآن الكريم',
            description: 'The Holy Quran'
        }
    });

    console.log('Seeding 114 Surahs & 6236 Ayahs...');

    for (const surah of quranData) {

        await prisma.surah.upsert({
            where: { surahNumber: surah.id },
            update: {},
            create: {
                kitabId: quran.id,
                surahNumber: surah.id,
                name: surah.name,
                nameArabic: surah.name,
                versesCount: surah.verses.length,
                revelation: surah.type
            }
        });

        for (const verse of surah.verses) {
            await prisma.ayah.upsert({
                where: {
                    surahNumber_ayahNumber: {
                        surahNumber: surah.id,
                        ayahNumber: verse.id
                    }
                },
                update: {},
                create: {
                    kitabId: quran.id,
                    surahNumber: surah.id,
                    ayahNumber: verse.id,
                    textArabic: verse.text,
                    paraNumber: verse.juz || null,
                    rukuNumber: verse.ruku || null
                }
            });

            // Add English Translation
            if (verse.translation_en) {
                await prisma.translation.upsert({
                    where: {
                        ayahId_language: {
                            ayahId: 0, // temporary, will fix later
                            language: 'en'
                        }
                    },
                    update: {},
                    create: {
                        ayahId: 0,
                        language: 'en',
                        translator: 'Dr. Mustafa Khattab',
                        text: verse.translation_en
                    }
                });
            }
        }
    }

    console.log('Quran Seeded Successfully!');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());