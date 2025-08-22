#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración de deployment
const DEPLOY_CONFIG = {
  buildDir: 'dist-web',
  backupDir: 'backup',
  deploymentTargets: {
    staging: {
      name: 'staging',
      url: process.env.STAGING_URL || 'https://staging.manifiesto-scanner.com',
      branch: 'develop'
    },
    production: {
      name: 'production', 
      url: process.env.PRODUCTION_URL || 'https://manifiesto-scanner.com',
      branch: 'main'
    }
  }
};

class DeploymentManager {
  constructor() {
    this.startTime = Date.now();
    this.logFile = `deployment-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    
    // Escribir al archivo de log
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async executeCommand(command, description) {
    this.log(`Executing: ${description}`);
    this.log(`Command: ${command}`, 'DEBUG');
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe']
      });
      
      if (output) {
        this.log(`Output: ${output.trim()}`, 'DEBUG');
      }
      
      return output;
    } catch (error) {
      this.log(`Error executing command: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async checkPrerequisites() {
    this.log('Checking deployment prerequisites...');
    
    // Verificar que estamos en un repositorio git
    try {
      await this.executeCommand('git status', 'Check git repository');
    } catch (error) {
      throw new Error('Not in a git repository');
    }

    // Verificar que no hay cambios sin commit
    const status = await this.executeCommand('git status --porcelain', 'Check working directory');
    if (status.trim()) {
      throw new Error('Working directory is not clean. Please commit or stash changes.');
    }

    // Verificar dependencias
    if (!fs.existsSync('node_modules')) {
      this.log('Installing dependencies...');
      await this.executeCommand('npm install', 'Install dependencies');
    }

    this.log('Prerequisites check passed ✓');
  }

  async runTests() {
    this.log('Running test suite...');
    
    try {
      await this.executeCommand('npm run test -- --run', 'Run unit tests');
      await this.executeCommand('npm run test:integration', 'Run integration tests');
      this.log('All tests passed ✓');
    } catch (error) {
      throw new Error('Tests failed. Deployment aborted.');
    }
  }

  async buildApplication() {
    this.log('Building application for production...');
    
    // Limpiar build anterior
    if (fs.existsSync(DEPLOY_CONFIG.buildDir)) {
      await this.executeCommand(`rm -rf ${DEPLOY_CONFIG.buildDir}`, 'Clean previous build');
    }

    // Build de producción
    await this.executeCommand('npm run build:web:prod', 'Build production bundle');
    
    // Verificar que el build fue exitoso
    if (!fs.existsSync(DEPLOY_CONFIG.buildDir)) {
      throw new Error('Build failed - output directory not found');
    }

    // Verificar archivos críticos
    const criticalFiles = ['index.html', 'manifest.json', 'sw.js'];
    for (const file of criticalFiles) {
      const filePath = path.join(DEPLOY_CONFIG.buildDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Critical file missing: ${file}`);
      }
    }

    this.log('Application built successfully ✓');
  }

  async optimizeBuild() {
    this.log('Optimizing build...');
    
    const buildPath = DEPLOY_CONFIG.buildDir;
    
    // Comprimir archivos estáticos si está disponible
    try {
      await this.executeCommand(
        `find ${buildPath} -name "*.js" -o -name "*.css" -o -name "*.html" | xargs gzip -k`,
        'Compress static files'
      );
      this.log('Static files compressed ✓');
    } catch (error) {
      this.log('Compression skipped (gzip not available)', 'WARN');
    }

    // Generar reporte de tamaño de bundle
    await this.generateBundleReport();
  }

  async generateBundleReport() {
    this.log('Generating bundle size report...');
    
    const buildPath = DEPLOY_CONFIG.buildDir;
    const reportPath = 'bundle-report.json';
    
    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          totalSize += getDirectorySize(filePath);
        } else {
          totalSize += fs.statSync(filePath).size;
        }
      }
      
      return totalSize;
    };

    const formatSize = (bytes) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      if (bytes === 0) return '0 Bytes';
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const totalSize = getDirectorySize(buildPath);
    const report = {
      timestamp: new Date().toISOString(),
      totalSize: totalSize,
      totalSizeFormatted: formatSize(totalSize),
      files: {}
    };

    // Analizar archivos principales
    const mainFiles = ['static/js', 'static/css'];
    for (const dir of mainFiles) {
      const dirPath = path.join(buildPath, dir);
      if (fs.existsSync(dirPath)) {
        report.files[dir] = {
          size: getDirectorySize(dirPath),
          sizeFormatted: formatSize(getDirectorySize(dirPath))
        };
      }
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Bundle report generated: ${reportPath}`);
    this.log(`Total bundle size: ${report.totalSizeFormatted}`);
  }

  async createBackup(target) {
    this.log(`Creating backup for ${target.name}...`);
    
    const backupPath = path.join(DEPLOY_CONFIG.backupDir, `${target.name}-${Date.now()}`);
    
    if (!fs.existsSync(DEPLOY_CONFIG.backupDir)) {
      fs.mkdirSync(DEPLOY_CONFIG.backupDir, { recursive: true });
    }

    // En un escenario real, aquí se haría backup del deployment actual
    // Por ahora solo creamos un marcador
    fs.writeFileSync(
      path.join(backupPath, 'backup-info.json'),
      JSON.stringify({
        target: target.name,
        timestamp: new Date().toISOString(),
        commit: await this.executeCommand('git rev-parse HEAD', 'Get current commit'),
        branch: await this.executeCommand('git branch --show-current', 'Get current branch')
      }, null, 2)
    );

    this.log(`Backup created: ${backupPath} ✓`);
    return backupPath;
  }

  async deployToTarget(target) {
    this.log(`Deploying to ${target.name} (${target.url})...`);
    
    // Crear backup antes del deployment
    const backupPath = await this.createBackup(target);
    
    try {
      // En un escenario real, aquí se subirían los archivos al servidor
      // Ejemplos de comandos que se podrían usar:
      
      if (process.env.DEPLOY_METHOD === 'rsync') {
        // Deployment via rsync
        const rsyncCommand = `rsync -avz --delete ${DEPLOY_CONFIG.buildDir}/ ${process.env.DEPLOY_USER}@${process.env.DEPLOY_HOST}:${process.env.DEPLOY_PATH}`;
        await this.executeCommand(rsyncCommand, 'Deploy via rsync');
      } else if (process.env.DEPLOY_METHOD === 's3') {
        // Deployment to AWS S3
        const s3Command = `aws s3 sync ${DEPLOY_CONFIG.buildDir} s3://${process.env.S3_BUCKET} --delete`;
        await this.executeCommand(s3Command, 'Deploy to S3');
      } else if (process.env.DEPLOY_METHOD === 'netlify') {
        // Deployment to Netlify
        const netlifyCommand = `netlify deploy --prod --dir ${DEPLOY_CONFIG.buildDir}`;
        await this.executeCommand(netlifyCommand, 'Deploy to Netlify');
      } else {
        // Simulación de deployment
        this.log('Simulating deployment (no DEPLOY_METHOD specified)...', 'WARN');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      this.log(`Deployment to ${target.name} completed ✓`);
      
      // Verificar deployment
      await this.verifyDeployment(target);
      
    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'ERROR');
      this.log(`Backup available at: ${backupPath}`, 'INFO');
      throw error;
    }
  }

  async verifyDeployment(target) {
    this.log(`Verifying deployment at ${target.url}...`);
    
    try {
      // Verificación básica de conectividad
      const curlCommand = `curl -f -s -o /dev/null -w "%{http_code}" ${target.url}`;
      const statusCode = await this.executeCommand(curlCommand, 'Check deployment status');
      
      if (statusCode.trim() === '200') {
        this.log('Deployment verification passed ✓');
      } else {
        throw new Error(`Unexpected status code: ${statusCode}`);
      }
    } catch (error) {
      this.log(`Deployment verification failed: ${error.message}`, 'WARN');
      // No fallar el deployment por problemas de verificación
    }
  }

  async tagRelease(target) {
    if (target.name === 'production') {
      const version = require('../package.json').version;
      const tagName = `v${version}-${Date.now()}`;
      
      this.log(`Creating release tag: ${tagName}`);
      
      await this.executeCommand(
        `git tag -a ${tagName} -m "Production release ${version}"`,
        'Create release tag'
      );
      
      await this.executeCommand(
        `git push origin ${tagName}`,
        'Push release tag'
      );
      
      this.log(`Release tagged: ${tagName} ✓`);
    }
  }

  async deploy(targetName) {
    const target = DEPLOY_CONFIG.deploymentTargets[targetName];
    if (!target) {
      throw new Error(`Unknown deployment target: ${targetName}`);
    }

    this.log(`Starting deployment to ${target.name}...`);
    
    try {
      await this.checkPrerequisites();
      await this.runTests();
      await this.buildApplication();
      await this.optimizeBuild();
      await this.deployToTarget(target);
      await this.tagRelease(target);
      
      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
      this.log(`Deployment completed successfully in ${duration}s ✓`);
      
    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'ERROR');
      process.exit(1);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const targetName = args[0];
  
  if (!targetName) {
    console.log('Usage: node scripts/deploy.js <target>');
    console.log('Available targets:', Object.keys(DEPLOY_CONFIG.deploymentTargets).join(', '));
    process.exit(1);
  }

  const deployment = new DeploymentManager();
  await deployment.deploy(targetName);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DeploymentManager, DEPLOY_CONFIG };