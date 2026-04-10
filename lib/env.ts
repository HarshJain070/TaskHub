// Helper to validate environment variables
export function validateEnv() {
  const requiredEnvVars = ["POSTGRES_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET"]

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`)
  }
}

