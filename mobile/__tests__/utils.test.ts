import { toArabicNumerals } from '../utils';

describe('toArabicNumerals', () => {
    it('converts single digits correctly', () => {
        expect(toArabicNumerals(0)).toBe('٠');
        expect(toArabicNumerals(1)).toBe('١');
        expect(toArabicNumerals(5)).toBe('٥');
        expect(toArabicNumerals(9)).toBe('٩');
    });

    it('converts multiple digits correctly', () => {
        expect(toArabicNumerals(10)).toBe('١٠');
        expect(toArabicNumerals(123)).toBe('١٢٣');
        expect(toArabicNumerals(2024)).toBe('٢٠٢٤');
    });
});
