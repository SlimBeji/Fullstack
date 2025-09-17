<template>
    <header>
        <div class="wrapper">
            <nav>
                <RouterLink to="/auth">Auth</RouterLink>
                <RouterLink to="/">Users</RouterLink>
                <RouterLink to="/places/new">New Place</RouterLink>
                <RouterLink to="/places/p123">Edit Place</RouterLink>
                <RouterLink to="/u123/places">User Places</RouterLink>
            </nav>
        </div>
    </header>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>
