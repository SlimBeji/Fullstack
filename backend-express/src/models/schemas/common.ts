import { zod } from "@/lib/zod_";

export const createdAt = zod.date().openapi({
    description: "creation datetime",
    example: "2024-01-12T10:15:30.000Z",
});

export const updatedAt = zod.date().openapi({
    description: "last update datetime",
    example: "2024-01-12T10:15:30.000Z",
});
