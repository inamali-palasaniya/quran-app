'use client';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

export default function Home() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140 }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Total Kitabs
          </Typography>
          <Typography component="p" variant="h4">
            1
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140 }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Total Surahs
          </Typography>
          <Typography component="p" variant="h4">
            114
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140 }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Total Reciters
          </Typography>
          <Typography component="p" variant="h4">
            1
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
