import "./UsersList.css";

import { Card } from "../../components/ui";
import { User } from "../../types";
import UserItem from "./UserItem";

interface UserListProps {
    items: User[];
}

const UsersList: React.FC<UserListProps> = ({ items }) => {
    if (items.length === 0) {
        return (
            <div className="center">
                <Card>
                    <h2>No Users found!</h2>
                </Card>
            </div>
        );
    }
    return (
        <ul className="users-list">
            {items.map((item: User) => {
                return <UserItem key={item.id} user={item} />;
            })}
        </ul>
    );
};

export default UsersList;
