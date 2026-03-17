import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-button';

    const variants = {
        primary: 'bg-primary text-white hover:bg-[#158076] focus:ring-primary',
        secondary: 'bg-secondary text-white hover:bg-[#09152b] focus:ring-secondary',
        danger: 'bg-danger text-white hover:bg-[#b71c1c] focus:ring-danger',
        success: 'bg-success text-white hover:bg-[#388e3c] focus:ring-success',
        warning: 'bg-warning text-white hover:bg-[#f57c00] focus:ring-warning',
        outline: 'border border-border bg-transparent text-text-primary hover:bg-gray-50 focus:ring-gray-200',
        ghost: 'bg-transparent text-text-primary hover:bg-surface focus:ring-gray-200',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
