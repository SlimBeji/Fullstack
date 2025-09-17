<template>
    <div>
        <h1>This is the auth page</h1>
    </div>
</template>

<style lang="css">
@reference "../../main.css";

@layer components {
    .auth-form {
        @apply w-[90%] max-w-md mx-auto mt-10 p-6;
        @apply text-center shadow-lg rounded-xl bg-surface;
    }

    .auth-form > h2 {
        @apply text-2xl font-bold text-pen mb-2;
    }

    .auth-form > hr {
        @apply border-t-2 border-secondary w-[100%] mb-6;
    }

    .auth-form .buttons {
        @apply flex justify-center space-x-4;
    }

    .auth-form .button {
        @apply min-w-40;
    }
}
</style>
