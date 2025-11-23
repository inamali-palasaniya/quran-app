'use client';
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import KitabDialog from '../../components/KitabDialog';
import { kitabsApi } from '../../services/api';

export default function KitabsPage() {
    const [loading, setLoading] = useState(true);
    const [kitabs, setKitabs] = useState<any[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKitab, setEditingKitab] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [useLocalData, setUseLocalData] = useState(false);

    useEffect(() => {
        loadKitabs();
    }, []);

    const loadKitabs = async () => {
        try {
            setLoading(true);
            const response = await kitabsApi.getAll();
            setKitabs(response.data);
            setUseLocalData(false);
        } catch (error) {
            console.error('Error loading kitabs from API, using local mock data:', error);
            // Fallback to mock data
            setKitabs([
                { id: 1, name: 'Quran', nameArabic: 'القرآن الكريم', description: 'The Holy Quran' }
            ]);
            setUseLocalData(true);
            setSnackbar({ open: true, message: 'Using local data (API unavailable)', severity: 'warning' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (data: any) => {
        if (useLocalData) {
            setSnackbar({ open: true, message: 'Cannot create when using local data. Please connect to API.', severity: 'error' });
            return;
        }
        try {
            await kitabsApi.create(data);
            setSnackbar({ open: true, message: 'Kitab created successfully', severity: 'success' });
            loadKitabs();
        } catch (error) {
            console.error('Error creating kitab:', error);
            setSnackbar({ open: true, message: 'Failed to create Kitab', severity: 'error' });
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingKitab) return;
        if (useLocalData) {
            setSnackbar({ open: true, message: 'Cannot update when using local data. Please connect to API.', severity: 'error' });
            return;
        }
        try {
            await kitabsApi.update(editingKitab.id, data);
            setSnackbar({ open: true, message: 'Kitab updated successfully', severity: 'success' });
            loadKitabs();
        } catch (error) {
            console.error('Error updating kitab:', error);
            setSnackbar({ open: true, message: 'Failed to update Kitab', severity: 'error' });
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
            await kitabsApi.delete(itemToDelete);
            setSnackbar({ open: true, message: 'Kitab deleted successfully', severity: 'success' });
            loadKitabs();
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Error deleting kitab:', error);
            setSnackbar({ open: true, message: 'Failed to delete Kitab', severity: 'error' });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Kitabs
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setEditingKitab(null);
                        setDialogOpen(true);
                    }}
                >
                    Add New Kitab
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Arabic Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {kitabs.map((row) => (
                            <TableRow
                                key={row.id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {row.id}
                                </TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell sx={{ fontFamily: 'NooreHira' }}>{row.nameArabic}</TableCell>
                                <TableCell>{row.description}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        color="primary"
                                        aria-label="edit"
                                        onClick={() => {
                                            setEditingKitab(row);
                                            setDialogOpen(true);
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        aria-label="delete"
                                        onClick={() => {
                                            setItemToDelete(row.id);
                                            setDeleteDialogOpen(true);
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <KitabDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditingKitab(null);
                }}
                onSave={editingKitab ? handleUpdate : handleCreate}
                initialData={editingKitab}
                mode={editingKitab ? 'edit' : 'create'}
            />

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete this Kitab?
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
