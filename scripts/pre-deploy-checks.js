#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PreDeployChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  addError(message) {
    this.errors.push(message);
    this.log(message, 'ERROR');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, 'WARN');
  }

  executeCommand(command) {
    try {
      return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (error) {
      return null;
    }
  }

  checkGitStatus() {
    this.log('Checking Git status...');
    
    // Verificar que estamos en un repositorio git
    const gitStatus = this.executeCommand('git status --porcelain');
    if (gitStatus === null) {
      this.addError('Not in a Git repository');
      return;
    }

    // Verificar cambios sin commit
    if (gitStatus.length > 0) {
      this.addError('Working directory has uncommitted changes');
      this.log('Uncommitted files:', 'DEBUG');
      gitStatus.split('\n').forEach(line => this.log(`  ${line}`, 'DEBUG'));
    }

    // Verificar branch actual
    const currentBranch = this.executeCommand('git branch --show-current');
    if (currentBranch) {
      this.log(`Current branch: ${currentBranch}`);
      
      // Advertir si no estamos en main/master para producción
      if (process.env.DEPLOY_TARGET === 'production' && 
          !['main', 'master'].includes(currentBranch)) {
        this.addWarning(`Deploying to production from branch '${currentBranch}' instead of main/master`);
      }
    }

    // Verificar que estamos sincronizados con remote
    const behind = this.executeCommand('git rev-list --count HEAD..@{u}');
    const ahead = this.executeCommand('git rev-list --count @{u}..HEAD');
    
    if (behind && parseInt(behind) > 0) {
      this.addWarning(`Local branch is ${behind} commits behind remote`);
    }
    
    if (ahead && parseInt(ahead) > 0) {
      this.addWarning(`Local branch is ${ahead} commits ahead of remote`);
    }
  }

  checkDependencies() {
    this.log('Checking dependencies...');
    
    // Verificar package.json
    if (!fs.existsSync('package.json')) {
      this.addError('package.json not found');
      return;
    }

    // Verificar node_modules
    if (!fs.existsSync('node_modules')) {
      this.addError('node_modules not found. Run npm install first.');
      return;
    }

    // Verificar package-lock.json
    if (!fs.existsSync('package-lock.json')) {
      this.addWarning('package-lock.json not found. Consider using npm ci for reproducible builds.');
    }

    // Verificar vulnerabilidades
    const auditResult = this.executeCommand('npm audit --audit-level=high --json');
    if (auditResult) {
      try {
        const audit = JSON.parse(auditResult);
        if (audit.metadata && audit.metadata.vulnerabilities) {
          const { high, critical } = audit.metadata.vulnerabilities;
          if (critical > 0) {
            this.addError(`Found ${critical} critical security vulnerabilities`);
          }
          if (high > 0) {
            this.addWarning(`Found ${high} high security vulnerabilities`);
          }
        }
      } catch (error) {
        this.addWarning('Could not parse npm audit results');
      }
    }
  }

  checkBuildConfiguration() {
    this.log('Checking build configuration...');
    
    // Verificar archivos de configuración críticos
    const criticalFiles = [
      'app.json',
      'webpack.config.js',
      'tsconfig.json'
    ];

    for (const file of criticalFiles) {
      if (!fs.existsSync(file)) {
        this.addError(`Critical configuration file missing: ${file}`);
      }
    }

    // Verificar configuración de Expo
    if (fs.existsSync('app.json')) {
      try {
        const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
        
        if (!appConfig.expo) {
          this.addError('Invalid app.json: missing expo configuration');
        } else {
          const expo = appConfig.expo;
          
          // Verificar campos obligatorios
          const requiredFields = ['name', 'slug', 'version'];
          for (const field of requiredFields) {
            if (!expo[field]) {
              this.addError(`Missing required field in app.json: expo.${field}`);
            }
          }

          // Verificar configuración web
          if (!expo.web) {
            this.addWarning('No web configuration found in app.json');
          } else if (!expo.web.favicon) {
            this.addWarning('No favicon configured for web');
          }
        }
      } catch (error) {
        this.addError(`Invalid app.json: ${error.message}`);
      }
    }
  }

  checkEnvironmentVariables() {
    this.log('Checking environment variables...');
    
    // Variables requeridas para deployment
    const requiredEnvVars = [
      'NODE_ENV'
    ];

    // Variables opcionales pero recomendadas
    const recommendedEnvVars = [
      'DEPLOY_TARGET',
      'DEPLOY_METHOD'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.addError(`Required environment variable missing: ${envVar}`);
      }
    }

    for (const envVar of recommendedEnvVars) {
      if (!process.env[envVar]) {
        this.addWarning(`Recommended environment variable missing: ${envVar}`);
      }
    }

    // Verificar NODE_ENV para producción
    if (process.env.DEPLOY_TARGET === 'production' && process.env.NODE_ENV !== 'production') {
      this.addError('NODE_ENV must be set to "production" for production deployments');
    }
  }

  checkAssets() {
    this.log('Checking assets...');
    
    // Verificar directorio de assets
    if (!fs.existsSync('assets')) {
      this.addWarning('Assets directory not found');
      return;
    }

    // Verificar iconos requeridos
    const requiredIcons = [
      'assets/images/icon.png',
      'assets/images/favicon.png'
    ];

    for (const icon of requiredIcons) {
      if (!fs.existsSync(icon)) {
        this.addWarning(`Recommended icon missing: ${icon}`);
      }
    }

    // Verificar tamaño de assets
    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      if (!fs.existsSync(dirPath)) return 0;
      
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

    const assetsSize = getDirectorySize('assets');
    const assetsSizeMB = (assetsSize / (1024 * 1024)).toFixed(2);
    
    this.log(`Total assets size: ${assetsSizeMB} MB`);
    
    if (assetsSize > 50 * 1024 * 1024) { // 50MB
      this.addWarning(`Assets directory is large (${assetsSizeMB} MB). Consider optimizing images.`);
    }
  }

  checkTestCoverage() {
    this.log('Checking test coverage...');
    
    // Verificar que existen tests
    const testDirs = ['__tests__', 'tests'];
    const hasTests = testDirs.some(dir => fs.existsSync(dir)) || 
                    fs.existsSync('jest.config.js');

    if (!hasTests) {
      this.addWarning('No test configuration found');
      return;
    }

    // Ejecutar tests si están disponibles
    const testResult = this.executeCommand('npm test -- --run --passWithNoTests');
    if (testResult === null) {
      this.addWarning('Could not run tests');
    }
  }

  checkSecurityHeaders() {
    this.log('Checking security configuration...');
    
    // Verificar si existe configuración de headers de seguridad
    const securityFiles = [
      'public/_headers',
      'public/_redirects',
      'netlify.toml',
      'vercel.json'
    ];

    const hasSecurityConfig = securityFiles.some(file => fs.existsSync(file));
    
    if (!hasSecurityConfig) {
      this.addWarning('No security headers configuration found. Consider adding security headers for production.');
    }
  }

  async runAllChecks() {
    this.log('Starting pre-deployment checks...');
    
    this.checkGitStatus();
    this.checkDependencies();
    this.checkBuildConfiguration();
    this.checkEnvironmentVariables();
    this.checkAssets();
    this.checkTestCoverage();
    this.checkSecurityHeaders();
    
    // Resumen
    this.log('\n=== Pre-deployment Check Summary ===');
    
    if (this.errors.length > 0) {
      this.log(`❌ ${this.errors.length} error(s) found:`, 'ERROR');
      this.errors.forEach((error, index) => {
        this.log(`  ${index + 1}. ${error}`, 'ERROR');
      });
    }
    
    if (this.warnings.length > 0) {
      this.log(`⚠️  ${this.warnings.length} warning(s) found:`, 'WARN');
      this.warnings.forEach((warning, index) => {
        this.log(`  ${index + 1}. ${warning}`, 'WARN');
      });
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('✅ All checks passed! Ready for deployment.', 'INFO');
      return true;
    } else if (this.errors.length === 0) {
      this.log('✅ No critical errors found. Deployment can proceed with warnings.', 'INFO');
      return true;
    } else {
      this.log('❌ Critical errors found. Please fix before deploying.', 'ERROR');
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const checker = new PreDeployChecker();
  const success = await checker.runAllChecks();
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PreDeployChecker };