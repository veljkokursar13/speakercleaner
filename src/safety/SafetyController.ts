/**
 * SafetyController - Comprehensive safety checks and monitoring
 * 
 * Ensures safe operation by checking device state, preventing
 * harmful scenarios, and monitoring runtime conditions.
 */
import { Audio } from 'expo-av';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface SafetyCheck {
  passed: boolean;
  level: 'critical' | 'warning' | 'info';
  code: string;
  message: string;
  recommendation?: string;
}

export interface SafetyReport {
  safe: boolean;
  criticalIssues: SafetyCheck[];
  warnings: SafetyCheck[];
  infos: SafetyCheck[];
  timestamp: number;
}

export interface DeviceState {
  platform: string;
  deviceType: string;
  batteryLevel: number;
  isCharging: boolean;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical' | 'unknown';
  volumeLevel: number;
  isHeadphonesConnected: boolean;
  isBluetoothConnected: boolean;
}

export interface RuntimeMonitoring {
  startTime: number;
  duration: number; // ms
  maxTemperature?: number;
  avgVolume: number;
  clippingDetected: boolean;
  safetyViolations: SafetyCheck[];
}

export class SafetyController {
  private monitoring: RuntimeMonitoring | null = null;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;  

  /**
   * Perform comprehensive pre-flight safety checks
   */
  async performPreFlightChecks(): Promise<SafetyReport> {
    const checks: SafetyCheck[] = [];

    // Get current device state
    const deviceState = await this.getDeviceState();

    // Check 1: Headphones/Bluetooth connection (CRITICAL)
    if (deviceState.isHeadphonesConnected) {
      checks.push({
        passed: false,
        level: 'critical',
        code: 'HEADPHONES_CONNECTED',
        message: 'Headphones or earbuds detected',
        recommendation: 'Disconnect headphones before starting speaker cleaning',
      });
    }

    if (deviceState.isBluetoothConnected) {
      checks.push({
        passed: false,
        level: 'critical',
        code: 'BLUETOOTH_CONNECTED',
        message: 'Bluetooth audio device connected',
        recommendation: 'Disconnect Bluetooth speakers/headphones',
      });
    }

    // Check 2: Volume level
    if (deviceState.volumeLevel < 0.5) {
      checks.push({
        passed: false,
        level: 'warning',
        code: 'LOW_VOLUME',
        message: `System volume is low (${Math.round(deviceState.volumeLevel * 100)}%)`,
        recommendation: 'Increase volume to 70-80% for effective cleaning',
      });
    } else if (deviceState.volumeLevel > 0.95) {
      checks.push({
        passed: false,
        level: 'warning',
        code: 'EXCESSIVE_VOLUME',
        message: 'System volume is at maximum',
        recommendation: 'Reduce volume to 70-80% to prevent damage',
      });
    }

    // Check 3: Battery level
    if (deviceState.batteryLevel < 0.15 && !deviceState.isCharging) {
      checks.push({
        passed: false,
        level: 'warning',
        code: 'LOW_BATTERY',
        message: `Low battery (${Math.round(deviceState.batteryLevel * 100)}%)`,
        recommendation: 'Charge device or connect to power',
      });
    }

    // Check 4: Thermal state
    if (deviceState.thermalState === 'serious' || deviceState.thermalState === 'critical') {
      checks.push({
        passed: false,
        level: 'critical',
        code: 'DEVICE_OVERHEATING',
        message: 'Device is overheating',
        recommendation: 'Let device cool down before cleaning',
      });
    }

    // Check 5: Device compatibility
    const compatibilityCheck = this.checkDeviceCompatibility(deviceState);
    if (!compatibilityCheck.passed) {
      checks.push(compatibilityCheck);
    }

    // Check 6: Audio mode
    const audioModeCheck = await this.checkAudioMode();
    if (!audioModeCheck.passed) {
      checks.push(audioModeCheck);
    }

    // Categorize checks
    const criticalIssues = checks.filter((c) => !c.passed && c.level === 'critical');
    const warnings = checks.filter((c) => !c.passed && c.level === 'warning');
    const infos = checks.filter((c) => !c.passed && c.level === 'info');

    return {
      safe: criticalIssues.length === 0,
      criticalIssues,
      warnings,
      infos,
      timestamp: Date.now(),
    };
  }

