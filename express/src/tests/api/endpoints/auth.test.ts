import supertest from "supertest";
import app from "../../../api";
import { getImagePath } from "../../../lib/utils";
import { dropMemoryDb, prepareMemoryDb } from "../../helpers";

const request = supertest(app);

beforeAll(async () => {
    await prepareMemoryDb();
});

afterAll(async () => {
    await dropMemoryDb();
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
        expect(response.body).toHaveProperty("token");
    });
});

describe("POST /api/auth/signin", () => {
    it("responds with json", async () => {
        const data = {
            email: "mslimbeji@gmail.com",
            password: "very_secret",
        };
        const response = await request
            .post("/api/auth/signin")
            .send(data)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("email", "mslimbeji@gmail.com");
        expect(response.body).toHaveProperty("userId");
        expect(response.body).toHaveProperty("token");
    });
});
