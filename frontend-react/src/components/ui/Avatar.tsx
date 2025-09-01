interface AvatarProps {
    className?: string;
    imageUrl: string;
    alt: string;
}

const Avatar: React.FC<AvatarProps> = (props) => {
    return (
        <div
            className={`flex justify-center items-center rounded-full overflow-hidden w-16 h-16 ${props.className || ""}`}
        >
            <img
                src={props.imageUrl}
                alt={props.alt}
                className="w-full h-full object-cover"
            />
        </div>
    );
};

export default Avatar;