  /**
   * Quick safety check (essential checks only)
   */
  async performQuickCheck(): Promise<SafetyReport> {
    const checks: SafetyCheck[] = [];
    const deviceState = await this.getDeviceState();

    // Only check critical issues
    if (deviceState.isHeadphonesConnected || deviceState.isBluetoothConnected) {
      checks.push({
        passed: false,
        level: 'critical',
        code: 'AUDIO_OUTPUT_REDIRECTED',
        message: 'Audio output is not directed to phone speaker',
        recommendation: 'Disconnect all audio devices',
      });
    }

    if (deviceState.thermalState === 'critical') {
      checks.push({
        passed: false,
        level: 'critical',
        code: 'THERMAL_CRITICAL',
        message: 'Device temperature is critical',
        recommendation: 'Do not use until device cools',
      });
    }

    const criticalIssues = checks.filter((c) => c.level === 'critical');

    return {
      safe: criticalIssues.length === 0,
      criticalIssues,
      warnings: [],
      infos: [],
      timestamp: Date.now(),
    };
  }

  /**
   * Start runtime monitoring
   */
  startMonitoring(): void {
    if (this.monitoring) {
      return;
    }

    this.monitoring = {
      startTime: Date.now(),
      duration: 0,
      avgVolume: 0,
      clippingDetected: false,
      safetyViolations: [],
    };

    // Monitor every 2 seconds
    this.monitoringInterval = setInterval(() => {  
      this.performRuntimeCheck();
    }, 2000);
  }

  /**
   * Stop runtime monitoring
   */
  stopMonitoring(): RuntimeMonitoring | null {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.monitoring) {
      this.monitoring.duration = Date.now() - this.monitoring.startTime;
    }

    const result = this.monitoring;
    this.monitoring = null;

