'use client';
import * as React from 'react';
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

// Mock Data
const rows = [
    { id: 1, surah: 1, ayah: 1, text: 'بِسۡمِ اللّٰہِ الرَّحۡمٰنِ الرَّحِیۡمِ' },
    { id: 2, surah: 1, ayah: 2, text: 'ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ' },
];

export default function AyahsPage() {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Ayahs
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />}>
                    Add New Ayah
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Surah</TableCell>
                            <TableCell>Ayah</TableCell>
                            <TableCell>Text</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow
                                key={row.id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {row.surah}
                                </TableCell>
                                <TableCell>{row.ayah}</TableCell>
                                <TableCell sx={{ fontFamily: 'NooreHira', fontSize: '1.2rem' }}>{row.text}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" aria-label="edit">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" aria-label="delete">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
