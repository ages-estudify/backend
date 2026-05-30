/**
 * Jest sets NODE_ENV=test, so AppModule ignores .env (see app.module.ts).
 * Provide minimal config so the app boots without real AWS credentials.
 */
process.env.AWS_REGION ??= 'us-east-1';
process.env.AWS_S3_BUCKET ??= 'e2e-test-bucket';
process.env.JWT_SECRET ??= 'e2e-test-jwt-secret';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/backend?schema=public';
