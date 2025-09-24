<script lang="ts">
    import { authStore } from "./store";
    import type { SigninResponse } from "./types";

    const userId = authStore.userId;
    const login = () => {
        const resp: SigninResponse = {
            access_token: "token",
            token_type: "bearer",
            userId: "u123",
            email: "mslimbeji@gmail.com",
            expires_in: 123333,
        };
        authStore.login(resp);
    };
    const logout = () => {
        authStore.logout();
    };
</script>

<main>
    <p>
        Welcome User {$userId}
    </p>
    <button onclick={login}>Login</button>
    <button onclick={logout}>Logout</button>
</main>
