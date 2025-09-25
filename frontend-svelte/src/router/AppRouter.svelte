<script lang="ts">
import type { RouteConfig, RouteResult } from "@mateothegreat/svelte5-router";
import { goto, Router, StatusCode } from "@mateothegreat/svelte5-router";

import { Auth, NewPlace, UpdatePlace, UserPlaces, Users } from "@/pages";
import { authStore } from "@/store";

const isLoggedIn = authStore.isLoggedIn;

const routes: RouteConfig[] = [
    {
        path: "/auth",
        component: Auth,
    },
    {
        path: "/",
        component: Users,
    },
    {
        path: "/places/new",
        component: NewPlace,
    },
    {
        path: "/places/(?<placeId>[a-z0-9]*)",
        component: UpdatePlace,
    },
    {
        path: "/(?<userId>[a-z0-9]*)/places",
        component: UserPlaces,
    },
];

const authGuard = async (route: RouteResult): Promise<boolean> => {
    const path = route.route?.path;
    if (!$isLoggedIn && path !== "/auth") {
        goto("/auth");
        return false;
    }
    return true;
};

const hooks = { pre: authGuard };

const statuses = {
    [StatusCode.NotFound]: (route: RouteResult) => {
        console.warn(
            `Route "${route.result.path.original}" could not be found`
        );
        goto("/");
        return {
            component: Users,
        };
    },
};
</script>

<Router {routes} {hooks} {statuses} />
