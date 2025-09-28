import clsx from "clsx";
import React from "react";

interface LoadingSpinner {
    asOverlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinner> = ({ asOverlay }) => {
    return (
        <div className={clsx(["spinner-container", { overlay: asOverlay }])}>
            <div></div>
        </div>
    );
};

export default LoadingSpinner;
