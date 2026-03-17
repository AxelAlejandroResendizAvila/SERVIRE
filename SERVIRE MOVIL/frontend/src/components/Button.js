import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

export default function Button({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    disabled
}) {
    const getBackgroundColor = () => {
        if (disabled) return theme.colors.border;
        if (variant === 'primary') return theme.colors.primary;
        if (variant === 'danger') return theme.colors.danger;
        if (variant === 'outline') return 'transparent';
        return theme.colors.primary;
    };

    const getTextColor = () => {
        if (disabled) return theme.colors.text.secondary;
        if (variant === 'outline') return theme.colors.primary;
        return theme.colors.text.inverse;
    };

    const getBorderColor = () => {
        if (variant === 'outline') return theme.colors.primary;
        if (variant === 'dangerOutline') return theme.colors.danger;
        return 'transparent';
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: variant === 'dangerOutline' ? 'transparent' : getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant.includes('outline') || variant === 'dangerOutline' ? 1 : 0,
                },
                style,
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            <Text style={[
                styles.text,
                { color: variant === 'dangerOutline' ? theme.colors.danger : getTextColor() },
                textStyle
            ]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        fontSize: theme.typography.button.fontSize,
        fontWeight: theme.typography.button.fontWeight,
    },
});
