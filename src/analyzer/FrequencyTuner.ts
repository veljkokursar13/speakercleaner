//use the profile data to decide what frequencies to play during cleaning
//taking inputs from DeviceProfiler and MicAnalyzer
//dynamically adjust playback volume and step lenght
//ensure safe thresholds
//exppose fubak iounuzed startCleaningSession function
import { DeviceProfile } from "./DeviceProfiler";
import { MicAnalyzer } from "./MicAnalyzer";

export type TuningParameters = {
    hz: number;
    durationMs: number;
    volumeDb: number;
}[];

export const FrequencyTuner = {
    async build(profile: DeviceProfile): Promise<TuningParameters> {
        const micProfile = await MicAnalyzer.run(profile);

        // Use micProfile to determine optimal frequencies and tuning parameters
        const tuningParams: TuningParameters = [
            {
                hz: micProfile.optimalLowFreqHz,
                durationMs: 1000,
                volumeDb: -10
            }
        ];

        return tuningParams;
    }
};