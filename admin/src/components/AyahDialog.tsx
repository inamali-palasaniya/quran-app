'use client';
import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface AyahFormData {
    ayahNumber: number;
    textArabic: string;
    translation: string;
    surahId: number;
    tafseer?: string;
    scholar?: string;
}

interface AyahDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: AyahFormData) => void;
    initialData?: Partial<AyahFormData>;
    mode: 'create' | 'edit';
    surahs: Array<{ id: number; name: string; surahNumber: number }>;
}

export default function AyahDialog({ open, onClose, onSave, initialData, mode, surahs }: AyahDialogProps) {
    const [formData, setFormData] = useState<AyahFormData>({
        ayahNumber: 1,
        textArabic: '',
        translation: '',
        surahId: 1,
        tafseer: '',
        scholar: '',
    });

    React.useEffect(() => {
        if (open) {
            setFormData({
                ayahNumber: initialData?.ayahNumber || 1,
                textArabic: initialData?.textArabic || '',
                translation: initialData?.translation || '',
                surahId: initialData?.surahId || (surahs[0]?.id || 1),
                tafseer: initialData?.tafseer || '',
                scholar: initialData?.scholar || '',
            });
        }
    }, [initialData, open, surahs]);

    const handleChange = (field: keyof AyahFormData) => (e: any) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{mode === 'create' ? 'Add New Ayah' : 'Edit Ayah'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Surah</InputLabel>
                        <Select
                            value={formData.surahId}
                            label="Surah"
                            onChange={handleChange('surahId')}
                        >
                            {surahs.map((surah) => (
                                <MenuItem key={surah.id} value={surah.id}>
                                    {surah.surahNumber}. {surah.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Ayah Number"
                        type="number"
                        value={formData.ayahNumber}
                        onChange={handleChange('ayahNumber')}
                        fullWidth
                    />

                    <TextField
                        label="Arabic Text"
                        value={formData.textArabic}
                        onChange={handleChange('textArabic')}
                        fullWidth
                        multiline
                        rows={3}
                        inputProps={{ style: { fontFamily: 'NooreHira', fontSize: '1.2rem' } }}
                    />

                    <TextField
                        label="Translation"
                        value={formData.translation}
                        onChange={handleChange('translation')}
                        fullWidth
                        multiline
                        rows={3}
                    />

                    <TextField
                        label="Tafseer (Optional)"
                        value={formData.tafseer}
                        onChange={handleChange('tafseer')}
                        fullWidth
                        multiline
                        rows={4}
                    />

                    <TextField
                        label="Scholar (Optional)"
                        value={formData.scholar}
                        onChange={handleChange('scholar')}
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained">
                    {mode === 'create' ? 'Create' : 'Update'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
