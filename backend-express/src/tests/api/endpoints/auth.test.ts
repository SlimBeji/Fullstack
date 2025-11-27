import supertest from "supertest";

import app from "@/api";
import { closeAll, seedTestData } from "@/lib/setup";
import { getImagePath } from "@/lib/utils";

const request = supertest(app);

beforeAll(async () => {
    await seedTestData();
});

afterAll(async () => {
    await closeAll();
});

describe("POST /api/auth/signup", () => {
    it("responds with json", async () => {
        const response = await request
            .post("/api/auth/signup")
            .field("name", "Didier Drogba")
            .field("email", "new_user@gmail.com")
            .field("password", "very_secret")
            .attach("image", getImagePath("avatar1.jpg"))
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("email", "new_user@gmail.com");
        expect(response.body).toHaveProperty("userId");
        expect(response.body).toHaveProperty("access_token");
    });
});

describe("POST /api/auth/signin", () => {
    it("responds with json", async () => {
        const response = await request
            .post("/api/auth/signin")
            .set("Content-Type", "application/x-www-form-urlencoded")
            .send("username=mslimbeji@gmail.com&password=very_secret")
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("email", "mslimbeji@gmail.com");
        expect(response.body).toHaveProperty("userId");
        expect(response.body).toHaveProperty("access_token");
    });
});
