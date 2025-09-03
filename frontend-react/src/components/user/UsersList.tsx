import { User } from "../../types";
import UserItem from "./UserItem";

interface UserListProps {
    items: User[];
}

const UsersList: React.FC<UserListProps> = ({ items }) => {
    if (items.length === 0) {
        return (
            <div className="no-users">
                <div className="card">
                    <h2>No Users found!</h2>
                </div>
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
