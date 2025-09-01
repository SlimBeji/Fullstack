import React from "react";

interface CardProps {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

const Card: React.FC<CardProps> = (props) => {
    return (
        <div
            className={`relative m-0 shadow-lg hover:translate-x-1 hover:shadow-xl transition-all duration-300 rounded-lg overflow-hidden bg-white ${props.className}`}
            style={props.style}
        >
            {props.children}
        </div>
    );
};

export default Card;
