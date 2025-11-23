'use client';
import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';

interface AudioPlayerProps {
    surahNumber: number;
    ayahNumber: number;
    onEnded: () => void;
    onNext: () => void;
    onPrev: () => void;
    autoPlay: boolean;
}

export default function AudioPlayer({ surahNumber, ayahNumber, onEnded, onNext, onPrev, autoPlay }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const s = surahNumber.toString().padStart(3, '0');
    const a = ayahNumber.toString().padStart(3, '0');
    const src = `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;

    useEffect(() => {
        const loadAudio = async () => {
            if (audioRef.current) {
                // Pause current audio before loading new source
                audioRef.current.pause();
                audioRef.current.currentTime = 0;

                // Load new source
                audioRef.current.src = src;
                audioRef.current.load();

                if (autoPlay) {
                    // Wait for audio to be ready before playing
                    try {
                        await audioRef.current.play();
                        setIsPlaying(true);
                    } catch (e: any) {
                        // Ignore AbortError which happens when pausing/loading quickly
                        if (e.name !== 'AbortError') {
                            console.error("Audio play failed", e);
                        }
                        setIsPlaying(false);
                    }
                } else {
                    setIsPlaying(false);
                }
            }
        };

        loadAudio();
    }, [src, autoPlay]);

    const togglePlay = async () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                try {
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (e: any) {
                    if (e.name !== 'AbortError') {
                        console.error("Audio play failed", e);
                    }
                    setIsPlaying(false);
                }
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        onEnded();
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedMetadata={handleTimeUpdate}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <IconButton onClick={onPrev}>
                    <SkipPreviousIcon />
                </IconButton>
                <IconButton onClick={togglePlay} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, mx: 2 }}>
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton onClick={onNext}>
                    <SkipNextIcon />
                </IconButton>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption">{formatTime(progress)}</Typography>
                <Slider
                    size="small"
                    value={progress}
                    max={duration}
                    onChange={(_, value) => {
                        if (audioRef.current) {
                            audioRef.current.currentTime = value as number;
                            setProgress(value as number);
                        }
                    }}
                    sx={{ flex: 1 }}
                />
                <Typography variant="caption">{formatTime(duration)}</Typography>
            </Box>
        </Box>
    );
}
