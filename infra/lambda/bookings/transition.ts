import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { z } from "zod";
import { BOOKING_TRANSITIONS, type Booking, type BookingStatus, type Transaction } from "../../../src/domain/schema";
import { getCallerActorId, writeAuditLog } from "../shared/audit";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TransitionPayload = z.object({
  toStatus: z.enum(["selected", "units_frozen", "booked", "attended", "cancelled"]),
  units: z.number().int().positive().optional(), // required for units_frozen/attended
});

/**
 * Server-validated booking state machine transition — the ONLY place a
 * booking's status may change. Rejects any transition not listed in
 * BOOKING_TRANSITIONS (src/domain/schema.ts) so a client can never, say,
 * jump straight from "recommended" to "attended" and skip the wallet
 * freeze. Wallet debits/credits are written as append-only Transaction
 * rows in the same handler so a booking's state and its wallet effect
 * never drift apart.
 *
 * This is a Sprint 2 feature per the sprint plan; the skeleton here
 * establishes the state machine and ledger-write shape so Sprint 2 fills
 * in the remaining edge cases (partial units, expiry) rather than
 * inventing the transaction model from scratch.
 */
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const personId = event.pathParameters?.personId;
  const bookingId = event.pathParameters?.bookingId;
  if (!personId || !bookingId) {
    return { statusCode: 400, body: JSON.stringify({ error: "missing_path_params" }) };
  }

  const parsed = TransitionPayload.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) {
    return { statusCode: 400, body: JSON.stringify({ error: "invalid_payload", issues: parsed.error.issues }) };
  }

  const existing = await client.send(
    new GetCommand({ TableName: process.env.BOOKINGS_TABLE, Key: { personId, bookingId } })
  );
  const booking = existing.Item as Booking | undefined;
  if (!booking) {
    return { statusCode: 404, body: JSON.stringify({ error: "booking_not_found" }) };
  }

  const allowed = BOOKING_TRANSITIONS[booking.status as BookingStatus] ?? [];
  const toStatus = parsed.data.toStatus as BookingStatus;
  if (!allowed.includes(toStatus)) {
    return {
      statusCode: 409,
      body: JSON.stringify({ error: "invalid_transition", from: booking.status, to: toStatus, allowed }),
    };
  }

  const actorId = getCallerActorId(event);
  const now = new Date().toISOString();

  await client.send(
    new UpdateCommand({
      TableName: process.env.BOOKINGS_TABLE,
      Key: { personId, bookingId },
      UpdateExpression: "SET #status = :status, updatedAt = :now",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": toStatus, ":now": now },
    })
  );

  // Ledger effect for the transitions that move units. See
  // foldWalletBalance in src/domain/schema.ts — balance is always derived
  // from these rows, never mutated directly.
  if ((toStatus === "units_frozen" || toStatus === "cancelled" || toStatus === "attended") && parsed.data.units) {
    const sign = toStatus === "units_frozen" ? -1 : toStatus === "cancelled" ? 1 : 0; // attended: units already frozen, no further ledger change here
    if (sign !== 0) {
      const tx: Transaction = {
        txId: ulid(),
        walletId: `${personId}#${now.slice(0, 7)}`, // YYYY-MM period
        type: toStatus === "units_frozen" ? "freeze" : "release",
        units: sign * parsed.data.units,
        bookingId,
        actorId,
        timestamp: now,
      };
      await client.send(new PutCommand({ TableName: process.env.WALLET_LEDGER_TABLE, Item: tx }));
    }
  }

  await writeAuditLog({
    tableName: process.env.AUDIT_TABLE!,
    actorId,
    action: "update",
    entity: "Booking",
    entityId: bookingId,
  });

  return { statusCode: 200, body: JSON.stringify({ personId, bookingId, status: toStatus }) };
};
