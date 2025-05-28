# AWS Resource Discovery Feature

This feature allows Guardian Platform to automatically discover and inventory AWS resources across multiple regions using the AWS Resource Groups Tagging API.

## Features

- **Comprehensive Resource Discovery**: Discovers 100+ AWS resource types including EC2, RDS, S3, Lambda, ECS, DynamoDB, and many more
- **Multi-Region Support**: Scans across multiple AWS regions simultaneously
- **Smart Deduplication**: Avoids storing duplicate resources
- **Tag-Aware**: Captures all AWS tags and identifies resources by Name tag when available
- **Rate Limiting**: Built-in delays and batch processing to respect AWS API limits
- **Error Resilience**: Continues discovery even if some resource types or regions fail

## Supported Resource Types

The discovery service currently supports these AWS resource types:

### Compute & Containers
- EC2 Instances, Volumes, Security Groups, VPCs, Subnets
- ECS Clusters, Services, Task Definitions
- Lambda Functions
- EKS Clusters, Node Groups

### Storage & Databases
- S3 Buckets
- RDS DB Instances, Clusters, Snapshots
- DynamoDB Tables
- ElastiCache Clusters
- Redshift Clusters

### Networking & Content Delivery
- Load Balancers, Target Groups
- API Gateway REST APIs
- Route53 Hosted Zones
- CloudFront Distributions

### Security & Identity
- IAM Roles, Users, Groups, Policies
- Secrets Manager Secrets

### Developer Tools
- CodeBuild Projects
- CodeCommit Repositories
- CodeDeploy Applications
- CodePipeline Pipelines

### Monitoring & Management
- CloudWatch Alarms, Log Groups
- Systems Manager Parameters, Documents

### Analytics & ML
- Kinesis Streams
- OpenSearch Domains (formerly Elasticsearch)

## Environment Configuration

Set these environment variables:

```
