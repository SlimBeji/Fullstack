import "@/main.css";
import "leaflet/dist/leaflet.css";

import { mount } from "svelte";

import App from "@/App.svelte";

const app = mount(App, {
    target: document.getElementById("app")!,
});

export default app;
