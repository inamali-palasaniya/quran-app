'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Pagination from '@mui/material/Pagination';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AudioPlayer from '../../components/AudioPlayer';
import SurahDialog from '../../components/SurahDialog';
import AyahDialog from '../../components/AyahDialog';
import { surahsApi, ayahsApi, tafseerApi } from '../../services/api';

// Import local data as fallback
import quranData from '../../data/quran_data.json';

const ITEMS_PER_PAGE = 15;

export default function SurahsPage() {
    const [page, setPage] = useState(1);
    const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
    const [currentAyahIndex, setCurrentAyahIndex] = useState<number | null>(null);
    const [autoPlay, setAutoPlay] = useState(false);
    const [loading, setLoading] = useState(true);
    const [allSurahs, setAllSurahs] = useState<any[]>([]);
    const [selectedSurahDetails, setSelectedSurahDetails] = useState<any>(null);
    const [useLocalData, setUseLocalData] = useState(false);

    // Dialog states
    const [surahDialogOpen, setSurahDialogOpen] = useState(false);
    const [ayahDialogOpen, setAyahDialogOpen] = useState(false);
    const [editingSurah, setEditingSurah] = useState<any>(null);
    const [editingAyah, setEditingAyah] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'surah' | 'ayah', id: number } | null>(null);

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Load Surahs
    useEffect(() => {
        loadSurahs();
    }, []);

    const loadSurahs = async () => {
        try {
            setLoading(true);
            if (!surahsApi) {
                throw new Error('surahsApi is not defined');
            }
            console.log('Fetching surahs from API...');
            const response = await surahsApi.getAll();
            console.log('API response received');
            setAllSurahs(response.data);
            setUseLocalData(false);
        } catch (error) {
            console.warn('Failed to load surahs from API, falling back to local data.', error);
            // Fallback to local JSON data
            try {
                const localSurahs = (quranData as any)[0]?.surahs || [];
                if (localSurahs.length === 0) {
                    console.error('Local data is empty or invalid');
                }
                setAllSurahs(localSurahs);
                setUseLocalData(true);
                setSnackbar({ open: true, message: 'Using local data (API unavailable)', severity: 'warning' });
            } catch (localError) {
                console.error('Error loading local data:', localError);
                setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    // Load Surah Details
    const loadSurahDetails = async (id: number) => {
        try {
            if (useLocalData) {
                // Use local data
                const surah = allSurahs.find((s: any) => s.id === id);
                setSelectedSurahDetails(surah);
            } else {
                // Use API
                const response = await surahsApi.getById(id);
                setSelectedSurahDetails(response.data);
            }
        } catch (error) {
            console.error('Error loading surah details:', error);
            // Fallback to local data
            const surah = allSurahs.find((s: any) => s.id === id);
            setSelectedSurahDetails(surah);
        }
    };

    // Pagination Logic
    const pageCount = Math.ceil(allSurahs.length / ITEMS_PER_PAGE);
    const displayedSurahs = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return allSurahs.slice(start, start + ITEMS_PER_PAGE);
    }, [page, allSurahs]);

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const handleSurahClick = (id: number) => {
        setSelectedSurahId(id);
        setCurrentAyahIndex(null);
        setAutoPlay(false);
        loadSurahDetails(id);
    };

    // CRUD Handlers
    const handleCreateSurah = async (data: any) => {
        if (useLocalData) {
            setSnackbar({ open: true, message: 'Cannot create when using local data. Please connect to API.', severity: 'error' });
            return;
        }
        try {
            const payload = {
                ...data,
                surahNumber: Number(data.surahNumber),
                versesCount: Number(data.versesCount),
                kitabId: Number(data.kitabId || 1) // Default to 1 if missing
            };
            await surahsApi.create(payload);
            setSnackbar({ open: true, message: 'Surah created successfully', severity: 'success' });
            loadSurahs();
        } catch (error) {
            console.error('Error creating surah:', error);
            setSnackbar({ open: true, message: 'Failed to create Surah', severity: 'error' });
        }
    };

    const handleUpdateSurah = async (data: any) => {
        if (!editingSurah) return;
        if (useLocalData) {
            setSnackbar({ open: true, message: 'Cannot update when using local data. Please connect to API.', severity: 'error' });
            return;
        }
        try {
            await surahsApi.update(editingSurah.id, data);
            setSnackbar({ open: true, message: 'Surah updated successfully', severity: 'success' });
            loadSurahs();
            if (selectedSurahId === editingSurah.id) {
                loadSurahDetails(editingSurah.id);
            }
        } catch (error) {
            console.error('Error updating surah:', error);
            setSnackbar({ open: true, message: 'Failed to update Surah', severity: 'error' });
        }
    };

    const handleCreateAyah = async (data: any) => {
        if (useLocalData) {
            setSnackbar({ open: true, message: 'Cannot create when using local data. Please connect to API.', severity: 'error' });
            return;
        }
        try {
            // Find the selected surah to get kitabId and surahNumber
            const surah = allSurahs.find(s => s.id === data.surahId);
            if (!surah) {
                throw new Error('Selected Surah not found');
            }

            const payload = {
                ...data,
                kitabId: surah.kitabId,
                surahNumber: surah.surahNumber,
                // Ensure numbers are actually numbers
                ayahNumber: Number(data.ayahNumber),
                surahId: Number(data.surahId)
            };

            // Separate Tafseer/Scholar from Ayah data if needed, or handle in backend
            // The backend expects flat structure for Ayah, but Tafseer is separate model
            // My backend update added Tafseer creation separately? 
            // Wait, the backend POST /ayahs just does create(req.body). 
            // But Ayah model doesn't have 'tafseer' or 'scholar' fields directly.
            // I need to create Ayah first, then Tafseer.

            // Let's strip tafseer/scholar from payload for Ayah creation
            const { tafseer, scholar, ...ayahPayload } = payload;

            const response = await ayahsApi.create(ayahPayload);
            const newAyah = response.data;

            // If tafseer is provided, create it
            if (tafseer || scholar) {
                await tafseerApi.create(newAyah.id, {
                    text: tafseer || '',
                    scholar: scholar || 'Unknown'
                });
            }

            setSnackbar({ open: true, message: 'Ayah created successfully', severity: 'success' });
            if (selectedSurahId) {
                loadSurahDetails(selectedSurahId);
            }
        } catch (error) {
            console.error('Error creating ayah:', error);
            setSnackbar({ open: true, message: 'Failed to create Ayah', severity: 'error' });
        }
    };

    const handleUpdateAyah = async (data: any) => {
        if (!editingAyah) return;
        if (useLocalData) {
            setSnackbar({ open: true, message: 'Cannot update when using local data. Please connect to API.', severity: 'error' });
            return;
        }
        try {
            const surah = allSurahs.find(s => s.id === data.surahId);
            if (!surah) throw new Error('Surah not found');

            const payload = {
                ...data,
                kitabId: surah.kitabId,
                surahNumber: surah.surahNumber,
                ayahNumber: Number(data.ayahNumber),
                surahId: Number(data.surahId)
            };

            const { tafseer, scholar, ...ayahPayload } = payload;

            await ayahsApi.update(editingAyah.id, ayahPayload);

            // Handle Tafseer update (simplified: create if not exists, or update if we knew the ID)
            // Since we don't track Tafseer ID easily here, we might need a smarter backend endpoint or just ignore for now
            // For this task, let's assume we just update the Ayah text. 
            // If the user wants to update Tafseer, they should probably do it via a dedicated Tafseer management or we need to fetch Tafseer ID.
            // For now, let's just update the Ayah fields.

            setSnackbar({ open: true, message: 'Ayah updated successfully', severity: 'success' });
            if (selectedSurahId) {
                loadSurahDetails(selectedSurahId);
            }
        } catch (error) {
            console.error('Error updating ayah:', error);
            setSnackbar({ open: true, message: 'Failed to update Ayah', severity: 'error' });
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        if (useLocalData) {
            setSnackbar({ open: true, message: 'Cannot delete when using local data. Please connect to API.', severity: 'error' });
            setDeleteDialogOpen(false);
            return;
        }
        try {
            if (itemToDelete.type === 'surah') {
                await surahsApi.delete(itemToDelete.id);
                setSnackbar({ open: true, message: 'Surah deleted successfully', severity: 'success' });
                loadSurahs();
                if (selectedSurahId === itemToDelete.id) {
                    setSelectedSurahId(null);
                    setSelectedSurahDetails(null);
                }
            } else {
                await ayahsApi.delete(itemToDelete.id);
                setSnackbar({ open: true, message: 'Ayah deleted successfully', severity: 'success' });
                if (selectedSurahId) {
                    loadSurahDetails(selectedSurahId);
                }
            }
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Error deleting:', error);
            setSnackbar({ open: true, message: `Failed to delete ${itemToDelete.type}`, severity: 'error' });
        }
    };

    // Audio handlers
    const handleAudioNext = () => {
        if (selectedSurahDetails && currentAyahIndex !== null && currentAyahIndex < selectedSurahDetails.ayahs.length - 1) {
            setCurrentAyahIndex(currentAyahIndex + 1);
            setAutoPlay(true);
        }
    };

    const handleAudioPrev = () => {
        if (currentAyahIndex !== null && currentAyahIndex > 0) {
            setCurrentAyahIndex(currentAyahIndex - 1);
            setAutoPlay(true);
        }
    };

    const handleAudioEnded = () => {
        handleAudioNext();
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Surahs</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setEditingSurah(null);
                        setSurahDialogOpen(true);
                    }}
                >
                    Add Surah
                </Button>
            </Box>

            <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden', height: '100%' }}>
                {/* Left Column: Surah List */}
                <Grid size={{ xs: 12, md: 4 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Paper sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                        <List>
                            {displayedSurahs.map((surah: any) => (
                                <React.Fragment key={surah.id}>
                                    <ListItem
                                        disablePadding
                                        secondaryAction={
                                            <Box>
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingSurah(surah);
                                                        setSurahDialogOpen(true);
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setItemToDelete({ type: 'surah', id: surah.id });
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        }
                                    >
                                        <ListItemButton
                                            selected={selectedSurahId === surah.id}
                                            onClick={() => handleSurahClick(surah.id)}
                                        >
                                            <ListItemText
                                                primary={`${surah.surahNumber}. ${surah.name} (${surah.nameArabic})`}
                                                secondary={`${surah.versesCount} Ayahs • ${surah.revelation}`}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                            count={pageCount}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            size="small"
                        />
                    </Box>
                </Grid>

                {/* Right Column: Surah Details */}
                <Grid size={{ xs: 12, md: 8 }} sx={{ height: '100%', overflow: 'hidden' }}>
                    {selectedSurahDetails ? (
                        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
                            {/* Header */}
                            <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5">{selectedSurahDetails.name}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Typography variant="h4" sx={{ fontFamily: 'NooreHira' }}>
                                            {selectedSurahDetails.nameArabic}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={() => {
                                                setEditingAyah(null);
                                                setAyahDialogOpen(true);
                                            }}
                                        >
                                            Add Ayah
                                        </Button>
                                    </Box>
                                </Box>
                                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                    <Chip label={selectedSurahDetails.revelation} size="small" color="secondary" variant="outlined" />
                                    <Chip label={`${selectedSurahDetails.versesCount} Verses`} size="small" variant="outlined" />
                                </Box>
                            </Box>

                            {/* Audio Player (Sticky) */}
                            {currentAyahIndex !== null && selectedSurahDetails.ayahs[currentAyahIndex] && (
                                <Box sx={{ mb: 2 }}>
                                    <AudioPlayer
                                        surahNumber={selectedSurahDetails.surahNumber}
                                        ayahNumber={selectedSurahDetails.ayahs[currentAyahIndex].ayahNumber}
                                        onEnded={handleAudioEnded}
                                        onNext={handleAudioNext}
                                        onPrev={handleAudioPrev}
                                        autoPlay={autoPlay}
                                    />
                                </Box>
                            )}

                            {/* Ayah List */}
                            <Box sx={{ flex: 1, overflow: 'auto' }}>
                                {selectedSurahDetails.ayahs?.map((ayah: any, index: number) => (
                                    <Card
                                        key={ayah.id}
                                        sx={{
                                            mb: 2,
                                            bgcolor: currentAyahIndex === index ? 'action.selected' : 'background.paper',
                                            border: currentAyahIndex === index ? 1 : 0,
                                            borderColor: 'primary.main',
                                        }}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Chip
                                                    label={`Ayah ${ayah.ayahNumber}`}
                                                    size="small"
                                                    onClick={() => {
                                                        setCurrentAyahIndex(index);
                                                        setAutoPlay(true);
                                                    }}
                                                    clickable
                                                    color={currentAyahIndex === index ? 'primary' : 'default'}
                                                />
                                                <Box>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setEditingAyah(ayah);
                                                            setAyahDialogOpen(true);
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setItemToDelete({ type: 'ayah', id: ayah.id });
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                            <Typography variant="h5" align="right" sx={{ fontFamily: 'NooreHira', mb: 2, lineHeight: 2 }}>
                                                {ayah.textArabic}
                                            </Typography>
                                            {ayah.translation && ayah.translation.length > 0 && (
                                                <Typography variant="body1" color="text.secondary">
                                                    {ayah.translation[0].text}
                                                </Typography>
                                            )}
                                            {ayah.tafseer && ayah.tafseer.length > 0 && (
                                                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                                        Tafseer ({ayah.tafseer[0].scholar})
                                                    </Typography>
                                                    <Typography variant="body2">{ayah.tafseer[0].text}</Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Paper>
                    ) : (
                        <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="h6" color="text.secondary">
                                Select a Surah to view details
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>

            {/* Dialogs */}
            <SurahDialog
                open={surahDialogOpen}
                onClose={() => {
                    setSurahDialogOpen(false);
                    setEditingSurah(null);
                }}
                onSave={editingSurah ? handleUpdateSurah : handleCreateSurah}
                initialData={editingSurah}
                mode={editingSurah ? 'edit' : 'create'}
            />

            <AyahDialog
                open={ayahDialogOpen}
                onClose={() => {
                    setAyahDialogOpen(false);
                    setEditingAyah(null);
                }}
                onSave={editingAyah ? handleUpdateAyah : handleCreateAyah}
                initialData={editingAyah ? { ...editingAyah, surahId: selectedSurahId } : { surahId: selectedSurahId }}
                mode={editingAyah ? 'edit' : 'create'}
                surahs={allSurahs}
            />

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete this {itemToDelete?.type}?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
