import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnBucket } from 'aws-cdk-lib/aws-s3';
import { CfnTable } from 'aws-cdk-lib/aws-dynamodb';
import { CfnRole, PolicyDocument, PolicyStatement, PolicyStatementProps, Effect, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnFunction, Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { CfnRestApi, CfnResource, CfnMethod, CfnDeployment, CfnStage } from 'aws-cdk-lib/aws-apigateway';
import { CfnPermission } from 'aws-cdk-lib/aws-lambda';
import { aws_s3_assets } from 'aws-cdk-lib';
import { ResolutionTypeHint } from 'aws-cdk-lib';
// 独自モジュール
import { EnvProps } from '../bin/serverless';
import { get } from 'http';

export class ServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, envProps: EnvProps, props?: cdk.StackProps) {
    super(scope, id, props);
    // TODO: 以下に必要なリソースを立ち上げる
    const s3Bucket = this.createS3Bucket(envProps);
    const s3BucketArn: string = s3Bucket.getAtt('Arn', ResolutionTypeHint.STRING).toString();
    const dynamoDb = this.createDynamoDB(envProps);
    const dynanoDbArn: string = dynamoDb.getAtt('Arn', ResolutionTypeHint.STRING).toString();
    const lambdaAsset = this.createLambdaAsset(envProps);
    const lambdaExecRole = this.createLambdaIamRole(envProps, s3BucketArn, dynanoDbArn);
    const getLambda = this.createGetLambda(envProps, lambdaExecRole, lambdaAsset.s3BucketName, lambdaAsset.s3ObjectKey);
    this.createApiGateway(envProps, getLambda);
  };

  private createS3Bucket(envProps: EnvProps): CfnBucket {
    const applicationName = envProps.applicationName.toLocaleLowerCase();
    return new CfnBucket(this, `${envProps.envUpperCase}-${envProps.applicationName}-S3`, {
      bucketName: `${envProps.envLowerCase}-${applicationName}`,
    })
  };

  private createDynamoDB(envProps: EnvProps): CfnTable {
    const applicationName = envProps.applicationName.toLocaleLowerCase();
    return new CfnTable(this, `${envProps.envUpperCase}-${envProps.applicationName}-DynamoTable`, {
      tableName: `${envProps.envLowerCase}-${applicationName}`,
      attributeDefinitions: [
        {
          attributeName: 'userId',
          attributeType: 'S'
        },
        {
          attributeName: 'taskId',
          attributeType: 'S'
        }
      ],
      keySchema: [
        {
          attributeName: 'userId',
          keyType: 'HASH'
        },
        {
          attributeName: 'taskId',
          keyType: 'RANGE'
        }
      ],
      billingMode: 'PAY_PER_REQUEST'
    })
  };

  private createLambdaIamRole(envProps: EnvProps, s3BucketArn: string, dynamoDbArn: string): CfnRole {
    // TODO: 後で奇麗にする
    console.log('S3 Arn', s3BucketArn);
    console.log('DynamoDB Arn', dynamoDbArn);

    const servicePrincipal = new ServicePrincipal('lambda.amazonaws.com');

    const policyStatementProps: PolicyStatementProps = {
      effect: Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      principals: [servicePrincipal]
    };

    const policyStatement = new PolicyStatement(policyStatementProps);

    const policyDocument: PolicyDocument = new PolicyDocument({
      statements: [policyStatement]
    });

    const LambdaRole: CfnRole = new CfnRole(this, `${envProps.envUpperCase}-${envProps.applicationName}-LambdaExecRole`, {
      roleName: `${envProps.envUpperCase}-${envProps.applicationName}-LambdaExec`,
      description: `${envProps.envUpperCase} lambda Exection Role`,
      assumeRolePolicyDocument: policyDocument,
      // TODO: 最小権限の原則から後でする
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
        'arn:aws:iam::aws:policy/AmazonS3FullAccess',
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      ]
    });

    return LambdaRole;
  };

  private createLambdaAsset(envProps: EnvProps): aws_s3_assets.Asset {
    const lambdaAsset = new aws_s3_assets.Asset(this,
      `${envProps.envUpperCase}-${envProps.applicationName}-Lambda-Asset`,
    {
      path: './lambda'
    });

    return lambdaAsset;
  }

  private createGetLambda(envProps: EnvProps, lambdaExecRole: CfnRole, s3Bucket: string, s3Key: string): CfnFunction {
    const lambdaExecRoleArn: string = lambdaExecRole.getAtt('Arn', ResolutionTypeHint.STRING).toString();
    const getLambda = new CfnFunction(this, `${envProps.envUpperCase}-${envProps.applicationName}-Lambda-GET`, {
      functionName: `${envProps.applicationName}-GET-${envProps.envUpperCase}`,
      description: `${envProps.applicationName} GET Method`,
      architectures: [Architecture.ARM_64.toString()],
      handler: 'task.getHandler',
      memorySize: 1024,
      role: lambdaExecRoleArn,
      runtime: Runtime.NODEJS_20_X.toString(),
      timeout: 29,
      code: {
        s3Bucket: s3Bucket,
        s3Key: s3Key
      }
    })

    return getLambda;
  }

  private createApiGateway(envProps: EnvProps, getLambda: CfnFunction): void {
    const apigateway = new CfnRestApi(this, `${envProps.envUpperCase}-${envProps.applicationName}-Apigateway`, {
      name: `${envProps.envUpperCase}-${envProps.applicationName}`,
      description: `${envProps.envUpperCase} ${envProps.applicationName} Backend API`
    });

    const taskResource: CfnResource = new CfnResource(this, `${envProps.envUpperCase}-${envProps.applicationName}-Task-Resource`, {
      restApiId: apigateway.ref,
      parentId: apigateway.attrRootResourceId,
      pathPart: 'task'
    });

    const taskGetMethod: CfnMethod = new CfnMethod(this, `${envProps.envUpperCase}-${envProps.applicationName}-Task-Get-Method`, {
      httpMethod: 'GET',
      resourceId: taskResource.ref,
      restApiId: apigateway.ref,
      authorizationType: 'NONE',
      integration: {
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${getLambda.attrArn}/invocations`
      }
    });

    // LambdaとAPI Gatewayを紐づける
    new CfnPermission(this, `${envProps.envUpperCase}-${envProps.applicationName}-Get-Lambda-Permission`, {
      action: 'lambda:InvokeFunction',
      functionName: getLambda.attrArn,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${apigateway.ref}/*/GET/task` // ここは/*/*/*でもよい
    });

    const deployment: CfnDeployment = new CfnDeployment(this, `${envProps.envUpperCase}-${envProps.applicationName}-Deploy`, {
      restApiId: apigateway.ref
    });

    deployment.addDependency(taskGetMethod);

    new CfnStage(this, `${envProps.envUpperCase}-${envProps.applicationName}-Stage`, {
      restApiId: apigateway.ref,
      stageName: `${envProps.envLowerCase}`,
      deploymentId: deployment.ref
    });
  }

}
