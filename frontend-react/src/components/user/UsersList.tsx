import type { User } from "@/types";

import UserItem from "./UserItem";
import styles from "./UsersList.module.css";

interface UserListProps {
    items: User[];
}

const UsersList: React.FC<UserListProps> = ({ items }) => {
    if (items.length === 0) {
        return (
            <div className={styles["no-users"]}>
                <div className="card">
                    <h2>No Users found!</h2>
                </div>
            </div>
        );
    }
    return (
        <ul className={styles["users-list"]}>
            {items.map((item: User) => {
                return <UserItem key={item.id} user={item} />;
            })}
        </ul>
    );
};

export default UsersList;
