export const SPACES_MOCK_DATA = [
    { id: 1, name: 'Laboratorio de Cómputo 1', capacity: 30, type: 'Tics', state: 'disponible', waitlistCount: 0 },
    { id: 2, name: 'Laboratorio de Redes', capacity: 25, type: 'Tics', state: 'ocupado', waitlistCount: 3 },
    { id: 3, name: 'Auditorio Principal', capacity: 150, type: 'Auditorio', state: 'disponible', waitlistCount: 0 },
    { id: 4, name: 'Sala de Juntas A', capacity: 12, type: 'Salas', state: 'ocupado', waitlistCount: 1 },
    { id: 5, name: 'Laboratorio de Química', capacity: 20, type: 'Laboratorio', state: 'disponible', waitlistCount: 0 },
    { id: 6, name: 'Sala de Lectura Silenciosa', capacity: 40, type: 'Biblioteca', state: 'disponible', waitlistCount: 0 },
    { id: 7, name: 'Cubículo de Estudio 1', capacity: 4, type: 'Biblioteca', state: 'ocupado', waitlistCount: 5 },
    { id: 8, name: 'Laboratorio de Física', capacity: 25, type: 'Laboratorio', state: 'disponible', waitlistCount: 0 },
    { id: 9, name: 'Auditorio B', capacity: 80, type: 'Auditorio', state: 'ocupado', waitlistCount: 2 },
    { id: 10, name: 'Sala de Tesis', capacity: 8, type: 'Salas', state: 'disponible', waitlistCount: 0 },
];

export const MY_RESERVATIONS_MOCK = [
    { id: 101, spaceId: 3, date: '2023-10-15', time: '10:00 - 12:00', status: 'approved' },
    { id: 102, spaceId: 2, date: '2023-10-16', time: '14:00 - 16:00', status: 'waitlisted', waitlistPosition: 2, waitlistTotal: 3 },
];

export const ADMIN_REQUESTS_MOCK = [
    { id: 201, requester: 'Dr. López', space: 'Auditorio Principal', time: '10:00 - 12:00', status: 'pending' },
    { id: 202, requester: 'Mtra. García', space: 'Laboratorio de Cómputo 1', time: '14:00 - 16:00', status: 'pending' },
    { id: 203, requester: 'Ing. Fernández', space: 'Sala de Juntas A', time: '08:00 - 10:00', status: 'approved' },
];
