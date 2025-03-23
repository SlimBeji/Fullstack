import React from "react";
import "./LoadingSpinner.css";

interface LoadingSpinner {
    asOverlay: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinner> = ({ asOverlay }) => {
    return (
        <div className={`${asOverlay && "loading-spinner__overlay"}`}>
            <div className="lds-dual-ring"></div>
        </div>
    );
};

export default LoadingSpinner;
