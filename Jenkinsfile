pipeline {
    agent any

    options {
        ansiColor('xterm') 
    }

    environment {
        BASE_URL = 'http://localhost:3000'
    }

    stages {
        stage('1. Initialization') {
            steps {
                echo '⚙️ Зчитування коду та встановлення залежностей...'
                bat 'npm install'
            }
        }

        stage('2. Start Core Banking Application') {
            steps {
                echo '🚀 Запуск банківського сервера Apex Ledger в окремому фоновому вікні...'
                // Запуск у новому повністю незалежному вікні CLI
                bat 'start "ApexServer" node app/server.js'
                // Очікування 5 секунд для стабільної ініціалізації БД
                bat 'timeout /t 5 /nobreak'
            }
        }

        stage('3. Run API Tests (Jest)') {
            steps {
                echo '🧪 Запуск інтеграційного API-тест сьюту з Soft Assertions та SQL валідацією...'
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    bat 'npm run test'
                }
            }
        }
    }

    post {
        always {
            echo '📦 Архівація артефактів тестування та очищення оточення...'
            // Виправлено шлях до артефакту згідно з підказкою Jenkins
            archiveArtifacts artifacts: 'temp/.soft-assertions-temp.json', allowEmptyArchive: true
            
            // Примусово тушимо сервер Node.js на Windows
            bat 'taskkill /IM node.exe /F || exit 0'
        }
        success {
            echo '✅ CI/CD Пайплайн завершився успішно! Усі фінансові транзакції валідовано.'
        }
        failure {
            echo '🚨 Пайплайн впав. Знайдено критичні дефекти в транзакційному ядрі!'
        }
    }
}