import {
  describe,
  expect,
  beforeAll,
  beforeEach,
  it,
  afterEach,
  afterAll,
} from "vitest";
import request from "supertest";
import app from "../../src/api/app";
import { RateLimit } from "../../src/api/rate-limit";
import { PrismaClient } from '@prisma/client';
import { createTestUserWithPermissions, TestUser } from '../utils/helpers';

const prisma = new PrismaClient();

describe("Rate Limiter Middleware", () => {
  let adminUser: TestUser;
  const rateLimitConfig = RateLimit.config;

  /**
   * The generic rate limit middleware is applied to all routes by default.
   */
  const genericRoutes = ["/users"];

  // Set up test data
  beforeAll(async () => {
    // Create user with MANAGE_USERS permission for testing
    adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);
  });

  genericRoutes.forEach((route) => {
    describe(`Rate Limiter for ${route}`, () => {
      let initialResponses: any[];

      beforeAll(async () => {
        // Running the requests in parallel to speed up the test.
        initialResponses = await Promise.all(
          Array.from({ length: rateLimitConfig.max }, () =>
            request(app)
              .get(route)
              .set("Authorization", `Bearer ${adminUser.token}`),
          ),
        );
      });

      it("should successfully fulfill requests up to the max limit", () => {
        initialResponses.forEach((res) => expect(res.status).toBe(200));
      });

      it("should block the next request", async () => {
        const res = await request(app)
          .get(route)
          .set("Authorization", `Bearer ${adminUser.token}`);
        expect(res.status).toBe(429);
      });

      it("should contain the rate limit headers", async () => {
        const res = await request(app)
          .get(route)
          .set("Authorization", `Bearer ${adminUser.token}`);
        expect(res.headers["x-ratelimit-limit"]).toBe(
          rateLimitConfig.max.toString(),
        );
        expect(res.headers["x-ratelimit-remaining"]).toBe("0");
      });

      it("should contain a valid reset header", async () => {
        const res = await request(app)
          .get(route)
          .set("Authorization", `Bearer ${adminUser.token}`);
        const resetTime =
          parseInt(res.headers["x-ratelimit-reset"] ?? "0") * 1000;
        const now = Date.now();

        expect(resetTime).toBeGreaterThan(now);
        expect(resetTime).toBeLessThanOrEqual(now + rateLimitConfig.windowMs);
      });
    });
  });
});