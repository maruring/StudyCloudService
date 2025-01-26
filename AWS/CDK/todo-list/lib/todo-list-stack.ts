import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamoDb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as api from 'aws-cdk-lib/aws-apigateway';
import { Duration } from 'aws-cdk-lib';
// 独自モジュール
import { EnvProps } from '../bin/todo-list';

export class TodoListStack extends cdk.Stack {
  constructor(scope: Construct, id: string, envProps: EnvProps, props?: cdk.StackProps) {
    super(scope, id, props);
    const taskTable = this.createTaskTable(envProps);
    const getLambda = this.createTaskLambda(envProps, lambda.HttpMethod.GET, taskTable);
    this.createApiGateway(envProps, getLambda);
  }

  private createTaskTable(envProps: EnvProps): dynamoDb.Table {
    const id: string = `${envProps.envPascalCase}-${envProps.applicationName}-Task-Table`;
    return new dynamoDb.Table(this, id, {
      tableName: `${envProps.envPascalCase}-${envProps.applicationName}-Task`,
      partitionKey: {
        name: 'userId', type: dynamoDb.AttributeType.STRING
      },
      sortKey: {
        name: 'taskId', type: dynamoDb.AttributeType.STRING
      },
      billingMode: dynamoDb.BillingMode.PAY_PER_REQUEST
    })
  }

  private createTaskLambda(envProps: EnvProps, httpMehod: lambda.HttpMethod, taskTable: dynamoDb.Table): lambda.Function {
    const id: string = `${envProps.envPascalCase}-${envProps.applicationName}-Task-${httpMehod.toString()}-Lambda`;
    const taskLambda = new lambda.Function(this, id, {
      functionName: `${envProps.envPascalCase}-${envProps.applicationName}-Task-${httpMehod.toString()}`,
      handler: `lambda-task.${httpMehod.toLowerCase()}TaskHandler`,
      code: lambda.Code.fromAsset('lambda'),
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: Duration.seconds(29)
    });

    taskTable.grantFullAccess(taskLambda);

    return taskLambda;
  }

  private createApiGateway(envProps: EnvProps, lambdaFunc: lambda.Function): void {
    const id: string = `${envProps.envPascalCase}-${envProps.applicationName}-RestApi`;
    const apiGateway = new api.RestApi(this, id, {
      restApiName: `${envProps.envPascalCase}-${envProps.applicationName}`,
      cloudWatchRole: true,
      deployOptions: {
        stageName: 'v1'
      }
    })

    const taskResource = apiGateway.root.addResource('tasks');
    const taskIdResource = taskResource.addResource('{taskId}')
    const getApi = new api.LambdaRestApi(this, 'GetLambda', {handler: lambdaFunc})
    const getMethod = taskIdResource.addMethod(lambda.HttpMethod.GET, );
    
  }
}
