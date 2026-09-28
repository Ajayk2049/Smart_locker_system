import crypto from "crypto";
import mongoose from "mongoose";
import { RefreshToken } from "../models/RefreshToken.model.js";
import { config } from "../config.js";

export class TokenService {
  /**
   * Hashes a raw refresh token using SHA-256 for secure storage.
   */
  private static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Issues a new RefreshToken in the database and returns the unhashed raw token string.
   */
  public static async createRefreshToken(
    userId: string | mongoose.Types.ObjectId,
    family?: string
  ): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const tokenFamily = family || crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (config.refreshTokenExpiresDays || 7));

    await RefreshToken.create({
      userId: new mongoose.Types.ObjectId(userId.toString()),
      tokenHash,
      family: tokenFamily,
      isRevoked: false,
      expiresAt,
    });

    return rawToken;
  }

  /**
   * Rotates a refresh token: verifies the existing token, revokes it, and issues a new pair.
   * If reuse is detected, the entire token family is revoked immediately (security protection).
   */
  public static async rotateRefreshToken(
    rawToken: string
  ): Promise<{ userId: mongoose.Types.ObjectId; newRefreshToken: string } | null> {
    const tokenHash = this.hashToken(rawToken);
    const existing = await RefreshToken.findOne({ tokenHash });

    if (!existing) {
      return null;
    }

    // Reuse detection: if this token was already revoked, an attacker may have compromised it
    if (existing.isRevoked) {
      // Invalidate the entire family as a precaution
      await RefreshToken.updateMany({ family: existing.family }, { isRevoked: true });
      return null;
    }

    if (new Date() > existing.expiresAt) {
      return null;
    }

    // Mark current token as revoked
    existing.isRevoked = true;
    await existing.save();

    // Issue new token in the same family
    const newRefreshToken = await this.createRefreshToken(existing.userId, existing.family);

    return {
      userId: existing.userId,
      newRefreshToken,
    };
  }

  /**
   * Revokes a specific refresh token.
   */
  public static async revokeToken(rawToken: string): Promise<boolean> {
    const tokenHash = this.hashToken(rawToken);
    const result = await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
    return result.modifiedCount > 0;
  }

  /**
   * Revokes all refresh tokens belonging to a specific user (e.g., on logout all devices or password change).
   */
  public static async revokeAllUserTokens(userId: string | mongoose.Types.ObjectId): Promise<void> {
    await RefreshToken.updateMany(
      { userId: new mongoose.Types.ObjectId(userId.toString()) },
      { isRevoked: true }
    );
  }
}
