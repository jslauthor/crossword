import crypto from 'crypto';

class TokenGenerator {
  private static readonly TOKEN_LENGTH = 256;

  static generateBearerToken(): string {
    // Generate a random token
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');

    // Hash the token for storage
    const hashedToken = this.hashToken(token);

    return hashedToken;
  }

  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

console.log(TokenGenerator.generateBearerToken());
