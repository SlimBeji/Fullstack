import clsx from "clsx";
import React from "react";

import styles from "./LoadingSpinner.module.css";

interface LoadingSpinner {
    asOverlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinner> = ({ asOverlay }) => {
    return (
        <div
            className={clsx([
                styles["spinner-container"],
                { [styles["overlay"]]: asOverlay },
            ])}
        >
            <div></div>
        </div>
    );
};

export default LoadingSpinner;
