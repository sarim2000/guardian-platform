# Guardian Platform - Setup Guide

## GitHub App Setup

### 1. Create GitHub App

1. Go to GitHub Settings → Developer settings → GitHub Apps
2. Click "New GitHub App"
3. Configure:
   - **App name**: Guardian Platform
   - **Homepage URL**: `http://localhost:3000` or `https://your-domain.com`

### 2. Permissions

**Repository permissions:**
- Contents: Read
- Metadata: Read
- 
### 3. Generate Private Key

1. In your GitHub App settings
2. Click "Generate a private key"
3. Download the `.pem` file
4. Copy contents to `GITHUB_APP_PRIVATE_KEY` in `.env.local`

### 4. Install App

1. Install the app on your organization/repositories
2. Note the Installation ID from the URL
3. Add to `GITHUB_APP_INSTALLATION_ID` in `.env.local`

## AWS Setup (Optional)

### 1. Create IAM User

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "resource-groups:*",
        "tag:GetResources",
        "ec2:Describe*",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "rds:Describe*",
        "lambda:List*",
        "cloudformation:Describe*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. Generate Access Keys

1. Create access keys for the IAM user
2. Add AWS accounts through the Guardian UI
3. Credentials are encrypted and stored in database

 