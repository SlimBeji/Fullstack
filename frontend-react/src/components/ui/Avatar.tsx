interface AvatarProps {
    imageUrl: string;
    alt: string;
}

const Avatar: React.FC<AvatarProps> = (props) => {
    return (
        <div className="avatar-container">
            <img src={props.imageUrl} alt={props.alt} />
        </div>
    );
};

export default Avatar;
