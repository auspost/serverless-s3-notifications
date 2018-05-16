"use strict";
// Load necessary modules
const AWS = require("aws-sdk");
const proxy = require("proxy-agent");

// Update AWS region // Create a parameter since region should be configurable
AWS.config.update({ region: "ap-southeast-2" });
// Update proxy settings // Source this from /root/proxy_env_vars!
AWS.config.update({
  httpOptions: { agent: proxy(process.env.http_proxy) }
});

// Create Serverless class
class S3Notifications {
  constructor(serverless, options) {
    this.hooks = {
      // this is where we declare the hook, and in what sequence we want our code to run
      "after:deploy:finalize": function() { //after:deploy:finalize
        updateConf(serverless);
      }
    };
  }
}

// Assume role
function myAssumeRole(serverless) {
  var sts = new AWS.STS({ apiVersion: "2012-08-10" });
  sts.assumeRole(
    {
      RoleArn: process.env.assume_role,
      RoleSessionName: "AssumeSharedServicesRole"
    },
    function(err, data) {
      if (err) {
        // an error occurred
        console.log("Serverless-plugin: ERROR Cannot assume role");
        console.log(err, err.stack);
      } else {
        // successful response and then the update the local AWS configuration
        AWS.config.update({
          accessKeyId: data.Credentials.AccessKeyId,
          secretAccessKey: data.Credentials.SecretAccessKey,
          sessionToken: data.Credentials.SessionToken
        });
        //let sts = new AWS.STS({ apiVersion: "2012-08-10" });
        console.log("Serverless-plugin: successfully assumed role");
        }
    }
  );
}

// Generate config
function getLambdaConfigs(serverless, myFunctionArn) {
  console.log("Serverless-plugin: getting configuration");
  let lambdaConfigs = [];
  for (let folder of serverless.service.custom.notification_folders) {
    lambdaConfigs.push({
      Events: [
        /* required */
        serverless.service.custom.notification_type
      ],
      LambdaFunctionArn: myFunctionArn,
      Filter: {
        Key: {
          FilterRules: [
            {
              Name: "prefix",
              Value: folder
            }
          ]
        }
      },
      Id: folder
    });
  }
  return lambdaConfigs;
}

// Update config
function updateConf(serverless) {

  var defFunctionParams = {
    FunctionName: serverless.service.custom.lambda_name
  };

  // Create S3 service object
  const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
  // Create Lambda service object
  const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });

  // need assume role first!!!

  lambda.getFunction(defFunctionParams, function(err, data) {
    if (err) {
      console.log("Serverless-plugin: ERROR Cannot find function!");
      console.log(err, err.stack); // an error occurred
    } else {
      var myFunctionArn = data.Configuration.FunctionArn;

      console.log(
        "Serverless-plugin: starting plugin serverless-s3-notifications..."
      );

      var BucketName = serverless.service.custom.notification_bucket;

      var defLambdaParams = {
        FunctionName: myFunctionArn
      };

      const defBucketParams = {
        Bucket: serverless.service.custom.notification_bucket,
        NotificationConfiguration: {
          LambdaFunctionConfigurations: getLambdaConfigs(
            serverless,
            myFunctionArn
          )
        }
      };

      const defPermisisonParams = {
        Action: "lambda:InvokeFunction",
        FunctionName: myFunctionArn,
        Principal: "s3.amazonaws.com",
        SourceAccount: serverless.service.custom.aws_account_id,
        SourceArn:
          "arn:aws:s3:::" + serverless.service.custom.notification_bucket,
        StatementId: serverless.service.custom.notification_bucket // create unique id!
      };

      lambda.getPolicy(defLambdaParams, function(err, data) {
        if (err) {
          // at the initial run, the lambda permission does not exist and therefore we should create it.
          lambda.addPermission(defPermisisonParams, function(err, data) {
            if (err)
              console.log(
                "Serverless-plugin: ERROR setting Lambda permissions: ",
                err,
                err.stack
              );
            else console.log("Serverless-plugin: setting Lambda permissions");
          });
        } else {
          var policies = JSON.parse(data.Policy);
          var statement = policies.Statement;
          statement.forEach(function(elem) {
            // When a Lambda permission already exists we need to check if the new permission exist, or to create it.
            if (elem["Sid"] != BucketName) {
              console.log(statement);
              lambda.addPermission(defPermisisonParams, function(err, data) {
                if (err)
                  console.log(
                    "Serverless-plugin: ERROR setting Lambda permissions: ",
                    err,
                    err.stack
                  );
                else
                  console.log("Serverless-plugin: setting Lambda permissions");
              });
            } else {
              //console.log("already exists", elem)
            }
          });
        }
      });

      s3.putBucketNotificationConfiguration(defBucketParams, function(
        err,
        data
      ) {
        if (err) {
          console.log("Serverless-plugin: ERROR setting notifications: ", err);
        } else {
          console.log(
            "Serverless-plugin: finshed plugin serverless-s3-notifications successfully! "
          );
        }
      });
    }
  });

}

myAssumeRole();
module.exports = S3Notifications;
