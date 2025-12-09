import { zod } from "@/lib/zod";

const username = zod.string().email().openapi({
    description: "The user email (We use username here because of OAuth spec)",
    example: "mslimbeji@gmail.com",
});

const accessToken = zod.string().openapi({
    description:
        "A generated web token. The 'Bearer ' prefix needs to be added for authentication",
    example:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM",
});

const tokenType = zod.literal("bearer").openapi({
    description: "The type of token. Only 'bearer' is supported.",
    example: "bearer",
});

const expiresIn = zod.number().openapi({
    description: "The UNIX timestamp the token expires at",
    example: 1751879562,
});

export const AuthFields = { username, accessToken, tokenType, expiresIn };
