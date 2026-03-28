import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import InicioAPP from '../screens/InicioAPP';
import ExplorarEspacios from '../screens/ExplorarEspacios';
import MisReservas from '../screens/MisReservas';
import Cuenta from '../screens/Cuenta';
import DetallesReserva from '../screens/DetallesReserva';
import FormularioReservas from '../screens/FormularioReservas';
import EditarReserva from '../screens/EditarReserva';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const FeaturesStack = createNativeStackNavigator();

function FeaturesStackNavigator() {
    return (
        <FeaturesStack.Navigator screenOptions={{ headerShown: false }}>
            <FeaturesStack.Screen name="HomeTabs" component={MainTabs} />
            <FeaturesStack.Screen name="FormularioReservas" component={FormularioReservas} />
            <FeaturesStack.Screen name="EditarReserva" component={EditarReserva} />
            <FeaturesStack.Screen name="DetallesReserva" component={DetallesReserva} />
            <FeaturesStack.Screen name="MisReservas" component={MisReservas} />
        </FeaturesStack.Navigator>
    );
}

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Inicio') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Explorar') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'Reservas') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Cuenta') {
                        iconName = focused ? 'person' : 'person-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.text.secondary,
                headerShown: false,
            })}
        >
            <Tab.Screen name="Inicio" component={InicioAPP} />
            <Tab.Screen name="Explorar" component={ExplorarEspacios} />
            <Tab.Screen name="Reservas" component={MisReservas} />
            <Tab.Screen name="Cuenta" component={Cuenta} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registro" component={RegistroScreen} />
            <Stack.Screen name="MainTabs" component={FeaturesStackNavigator} />
        </Stack.Navigator>
    );
}
