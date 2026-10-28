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
                channel: '#jenkins-run',
                color: currentBuild.currentResult == 'SUCCESS' ? 'good' : 'danger',
                message: """
                🚀 Playwright Execution Finished

                📊 Status: ${currentBuild.currentResult}
                🏗 Build: #${env.BUILD_NUMBER}

                🔗 ${env.BUILD_URL}
                """
            )
        }
    }
}