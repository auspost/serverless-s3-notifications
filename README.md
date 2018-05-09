# serverless-s3-notifications

# Event notifications on already existing buckets
```
The reason for developing this plugin is that the serverless framework currently not supports creating event notifications on existing buckets, because it wants to create the bucket and fails when it already exists. In our particular use-case we need to add event notifications on already existing buckets.

Process description
- Firstly, we do a lambda.addPermission for the Lambda on the custom parameter notification_bucket. Some basic checks are in place to check if a permissions already exists.

- Secondly, we loop through the custom parameter notification_folders and do a s3.putBucketNotificationConfiguration for each folder. You can run the serverless deploy command multiple times to add/remove folders.
```

# Installing and configuring the plugin
Run the following command;
```bash
$ npm install serverless-s3-notifications
```

Add these custom parameter to your serverless.yml
```yaml
custom:
  # serverless-s3-notifications plugin parameters
  notification_bucket: bucketname                                 # S3 bucket you need to place the event notifications on
  notification_type: "s3:ObjectCreated:*"                         # type of action you want to trigger the event notification
  notification_folders: ['myfolder1/', 'myfolder2/']              # specify any number of `folders`s that you want the event to trigger on.
  aws_account_id: "1234567890"                                    # the aws account id where the parameter notification_bucket resides
  lambda_name: "${self:service}-${self:stage, 'dev'}-myfunction"  # change myfunction to your Lambda function name!

plugins:
  - serverless-s3-notifications
```

# Deploying your Lambda and event notifications
Deploy
```bash
$ serverless deploy
```

Remove
```bash
$ serverless remove
```