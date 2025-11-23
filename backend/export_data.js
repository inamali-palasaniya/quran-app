const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const prisma = new PrismaClient();

async function exportData() {
    try {
        console.log('Fetching data from Database...');
        const kitabs = await prisma.kitab.findMany({
            include: {
                surahs: {
                    include: {
                        ayahs: {
                            include: {
                                translation: true,
                                tafsirs: true
                            },
                            orderBy: {
                                ayahNumber: 'asc'
                            }
                        }
                    },
                    orderBy: {
                        surahNumber: 'asc'
                    }
                }
            }
        });

        console.log('Fetching Tajweed data from API...');

        // Iterate through each Kitab and Surah to fetch Tajweed
        for (const kitab of kitabs) {
            for (const surah of kitab.surahs) {
                console.log(`Fetching Tajweed for Surah ${surah.surahNumber} (${surah.name})...`);
                try {
                    const response = await axios.get(`https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=${surah.surahNumber}`);
                    const tajweedVerses = response.data.verses;

                    // Merge Tajweed text into existing Ayahs
                    surah.ayahs = surah.ayahs.map(ayah => {
                        const tajweedAyah = tajweedVerses.find(t => t.verse_key === `${surah.surahNumber}:${ayah.ayahNumber}`);
                        return {
                            ...ayah,
                            textTajweed: tajweedAyah ? tajweedAyah.text_uthmani_tajweed : null
                        };
                    });

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (err) {
                    console.error(`Failed to fetch Tajweed for Surah ${surah.surahNumber}:`, err.message);
                }
            }
        }

        const outputPath = path.join(__dirname, '../mobile/assets/quran_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(kitabs, null, 2));
        console.log(`Data exported to ${outputPath}`);
    } catch (error) {
        console.error('Error exporting data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportData();
