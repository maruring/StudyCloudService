import json
import boto3

s3 = boto3.client('s3')

def read_rds_init_data(bucket, object_key, application_name, table_name):
    response = s3.get_object(Bucket=bucket, Key=object_key)
    body = response['Body'].read()
    data = json.loads(body.decode('utf-8'))
    init_data = data[application_name][table_name]
    return init_data
