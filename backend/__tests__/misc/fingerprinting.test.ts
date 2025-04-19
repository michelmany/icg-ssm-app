import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../../src/api/app";

/**
 * Although not a huge deal and not 100% possible to avoid fingerprinting,
 * this file ensures that we at least make it a little harder for it to happen.
 *
 * The tests here are skipped for now and will be implemented later.
 */

// TODO: Add tests for multiple routes.
describe("GET /", () => {
  test.skip("check x-powered-by header does not exist", async () => {
    const response = await request(app).get("/");

    expect(response.header).not.toHaveProperty("x-powered-by");
  });
});

// Express 404 pages are fingerprintable, so we need to ensure that we don't have the default 404 page.
describe("GET /nonexistent123", () => {
  test.skip("responds with 404", async () => {
    const response = await request(app).get("/nonexistent123");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Not Found." });
  });
});
