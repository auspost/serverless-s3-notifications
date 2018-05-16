# serverless-s3-notifications

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![npm](https://img.shields.io/npm/v/serverless-s3-notifications.svg)](https://www.npmjs.com/package/serverless-s3-notifications)
[![npm](https://img.shields.io/npm/dt/serverless-s3-notifications.svg)](https://www.npmjs.com/package/serverless-s3-notifications)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/kevinrambaud/serverless-functions-path/master/LICENSE)

# Event notifications on already existing buckets
```
The reason for developing this plugin is that the serverless framework currently not supports creating event notifications on existing buckets in another AWS account, because it wants to create the bucket and fails when it already exists. In our particular use-case we need to add event notifications on already existing buckets in another AWS account.

Process description
- The scripts assumes that the S3 buckets, permissions ("s3:Put*", "s3:Get*","s3:Delete*") and roles are already in place!

- Firstly, we add lambda.addPermission for the Lambda on the custom parameter notification_bucket. Some basic checks are in place to check if a permissions already exists.

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
  notification_bucket: your_event_s3_bucket_name                  # S3 bucket name where are placing the event notifications
  notification_type: "s3:ObjectCreated:*"                         # type of action you want to trigger the event notification
  notification_folders: ['myfolder1/', 'myfolder2/']              # specify any number of folders`s that you want the event to trigger
  aws_account_id: "1234567890"                                    # aws account id where the notification_bucket resides
  lambda_name: "${self:service}-${self:stage, 'dev'}-helloworld"  # service-stage-functionname

functions:
  helloworld:
    handler: helloworld.lambda_handler
    timeout: 10
    memorySize: 128

plugins:
  - serverless-s3-notifications
```

# Deploying your Lambda and event notifications
Deploy
```bash
$ export http_proxy="http://yourproxy" # provide a proxy address
$ export assume_role="assume_role_arn" # haven't found a way of fetching this from serverless.yml (yet)
$ serverless deploy --profile your_aws_profile
```

Remove
```bash
$ serverless remove
```