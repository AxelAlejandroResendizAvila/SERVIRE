import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LogoSVG({ size = 80 }) {
    const sSize = size * 0.6;
    const checkSize = size * 0.5;
    
    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Text style={[styles.sText, { fontSize: sSize }]}>S</Text>
            <Text style={[styles.checkmark, { fontSize: checkSize }]}>✓</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    sText: {
        fontWeight: 'bold',
        color: '#003d5c',
    },
    checkmark: {
        color: '#17a2b8',
        fontWeight: 'bold',
        marginLeft: -8,
    },
});

