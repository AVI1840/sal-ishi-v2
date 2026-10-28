import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

/**
 * Honest stub for routes wired into API Gateway but not yet built.
 * PROMPT_SONNET5_PRODUCTION.md constraint: "no fake numbers in the
 * production app" — this extends to no fake success responses either.
 * See infra/README.md for which sprint owns each of these routes.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  return {
    statusCode: 501,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      error: "not_implemented",
      route: `${event.requestContext.http.method} ${event.requestContext.http.path}`,
      message: "This route is wired but the handler has not been built yet. See infra/README.md.",
    }),
  };
};
