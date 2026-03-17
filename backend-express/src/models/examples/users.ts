import { getImagePath } from "@/static";

import { UserSeed } from "../schemas";

export const users: UserSeed[] = [
    {
        _ref: 1,
        name: "Slim Beji",
        email: "mslimbeji@gmail.com",
        password: "very_secret",
        image_url: getImagePath("avatar1.jpg"),
        is_admin: true,
    },
    {
        _ref: 2,
        name: "Mohamed Slim Beji",
        email: "beji.slim@yahoo.fr",
        password: "very_secret",
        image_url: getImagePath("avatar2.jpg"),
        is_admin: false,
    },
];
