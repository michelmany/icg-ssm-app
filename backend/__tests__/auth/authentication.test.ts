import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../../src/api/app";

describe("GET /", () => {
  test("responds with unauthorized", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(401);
  });

  // TODO: Add tests for authorized requests once JWT authentication is implemented.
});
