# 標準モジュール
import sys
import logging
import os
from typing import Final
import uuid

# 自作モジュール
from storage import read_rds_init_data

# 外部ライブラリ
import pymysql

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# DBの設定条件
DB_HOST: Final[str] = os.environ['DB_HOST']
DB_USER_NAME: Final[str] = os.environ['DB_USER_NAME']
DB_PASSWORD: Final[str] = os.environ['DB_PASSWORD']
DB_NAME: Final[str] = os.environ['DB_NAME']
DB_PORT: Final[int] = os.environ['DB_PORT']

logger.info('RDS Init Process Start')

# DBとのセッションを確立する
try:
    conn = pymysql.connect(host=DB_HOST, user=DB_USER_NAME, passwd=DB_PASSWORD, db=DB_NAME, connect_timeout=5)
except pymysql.MySQLError as e:
    print(e)
    sys.exit(1)

def handler(event, context):
    bucket = event['bucket_name']
    object_key = event['object_key']
    application_name = event['application_name']
    table_name = event['table_name']
    
    with conn.cursor() as cursor:
        create_table_sql: str = "CREATE TABLE IF NOT EXISTS users(`id` varchar(256) PRIMARY KEY,`name` varchar(256) NOT NULL,`age` TINYINT NOT NULL, `mail_address` varchar(256) NOT NULL)"
        cursor.execute(create_table_sql)

        init_data = read_rds_init_data(bucket=bucket, object_key=object_key, application_name=application_name, table_name=table_name)
        for data in init_data:
            logger.debug(f'insert data: {data}')
            id = uuid.uuid1()
            name = data['name']
            age = data['age']
            mail_address = data['mail_address']
            insert_sql: str = f"INSERT INTO users(id, name, age, mail_address) VALUES (%s, %s, %s, %s)"
            cursor.execute(insert_sql, (id, name, age, mail_address))
            conn.commit()

        select_sql: str = "SELECT * FROM users"
        cursor.execute(select_sql)
        logger.debug('check inserted data')
        for row in cursor:
            print(row)

logger.info('RDS Init Process End')
