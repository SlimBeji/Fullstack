interface AvatarProps {
    className?: string;
    imageUrl: string;
    alt: string;
}

const Avatar: React.FC<AvatarProps> = (props) => {
    const conatainerClasses = `${props.className || ""} flex justify-center items-center rounded-full overflow-hidden w-16 h-16`;
    const imgClasses = "w-full h-full object-cover";

    return (
        <div className={conatainerClasses}>
            <img src={props.imageUrl} alt={props.alt} className={imgClasses} />
        </div>
    );
};

export default Avatar;
