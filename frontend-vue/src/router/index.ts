import { createRouter, createWebHistory } from "vue-router";
import { Auth, NewPlace, UpdatePlace, UserPlaces, Users } from "@/views";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/auth",
            name: "Auth",
            component: Auth,
        },
        {
            path: "/",
            name: "Users",
            component: Users,
        },
        {
            path: "/places/new",
            name: "NewPlace",
            component: NewPlace,
        },
        {
            path: "/places/:placeId",
            name: "UpdatePlace",
            component: UpdatePlace,
        },
        {
            path: "/:userId/places",
            name: "UserPlaces",
            component: UserPlaces,
        },
        {
            path: "/:pathMatch(.*)*",
            redirect: "/",
        },
    ],
});

export default router;
