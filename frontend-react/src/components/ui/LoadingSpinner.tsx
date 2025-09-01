import React from "react";

interface LoadingSpinner {
    asOverlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinner> = ({ asOverlay }) => {
    return (
        <div
            className={
                asOverlay
                    ? "absolute inset-0 bg-white/90 flex justify-center items-center"
                    : ""
            }
        >
            <div className="w-12 h-12 border-4 border-[#510077] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
};

export default LoadingSpinner;
