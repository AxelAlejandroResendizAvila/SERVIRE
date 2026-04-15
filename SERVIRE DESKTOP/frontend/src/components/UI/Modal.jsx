import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, children, actions }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="relative w-full max-w-2xl p-6 mx-auto my-6 z-50 max-h-[90vh] flex flex-col">
                <div className="relative flex flex-col w-full bg-white border-0 rounded-card shadow-xl outline-none focus:outline-none overflow-hidden">

                    <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-border shrink-0">
                        <h3 className="text-xl font-semibold text-secondary">
                            {title}
                        </h3>
                        <button
                            className="p-1 ml-auto bg-transparent border-0 text-gray-500 float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:text-gray-800 transition-colors"
                            onClick={onClose}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="relative p-6 flex-auto overflow-y-auto">
                        {children}
                    </div>

                    {actions && (
                        <div className="flex items-center justify-end p-5 border-t border-solid border-border rounded-b gap-3 shrink-0">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
