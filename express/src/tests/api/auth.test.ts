import request from "supertest";
import { memoryDb } from "../memoryDb";
import app from "../../api";

beforeAll(async () => {
    await memoryDb.session();
});

afterAll(async () => {
    await memoryDb.destroy();
});

describe("POST /api/auth/signup", () => {
    it("responds with json", async () => {
        const data = {
            name: "Didier Drogba",
            email: "new_user@gmail.com",
            password: "very_secret",
        };
        const response = await request(app)
            .post("/api/auth/signup")
            .send(data)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("email", "new_user@gmail.com");
        expect(response.body).toHaveProperty("userId");
        expect(response.body).toHaveProperty("token");
    });
});

describe("POST /api/auth/signin", () => {
    it("responds with json", async () => {
        const data = {
            email: "mslimbeji@gmail.com",
            password: "very_secret",
        };
        const response = await request(app)
            .post("/api/auth/signin")
            .send(data)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("email", "mslimbeji@gmail.com");
        expect(response.body).toHaveProperty("userId");
        expect(response.body).toHaveProperty("token");
    });
});
