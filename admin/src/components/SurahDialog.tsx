'use client';
import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

interface SurahFormData {
    name: string;
    nameArabic: string;
    surahNumber: number;
    versesCount: number;
    revelation: 'Meccan' | 'Medinan';
    kitabId: number;
}

interface SurahDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: SurahFormData) => void;
    initialData?: Partial<SurahFormData>;
    mode: 'create' | 'edit';
}

export default function SurahDialog({ open, onClose, onSave, initialData, mode }: SurahDialogProps) {
    const [formData, setFormData] = useState<SurahFormData>({
        name: '',
        nameArabic: '',
        surahNumber: 1,
        versesCount: 1,
        revelation: 'Meccan',
        kitabId: 1,
    });

    React.useEffect(() => {
        if (open) {
            setFormData({
                name: initialData?.name || '',
                nameArabic: initialData?.nameArabic || '',
                surahNumber: initialData?.surahNumber || 1,
                versesCount: initialData?.versesCount || 1,
                revelation: initialData?.revelation || 'Meccan',
                kitabId: initialData?.kitabId || 1,
            });
        }
    }, [initialData, open]);

    const handleChange = (field: keyof SurahFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{mode === 'create' ? 'Add New Surah' : 'Edit Surah'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <TextField
                        label="Surah Number"
                        type="number"
                        value={formData.surahNumber}
                        onChange={handleChange('surahNumber')}
                        fullWidth
                    />
                    <TextField
                        label="Name (English)"
                        value={formData.name}
                        onChange={handleChange('name')}
                        fullWidth
                    />
                    <TextField
                        label="Name (Arabic)"
                        value={formData.nameArabic}
                        onChange={handleChange('nameArabic')}
                        fullWidth
                        inputProps={{ style: { fontFamily: 'NooreHira' } }}
                    />
                    <TextField
                        label="Number of Verses"
                        type="number"
                        value={formData.versesCount}
                        onChange={handleChange('versesCount')}
                        fullWidth
                    />
                    <TextField
                        label="Revelation"
                        select
                        value={formData.revelation}
                        onChange={handleChange('revelation')}
                        fullWidth
                        SelectProps={{ native: true }}
                    >
                        <option value="Meccan">Meccan</option>
                        <option value="Medinan">Medinan</option>
                    </TextField>
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
