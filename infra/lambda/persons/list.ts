import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { Person } from "../../../src/domain/schema";
import { getCallerCompanionId } from "../shared/audit";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/**
 * Caseload-scoped list. A companion can only ever see their own clients —
 * this is enforced here by querying the byCompanion GSI keyed off the
 * JWT's companionId claim, never a client-supplied filter. See
 * PROMPT_SONNET5_PRODUCTION.md Sprint 1 DoD: "Cross-caseload access = 403
 * (tested)" — a 403 test for this handler is required before Sprint 1
 * closes.
 */
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  let companionId: string;
  try {
    companionId = getCallerCompanionId(event);
  } catch {
    return { statusCode: 403, body: JSON.stringify({ error: "missing_companion_claim" }) };
  }

  const tenantId = process.env.TENANT_ID ?? "jerusalem";

  const result = await client.send(
    new QueryCommand({
      TableName: process.env.PERSONS_TABLE,
      IndexName: "byCompanion",
      KeyConditionExpression: "companionId = :cid",
      FilterExpression: "tenantId = :tid",
      ExpressionAttributeValues: { ":cid": companionId, ":tid": tenantId },
    })
  );

  const persons = (result.Items ?? []) as Person[];

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ persons }),
  };
};
