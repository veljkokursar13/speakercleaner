//detect and store hardware specific information
//fetch phone model, brand, os version, cpu architecture, ram size, storage size, battery health, etc.
//query audio manager
//test output volume
//saving this in async storage for later use

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type DeviceProfile = {
  model: string;
  brand: string;
  osVersion: string;
  sampleRateHz: number;
  micSensitivity: number;
  resonanceOffsetHz: number;
  deviceType: string;
  brandModel?: string; // Combined brand + model for easier identification
};

export const DeviceProfileManager = {
    async detect(): Promise<DeviceProfile> {
        // Detect real device information
        const deviceType = await this.getDeviceType();
        const model = Device.modelName || 'Unknown';
        const brand = Platform.OS === 'ios' ? 'Apple' : await this.getAndroidBrand();
        const osVersion = Platform.Version.toString();
        
        // Try to load cached audio settings, otherwise use defaults
        const sampleRateHzStr = await AsyncStorage.getItem("audio.sampleRateHz");
        const micSensitivityStr = await AsyncStorage.getItem("audio.micSensitivity");
        const resonanceOffsetHzStr = await AsyncStorage.getItem("audio.resonanceOffsetHz");

        const profile: DeviceProfile = {
            brand,
            model,
            osVersion,
            deviceType,
            brandModel: `${brand} ${model}`,
            sampleRateHz: Number(sampleRateHzStr ?? '48000'),
            micSensitivity: Number(micSensitivityStr ?? '1'),
            resonanceOffsetHz: Number(resonanceOffsetHzStr ?? '0'),
        };

        // Save detected profile
        await this.save(profile);
        
        return profile;
    },

    async getDeviceType(): Promise<string> {
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
    },

    async getAndroidBrand(): Promise<string> {
        if (Platform.OS !== 'android') return 'Unknown';
        
        try {
            // Try to get manufacturer from device info
            // This is a best-effort approach since React Native doesn't expose this directly
            const model = Device.modelName || '';
            
            // Common Android manufacturers
            const brandHints: Record<string, string> = {
                'SM-': 'Samsung',
                'Pixel': 'Google',
                'Mi ': 'Xiaomi',
                'Redmi': 'Xiaomi',
                'OnePlus': 'OnePlus',
                'OPPO': 'OPPO',
                'vivo': 'vivo',
                'HUAWEI': 'Huawei',
                'Honor': 'Honor',
                'Moto': 'Motorola',
                'LG': 'LG',
            };

            for (const [hint, brand] of Object.entries(brandHints)) {
                if (model.includes(hint)) {
                    return brand;
                }
            }

            return 'Android';
        } catch {
            return 'Android';
        }
    },

    async save(profile: DeviceProfile): Promise<void> {
        await AsyncStorage.setItem("device.brand", profile.brand);
        await AsyncStorage.setItem("device.model", profile.model);
        await AsyncStorage.setItem("device.osVersion", profile.osVersion);
        await AsyncStorage.setItem("device.deviceType", profile.deviceType);
        await AsyncStorage.setItem("device.brandModel", profile.brandModel || '');
        await AsyncStorage.setItem("audio.sampleRateHz", String(profile.sampleRateHz));
        await AsyncStorage.setItem("audio.micSensitivity", String(profile.micSensitivity));
        await AsyncStorage.setItem("audio.resonanceOffsetHz", String(profile.resonanceOffsetHz));
    },

    async load(): Promise<DeviceProfile | null> {
        try {
            const brand = (await AsyncStorage.getItem("device.brand")) ?? 'Unknown';
            const model = (await AsyncStorage.getItem("device.model")) ?? 'Unknown';
            const osVersion = (await AsyncStorage.getItem("device.osVersion")) ?? 'Unknown';
            const deviceType = (await AsyncStorage.getItem("device.deviceType")) ?? 'unknown';
            const brandModel = (await AsyncStorage.getItem("device.brandModel")) ?? '';
            const sampleRateHzStr = await AsyncStorage.getItem("audio.sampleRateHz");
            const micSensitivityStr = await AsyncStorage.getItem("audio.micSensitivity");
            const resonanceOffsetHzStr = await AsyncStorage.getItem("audio.resonanceOffsetHz");

            const profile: DeviceProfile = {
                brand,
                model,
                osVersion,
                deviceType,
                brandModel: brandModel || `${brand} ${model}`,
                sampleRateHz: Number(sampleRateHzStr ?? '48000'),
                micSensitivity: Number(micSensitivityStr ?? '1'),
                resonanceOffsetHz: Number(resonanceOffsetHzStr ?? '0'),
            };
            return profile;
        } catch {
            return null;
        }
    },

    /**
     * Update audio calibration parameters
     */
    async updateAudioCalibration(params: {
        sampleRateHz?: number;
        micSensitivity?: number;
        resonanceOffsetHz?: number;
    }): Promise<void> {
        const current = await this.load() || await this.detect();
        
        if (params.sampleRateHz !== undefined) {
            current.sampleRateHz = params.sampleRateHz;
        }
        if (params.micSensitivity !== undefined) {
            current.micSensitivity = params.micSensitivity;
        }
        if (params.resonanceOffsetHz !== undefined) {
            current.resonanceOffsetHz = params.resonanceOffsetHz;
        }

        await this.save(current);
    },

    /**
     * Get optimal resonance frequency for this device
     */
    getOptimalResonanceFrequency(profile: DeviceProfile): number {
        // Platform-specific defaults
        let baseFreq = 165; // Apple Watch standard
        
        if (Platform.OS === 'android') {
            baseFreq = 950; // Android phone speaker typical
        }

        // Adjust based on device type
        if (profile.deviceType === 'tablet') {
            baseFreq *= 0.8; // Tablets typically have larger speakers
        }

        // Apply offset
        return baseFreq + profile.resonanceOffsetHz;
    },
};



