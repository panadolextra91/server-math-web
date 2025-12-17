import swaggerJSDoc from "swagger-jsdoc";

export function buildOpenApiSpec() {
  return swaggerJSDoc({
    definition: {
      openapi: "3.0.3",
      info: {
        title: "Math Learning Game API",
        version: "0.1.0",
        description: "Node.js + Express + MySQL backend for a math learning game.",
      },
      servers: [{ url: "/api" }],
    },
    apis: ["./src/docs/openapi.ts"],
  });
}


