export const toArabicNumerals = (n: number) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return n.toString().split('').map(c => arabicNumbers[parseInt(c)]).join('');
};
