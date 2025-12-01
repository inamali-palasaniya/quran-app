import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

const AudioControlBar = ({ isPlaying, currentAyahNum, playingBismillah, onPlayPause, onNext, onPrev }: any) => {
    return (
        <View style={styles.audioBar}>
            <Text style={styles.audioBarText}>{playingBismillah ? 'Bismillah' : `Ayah ${currentAyahNum}`}</Text>
            <View style={styles.audioBarControls}>
                <IconButton icon="skip-previous" onPress={onPrev} iconColor="#fff" />
                <IconButton icon={isPlaying ? "pause" : "play"} onPress={onPlayPause} iconColor="#fff" size={30} />
                <IconButton icon="skip-next" onPress={onNext} iconColor="#fff" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    audioBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1e40af',
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 10,
    },
    audioBarText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
    audioBarControls: { flexDirection: 'row' },
});

export default AudioControlBar;
