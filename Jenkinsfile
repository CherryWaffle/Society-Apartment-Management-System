pipeline {
    agent any

    tools {
        nodejs 'node20'
    }

    environment {
        // You can set global environment variables here
        NODE_ENV = 'development'
    }

    stages {
        stage('Checkout') {
            steps {
                // Checkout code from Git
                checkout scm
            }
        }

        stage('Backend: Install') {
            steps {
                dir('backend') {
                    echo 'Installing Backend Dependencies...'
                    // Use bat instead of sh if running Jenkins natively on Windows 
                    // However, 'sh' is standard for Docker/Linux Jenkins setups
                    sh 'npm install'
                }
            }
        }

        stage('Frontend Web: Build') {
            steps {
                dir('frontend-web') {
                    echo 'Installing Web Dependencies...'
                    sh 'npm install'
                    
                    echo 'Building Web App...'
                    sh 'npm run build'
                }
            }
        }

        stage('Frontend Mobile: Install') {
            steps {
                dir('frontend-mobile') {
                    echo 'Installing Mobile Dependencies...'
                    sh 'npm install'
                }
            }
        }

        stage('Docker: Build Images') {
            steps {
                echo 'Skipping Docker build in Jenkins container as it does not have Docker installed by default.'
                // Normally this would be: sh 'docker-compose build'
                // However, since Jenkins is running INSIDE Docker, 
                // nested Docker-in-Docker requires advanced setup.
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution complete.'
        }
        success {
            echo '✅ All stages completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed. Please check the stage logs.'
        }
    }
}
