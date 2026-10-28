import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { Service } from "../../../src/domain/schema";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/**
 * Serves the seeded catalog (102 services in the pilot). Seeding itself
 * is a Sprint 1 one-time script from services-catalog.json — this handler
 * only reads what's already in the table.
 */
export const handler: APIGatewayProxyHandlerV2 = async () => {
  const tenantId = process.env.TENANT_ID ?? "jerusalem";

  const result = await client.send(
    new QueryCommand({
      TableName: process.env.SERVICES_TABLE,
      KeyConditionExpression: "tenantId = :tid",
      ExpressionAttributeValues: { ":tid": tenantId },
    })
  );

  const services = (result.Items ?? []) as Service[];

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ services }),
  };
};
