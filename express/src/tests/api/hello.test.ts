import supertest from "supertest";
import { memoryDb } from "../memoryDb";
import app from "../../api";
const request = supertest(app);

beforeAll(async () => {
    await memoryDb.session();
});

afterAll(async () => {
    await memoryDb.destroy();
});

describe("GET /api/hello-world/", () => {
    it("responds with json", async () => {
        const response = await request
            .get("/api/hello-world/")
            .expect("Content-Type", /json/)
            .expect(200);

        expect(response.body).toEqual({ message: "Hello World!" });
    });
});
