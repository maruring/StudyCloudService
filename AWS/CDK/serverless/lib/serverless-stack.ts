import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnBucket } from 'aws-cdk-lib/aws-s3';
import { CfnTable } from 'aws-cdk-lib/aws-dynamodb';
import { CfnRole, PolicyDocument, PolicyStatement, PolicyStatementProps, Effect, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnFunction, Architecture, Runtime, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import { CfnRestApi, CfnResource, CfnMethod, CfnDeployment, CfnStage } from 'aws-cdk-lib/aws-apigateway';
import { CfnPermission } from 'aws-cdk-lib/aws-lambda';
import { aws_s3_assets } from 'aws-cdk-lib';
import { ResolutionTypeHint } from 'aws-cdk-lib';
// 独自モジュール
import { EnvProps } from '../bin/serverless';

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
    const apiGateway = this.createApiGateway(envProps);
    const apiGatewayRole = this.createApiGatewayIamRole(envProps);
    // task リソース追加
    const taskResourcePath = this.createApiGatewayResource(envProps, apiGateway, 'tasks');
    // ${taskId}メソッドの作成
    const taskIdResourcePath = this.createApiGatewayResource(envProps, apiGateway, '{taskId}', taskResourcePath);
    // GETメソッド作成(Lambda)
    const getMethod = this.createMethodByLambda(envProps, apiGateway, taskIdResourcePath, 'task', HttpMethod.GET, getLambda);
    // DELETE Method作成(APIGateway統合)
    const deleteMethod = this.createDeleteMethod(envProps, apiGateway, taskIdResourcePath, apiGatewayRole, dynamoDb);

    const methods: CfnMethod[] = [getMethod, deleteMethod];
    // DeployとStage
    this.deployAndStageApiGateway(envProps, apiGateway, methods);
  };

  /**
   * APIGatewayのRole作成
   * @param envProps 
   * @returns 
   */
  private createApiGatewayIamRole(envProps: EnvProps): CfnRole {
    const servicePrincipal = new ServicePrincipal('apigateway.amazonaws.com');
    const policyStatementProps: PolicyStatementProps = {
      effect: Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      principals: [servicePrincipal]
    };

    const policyStatement = new PolicyStatement(policyStatementProps);
    const policyDocument = new PolicyDocument({
      statements: [policyStatement]
    });

    const apiGatewayRole = new CfnRole(this, `${envProps.envUpperCase}-${envProps.applicationName}-ApiGateway-Role`, {
      roleName: `${envProps.envUpperCase}-${envProps.applicationName}-ApiGateway`,
      description: `${envProps.envUpperCase} ApiGateway Role`,
      assumeRolePolicyDocument: policyDocument,
      // TODO: 最小権限の原則から後でする
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs',
        'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess'
      ]
    })

    return apiGatewayRole;
  };

  // TODO: 後で奇麗にする
  private createDeleteMethod(envProps: EnvProps, apiGateway: CfnRestApi, resoucePath: CfnResource, apiGatewayRole: CfnRole, targetTable: CfnTable): CfnMethod {

    const requestTemplate = {
      TableName: targetTable.ref,
      Key: {
        userId: {
          "S": "input.param('taskId')"
        }
      }
    };

    const integrationResponse: CfnMethod.IntegrationResponseProperty = {
      statusCode: '204'
    };

    const deleteMethod = new CfnMethod(this, `${envProps.envUpperCase}-${envProps.applicationName}-Task-Delete-Method`,{
      httpMethod: HttpMethod.DELETE,
      restApiId: apiGateway.ref,
      resourceId: resoucePath.ref,
      authorizationType: 'NONE',
      requestParameters: {
        'method.request.path.taskId': true
      },
      methodResponses: [{'statusCode': '204'}],
      integration: {
        type: 'AWS',
        integrationHttpMethod: HttpMethod.POST,
        credentials: apiGatewayRole.getAtt('Arn', ResolutionTypeHint.STRING).toString(),
        uri: `arn:aws:apigateway:${this.region}:dynamodb:action/DeleteItem`,
        passthroughBehavior: 'WHEN_NO_TEMPLATES',
        requestParameters: {
          'integration.request.path.taskId': 'method.request.path.taskId'
        },
        requestTemplates: {
          'application/json': JSON.stringify(requestTemplate)
        },
        integrationResponses: [integrationResponse]
      }
    })

    return deleteMethod;
  };

  /**
   * S3バケット作成
   * @param envProps 
   * @returns 
   */
  private createS3Bucket(envProps: EnvProps): CfnBucket {
    const applicationName = envProps.applicationName.toLocaleLowerCase();
    return new CfnBucket(this, `${envProps.envUpperCase}-${envProps.applicationName}-S3`, {
      bucketName: `${envProps.envLowerCase}-${applicationName}`,
    })
  };

  /**
   * DynamoDB Table作成
   * @param envProps 
   * @returns 
   */
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

  /**
   * Lambda 実行ロール作成
   * @param envProps 
   * @param s3BucketArn 
   * @param dynamoDbArn 
   * @returns 
   */
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

  /**
   * lambdaのコード保管場所作成
   * @param envProps 
   * @returns 
   */
  private createLambdaAsset(envProps: EnvProps): aws_s3_assets.Asset {
    const lambdaAsset = new aws_s3_assets.Asset(this,
      `${envProps.envUpperCase}-${envProps.applicationName}-Lambda-Asset`,
    {
      path: './lambda'
    });

    return lambdaAsset;
  }

  /**
   * GET methodのLambda作成
   * @param envProps 
   * @param lambdaExecRole 
   * @param s3Bucket 
   * @param s3Key 
   * @returns 
   */
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

  /**
   * API Gateway作成
   * @param envProps 
   * @returns 
   */
  private createApiGateway(envProps: EnvProps): CfnRestApi {
    const apiGateway = new CfnRestApi(this, `${envProps.envUpperCase}-${envProps.applicationName}-ApiGateway`, {
      name: `${envProps.envUpperCase}-${envProps.applicationName}`,
      description: `${envProps.envUpperCase} ${envProps.applicationName} Backend API`
    });

    return apiGateway;
  };

  /**
   * API Gatewayのリソースパス作成
   * @param envProps 
   * @param apiGateway 
   * @param resourcePath 
   * @param parentResource 
   * @returns 
   */
  private createApiGatewayResource(envProps: EnvProps, apiGateway: CfnRestApi, resourcePath: string, parentResource?: CfnResource): CfnResource {
    const parentId = parentResource !== undefined ? parentResource.attrResourceId : apiGateway.attrRootResourceId
    
    const resource: CfnResource = new CfnResource(this, `${envProps.envUpperCase}-${envProps.applicationName}-Resource-${resourcePath}`, {
      restApiId: apiGateway.ref,
      parentId: parentId,
      pathPart: resourcePath
    });

    return resource;
  }

  /**
   * API Gatewayのメソッド作成
   * @param envProps 
   * @param apiGateway 
   * @param resouce 
   * @param resourcePath 
   * @param httpMethod 
   * @param lambda 
   * @returns 
   */
  private createMethodByLambda(envProps: EnvProps, apiGateway: CfnRestApi, resouce: CfnResource, resourcePath: string, httpMethod: HttpMethod, lambda: CfnFunction): CfnMethod {
    const method = new CfnMethod(this, `${envProps.envUpperCase}-${envProps.applicationName}-${resourcePath}-${httpMethod}-Method`, {
      httpMethod: httpMethod,
      restApiId: apiGateway.ref,
      resourceId: resouce.ref,
      authorizationType: 'NONE',
      integration: {
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${lambda.attrArn}/invocations`
      }
    });

      new CfnPermission(this, `${envProps.envUpperCase}-${envProps.applicationName}-${httpMethod}-Lambda-Permission`, {
        action: 'lambda:InvokeFunction',
        functionName: lambda.attrArn,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${apiGateway.ref}/*/${httpMethod}/${resourcePath}`
      });

    return method;
  };

  /**
   * API Gatewayのdeploymentとstage作成
   * @param envProps 
   * @param apiGateway 
   * @param dependMethod 
   */
  private deployAndStageApiGateway(envProps: EnvProps, apiGateway: CfnRestApi, dependMethod: CfnMethod[]): void {
    const deployment: CfnDeployment = new CfnDeployment(this, `${envProps.envUpperCase}-${envProps.applicationName}-Deploy`, {
      restApiId: apiGateway.ref
    });

    dependMethod.forEach((method) => {
      deployment.addDependency(method);
    })

    new CfnStage(this, `${envProps.envUpperCase}-${envProps.applicationName}-Stage`, {
      restApiId: apiGateway.ref,
      stageName: `${envProps.envLowerCase}`,
      deploymentId: deployment.ref
    });
  };

}
