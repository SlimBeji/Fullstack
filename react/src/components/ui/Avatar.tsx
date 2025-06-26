import "./Avatar.css";

interface AvatarProps {
    className?: string;
    imageUrl: string;
    alt: string;
    width?: string;
    height?: string;
    style?: React.CSSProperties;
}

const Avatar: React.FC<AvatarProps> = (props) => {
    return (
        <div className={`avatar ${props.className}`} style={props.style}>
            <img
                src={props.imageUrl}
                alt={props.alt}
                style={{ width: props.width, height: props.width }}
            />
        </div>
    );
};

export default Avatar;
