import React from 'react';

const Card = ({ children, className = '', hover = true, ...props }) => {
    return (
        <div
            className={`bg-white rounded-card shadow-sm border border-border ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
