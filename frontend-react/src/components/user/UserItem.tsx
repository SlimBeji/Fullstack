import { Link } from "react-router-dom";

import placeholder from "../../assets/avatar_placeholder.jpg";
import { Avatar } from "../../components/ui";
import { User } from "../../types";

interface UserItemProps {
    user: User;
}

const UserItem: React.FC<UserItemProps> = ({ user }) => {
    const number = user.places.length;
    let placeNumber = `${number} Place`;
    if (number > 1) {
        placeNumber = `${number} Places`;
    }

    return (
        <li className="user-item">
            <div className="card">
                <Link to={`/${user.id}/places`} className="user-item-link">
                    <div className="user-avatar">
                        <Avatar
                            imageUrl={user.imageUrl || placeholder}
                            alt={user.name}
                        />
                    </div>
                    <div className="user-info">
                        <h2>{user.name}</h2>
                        <h3>{placeNumber}</h3>
                    </div>
                </Link>
            </div>
        </li>
    );
};

export default UserItem;
