import { Link } from "react-router-dom";

import { Avatar, Card } from "../../components/ui";
import placeholder from "../../static/avatar_placeholder.jpg";
import { User } from "../../types";

interface UserItemProps {
    user: User;
}

const UserItem: React.FC<UserItemProps> = ({ user }) => {
    return (
        <li className="user-item">
            <Card className="user-item-card">
                <Link to={`/${user.id}/places`} className="user-item-link">
                    <div className="user-avatar">
                        <Avatar
                            imageUrl={user.imageUrl || placeholder}
                            alt={user.name}
                        />
                    </div>
                    <div className="user-info">
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
