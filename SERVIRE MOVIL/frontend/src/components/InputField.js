import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

export default function InputField({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType = 'default',
    style,
    multiline = false,
    numberOfLines = 1,
    icon
}) {
    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                multiline && styles.multilineContainer
            ]}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    style={[styles.input, multiline && styles.multilineInput]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.text.secondary}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
        width: '100%',
    },
    label: {
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
    },
    multilineContainer: {
        alignItems: 'flex-start',
        paddingVertical: theme.spacing.sm,
    },
    input: {
        flex: 1,
        height: 48,
        color: theme.colors.text.primary,
        fontSize: theme.typography.body.fontSize,
    },
    multilineInput: {
        height: 'auto',
        textAlignVertical: 'top',
        minHeight: 100,
    },
    iconContainer: {
        marginRight: theme.spacing.sm,
    },
});
