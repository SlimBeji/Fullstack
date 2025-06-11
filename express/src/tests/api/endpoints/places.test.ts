import supertest from "supertest";
import { memoryDb } from "../../memoryDb";
import app from "../../../api";
import { crudPlace, crudUser } from "../../../models/crud";
import { getImagePath } from "../../../lib/utils";
import { PlaceRead } from "../../../models/schemas";
import { HttpStatus } from "../../../types";

let adminToken: string = "";
let token: string = "";
let example: PlaceRead;
const request = supertest(app);

beforeAll(async () => {
    await memoryDb.session();
    adminToken = await crudUser.getBearer("mslimbeji@gmail.com");
    token = await crudUser.getBearer("beji.slim@yahoo.fr");
    const examples = await crudPlace.fetch({
        filters: { title: { $eq: "Stamford Bridge" } },
    });
    example = examples.data[0]!;
});

afterAll(async () => {
    token = "";
    adminToken = "";
    await memoryDb.destroy();
});

describe("GET /api/places", () => {
    it("Fetches Places", async () => {
        const response = await request
            .get(`/api/places?title=eq:Stamford%20Bridge`)
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("page", 1);
        expect(response.body).toHaveProperty("totalPages");
        expect(response.body).toHaveProperty("totalCount", 1);
        expect(response.body).toHaveProperty("data");
    });
});

describe("POST /api/places", () => {
    it("Create Places", async () => {
        const user = (await crudUser.getByEmail("mslimbeji@gmail.com"))!;
        const response = await request
            .post("/api/places")
            .field("creatorId", user.id.toString())
            .field("description", "A brand new place")
            .field("title", "Brand New Place")
            .field("address", "Somewhere over the rainbow")
            .attach("image", getImagePath("place1.jpg"))
            .set("Authorization", adminToken)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("creatorId", user.id.toString());
        expect(response.body).toHaveProperty(
            "description",
            "A brand new place"
        );
        expect(response.body).toHaveProperty("title", "Brand New Place");
        expect(response.body).toHaveProperty(
            "address",
            "Somewhere over the rainbow"
        );
    });

    it("Someone cannot post on others behalf", async () => {
        const user = (await crudUser.getByEmail("mslimbeji@gmail.com"))!;
        const response = await request
            .post("/api/places")
            .field("creatorId", user.id.toString())
            .field("description", "A brand new place")
            .field("title", "Brand New Place")
            .field("address", "Somewhere over the rainbow")
            .attach("image", getImagePath("place1.jpg"))
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(HttpStatus.UNAUTHORIZED);
    });
});

describe("GET /api/places/id", () => {
    it("Fetch a place byd Id", async () => {
        const response = await request
            .get(`/api/places/${example.id}`)
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("address", "Fulham Road, London");
        expect(response.body).toHaveProperty("title", "Stamford Bridge");
        expect(response.body).toHaveProperty(
            "description",
            "Chelsea FC Stadium"
        );
    });
});

describe("PUT /api/places/id", () => {
    it("Update Users", async () => {
        const data = { description: "Stamford Bridge - Home of the Blues" };
        const response = await request
            .put(`/api/places/${example.id}`)
            .send(data)
            .set("Authorization", adminToken)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("address", "Fulham Road, London");
        expect(response.body).toHaveProperty("title", "Stamford Bridge");
        expect(response.body).toHaveProperty(
            "description",
            "Stamford Bridge - Home of the Blues"
        );
    });

    it("User cannot update othe rplaces", async () => {
        const data = { description: "Stamford Bridge - Home of the Blues" };
        const response = await request
            .put(`/api/places/${example.id}`)
            .send(data)
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(HttpStatus.UNAUTHORIZED);
    });
});

describe("DELETE /api/places/id", () => {
    it("A user cannot delete someone else place", async () => {
        const response = await request
            .delete(`/api/places/${example.id}`)
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it("DELETE a place", async () => {
        const response = await request
            .delete(`/api/places/${example.id}`)
            .set("Authorization", adminToken)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty(
            "message",
            `Deleted place ${example.id}`
        );
    });
});
