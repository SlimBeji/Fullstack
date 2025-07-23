import { UserSeed } from "../schemas";
import { getImagePath } from "../../lib/utils";

export const users: UserSeed[] = [
    {
        _ref: 1,
        name: "Slim Beji",
        email: "mslimbeji@gmail.com",
        password: "very_secret",
        imageUrl: getImagePath("avatar1.jpg"),
        isAdmin: true,
    },
    {
        _ref: 2,
        name: "Mohamed Slim Beji",
        email: "beji.slim@yahoo.fr",
        password: "very_secret",
        imageUrl: getImagePath("avatar2.jpg"),
        isAdmin: false,
    },
];
