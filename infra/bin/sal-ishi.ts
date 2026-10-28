#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { IdentityStack } from "../lib/identity-stack";
import { DataStack } from "../lib/data-stack";
import { ApiStack } from "../lib/api-stack";

// D1 (locked): AWS Serverless, region il-central-1, data residency in Israel
// is mandatory for every environment. Do not add a region override here.
const REGION = "il-central-1";

const app = new cdk.App();
const stage = (app.node.tryGetContext("stage") ?? "dev") as "dev" | "prod";
const tenantId = "jerusalem"; // pilot tenant; schema supports more without migration

const env: cdk.Environment = { region: REGION, account: process.env.CDK_DEFAULT_ACCOUNT };
const tags = { project: "sal-ishi", stage, tenant: tenantId };

const identity = new IdentityStack(app, `SalIshi-${stage}-Identity`, { env, tags });
const data = new DataStack(app, `SalIshi-${stage}-Data`, { env, tags });
new ApiStack(app, `SalIshi-${stage}-Api`, {
  env,
  tags,
  userPool: identity.userPool,
  userPoolClient: identity.userPoolClient,
  tables: data.tables,
});
