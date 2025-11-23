const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Gujarati Translation ID
const TRANSLATION_ID = 225;
const LANGUAGE_CODE = 'gu';
const TRANSLATOR_NAME = 'Rabila Al-Umry';

async function fetchAndSaveTranslations() {
    try {
        console.log(`Starting fetch for translation ID: ${TRANSLATION_ID} (${TRANSLATOR_NAME})...`);

        // Loop through all 114 Surahs
        for (let surahNum = 1; surahNum <= 114; surahNum++) {
            console.log(`Fetching Surah ${surahNum}...`);

            try {
                const response = await axios.get(`https://api.quran.com/api/v4/quran/translations/${TRANSLATION_ID}?chapter_number=${surahNum}`);
                const translations = response.data.translations;

                if (!translations || translations.length === 0) {
                    console.warn(`No translations found for Surah ${surahNum}`);
                    continue;
                }

                console.log(`  Found ${translations.length} verses. Saving to DB...`);
                if (translations.length > 0) {
                    console.log('Sample translation item:', JSON.stringify(translations[0], null, 2));
                }

                for (let i = 0; i < translations.length; i++) {
                    const t = translations[i];
                    const sNum = surahNum;
                    const aNum = i + 1; // Assume sequential order starting from 1

                    // Find the Ayah in our DB
                    const ayah = await prisma.ayah.findFirst({
                        where: {
                            surahNumber: sNum,
                            ayahNumber: aNum
                        }
                    });

                    if (ayah) {
                        // Check if translation already exists to avoid duplicates
                        const existing = await prisma.translation.findFirst({
                            where: {
                                ayahId: ayah.id,
                                language: LANGUAGE_CODE,
                                translator: TRANSLATOR_NAME
                            }
                        });

                        if (!existing) {
                            await prisma.translation.create({
                                data: {
                                    ayahId: ayah.id,
                                    language: LANGUAGE_CODE,
                                    translator: TRANSLATOR_NAME,
                                    text: t.text // The translation text (might contain HTML)
                                }
                            });
                        }
                    }
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                console.error(`Error processing Surah ${surahNum}:`, err.message);
            }
        }

        console.log('Translation fetch completed!');

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fetchAndSaveTranslations();
