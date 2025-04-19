import rateLimit from 'express-rate-limit'
import {Request, Response, NextFunction} from 'express';

/**
 * General rate limiting middleware.
 *
 * The 2000 requests per 15 minutes per IP limit should be a very lax limit and enough to not affect normal users.
 * A more strict rate limiting will be applied to more sensitive routes.
 *
 * This can be further improved by adjusting the limit depending on the user's role, like giving a lower limit
 * to unauthenticated users and a higher limit to roles that we can consider as more trustworthy,
 * such as "admin", "teacher", etc.
 */
export namespace RateLimit {
    export const config = {
        windowMs: 15 * 60 * 1000, // 15 minutes.
        max: 2000, // Limit each IP to 2000 requests per 15 minutes, hence 2.22 requests per second.
        message: 'Too many requests from this IP, please try again after 15 minutes',
        standardHeaders: 'draft-8',
    };
    
    export const middleware = rateLimit(config);
}
