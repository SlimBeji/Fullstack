import React from "react";

interface LoadingSpinner {
    asOverlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinner> = ({ asOverlay }) => {
    return (
        <div className={`spinner-container ${asOverlay ? "overlay" : ""}`}>
            <div></div>
        </div>
    );
};

export default LoadingSpinner;