    return result;
  }

  /**
   * Get current device state
   */
  private async getDeviceState(): Promise<DeviceState> {
    const state: DeviceState = {
      platform: Platform.OS,
      deviceType: await this.getDeviceType(),
      batteryLevel: await this.getBatteryLevel(),
      isCharging: await this.isCharging(),
      thermalState: await this.getThermalState(),
      volumeLevel: await this.getVolumeLevel(),
      isHeadphonesConnected: await this.isHeadphonesConnected(),
      isBluetoothConnected: await this.isBluetoothConnected(),
    };

    return state;
  }

  /**
   * Perform runtime check during cleaning
   */
  private async performRuntimeCheck(): Promise<void> {
    if (!this.monitoring) {
      return;
    }

    const deviceState = await this.getDeviceState();

    // Check for headphones connected during cleaning
    if (deviceState.isHeadphonesConnected || deviceState.isBluetoothConnected) {
      this.monitoring.safetyViolations.push({
        passed: false,
        level: 'critical',
        code: 'RUNTIME_AUDIO_REDIRECT',
        message: 'Audio device connected during cleaning',
        recommendation: 'Cleaning stopped for safety',
      });
    }

    // Check thermal state
    if (deviceState.thermalState === 'serious' || deviceState.thermalState === 'critical') {
      this.monitoring.safetyViolations.push({
        passed: false,
        level: 'critical',
        code: 'RUNTIME_OVERHEATING',
        message: 'Device overheating during cleaning',
        recommendation: 'Cleaning stopped to prevent damage',
      });
    }

    // Monitor volume
    this.monitoring.avgVolume =
      (this.monitoring.avgVolume + deviceState.volumeLevel) / 2;

    // Check for clipping (volume > 0.95)
    if (deviceState.volumeLevel > 0.95) {
      this.monitoring.clippingDetected = true;
    }
  }

  /**
   * Check device compatibility
   */
  private checkDeviceCompatibility(deviceState: DeviceState): SafetyCheck {
    // Check if device is suitable for speaker cleaning
    if (deviceState.platform === 'web') {
      return {
        passed: false,
        level: 'critical',
        code: 'UNSUPPORTED_PLATFORM',
        message: 'Web platform not supported for speaker cleaning',
        recommendation: 'Use native iOS or Android app',
      };
    }

    // Warn about older devices
    if (deviceState.deviceType.includes('unknown')) {
      return {
        passed: true,
        level: 'info',
        code: 'UNKNOWN_DEVICE',
        message: 'Device model not recognized',
        recommendation: 'Proceed with caution',
      };
    }

    return {
      passed: true,
      level: 'info',
      code: 'DEVICE_COMPATIBLE',
      message: 'Device is compatible',
    };
  }

  /**
   * Check audio mode configuration
   */
  private async checkAudioMode(): Promise<SafetyCheck> {
    try {
      const audioMode = await Audio.getAudioModeAsync();
      if (Platform.OS === 'ios' && !audioMode.playsInSilentModeIOS) {  
        return {
          passed: false,
          level: 'warning',
          code: 'SILENT_MODE_ENABLED',
          message: 'Silent mode may prevent audio playback',
          recommendation: 'Disable silent mode',
        };
      }

      return {
        passed: true,
        level: 'info',
        code: 'AUDIO_MODE_OK',
        message: 'Audio mode configured correctly',
      };
    } catch {
      return {
        passed: true,
        level: 'info',
        code: 'AUDIO_MODE_CHECK_FAILED',
        message: 'Could not verify audio mode',
      };
    }
  }

  // ==================== Device Info Helpers ====================

  private async getDeviceType(): Promise<string> {
    try {
      const type = await Device.getDeviceTypeAsync();
      const typeMap: Record<number, string> = {
        [Device.DeviceType.PHONE]: 'phone',
        [Device.DeviceType.TABLET]: 'tablet',
        [Device.DeviceType.DESKTOP]: 'desktop',
        [Device.DeviceType.TV]: 'tv',
        [Device.DeviceType.UNKNOWN]: 'unknown',
      };
      return typeMap[type] || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      const level = await Battery.getBatteryLevelAsync();
      return level;
    } catch {
      return 1.0; // Assume full if can't read
    }
  }

  private async isCharging(): Promise<boolean> {
    try {
      const state = await Battery.getBatteryStateAsync();
      return state === Battery.BatteryState.CHARGING;
    } catch {
      return false;
    }
  }

  private async getThermalState(): Promise<DeviceState['thermalState']> {
    // Note: This would require native module for actual thermal monitoring
    // Placeholder implementation
    return 'nominal';
  }

  private async getVolumeLevel(): Promise<number> {
    // Expo doesn't expose system volume; placeholder default
    return 0.75;
  }

  private async isHeadphonesConnected(): Promise<boolean> {
    // Placeholder: would require native module for accurate detection
    return false;
  }

  private async isBluetoothConnected(): Promise<boolean> {
    // Placeholder: would require native module for accurate detection
    return false;
  }

  /**
   * Get safety recommendations based on report
   */
  static getRecommendations(report: SafetyReport): string[] {
    const recommendations: string[] = [];

    // Critical issues first
    report.criticalIssues.forEach((issue) => {
      if (issue.recommendation) {
        recommendations.push(`⚠️ ${issue.recommendation}`);
      }
    });

    // Then warnings
    report.warnings.forEach((warning) => {
      if (warning.recommendation) {
        recommendations.push(`⚡ ${warning.recommendation}`);
      }
    });

    // General recommendations
    if (report.safe) {
      recommendations.push('✓ All safety checks passed');
      recommendations.push('• Place phone speaker-side down on a clean surface');
      recommendations.push('• Keep phone still during cleaning');
      recommendations.push('• Cleaning typically takes 15-30 seconds');
    }

    return recommendations;
  }

  /**
   * Format safety report for display
   */
  static formatReport(report: SafetyReport): string {
    let output = `Safety Check Report\n`;
    output += `Status: ${report.safe ? '✓ SAFE' : '⚠ UNSAFE'}\n`;
    output += `Time: ${new Date(report.timestamp).toLocaleTimeString()}\n\n`;

    if (report.criticalIssues.length > 0) {
      output += `Critical Issues:\n`;
      report.criticalIssues.forEach((issue) => {
        output += `  ❌ ${issue.message}\n`;
        if (issue.recommendation) {
          output += `     → ${issue.recommendation}\n`;
        }
      });
      output += '\n';
    }

    if (report.warnings.length > 0) {
      output += `Warnings:\n`;
      report.warnings.forEach((warning) => {
        output += `  ⚠️  ${warning.message}\n`;
        if (warning.recommendation) {
          output += `     → ${warning.recommendation}\n`;
        }
      });
      output += '\n';
    }

    if (report.infos.length > 0) {
      output += `Information:\n`;
      report.infos.forEach((info) => {
        output += `  ℹ️  ${info.message}\n`;
      });
    }

    return output;
  }
}

