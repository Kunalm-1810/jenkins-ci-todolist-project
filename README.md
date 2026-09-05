# 📋 MERN Stack TodoList — DevSecOps CI Pipeline with Jenkins

[![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestration-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![SonarQube](https://img.shields.io/badge/SonarQube-Code%20Quality-4E9BCD?logo=sonarqube&logoColor=white)](https://www.sonarqube.org/)
[![Trivy](https://img.shields.io/badge/Trivy-Security%20Scan-1904DA?logo=aqua&logoColor=white)](https://trivy.dev/)
[![AWS ECR](https://img.shields.io/badge/AWS%20ECR-Registry-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/ecr/)


---

## 📖 Project Overview

A production-oriented 3-tier MERN Stack TodoList application demonstrating a complete DevSecOps Continuous Integration workflow with Jenkins. Every code push automatically triggers a secure CI pipeline that validates code quality with SonarQube, enforces quality gates, scans dependencies using OWASP Dependency-Check, performs Trivy filesystem and Docker image vulnerability scans, builds versioned container images with Docker, and publishes them to AWS ECR.

The project focuses on shift-left security, automated quality enforcement, parallel CI execution, immutable image versioning, and artifact traceability, providing a practical implementation of modern DevSecOps CI practices..

```
![Jenkins CI Workflow](images/jenkins-ci-workflow.png)
```

### Application

A full-stack **Todo List** app where users can create, complete, and delete tasks. Built with:
- **Frontend** — React 17 + Material UI, served via Nginx
- **Backend** — Node.js + Express REST API
- **Database** — MongoDB with Mongoose ODM

---

## ✨ Key Features

### Application Features
- ✅ Create, complete, and delete tasks
- ✅ Real-time UI updates with optimistic rendering
- ✅ Health check endpoints (`/healthz`, `/ready`, `/started`) for Kubernetes probes
- ✅ Environment-driven backend URL configuration via `REACT_APP_BACKEND_URL`
- ✅ Multi-stage Docker builds for minimal image size

### DevSecOps Features
- 🔒 **Shift-left security** — vulnerabilities caught before deployment
- 🧪 **SonarQube** code quality gates block bad code from progressing
- 🛡️ **OWASP Dependency-Check** scans third-party libraries for known CVEs
- 🔍 **Trivy** scans both source filesystem and built Docker images
- 🚀 **GitOps** with ArgoCD — cluster state always matches Git
- 📦 **Helm** charts for templated, repeatable Kubernetes deployments
- 🔄 **Parallel pipeline stages** for faster CI execution
- 📊 **Archived scan reports** for audit and compliance

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 17, Material UI, Nginx | User interface, served as static build |
| **Backend** | Node.js 20, Express 4 | REST API server |
| **Database** | MongoDB 7 | Persistent task storage |
| **Containerization** | Docker, Docker Compose | Image builds, local validation |
| **Registry** | AWS ECR | Versioned image storage |
| **CI Server** | Jenkins | Pipeline orchestration |
| **Code Quality** | SonarQube LTS | Static analysis, quality gates |
| **Dependency Scan** | OWASP Dependency-Check v10 | Third-party CVE detection |
| **Image/FS Scan** | Trivy | Filesystem & container image scanning |
| **Image push to ECR** | AWS ECR | Image on aws conatiner registry |
| **Source Control** | Github | Source code management and Jenkins webhook trigger | 

---

## 🏗️ Architecture

### Application Architecture (3-Tier)

```
┌─────────────────────────────────────────────────────────┐
│                    AWS EKS Cluster                       │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │   Frontend   │───▶│   Backend    │───▶│  MongoDB  │  │
│  │  React/Nginx │    │  Node/Express│    │           │  │
│  │   Port: 80   │    │  Port: 3500  │    │ Port:27017│  │
│  └──────────────┘    └──────────────┘    └───────────┘  │
│         ▲                                                │
│         │                                                │
│  ┌──────────────┐                                        │
│  │  Ingress /   │                                        │
│  │  LoadBalancer│                                        │
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline Architecture

```
![DevSecOps CI Pipeline](images/devsecops-ci.png)
```

---

## 🔄 CI/CD Pipeline Stages

### Pipeline Overview

| # | Stage | Tool | Runs In Parallel | Purpose |
|---|---|---|---|---|
| 1 | Checkout | Git/Jenkins | — | Pull source code from GitHub |
| 2 | Set Image Names | AWS CLI | — | Resolve ECR registry URL dynamically |
| 3 | SonarQube Analysis | SonarQube Scanner | ✅ FE + BE | Static code analysis |
| 4 | Quality Gate | SonarQube | — | Block pipeline if quality fails |
| 5 | OWASP Dependency Check | dependency-check.sh | ✅ FE + BE | Scan third-party libraries for CVEs |
| 6 | Trivy FS Scan | Trivy | ✅ FE + BE | Scan source files for secrets & misconfigs |
| 7 | Build Docker Images | Docker | ✅ FE + BE | Build versioned container images |
| 8 | Push to AWS ECR | Docker + AWS CLI | — | Publish images to private registry |
| 9 | Trivy Image Scan | Trivy | ✅ FE + BE | Scan built images for OS/library CVEs |
| 10 | Update Deployment Files | sed + Git + SSH | — | Update Helm `values.yaml` with new image tag |

---

### Stage-by-Stage Breakdown

#### 1️⃣ Checkout
```
Trigger: GitHub webhook on push to main
Action:  Jenkins checks out the source code via `checkout scm`
```

#### 2️⃣ Set Image Names
```
Action:  Calls `aws sts get-caller-identity` to get the AWS account ID
Output:  Dynamically sets ECR registry URL, FE_IMAGE, and BE_IMAGE env vars
Why:     Avoids hardcoding account IDs — works across AWS accounts
```

#### 3️⃣ SonarQube Analysis *(Parallel: Frontend + Backend)*
```
Tool:    SonarQube Scanner
Scans:   frontend/src  |  backend/
Skips:   node_modules/**
Config:  sonar-project.properties in each component directory
Output:  Code smells, bugs, vulnerabilities, coverage reports in SonarQube UI
```

#### 4️⃣ Quality Gate
```
Tool:    SonarQube (waitForQualityGate)
Timeout: 10 minutes
Action:  Polls SonarQube for gate result — aborts pipeline if FAILED
Why:     Enforces minimum code quality standards before any build happens
```

#### 5️⃣ OWASP Dependency Check *(Sequential: Frontend → Backend)*
```
Tool:    /opt/dependency-check/bin/dependency-check.sh
Scans:   package.json dependencies for known CVEs (NVD database)
Output:  HTML report archived as Jenkins artifact
API Key: NVD API key injected via Jenkins credentials (nvd-api-key)
```

#### 6️⃣ Trivy Filesystem Scan *(Parallel: Frontend + Backend)*
```
Tool:     Trivy
Severity: HIGH, CRITICAL
Scans:    Source code directories for secrets, misconfigurations
Output:   trivy-frontend-fs-report.txt / trivy-backend-fs-report.txt (archived)
Cache:    /tmp/trivy-cache-fe|be (speeds up repeated scans)
```

#### 7️⃣ Build Docker Images *(Parallel: Frontend + Backend)*
```
Frontend: docker build --build-arg REACT_APP_BACKEND_URL=<url> -t <ECR>/project-frontend:v{N}
Backend:  docker build -t <ECR>/project-backend:v{N}
Tag:      v{BUILD_NUMBER} — immutable, traceable versioning
```

#### 8️⃣ Push to AWS ECR
```
Auth:   aws ecr get-login-password | docker login
Pushes: Both frontend and backend images to their respective ECR repositories
```

#### 9️⃣ Trivy Image Scan *(Parallel: Frontend + Backend)*
```
Tool:      Trivy
Scan type: Built Docker images (OS packages + app libraries)
Severity:  HIGH, CRITICAL
Exit code: 0 (informational — does not block pipeline)
Output:    trivy-frontend-image-report.txt / trivy-backend-image-report.txt (archived)
```

#### 🔟 Update Deployment Files (GitOps)
```
Action:  Clones the K8s manifest repo via SSH
         Runs sed to update `tag:` in charts/frontend/values.yaml
                                    charts/backend/values.yaml
         Commits and pushes only if values actually changed
Result:  ArgoCD detects the change and rolls out new pods to EKS
```

---

## 🔧 Jenkins Server Setup

> All steps target **Ubuntu 22.04** on an AWS EC2 instance.

### 1. System Update

```bash
sudo apt update -y && sudo apt upgrade -y
```

### 2. Java (Jenkins dependency)

```bash
sudo apt install -y fontconfig openjdk-21-jre
java -version
```

### 3. Jenkins
[Jenkins doumnetations](https://www.jenkins.io/doc/book/installing/linux/#debianubuntu)
```bash
sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key

echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc]" \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update && sudo apt install -y jenkins
sudo systemctl enable --now jenkins

# Retrieve initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### 4. Docker
[Docker official Documentation](https://docs.docker.com/engine/install/ubuntu/)
```bash
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable --now docker

# Grant Jenkins access to Docker socket
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### 5. Trivy
[Trivy official Doumnetation](https://trivy.dev/docs/latest/getting-started/installation/)
```bash
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | \
  gpg --dearmor | sudo tee /etc/apt/keyrings/trivy.gpg > /dev/null

echo "deb [signed-by=/etc/apt/keyrings/trivy.gpg] \
  https://aquasecurity.github.io/trivy-repo/deb generic main" | \
  sudo tee /etc/apt/sources.list.d/trivy.list > /dev/null

sudo apt-get update && sudo apt-get install -y trivy
```

### 6. AWS CLI
[AWS CLI official Doumnentation](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt install -y unzip && unzip awscliv2.zip
sudo ./aws/install
aws --version
```

### 7. OWASP Dependency-Check

```bash
cd /opt
sudo wget https://github.com/jeremylong/DependencyCheck/releases/download/v10.0.4/dependency-check-10.0.4-release.zip
sudo unzip dependency-check-10.0.4-release.zip
sudo chmod +x /opt/dependency-check/bin/dependency-check.sh
```

> ⚠️ **Run once manually** to pre-populate the NVD database (takes 10–15 min):
> ```bash
> /opt/dependency-check/bin/dependency-check.sh \
>   --updateonly \
>   --nvdApiKey <YOUR_NVD_API_KEY>
> ```
> Get a free API key at: https://nvd.nist.gov/developers/request-an-api-key

### 8. SonarQube (Docker container on same server)

```bash
docker run -d \
  --name sonarqube \
  --restart always \
  -p 9000:9000 \
  sonarqube:lts-community
```

> Access at `http://<EC2-IP>:9000` — default login: `admin / admin`

---

## 🔌 Jenkins Configuration

### Required Plugins

Go to **Manage Jenkins → Plugins → Available plugins** and install:

| Plugin | Purpose |
|---|---|
| GitHub Integration | Webhook-triggered builds on push |
| SonarQube Scanner | SonarQube analysis integration |
| NodeJS | Managed Node.js tool installation |
| Docker | Docker build/push steps |
| Docker Compose Build Step | Compose validation support |
| OWASP Dependency-Check | Scan report publishing |
| SSH Agent | SSH key injection for Git operations |
| Blue Ocean *(optional)* | Visual pipeline UI |

### Manage Tools

**Manage Jenkins → Tools:**

| Tool | Name to Set | Notes |
|---|---|---|
| SonarQube Scanner | `sonar-scanner` | Auto-install latest |
| NodeJS | `NodeJS-18` | Version 18.x |
| Git | *(default)* | Verify path |

### Manage System

**Manage Jenkins → System → SonarQube installations:**

| Field | Value |
|---|---|
| Name | `sonarqube-server` |
| Server URL | `http://<EC2-IP>:9000` |
| Auth Token | Select `sonarqube-token` credential |

### Credentials

**Manage Jenkins → Credentials → Global → Add Credential:**

| Credential ID | Kind | Description |
|---|---|---|
| `sonarqube-token` | Secret text | SonarQube global analysis token |
| `nvd-api-key` | Secret text | NVD API key for OWASP scans |
| `github-ssh-key` | SSH Username with private key | SSH key for pushing to manifest repo |

> AWS credentials are provided via **IAM Role attached to the EC2 instance** — no plugin or stored credentials needed.

### GitHub Webhook

In your GitHub repo → **Settings → Webhooks → Add webhook:**

| Field | Value |
|---|---|
| Payload URL | `http://<EC2-IP>:8080/github-webhook/` |
| Content type | `application/json` |
| Trigger | Just the push event |

### Create Pipeline Job

1. **New Item** → Pipeline → enter a name
2. **Build Triggers** → ✅ GitHub hook trigger for GITScm polling
3. **Pipeline** → Pipeline script from SCM
   - SCM: `Git`
   - Repository URL: your CI repo URL
   - Credentials: `github-credentials`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
4. **Save**

---

## 📄 SonarQube Setup

### 1. Create Projects

**Projects → Create Project → Manually:**

| Project Key | Display Name |
|---|---|
| `mern-frontend` | MERN Frontend |
| `mern-backend` | MERN Backend |

### 2. Generate Token

**My Account → Security → Generate Tokens:**
- Name: `jenkins-token`
- Type: `Global Analysis Token`
- Copy the token → add to Jenkins as `sonarqube-token` (Secret text)

---

## 📁 Repository Structure

```
jenkins-ci-repo-todolist/
├── Jenkinsfile                    # CI pipeline definition
├── docker-compose.yml             # Local multi-container stack
├── pre-requisites                 # Server setup reference
│
├── frontend/
│   ├── Dockerfile                 # Multi-stage: Node build → Nginx serve
│   ├── sonar-project.properties   # SonarQube project config
│   ├── .dockerignore
│   ├── package.json
│   └── src/
│       ├── App.js                 # Main React component
│       ├── Tasks.js               # Task CRUD logic (base class)
│       └── services/
│           └── taskServices.js    # Axios API calls
│
└── backend/
    ├── Dockerfile                 # Node 20 Alpine image
    ├── sonar-project.properties   # SonarQube project config
    ├── .dockerignore
    ├── index.js                   # Express server + health endpoints
    ├── db.js                      # MongoDB connection
    ├── package.json
    ├── models/
    │   └── task.js                # Mongoose schema
    └── routes/
        └── tasks.js               # CRUD route handlers
```

---

## 📝 Jenkinsfile Explained

### Environment Block
```groovy
environment {
    IMAGE_TAG        = "v${BUILD_NUMBER}"          // Immutable version tag per build
    DEPLOYMENT_REPO  = "git@github.com:..."        // SSH URL of K8s manifest repo
    NVD_API_KEY      = credentials('nvd-api-key')  // Injected securely from Jenkins vault
    REACT_APP_BACKEND_URL = "https://..."          // Baked into React build at compile time
}
```

### Dynamic ECR Registry Resolution
```groovy
def accountId = sh(script: "aws sts get-caller-identity --query Account --output text", returnStdout: true).trim()
env.AWS_ECR_REGISTRY = "${accountId}.dkr.ecr.ap-south-1.amazonaws.com"
```
> Uses the EC2 instance's IAM role — no hardcoded credentials.

### Parallel Stages Pattern
```groovy
stage('SonarQube Analysis') {
    parallel {
        stage('Frontend') { ... }
        stage('Backend')  { ... }
    }
}
```
> Frontend and backend scans run simultaneously, cutting pipeline time roughly in half.

### Quality Gate Enforcement
```groovy
stage('Quality Gate') {
    steps {
        timeout(time: 10, unit: 'MINUTES') {
            waitForQualityGate abortPipeline: true   // Hard stop on failure
        }
    }
}
```

### GitOps Update with Idempotency
```groovy
if ! git diff --cached --quiet; then
    git commit -m "Update image tags to ${IMAGE_TAG}"
    git push origin main
fi
```
> Only commits and pushes if values actually changed — prevents empty commits.

### Post Block (Cleanup)
```groovy
post {
    always {
        sh "docker rmi ${env.FE_IMAGE}:${IMAGE_TAG} ${env.BE_IMAGE}:${IMAGE_TAG} || true"
        cleanWs()   // Wipes workspace to prevent disk bloat
    }
}
```

---

## 🐳 Local Development with Docker Compose

Run the full stack locally to validate before pushing:

```bash
export BE_IMAGE=<your-ecr-registry>/project-backend
export FE_IMAGE=<your-ecr-registry>/project-frontend
export IMAGE_TAG=local

docker compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:8086 |
| Backend API | http://localhost:3500/api/tasks |
| MongoDB | localhost:27017 |

---

## 🧹 Cleanup

### Remove SonarQube container
```bash
docker stop sonarqube && docker rm sonarqube
```

### Full EC2 teardown
```bash
sudo systemctl stop jenkins docker

sudo apt-get remove --purge -y jenkins docker-ce docker-ce-cli containerd.io trivy openjdk-21-jre
sudo rm -f /etc/apt/sources.list.d/{jenkins,docker,trivy}.list
sudo rm -f /etc/apt/keyrings/{jenkins-keyring,docker,trivy}.{asc,gpg}
sudo rm -rf /usr/local/aws-cli /usr/local/bin/aws /opt/dependency-check /usr/bin/yq

sudo apt-get autoremove -y && sudo apt-get clean
```

---
CI complete 

*Built as a hands-on DevSecOps project demonstrating automated CI,
code quality enforcement, dependency scanning, filesystem scanning,
Docker image security scanning, and publishing versioned images to AWS ECR.*
