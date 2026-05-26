pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        IMAGE_TAG              = "v${BUILD_NUMBER}"
        DEPLOYMENT_REPO        = "https://github.com/Kunalm-1810/to-do-list-app-k8s-manifest.git"  // replace with your actual deployment repo
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
                    env.FE_IMAGE = "${DOCKERHUB_CREDENTIALS_USR}/mern-frontend"
                    env.BE_IMAGE = "${DOCKERHUB_CREDENTIALS_USR}/mern-backend"
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
                    FE_IMAGE=${FE_IMAGE} BE_IMAGE=${BE_IMAGE} IMAGE_TAG=${IMAGE_TAG} docker compose down
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh '''
                    echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin
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
            environment {
                GIT_CREDENTIALS = credentials('github-credentials')
            }
            steps {
                sh '''
                    git clone ${DEPLOYMENT_REPO} k8s-repo
                    cd k8s-repo
                    yq -i ".spec.template.spec.containers[0].image = \"${FE_IMAGE}:${IMAGE_TAG}\"" frontend/fe_deployment.yaml
                    yq -i ".spec.template.spec.containers[0].image = \"${BE_IMAGE}:${IMAGE_TAG}\"" backend/be_deployment.yaml
                    git config user.email "jenkins@ci.com"
                    git config user.name "Jenkins"
                    git add frontend/fe_deployment.yaml backend/be_deployment.yaml
                    git commit -m "Update image tags to ${IMAGE_TAG}" | echo "No changes to commit"
                    git push https://${GIT_CREDENTIALS_USR}:${GIT_CREDENTIALS_PSW}@github.com/Kunalm-1810/to-do-list-app-k8s-manifest.git main
                    cd .. && rm -rf k8s-repo
                '''
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
