<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
const userId = route.params.userId as string;
</script>

<template>
    <div>
        <h1>This is the page for user {{ userId }} places</h1>
    </div>
</template>
