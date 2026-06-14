import "./UserItem.css";

import { Link } from "react-router-dom";

import { Avatar } from "@/components/ui";
import { userPlacesRoute } from "@/router";
import type { User } from "@/types";

const placeholder = "/public/avatar_placeholder.jpg";

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
                <Link to={userPlacesRoute(user.id)} className="user-item-link">
                    <div className="user-avatar">
                        <Avatar
                            imageUrl={user.image_url || placeholder}
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
