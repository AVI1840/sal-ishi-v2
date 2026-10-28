import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpUserPoolAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import type { SalIshiTables } from "./data-stack";

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  tables: SalIshiTables;
}

/**
 * HTTP API implementing the route list in PROMPT_SONNET5_PRODUCTION.md
 * "API (Lambda + API Gateway, Cognito JWT authorizer on everything)".
 *
 * Only /health, /persons (list+create), and /persons/{id}/bookings have
 * real handler logic today — the rest are wired to an honest 501 stub so
 * the API surface, auth, and routing are complete and deployable while
 * Sprint 1/2 fill in the remaining business logic one route at a time.
 * See infra/README.md for the exact list of what's stubbed.
 */
export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userPool, userPoolClient, tables } = props;

    const authorizer = new HttpUserPoolAuthorizer("CognitoAuthorizer", userPool, {
      userPoolClients: [userPoolClient],
    });

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: `sal-ishi-${this.node.tryGetContext("stage") ?? "dev"}`,
      corsPreflight: {
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        // Tightened to the real app origin once it has a fixed domain
        // (Sprint 3 — see PROMPT_SONNET5_PRODUCTION.md "App split").
        allowOrigins: ["*"],
      },
    });

    const nodeFn = (fnId: string, entry: string, env: Record<string, string> = {}) =>
      new NodejsFunction(this, fnId, {
        entry: path.join(__dirname, "..", "lambda", entry),
        runtime: lambda.Runtime.NODEJS_20_X,
        architecture: lambda.Architecture.ARM_64, // Well-Architected: Graviton for cost + sustainability
        memorySize: 256,
        timeout: cdk.Duration.seconds(10),
        environment: {
          TENANT_ID: "jerusalem",
          ...env,
        },
      });

    // ── Health (no auth) ──────────────────────────────────────────
    const healthFn = nodeFn("HealthFn", "health/check.ts");
    httpApi.addRoutes({
      path: "/health",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration("HealthIntegration", healthFn),
    });

    // ── Persons ────────────────────────────────────────────────────
    const listPersonsFn = nodeFn("ListPersonsFn", "persons/list.ts", {
      PERSONS_TABLE: tables.persons.tableName,
    });
    tables.persons.grantReadData(listPersonsFn);

    const createPersonFn = nodeFn("CreatePersonFn", "persons/create.ts", {
      PERSONS_TABLE: tables.persons.tableName,
      AUDIT_TABLE: tables.auditLog.tableName,
    });
    tables.persons.grantWriteData(createPersonFn);
    tables.auditLog.grantWriteData(createPersonFn);

    const personsRoutes: Array<{ methods: apigwv2.HttpMethod[]; path: string; fn: NodejsFunction }> = [
      { methods: [apigwv2.HttpMethod.GET], path: "/persons", fn: listPersonsFn },
      { methods: [apigwv2.HttpMethod.POST], path: "/persons", fn: createPersonFn },
    ];
    for (const { methods, path: routePath, fn } of personsRoutes) {
      httpApi.addRoutes({
        path: routePath,
        methods,
        integration: new HttpLambdaIntegration(`${fn.node.id}Integration`, fn),
        authorizer,
      });
    }

    // ── Bookings ───────────────────────────────────────────────────
    const transitionBookingFn = nodeFn("TransitionBookingFn", "bookings/transition.ts", {
      BOOKINGS_TABLE: tables.bookings.tableName,
      WALLET_LEDGER_TABLE: tables.walletLedger.tableName,
      AUDIT_TABLE: tables.auditLog.tableName,
    });
    tables.bookings.grantReadWriteData(transitionBookingFn);
    tables.walletLedger.grantReadWriteData(transitionBookingFn);
    tables.auditLog.grantWriteData(transitionBookingFn);

    httpApi.addRoutes({
      path: "/persons/{personId}/bookings/{bookingId}/transition",
      methods: [apigwv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration("TransitionBookingIntegration", transitionBookingFn),
      authorizer,
    });

    // ── Services catalog ─────────────────────────────────────────
    const listServicesFn = nodeFn("ListServicesFn", "services/list.ts", {
      SERVICES_TABLE: tables.services.tableName,
    });
    tables.services.grantReadData(listServicesFn);
    httpApi.addRoutes({
      path: "/services",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration("ListServicesIntegration", listServicesFn),
      authorizer,
    });

    // ── Everything else: honest 501, wired but not implemented ────
    // Sprint 1/2 replace these one at a time — see infra/README.md.
    const notImplementedFn = nodeFn("NotImplementedFn", "shared/not-implemented.ts");
    const stubRoutes: [apigwv2.HttpMethod, string][] = [
      [apigwv2.HttpMethod.POST, "/persons/{personId}/intake"],
      [apigwv2.HttpMethod.GET, "/persons/{personId}/matches"],
      [apigwv2.HttpMethod.GET, "/persons/{personId}/actions"],
      [apigwv2.HttpMethod.POST, "/persons/{personId}/actions"],
      [apigwv2.HttpMethod.GET, "/persons/{personId}/timeline"],
      [apigwv2.HttpMethod.GET, "/dashboard/kpis"],
      [apigwv2.HttpMethod.GET, "/export/events.csv"],
      [apigwv2.HttpMethod.POST, "/ai/summary"],
      [apigwv2.HttpMethod.POST, "/ai/outreach"],
      [apigwv2.HttpMethod.POST, "/ai/intake-assist"],
    ];
    const stubIntegration = new HttpLambdaIntegration("NotImplementedIntegration", notImplementedFn);
    for (const [method, routePath] of stubRoutes) {
      httpApi.addRoutes({ path: routePath, methods: [method], integration: stubIntegration, authorizer });
    }

    new cdk.CfnOutput(this, "ApiUrl", { value: httpApi.apiEndpoint });
  }
}
