import L from "leaflet";

export function fixLeafletIcons() {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: new URL(
            "leaflet/dist/images/marker-icon-2x.png",
            import.meta.url
        ).toString(),
        iconUrl: new URL(
            "leaflet/dist/images/marker-icon.png",
            import.meta.url
        ).toString(),
        shadowUrl: new URL(
            "leaflet/dist/images/marker-shadow.png",
            import.meta.url
        ).toString(),
    });
}
