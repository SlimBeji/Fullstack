import { zodDatetime } from "@/lib/zod_";

export const createdAt = zodDatetime.openapi({
    description: "creation datetime",
    example: "2024-01-12T10:15:30.000Z",
});

export const updatedAt = zodDatetime.openapi({
    description: "last update datetime",
    example: "2024-01-12T10:15:30.000Z",
});
