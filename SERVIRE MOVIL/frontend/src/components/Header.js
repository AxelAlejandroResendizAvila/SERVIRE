import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoSVG from './LogoSVG';

export default function Header({ title, showBack = false, showLogo = false }) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
            <View style={styles.leftContainer}>
                {showLogo ? (
                    <LogoSVG size={32} />
                ) : showBack ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.inverse} />
                    </TouchableOpacity>
                ) : null}
            </View>

            <Text style={styles.title}>{title}</Text>

            <View style={styles.rightContainer} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingRight: 8,
    },
    rightContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    title: {
        ...theme.typography.subheader,
        color: theme.colors.text.inverse,
        flex: 2,
        textAlign: 'center',
    },
    iconButton: {
        padding: theme.spacing.xs,
    },
    logo: {
        width: 32,
        height: 32,
    },

});