/**
 * Returns a user-friendly error message for AI service HTTP status codes.
 */
export function getAIErrorMessage(status: number): string {
  switch (status) {
    case 503:
      return "AI service is being configured. Try again shortly or contact your administrator.";
    case 429:
      return "You've been using PRAXIS heavily! Please wait a moment before your next analysis.";
    case 500:
      return "Something went wrong with the analysis. Please try again.";
    default:
      return "An unexpected error occurred.";
  }
}
