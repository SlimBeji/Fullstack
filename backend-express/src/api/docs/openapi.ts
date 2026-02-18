import {
    OpenApiGeneratorV3,
    OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { Application } from "express";
import swaggerUi from "swagger-ui-express";

import { env } from "@/config";

const swaggerRegistery = new OpenAPIRegistry();

const registerSwaggger = (app: Application, path: string): void => {
    swaggerRegistery.registerComponent("securitySchemes", "OAuth2Password", {
        type: "oauth2",
        flows: {
            password: {
                tokenUrl: `${env.API_URL}/auth/signin`,
                scopes: {},
            },
        },
        description: "Login with username/password to get a JWT",
    });
    const generator = new OpenApiGeneratorV3(swaggerRegistery.definitions);
    const openApiDocument = generator.generateDocument({
        openapi: "3.0.0",
        info: {
            title: "My Express Zod API",
            version: "1.0.0",
            description:
                "API documentation for my Express application using Zod and Swagger UI",
        },
        servers: [
            {
                url: env.API_URL,
                description: "Swagger documentation",
            },
        ],
        tags: [
            {
                name: "Auth",
                description: "Registration and Authentication endpoints",
            },
            {
                name: "Hello World",
                description: "Hello World endpoints",
            },
            {
                name: "User",
                description: "User cruds endpoints",
            },
            {
                name: "Place",
                description: "Place cruds endpoints",
            },
        ],
    });
    app.use(path, swaggerUi.serve, swaggerUi.setup(openApiDocument));
};

export { registerSwaggger, swaggerRegistery };
