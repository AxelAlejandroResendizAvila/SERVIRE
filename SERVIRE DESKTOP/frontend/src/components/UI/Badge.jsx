import React from 'react';

const badgeColors = {
    disponible: 'bg-green-100 text-success border-green-200',
    ocupado: 'bg-orange-100 text-warning border-orange-200',
    pending: 'bg-blue-100 text-blue-700 border-blue-200',
    approved: 'bg-green-100 text-success border-green-200',
    waitlisted: 'bg-orange-100 text-warning border-orange-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
    completed: 'bg-gray-100 text-gray-600 border-gray-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
};

const Badge = ({ status, label }) => {
    const colorClass = badgeColors[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
            {label || status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

export default Badge;
