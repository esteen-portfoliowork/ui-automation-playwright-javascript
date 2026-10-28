pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Install Browsers') {
            steps {
                sh 'npx playwright install --with-deps'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npx playwright test'
            }
        }
    }

    post {
        always {

            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Report'
            ])

            slackSend(
                channel: 'C0CD1PMAN2D',
                color: currentBuild.currentResult == 'SUCCESS' ? 'good' : 'danger',
                message: """
                🚀 Playwright Execution Finished

                👤 Triggered By: ${env.BUILD_USER}
                📦 Repository: ${env.JOB_NAME}

                📊 Status: ${currentBuild.currentResult}
                🏗 Build: #${env.BUILD_NUMBER}
                🌿 Branch: ${env.BRANCH_NAME}
                🔗 ${env.BUILD_URL}
                """
            )
        }
    }
}