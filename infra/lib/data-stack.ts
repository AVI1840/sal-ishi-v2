import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface SalIshiTables {
  persons: dynamodb.Table;
  enrollments: dynamodb.Table;
  walletLedger: dynamodb.Table;
  services: dynamodb.Table;
  bookings: dynamodb.Table;
  crmActions: dynamodb.Table;
  timelineEvents: dynamodb.Table;
  riskSignals: dynamodb.Table;
  auditLog: dynamodb.Table;
}

/**
 * DynamoDB tables for the canonical schema in src/domain/schema.ts.
 * On-demand billing (no idle cost for a pilot's traffic), PITR on every
 * table holding pilot data (D1: cost is a design input; still, losing a
 * pilot client's records is not an acceptable savings).
 *
 * Every partition key is prefixed with tenantId so a second city (Horizon
 * 2) is a new partition value, never a schema migration.
 */
export class DataStack extends cdk.Stack {
  public readonly tables: SalIshiTables;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const common: Partial<dynamodb.TableProps> = {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    };

    const persons = new dynamodb.Table(this, "Persons", {
      ...common,
      partitionKey: { name: "tenantId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "personId", type: dynamodb.AttributeType.STRING },
    });
    // Caseload scoping: a companion's queries never scan another
    // companion's clients — see PROMPT_SONNET5_PRODUCTION.md Sprint 1 DoD.
    persons.addGlobalSecondaryIndex({
      indexName: "byCompanion",
      partitionKey: { name: "companionId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "personId", type: dynamodb.AttributeType.STRING },
    });

    const enrollments = new dynamodb.Table(this, "Enrollments", {
      ...common,
      partitionKey: { name: "personId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "program", type: dynamodb.AttributeType.STRING },
    });

    // Append-only ledger. Balance is folded from these rows at read time —
    // never stored as a separately-mutated number (see foldWalletBalance
    // in src/domain/schema.ts). Prevents double-spend races under retry.
    const walletLedger = new dynamodb.Table(this, "WalletLedger", {
      ...common,
      partitionKey: { name: "walletId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "txId", type: dynamodb.AttributeType.STRING },
    });

    const services = new dynamodb.Table(this, "Services", {
      ...common,
      partitionKey: { name: "tenantId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "serviceId", type: dynamodb.AttributeType.STRING },
    });

    const bookings = new dynamodb.Table(this, "Bookings", {
      ...common,
      partitionKey: { name: "personId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "bookingId", type: dynamodb.AttributeType.STRING },
    });

    const crmActions = new dynamodb.Table(this, "CrmActions", {
      ...common,
      partitionKey: { name: "personId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "actionId", type: dynamodb.AttributeType.STRING },
    });

    // This table IS the measurement pipeline for the reform (utilization,
    // SDI/RDI inputs, evaluator export) — see REFERENCE_ARCHITECTURE.md.
    const timelineEvents = new dynamodb.Table(this, "TimelineEvents", {
      ...common,
      partitionKey: { name: "personId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
    });

    const riskSignals = new dynamodb.Table(this, "RiskSignals", {
      ...common,
      partitionKey: { name: "personId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
    });

    // Append-only. Written by middleware on every mutation and every read
    // of a person record (D2 compliance minimum) — never edited in place.
    const auditLog = new dynamodb.Table(this, "AuditLog", {
      ...common,
      partitionKey: { name: "entityId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
    });

    this.tables = {
      persons,
      enrollments,
      walletLedger,
      services,
      bookings,
      crmActions,
      timelineEvents,
      riskSignals,
      auditLog,
    };
  }
}
