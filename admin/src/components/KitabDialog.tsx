'use client';
import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

interface KitabFormData {
    name: string;
    nameArabic: string;
    description: string;
}

interface KitabDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: KitabFormData) => void;
    initialData?: Partial<KitabFormData>;
    mode: 'create' | 'edit';
}

export default function KitabDialog({ open, onClose, onSave, initialData, mode }: KitabDialogProps) {
    const [formData, setFormData] = useState<KitabFormData>({
        name: '',
        nameArabic: '',
        description: '',
    });

    React.useEffect(() => {
        if (open) {
            setFormData({
                name: initialData?.name || '',
                nameArabic: initialData?.nameArabic || '',
                description: initialData?.description || '',
            });
        }
    }, [initialData, open]);

    const handleChange = (field: keyof KitabFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{mode === 'create' ? 'Add New Kitab' : 'Edit Kitab'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
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
                        label="Description"
                        value={formData.description}
                        onChange={handleChange('description')}
                        fullWidth
                        multiline
                        rows={3}
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
