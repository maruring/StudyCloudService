import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnBucket } from 'aws-cdk-lib/aws-s3';
import { CfnTable } from 'aws-cdk-lib/aws-dynamodb';
// 独自モジュール
import { EnvProps } from '../bin/serverless';

export class ServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, envProps: EnvProps, props?: cdk.StackProps) {
    super(scope, id, props);
    // TODO: 以下に必要なリソースを立ち上げる
    this.createS3Bucket(envProps);
    this.createDynamoDB(envProps);
  }

  private createS3Bucket(envProps: EnvProps) {
    const applicationName = envProps.applicationName.toLocaleLowerCase();
    new CfnBucket(this, `${envProps.envUpperCase}-${envProps.applicationName}-S3`, {
      bucketName: `${envProps.envLowerCase}-${applicationName}`,
    })
  };

  private createDynamoDB(envProps: EnvProps) {
    const applicationName = envProps.applicationName.toLocaleLowerCase();
    new CfnTable(this, `${envProps.envUpperCase}-${envProps.applicationName}-DynamoTable`, {
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
}
