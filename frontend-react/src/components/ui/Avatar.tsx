import styles from "./Avatar.module.css";

interface AvatarProps {
    imageUrl: string;
    alt: string;
}

const Avatar: React.FC<AvatarProps> = (props) => {
    return (
        <div className={styles["avatar-container"]}>
            <img src={props.imageUrl} alt={props.alt} />
        </div>
    );
};

export default Avatar;
