import { Card } from "../../components/ui";
import { User } from "../../types";
import UserItem from "./UserItem";

interface UserListProps {
    items: User[];
}

const UsersList: React.FC<UserListProps> = ({ items }) => {
    if (items.length === 0) {
        return (
            <div className="flex justify-center items-center">
                <Card>
                    <h2 className="text-xl font-semibold text-gray-700">
                        No Users found!
                    </h2>
                </Card>
            </div>
        );
    }
    return (
        <ul className="w-[90%] max-w-4xl mx-auto flex justify-center flex-wrap gap-6">
            {items.map((item: User) => {
                return <UserItem key={item.id} user={item} />;
            })}
        </ul>
    );
};

export default UsersList;
