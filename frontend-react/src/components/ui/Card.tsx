import React from "react";

interface CardProps {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

const Card: React.FC<CardProps> = (props) => {
    const cardStyle =
        "relative m-0 shadow-md rounded-lg overflow-hidden p-4 bg-white";
    return (
        <div className={cardStyle} style={props.style}>
            {props.children}
        </div>
    );
};

export default Card;
