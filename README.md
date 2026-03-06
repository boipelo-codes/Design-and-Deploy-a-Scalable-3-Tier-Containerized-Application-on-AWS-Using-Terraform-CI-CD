# 🚀 RPS Cloud – Scalable 3-Tier Multiplayer Game on AWS

This project transforms a local Rock Paper Scissors game into a production‑ready, highly available cloud application on AWS. It follows the **Mid‑Level Cloud Engineering Project** guidelines, implementing a 3‑tier architecture using Infrastructure as Code (Terraform), CI/CD (GitHub Actions), containerization (Docker), and monitoring (CloudWatch).

## 🎯 Project Goals

- Design a secure, scalable AWS VPC with public/private subnets
- Deploy a containerized Node.js app with auto‑scaling
- Use PostgreSQL (RDS) for persistent user scores
- Implement real‑time multiplayer via Socket.IO with Redis (ElastiCache)
- Automate infrastructure provisioning with Terraform
- Set up CI/CD pipeline with GitHub Actions
- Configure CloudWatch monitoring and alarms
- Document architecture, security, and cost estimation

## 🏗️ Architecture Overview

*(Placeholder: architecture diagram to be added)*

The application consists of:

- **Presentation Tier**: Static frontend served via the same Node.js backend (Express)
- **Application Tier**: Node.js + Socket.IO, running in Docker on EC2 behind an Application Load Balancer
- **Data Tier**: PostgreSQL on RDS (private subnet) and Redis on ElastiCache (for Socket.IO multi‑instance support)

All infrastructure is defined in Terraform and deployed via CI/CD.

## 📅 4‑Week Implementation Plan

### Week 1 – Application & Containerization
- [x] Set up GitHub repository and initial documentation
- [ ] Adapt existing game to use PostgreSQL instead of MongoDB
- [ ] Add Redis adapter for Socket.IO
- [ ] Write Dockerfile and test locally with Docker Compose
- [ ] Push Docker image to Docker Hub

### Week 2 – Infrastructure as Code (Terraform)
- [ ] Design VPC with public/private subnets, NAT gateway, internet gateway
- [ ] Provision RDS PostgreSQL and ElastiCache Redis
- [ ] Create launch template, ALB, auto scaling group
- [ ] Configure security groups and IAM roles
- [ ] Apply Terraform and verify resources

### Week 3 – CI/CD & Deployment Automation
- [ ] Create GitHub Actions workflow to build and push Docker image
- [ ] Automate deployment to EC2 (via rolling update or instance refresh)
- [ ] Test end‑to‑end pipeline

### Week 4 – Monitoring, Scaling & Security
- [ ] Set up CloudWatch logs and custom metrics
- [ ] Configure auto scaling policies (CPU thresholds)
- [ ] Implement security best practices (encryption, parameter store, least privilege)
- [ ] Create CloudWatch alarms and dashboard
- [ ] Finalize documentation and architecture diagram

## 🛠️ Tech Stack

| Layer         | Technology                          |
|---------------|--------------------------------------|
| **Frontend**  | HTML5, CSS3, JavaScript (ES6)       |
| **Backend**   | Node.js, Express, Socket.IO          |
| **Database**  | PostgreSQL (Amazon RDS)               |
| **Caching**   | Redis (Amazon ElastiCache)            |
| **Container** | Docker                               |
| **IaC**       | Terraform                            |
| **CI/CD**     | GitHub Actions                       |
| **Monitoring**| Amazon CloudWatch                    |
| **Cloud**     | AWS (VPC, EC2, ALB, RDS, ElastiCache)|

## 📂 Repository Structure

├── backend/ # Node.js application code
├── frontend/ # Static frontend files
├── terraform/ # Terraform configuration
├── .github/workflows/ # GitHub Actions CI/CD pipelines
├── docs/ # Architecture diagrams, documentation
└── README.md


## 🚀 Getting Started (Development)

*Instructions will be added as the project progresses.*

## 📄 License

MIT

## 🙏 Acknowledgments

- The Odin Project for the original game idea
- AWS, HashiCorp, and the open‑source community