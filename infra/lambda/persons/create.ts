import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { z } from "zod";
import type { Person } from "../../../src/domain/schema";
import { getCallerActorId, getCallerCompanionId, writeAuditLog } from "../shared/audit";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// D2 (locked): this is the enforcement point, not just the type system.
// If a caller sends teudatZehut, fullName, address, or phone, reject the
// request outright rather than silently dropping the field — a silent
// drop would hide a companion-side workflow that still collects PII.
const IntakePayload = z
  .object({
    alias: z.string().min(1).max(60),
    birthYear: z.number().int().gte(1920).lte(new Date().getFullYear()),
    gender: z.enum(["male", "female", "other"]),
    neighborhood: z.string().min(1),
    languages: z.array(z.string()).min(1),
    sector: z.enum(["secular", "arab", "haredi", "mixed"]),
    consentGiven: z.literal(true),
  })
  .strict();

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  let companionId: string;
  try {
    companionId = getCallerCompanionId(event);
  } catch {
    return { statusCode: 403, body: JSON.stringify({ error: "missing_companion_claim" }) };
  }
  const actorId = getCallerActorId(event);

  const parsed = IntakePayload.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "invalid_payload", issues: parsed.error.issues }),
    };
  }

  const now = new Date().toISOString();
  const person: Person = {
    personId: ulid(),
    tenantId: process.env.TENANT_ID ?? "jerusalem",
    alias: parsed.data.alias,
    birthYear: parsed.data.birthYear,
    gender: parsed.data.gender,
    neighborhood: parsed.data.neighborhood,
    languages: parsed.data.languages,
    sector: parsed.data.sector,
    companionId,
    consentAt: now,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await client.send(new PutCommand({ TableName: process.env.PERSONS_TABLE, Item: person }));
  await writeAuditLog({
    tableName: process.env.AUDIT_TABLE!,
    actorId,
    action: "create",
    entity: "Person",
    entityId: person.personId,
  });

  // NOTE: intake does not yet create an Enrollment or run the matching
  // engine — that wiring is Sprint 1 (POST /persons/:id/intake in the API
  // spec). This endpoint covers the base Person record only.
  return { statusCode: 201, body: JSON.stringify({ person }) };
};
