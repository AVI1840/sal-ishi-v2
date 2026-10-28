import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import type { AuditAction, AuditLogEntry } from "../../../src/domain/schema";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/**
 * Write-once audit entry. Called by every handler that mutates or reads a
 * Person record (D2 compliance minimum — PROMPT_SONNET5_PRODUCTION.md).
 * Never call this from client code; it must only run with the Lambda
 * execution role's write grant on AuditLogTable.
 */
export async function writeAuditLog(params: {
  tableName: string;
  actorId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
}): Promise<void> {
  const entry: AuditLogEntry = {
    auditId: ulid(),
    actorId: params.actorId,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    timestamp: new Date().toISOString(),
  };

  await client.send(
    new PutCommand({
      TableName: params.tableName,
      Item: entry,
    })
  );
}

/**
 * Extracts the caller's companionId from the Cognito JWT claims that API
 * Gateway's HttpUserPoolAuthorizer attaches to the event. This is the only
 * legitimate source of companionId for caseload scoping — never trust a
 * value from the request body or query string for this purpose.
 */
export function getCallerCompanionId(event: APIGatewayProxyEventV2WithJWTAuthorizer): string {
  const claims = event.requestContext.authorizer?.jwt?.claims ?? {};
  const companionId = claims["custom:companionId"];
  if (typeof companionId !== "string" || !companionId) {
    throw new Error("missing companionId claim on caller's JWT");
  }
  return companionId;
}

export function getCallerActorId(event: APIGatewayProxyEventV2WithJWTAuthorizer): string {
  const claims = event.requestContext.authorizer?.jwt?.claims ?? {};
  const sub = claims["sub"];
  return typeof sub === "string" ? sub : "unknown";
}
