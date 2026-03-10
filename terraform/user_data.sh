#!/bin/bash
yum update -y
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"  # You'll need to store these securely

# Pull and run your app image (replace with your Docker Hub username)
docker pull yourusername/rps-cloud:latest
docker run -d -p 3000:3000 \
  -e DB_HOST=${db_host} \
  -e DB_PASSWORD=${db_password} \
  -e REDIS_HOST=${redis_host} \
  yourusername/rps-cloud:latest