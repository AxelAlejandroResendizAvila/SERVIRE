import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useBadge } from '../context/BadgeContext';

import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import OlvideContrasenya from '../screens/OlvideContrasenya';
import VerificarCodigo from '../screens/VerificarCodigo';
import CambiarContrasenya from '../screens/CambiarContrasenya';
import InicioAPP from '../screens/InicioAPP';
import ExplorarEspacios from '../screens/ExplorarEspacios';
import MisReservas from '../screens/MisReservas';
import Cuenta from '../screens/Cuenta';
import DetallesReserva from '../screens/DetallesReserva';
import FormularioReservas from '../screens/FormularioReservas';
import EditarReserva from '../screens/EditarReserva';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    const { hasChangedReservations, checkReservationChanges, clearBadge } = useBadge();

    // Verificar si hay reservas con cambios
    useEffect(() => {
        checkReservationChanges();
        
        // Revisar cada 1 segundo
        const interval = setInterval(checkReservationChanges, 1000);
        return () => clearInterval(interval);
    }, [checkReservationChanges]);

    const BadgeIcon = ({ name, focused, size, color, showBadge }) => (
        <View style={{ position: 'relative' }}>
            <Ionicons name={name} size={size} color={color} />
            {showBadge && (
                <View
                    style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#FF4444',
                        borderWidth: 2,
                        borderColor: '#fff',
                    }}
                />
            )}
        </View>
    );

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    let showBadge = false;

                    if (route.name === 'Inicio') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Explorar') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'Reservas') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                        showBadge = hasChangedReservations;
                    } else if (route.name === 'Cuenta') {
                        iconName = focused ? 'person' : 'person-outline';
                    }
                    
                    return <BadgeIcon name={iconName} focused={focused} size={size} color={color} showBadge={showBadge} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.text.secondary,
                headerShown: false,
            })}
        >
            <Tab.Screen name="Inicio" component={InicioAPP} />
            <Tab.Screen name="Explorar" component={ExplorarEspacios} />
            <Tab.Screen 
                name="Reservas" 
                component={MisReservas}
                listeners={({ navigation }) => ({
                    tabPress: () => {
                        clearBadge();
                    },
                })}
            />
            <Tab.Screen name="Cuenta" component={Cuenta} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registro" component={RegistroScreen} />
            <Stack.Screen name="OlvideContrasenya" component={OlvideContrasenya} />
            <Stack.Screen name="VerificarCodigo" component={VerificarCodigo} />
            <Stack.Screen name="CambiarContrasenya" component={CambiarContrasenya} />
            <Stack.Screen 
                name="MainTabs" 
                component={MainTabs}
                options={{ animationEnabled: false }}
            />
            <Stack.Screen name="FormularioReservas" component={FormularioReservas} />
            <Stack.Screen name="EditarReserva" component={EditarReserva} />
            <Stack.Screen name="DetallesReserva" component={DetallesReserva} />
        </Stack.Navigator>
    );
}
