<script setup lang="ts">
import { RouterView } from "vue-router";

import { MainNavigation } from "./components/navigation";
</script>

<template>
    <MainNavigation />
    <main>
        <RouterView />
    </main>
</template>
