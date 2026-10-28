import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

/**
 * Cognito identity for Sal Ishi. Three roles only for the pilot
 * (PROMPT_SONNET5_PRODUCTION.md "Roles"): companion, supervisor, admin.
 * No provider or citizen logins — the pilot is companion-mediated.
 */
export class IdentityStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `sal-ishi-${this.node.tryGetContext("stage") ?? "dev"}`,
      selfSignUpEnabled: false, // accounts are provisioned by an admin, not self-serve
      signInAliases: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
      },
      customAttributes: {
        // Server-side caseload scoping reads this claim on every request —
        // see PROMPT_SONNET5_PRODUCTION.md "Caseload scoping is enforced
        // server-side". Never trust a client-supplied companionId.
        companionId: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    for (const roleName of ["companion", "supervisor", "admin"]) {
      new cognito.CfnUserPoolGroup(this, `${roleName}Group`, {
        userPoolId: this.userPool.userPoolId,
        groupName: roleName,
        description: `Sal Ishi role: ${roleName}`,
      });
    }

    this.userPoolClient = this.userPool.addClient("WebClient", {
      authFlows: { userPassword: true, userSrp: true },
      generateSecret: false, // SPA client
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    new cdk.CfnOutput(this, "UserPoolId", { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: this.userPoolClient.userPoolClientId });
  }
}
