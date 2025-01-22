import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamoTable from 'aws-cdk-lib/aws-dynamodb';
import { Duration } from 'aws-cdk-lib';

// 独自モジュール
import { EnvProps } from '../bin/l2_serverless';

export class L2ServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, envProps: EnvProps, props?: cdk.StackProps) {
    super(scope, id, props);
    const getHandler = this.createGetLambda(envProps);
    const deleteHandler = this.createDeleteHandler(envProps)
    const taskTable = this.createTaskTable(envProps, 'task');
    this.addExecRoleToLambda(envProps, [getHandler, deleteHandler], taskTable);
  }

  /**
   * DynamoDBの作成
   * NOTE: Global TableではないためV1を使用
   * @param envProps 
   * @param tableName 
   */
  private createTaskTable(envProps: EnvProps, tableName: string): dynamoTable.Table {
    const table = new dynamoTable.Table(this, `${envProps.envPascal}-${envProps.applicationName}-Task-Table`, {
      tableName: `${envProps.envPascal}-${envProps.applicationName}-${tableName}`,
      partitionKey: {'name': 'userId', 'type': dynamoTable.AttributeType.STRING},
      sortKey: {'name': 'taskId', type: dynamoTable.AttributeType.STRING}
    });

    return table;
  }

  private createGetLambda(envProps: EnvProps): lambda.Function {
    const getHandler = new lambda.Function(this, `${envProps.envPascal}-${envProps.applicationName}-Task-Get-Lambda`, {
      functionName: `${envProps.envPascal}-${envProps.applicationName}-Task-Get`,
      description: `${envProps.envPascal} ${envProps.applicationName} Task Get`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'task.getHandler',
      code: lambda.Code.fromAsset('lambda'),
      architecture: lambda.Architecture.ARM_64,
      timeout: Duration.seconds(29)
    })
    
    return getHandler;
  }

  private createDeleteHandler(envProps: EnvProps): lambda.Function {
    const deleteHandler = new lambda.Function(this, `${envProps.envPascal}-${envProps.applicationName}-Task-Delete-Lambda`, {
      functionName: `${envProps.envPascal}-${envProps.applicationName}-Task-Delete`,
      description: `${envProps.envPascal} ${envProps.applicationName} Task Delete`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'task.deleteHandler',
      code: lambda.Code.fromAsset('lambda'),
      architecture: lambda.Architecture.ARM_64,
      timeout: Duration.seconds(29)
    })
    
    return deleteHandler;
  };

  private addExecRoleToLambda(envProps: EnvProps, lambdas: lambda.Function[], table: dynamoTable.Table): void {
    lambdas.forEach((handler) => {
      handler.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:*'],
        resources: [`${table.tableArn}`]
      }))
    })
  }

}
