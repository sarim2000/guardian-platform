Okay, here's a focused Product Requirements Document (PRD) specifically for the **AWS Resource Discovery & Listing feature** as part of the Guardian Platform Proof of Concept (PoC).

---

**Product Requirements Document: Guardian Platform - AWS Resource Discovery (PoC Feature)**

* **Feature Name:** AWS Resource Discovery & Listing (PoC)
* **Related Product:** Guardian Platform (PoC/MVP 1.0)
* **Version:** PoC 0.1
* **Date:** May 28, 2025
* **Status:** Definition

## 1. Goal
To validate the technical feasibility of Guardian Platform securely connecting to an AWS environment, discovering a predefined set of AWS resource types, and displaying a basic inventory of these resources. This provides foundational visibility complementary to the manifest-driven catalog.

## 2. Target Users (for this PoC feature)
* **Platform Administrators/Engineers (Primary):** For configuring AWS access, triggering discovery, and viewing the raw inventory for initial validation.
* **(Indirectly) Service Owners/Developers:** As a precursor to potentially identifying unmanaged resources that may later require a `guardian-manifest.yaml`.

## 3. Core Functionality

### 3.1. AWS Authentication & Configuration
* Guardian backend will utilize AWS credentials (Access Key ID, Secret Access Key, Region) configured via environment variables.
* For PoC in an isolated dev/sandbox environment, the associated IAM User/Role will temporarily use the AWS managed `ReadOnlyAccess` policy. *(Transition to a least-privilege custom IAM policy is mandatory post-PoC)*.

### 3.2. Resource Discovery Engine (Backend)
* Manually triggered process (via an admin API endpoint).
* Connects to AWS using the configured credentials and specified region(s).
* Discovers a **predefined, limited set of AWS resource types** for the PoC (e.g., EC2 Instances, S3 Buckets, Lambda Functions – *to be explicitly chosen for PoC scope*).
* Handles API pagination for AWS list/describe calls.
* Extracts key identifying metadata for each discovered resource (e.g., ID/ARN, Name tag, type, region, key tags).

### 3.3. Data Storage (PoC)
* Discovered AWS resource metadata will be stored in a dedicated PostgreSQL table (e.g., `aws_discovered_resources`) using Drizzle ORM.
* Schema to include: ARN (unique ID), AWS Account ID, AWS Region, Resource Type, Name Tag, All Tags (JSONB), Raw Metadata (JSONB from AWS API response), First Discovered At, Last Seen At.
* Ingestion logic will upsert records based on ARN (update `lastSeenAt` and metadata if changed, insert if new).

### 3.4. API Endpoint for Discovered Resources
* `GET /api/aws/resources`: Exposes the list of discovered AWS resources.
* Supports basic filtering (e.g., by resource type, region) and pagination.

### 3.5. Basic UI Display
* A dedicated page/section in the Guardian UI to list discovered AWS resources.
* Displays key metadata in a table format.
* Includes basic filtering capabilities based on API support.

## 4. Success Metrics (for this PoC feature)
* Guardian successfully connects to the configured AWS account using the provided credentials.
* Guardian lists resources for at least **two** predefined AWS resource types (e.g., EC2 instances, S3 buckets) from **one** specified AWS region.
* Key metadata (ID/ARN, Name Tag, Type, Region, Tags) for discovered resources is accurately stored and displayed in the UI.
* Discovery process for a PoC-scoped set of resources completes within an acceptable timeframe (e.g., < 5 minutes).

## 5. Key Non-Functional Requirements (for this PoC feature)
* **Security:** AWS credentials are not hardcoded and are loaded from the environment. (Note: `ReadOnlyAccess` is temporary for PoC; least-privilege is the goal).
* **Reliability:** Discovery logic includes basic error handling for AWS API calls.
* **Data Handling:** Stores essential identifying information and provides a way to access raw metadata from AWS if needed.

## 6. Out of Scope (for this PoC feature iteration)
* Discovery of all possible AWS resource types (PoC will focus on a small, defined set).
* Scanning multiple AWS accounts or all AWS regions simultaneously (PoC likely targets one account, 1-2 regions).
* Automated or scheduled discovery runs (manual trigger only for PoC).
* Automatic linking or reconciliation of discovered AWS resources with `guardian-manifest.yaml`-defined services.
* UI actions to "onboard" a discovered resource (e.g., prompting manifest creation).
* Real-time status monitoring of AWS resources.
* Implementation of the final, custom least-privilege IAM policy (this is an *outcome* and next step *after* the PoC helps identify required permissions).

---

This PRD focuses narrowly on getting the AWS resource listing capability demonstrated at a basic level for the Proof of Concept. It acknowledges the temporary use of broader permissions and sets the stage for more robust and secure implementation later.
