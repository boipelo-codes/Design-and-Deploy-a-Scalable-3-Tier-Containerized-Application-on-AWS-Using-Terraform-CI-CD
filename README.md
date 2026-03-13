# 🎮 RPS Cloud – Scalable 3‑Tier Multiplayer Game on AWS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A real‑time multiplayer Rock Paper Scissors game transformed into a production‑ready, highly available cloud application on AWS. This project demonstrates end‑to‑end cloud engineering skills including Infrastructure as Code (Terraform), containerization (Docker), CI/CD (GitHub Actions), and monitoring (CloudWatch).

---

## 📖 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Infrastructure as Code (Terraform)](#infrastructure-as-code-terraform)
- [Deployment](#deployment)
- [CI/CD Pipeline](#cicd-pipeline-github-actions)
- [Monitoring & Scaling](#monitoring--scaling)
- [Security](#security)
- [Cost Estimation](#cost-estimation)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Future Improvements](#future-improvements)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## 📌 Overview

The application is a real‑time multiplayer Rock Paper Scissors game where two players can compete, with scores persisted in a database. The original front‑end only game has been enhanced with a Node.js backend using **Socket.IO** for real‑time communication, **PostgreSQL** for data storage, and **Redis** for multi‑instance support.

The cloud deployment on AWS provides **high availability**, **auto scaling**, **security**, and **monitoring**, following the **AWS Well‑Architected Framework**.

---

## 🏗️ Architecture

The infrastructure is designed with a **3‑tier model**:

1. **Presentation Tier** – Static frontend served via the same Node.js backend (Express static files).
2. **Application Tier** – Node.js + Socket.IO running in Docker on EC2 instances behind an **Application Load Balancer**.
3. **Data Tier** – **Amazon RDS PostgreSQL** (primary database) and **Amazon ElastiCache Redis** (Socket.IO adapter) in private subnets.

All components are deployed inside a custom **VPC** with public and private subnets across two Availability Zones for fault tolerance.

![Detailed Architecture](docs/architecture-detailed.png)  
*(Add a detailed architecture diagram here)*

---

## 🛠️ Tech Stack

| Layer           | Technology                          |
|-----------------|--------------------------------------|
| **Frontend**    | HTML5, CSS3, JavaScript (ES6)       |
| **Backend**     | Node.js, Express, Socket.IO          |
| **Database**    | PostgreSQL (Amazon RDS)               |
| **Caching**     | Redis (Amazon ElastiCache)            |
| **Container**   | Docker                               |
| **IaC**         | Terraform                            |
| **CI/CD**       | GitHub Actions                       |
| **Monitoring**  | Amazon CloudWatch                    |
| **Cloud**       | AWS (VPC, EC2, ALB, RDS, ElastiCache)|

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [AWS Account](https://aws.amazon.com/) (free tier eligible)
- [AWS CLI](https://aws.amazon.com/cli/) configured (`aws configure`)
- [Terraform](https://www.terraform.io/downloads) (v1.0+)
- [Git](https://git-scm.com/)

---

## 🚀 Local Development

### Clone the repository
```bash
git clone https://github.com/boipelo-codes/Design-and-Deploy-a-Scalable-3-Tier-Containerized-Application-on-AWS-Using-Terraform-CI-CD.git
cd Design-and-Deploy-a-Scalable-3-Tier-Containerized-Application-on-AWS-Using-Terraform-CI-CD

docker compose up --build

```
## 🏗️ Infrastructure as Code (Terraform)
All AWS resources are defined in the terraform/ directory. The setup includes:

* Networking: VPC, public/private subnets, Internet Gateway, NAT Gateway, route tables.

* Security Groups: ALB, EC2, RDS, Redis.

* RDS PostgreSQL in private subnets.

* ElastiCache Redis in private subnets.

* Application Load Balancer in public subnets.

* Launch Template with user data to run the Docker container.

* Auto Scaling Group (min 2, max 4 instances) with health checks.

* IAM roles for EC2 to access Parameter Store and CloudWatch.

## Deploy the infrastructure
```bash
cd terraform
terraform init
terraform plan   # Review changes
terraform apply  # Type 'yes' to confirm
```

### After successful deployment, Terraform will output the ALB DNS name – use this to access the application.

Note: The RDS and ElastiCache instances are placed in private subnets and are not publicly accessible. The EC2 instances retrieve database credentials via AWS Systems Manager Parameter Store.

## 🔄 Deployment
The application is deployed via a rolling update mechanism using the Auto Scaling Group. After pushing a new Docker image to Docker Hub, you can refresh the ASG:
```bash
aws autoscaling start-instance-refresh --auto-scaling-group-name rps-cloud-dev-asg
```
This will gradually replace old instances with new ones running the updated image.

## ⚙️ CI/CD Pipeline (GitHub Actions)
The pipeline automates building, pushing, and deploying the application.

Workflow: .github/workflows/deploy.yml

Trigger: On push to main branch.

Build: Build Docker image with the latest code.

Push: Push image to Docker Hub (credentials stored as GitHub Secrets).

Deploy: Trigger an instance refresh on the Auto Scaling Group using the AWS CLI (via OIDC or access keys).

(Add screenshot of successful pipeline run)

## 📊 Monitoring & Scaling
### Auto Scaling
The Auto Scaling Group is configured with dynamic scaling policies based on average CPU utilization:

* Scale up when CPU > 70% for 5 minutes.

* Scale down when CPU < 30% for 10 minutes.

### CloudWatch
* Logs: EC2 instances stream application logs to CloudWatch Logs.

* Metrics: CPU, memory, disk, and custom metrics (Socket.IO connections).

* Alarms: Notify on high CPU, instance failures, etc.

* Dashboard: Visual overview of key metrics.
(Add screenshots of CloudWatch dashboards)

## 🔒 Security
* VPC Isolation: Databases in private subnets, no direct internet access.

* Security Groups: Least‑privilege rules (only required ports).

* IAM Roles: EC2 instances assume roles (no hardcoded keys).

* Secrets Management: Database credentials stored in AWS Systems Manager Parameter Store (SecureString). Retrieved at runtime via user data or application startup.

* Encryption: RDS and EBS volumes encrypted at rest.

* SSH Access: Restricted via EC2 Instance Connect Endpoint or bastion host (no public IPs)

## 💰 Cost Estimation
Using AWS Free Tier eligible resources, the estimated monthly cost is $0 (if within limits). However, once free tier expires, approximate costs:

EC2 (t2.micro × 2): ~$15/month

RDS (db.t3.micro): ~$13/month

ElastiCache (cache.t3.micro): ~$13/month

NAT Gateway: ~$32/month

Data transfer, ALB, etc.: minimal additional.

Total: ~$73/month (without free tier).
Use the AWS Pricing Calculator for precise estimates.

## 🔍 Troubleshooting
### Unhealthy Instances in Target Group
Check application logs: Connect via EC2 Instance Connect Endpoint and run sudo docker logs <container-id>.

Verify user data: sudo cat /var/log/cloud-init-output.log for errors.

Test locally: curl -v http://localhost:3000 should return 200.

Security groups: Ensure EC2 security group allows port 3000 from ALB security group, and ALB security group allows HTTP from anywhere.

### Unable to Connect via EC2 Instance Connect Endpoint
Verify endpoint status is Available.

Check that instance security group allows SSH from the endpoint's security group.

Ensure endpoint security group allows outbound SSH to the instance's security group.

Confirm IAM permissions (if using IAM user) include ec2-instance-connect:OpenTunnel.

### Database Connection Issues
* From the instance, test connectivity:
```bash
psql -h <rds-endpoint> -U postgres -d rps -W
redis-cli -h <redis-endpoint> -p 6379 ping
```
* Check RDS/Redis security groups: allow inbound from EC2 security group on respective ports.

## 🔮 Future Improvements
Add HTTPS support with AWS Certificate Manager.

Implement blue/green deployments.

Use AWS CodeDeploy for more robust deployments.

Add Prometheus + Grafana for advanced monitoring.

Create a simple lobby system or matchmaking queue.

Deploy frontend to S3 + CloudFront for better performance.

## Screenshots

| Instance Overview | Target Group Health | 
|-------------------|---------------------|
| ![EC2 Instances](/more%20screenshots/insatnces.png) | ![Target Group](/more%20screenshots/target%20groups.png) |

| Auto-Scaling Groups | Internet Gateway | 
|-------------------|---------------------|
| ![Auto-Scaling Groups](/more%20screenshots/auto%20scaling%20groups.png) | ![Internet Gateway](/more%20screenshots/rps%20internet%20gateway.png) |

| Load-Balancer | Security Groups | 
|-------------------|---------------------|
| ![Load-Balancer](/more%20screenshots/rps%20loadbalancer.png) | ![Security Groups](/more%20screenshots/security%20groups.png) |

| VPC | Subnets | 
|-------------------|---------------------|
| ![VPC](/more%20screenshots/rps%20vpc.png) | ![Subnets ](/more%20screenshots/subnets.png) |

| Endpoint | Broswer Snippet (of both players)| 
|-------------------|---------------------|
| ![ Endpoint](/more%20screenshots/enpoint.png) | ![Broswer Snippet (of both players)](/more%20screenshots/browser%20snippet.png) |


## Architectural Diagram

![Architctural Diagram](/more%20screenshots/architectural%20diagram.drawio%20(1).png)