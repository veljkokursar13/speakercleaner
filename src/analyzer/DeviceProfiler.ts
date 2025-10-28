//detect and store hardware specific information
//fetch phone model, brand, os version, cpu architecture, ram size, storage size, battery health, etc.
//query audio manager
//test output volume
//saving this in async storage for later use

import AsyncStorage from '@react-native-async-storage/async-storage';

export type DeviceProfile = {
  model: string;
  brand: string;
  osVersion: string;
  sampleRateHz: number;
  micSensitivity: number;
  resonanceOffsetHz: number;
};

export const DeviceProfileManager = {
    async detect(): Promise<DeviceProfile> {
        // Implementation to retrieve device profile information
        const brand = (await AsyncStorage.getItem("device.brand")) ?? 'Unknown';
        const model = (await AsyncStorage.getItem("device.model")) ?? 'Unknown';
        const osVersion = (await AsyncStorage.getItem("device.osVersion")) ?? 'Unknown';
        const sampleRateHzStr = await AsyncStorage.getItem("audio.sampleRateHz");
        const micSensitivityStr = await AsyncStorage.getItem("audio.micSensitivity");
        const resonanceOffsetHzStr = await AsyncStorage.getItem("audio.resonanceOffsetHz");

        const profile: DeviceProfile = {
            brand,
            model,
            osVersion,
            sampleRateHz: Number(sampleRateHzStr ?? '44100'),
            micSensitivity: Number(micSensitivityStr ?? '1'),
            resonanceOffsetHz: Number(resonanceOffsetHzStr ?? '0'),
        }
        return profile;
        
    },

    async save(profile: DeviceProfile): Promise<void> {
        await AsyncStorage.setItem("device.brand", profile.brand);
        await AsyncStorage.setItem("device.model", profile.model);
        await AsyncStorage.setItem("device.osVersion", profile.osVersion);
        await AsyncStorage.setItem("audio.sampleRateHz", String(profile.sampleRateHz));
        await AsyncStorage.setItem("audio.micSensitivity", String(profile.micSensitivity));
        await AsyncStorage.setItem("audio.resonanceOffsetHz", String(profile.resonanceOffsetHz));

    },

    async load(): Promise<DeviceProfile | null> {
        const brand = (await AsyncStorage.getItem("device.brand")) ?? 'Unknown';
        const model = (await AsyncStorage.getItem("device.model")) ?? 'Unknown';
        const osVersion = (await AsyncStorage.getItem("device.osVersion")) ?? 'Unknown';
        const sampleRateHzStr = await AsyncStorage.getItem("audio.sampleRateHz");
        const micSensitivityStr = await AsyncStorage.getItem("audio.micSensitivity");
        const resonanceOffsetHzStr = await AsyncStorage.getItem("audio.resonanceOffsetHz");

        const profile: DeviceProfile = {
            brand,
            model,
            osVersion,
            sampleRateHz: Number(sampleRateHzStr ?? '44100'),
            micSensitivity: Number(micSensitivityStr ?? '1'),
            resonanceOffsetHz: Number(resonanceOffsetHzStr ?? '0'),
        };
        return profile;
    },
};



