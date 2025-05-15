/**
 * @description Handles team registration commands and user enrollment processes
 * @author A. Rahman Syed
 * @github legendhimself
 * @version 1.0.0
 *
 * This file is part of the E-Cell Hackathon Discord bot.
 * For questions or issues, please contact the maintainers at:
 * https://github.com/E-Cell-MJCET
 */

// A simple in-memory rate limiter
export class RateLimiter {
  private readonly attempts: Map<string, number>;
  private readonly cooldown: number;

  constructor(cooldownMs: number) {
    this.attempts = new Map();
    this.cooldown = cooldownMs;
  }

  /**
   * Check if an action is allowed for a given key
   * @param key Unique identifier for the rate limit (e.g., user ID)
   * @returns Object containing whether the action is allowed and time remaining if not
   */
  checkRateLimit(key: string): { allowed: boolean; remainingTime: number } {
    const now = Date.now();
    const lastAttempt = this.attempts.get(key) ?? 0;
    const timeElapsed = now - lastAttempt;

    if (timeElapsed < this.cooldown) {
      return {
        allowed: false,
        remainingTime: this.cooldown - timeElapsed,
      };
    }

    this.attempts.set(key, now);
    return {
      allowed: true,
      remainingTime: 0,
    };
  }

  /**
   * Clear rate limit data for a given key
   * @param key Unique identifier to clear
   */
  clearRateLimit(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clearAllRateLimits(): void {
    this.attempts.clear();
  }
}
