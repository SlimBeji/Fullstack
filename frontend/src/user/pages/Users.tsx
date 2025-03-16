import UsersList from "../components/UsersList";

import { User } from "../../shared/types";

const USERS: User[] = [
    {
        id: 1,
        name: "Slim",
        imageUrl:
            "https://img.delicious.com.au/DGZCHR1s/del/2018/12/paris-france-97370-2.jpg",
        placesCount: 3,
    },
];

const Users: React.FC = () => {
    return <UsersList items={USERS} />;
};

export default Users;
