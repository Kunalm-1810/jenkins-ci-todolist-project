pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        IMAGE_TAG        = "v${BUILD_NUMBER}"
        DEPLOYMENT_REPO  = "github.com/Kunalm-1810/k8s-manifest-deployment-repo-todolist.git"
        NVD_API_KEY      = credentials('nvd-api-key')
    }

    tools {
        nodejs 'NodeJS-18'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Set Image Names') {
            steps {
                script {
                    def accountId = sh(script: "aws sts get-caller-identity --query Account --output text", returnStdout: true).trim()
                    env.AWS_ECR_REGISTRY = "${accountId}.dkr.ecr.ap-south-1.amazonaws.com"
                    env.FE_IMAGE = "${env.AWS_ECR_REGISTRY}/project-frontend"
                    env.BE_IMAGE = "${env.AWS_ECR_REGISTRY}/project-backend"
                }
            }
        }

        stage('SonarQube Analysis') {
            parallel {
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            withSonarQubeEnv('sonarqube-server') {
                                script {
                                    def scannerHome = tool name: 'sonar-scanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
                                    sh """
                                      ${scannerHome}/bin/sonar-scanner \
                                      -Dsonar.projectKey=mern-frontend \
                                      -Dsonar.sources=src \
                                      -Dsonar.exclusions=node_modules/**
                                    """
                                }
                            }
                        }
                    }
                }
                stage('Backend') {
                    steps {
                        dir('backend') {
                            withSonarQubeEnv('sonarqube-server') {
                                script {
                                    def scannerHome = tool name: 'sonar-scanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
                                    sh """
                                        ${scannerHome}/bin/sonar-scanner \
                                        -Dsonar.projectKey=mern-backend \
                                        -Dsonar.sources=. \
                                        -Dsonar.exclusions=node_modules/**
                                    """
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('OWASP Dependency Check') {
            stages {
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm install'
                            sh '''
                                /opt/dependency-check/bin/dependency-check.sh \
                                  --project mern-frontend \
                                  --scan . \
                                  --exclude "**/node_modules/**" \
                                  --format HTML \
                                  --out dependency-check-frontend-report \
                                  --data /opt/dependency-check/data \
                                  --nvdApiKey ${NVD_API_KEY} \
                                  --disableOssIndex \
                                  --disableNodeAudit
                            '''
                            archiveArtifacts artifacts: 'dependency-check-frontend-report/**'
                        }
                    }
                }
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh '''
                                /opt/dependency-check/bin/dependency-check.sh \
                                  --project mern-backend \
                                  --scan . \
                                  --exclude "**/node_modules/**" \
                                  --format HTML \
                                  --out dependency-check-backend-report \
                                  --data /opt/dependency-check/data \
                                  --nvdApiKey ${NVD_API_KEY} \
                                  --disableOssIndex \
                                  --disableNodeAudit
                            '''
                            archiveArtifacts artifacts: 'dependency-check-backend-report/**'
                        }
                    }
                }
            }
        }

        stage('Trivy File Scan') {
            parallel {
                stage('Frontend') {
                    steps {
                        sh '''
                            trivy fs \
                              --severity HIGH,CRITICAL \
                              --format table \
                              --cache-dir /tmp/trivy-cache-fe \
                              -o trivy-frontend-fs-report.txt \
                              ./frontend
                        '''
                        archiveArtifacts artifacts: 'trivy-frontend-fs-report.txt'
                    }
                }
                stage('Backend') {
                    steps {
                        sh '''
                            trivy fs \
                              --severity HIGH,CRITICAL \
                              --format table \
                              --cache-dir /tmp/trivy-cache-be \
                              -o trivy-backend-fs-report.txt \
                              ./backend
                        '''
                        archiveArtifacts artifacts: 'trivy-backend-fs-report.txt'
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Frontend') {
                    steps {
                        sh "docker build -t ${env.FE_IMAGE}:${IMAGE_TAG} ./frontend"
                    }
                }
                stage('Backend') {
                    steps {
                        sh "docker build -t ${env.BE_IMAGE}:${IMAGE_TAG} ./backend"
                    }
                }
            }
        }

        stage('Docker Compose Validation') {
            steps {
                sh '''
                    FE_IMAGE=${FE_IMAGE} BE_IMAGE=${BE_IMAGE} IMAGE_TAG=${IMAGE_TAG} docker compose up -d
                    sleep 20
                    docker compose ps
                '''
            }
        }

        stage('Push to AWS ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ${FE_IMAGE%%/*}
                    docker push ${FE_IMAGE}:${IMAGE_TAG}
                    docker push ${BE_IMAGE}:${IMAGE_TAG}
                '''
            }
        }

        stage('Trivy Image Scan') {
            parallel {
                stage('Frontend') {
                    steps {
                        sh '''
                            trivy image \
                              --exit-code 0 \
                              --severity HIGH,CRITICAL \
                              --scanners vuln \
                              --cache-dir /tmp/trivy-cache-fe \
                              --format table \
                              -o trivy-frontend-image-report.txt \
                              ${FE_IMAGE}:${IMAGE_TAG}
                        '''
                        archiveArtifacts artifacts: 'trivy-frontend-image-report.txt'
                    }
                }
                stage('Backend') {
                    steps {
                        sh '''
                            trivy image \
                              --exit-code 0 \
                              --severity HIGH,CRITICAL \
                              --scanners vuln \
                              --cache-dir /tmp/trivy-cache-be \
                              --format table \
                              -o trivy-backend-image-report.txt \
                              ${BE_IMAGE}:${IMAGE_TAG}
                        '''
                        archiveArtifacts artifacts: 'trivy-backend-image-report.txt'
                    }
                }
            }
        }

        stage('Update Deployment Files') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                    sh """
                    git clone https://${GIT_USER}:${GIT_PASS}@github.com/Kunalm-1810/k8s-manifest-deployment-repo-todolist.git k8s-repo
                    cd k8s-repo && \\
                    yq -i '.image.tag = "${IMAGE_TAG}"' charts/frontend/values.yaml && \\
                    yq -i '.image.tag = "${IMAGE_TAG}"' charts/backend/values.yaml && \\
                    git config user.email "jenkins@ci.com" && \\
                    git config user.name "Jenkins" && \\
                    git add charts/frontend/values.yaml charts/backend/values.yaml && \\
                    git diff --cached --quiet || git commit -m "Update image tags to ${IMAGE_TAG}" && \\
                    git push https://${GIT_USER}:${GIT_PASS}@github.com/Kunalm-1810/k8s-manifest-deployment-repo-todolist.git main
                    cd .. && rm -rf k8s-repo
                    """
                }
            }
        }
    }
     

    post {
        always {
            sh "docker rmi ${env.FE_IMAGE}:${IMAGE_TAG} ${env.BE_IMAGE}:${IMAGE_TAG} || true"
            cleanWs()
        }
        failure {
            echo "Pipeline failed — check stage logs above."
        }
    }
}
