import request from "supertest";
import { memoryDb } from "../memoryDb";
import app from "../../api";

beforeAll(async () => {
    await memoryDb.session();
});

afterAll(async () => {
    await memoryDb.disconnect();
});

describe("GET /api/hello-world/", () => {
    it("responds with json", async () => {
        const response = await request(app)
            .get("/api/hello-world/")
            .expect("Content-Type", /json/)
            .expect(200);

        expect(response.body).toEqual({ message: "Hello World!" });
    });
});
