import { Link } from "react-router-dom";

import { Avatar, Card } from "../../components/ui";
import placeholder from "../../static/avatar_placeholder.jpg";
import { User } from "../../types";

interface UserItemProps {
    user: User;
}

const UserItem: React.FC<UserItemProps> = ({ user }) => {
    return (
        <li className="m-4 w-[45%] min-w-[17.5rem]">
            <Card className="p-0 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow duration-300">
                <Link
                    to={`/${user.id}/places`}
                    className="flex items-center size-full p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                    <div className="w-16 h-16 mr-4">
                        <Avatar
                            imageUrl={user.imageUrl || placeholder}
                            alt={user.name}
                        />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            {user.name}
                        </h2>
                        <h3 className="text-sm text-gray-500">
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
