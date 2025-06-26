import { Link } from "react-router-dom";

import "./UserItem.css";

import { User } from "../../types";

import { Avatar, Card } from "../../components/ui";
import placeholder from "../../static/avatar_placeholder.jpg";

interface UserItemProps {
    user: User;
}

const UserItem: React.FC<UserItemProps> = ({ user }) => {
    return (
        <li className="user-item">
            <Card className="user-item__content">
                <Link to={`/${user.id}/places`}>
                    <div className="user-item__image">
                        <Avatar
                            imageUrl={user.imageUrl || placeholder}
                            alt={user.name}
                        />
                    </div>
                    <div className="user-item__info">
                        <h2>{user.name}</h2>
                        <h3>
                            {user.places.length}{" "}
                            {user.places.length === 1 ? "Place" : "Places"}
                        </h3>
                    </div>
                </Link>
            </Card>
        </li>
    );
};

export default UserItem;
