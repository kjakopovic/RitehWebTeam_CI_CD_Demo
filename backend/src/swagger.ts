import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Projects API",
      version: "1.0.0",
      description: "A simple Express API for managing projects",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
  },
  apis: ["./src/**/*.ts", "./services/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
