import noise from '../../assets/images/noise.jpg';

export const QuantumTheme = {
  background: {
    image: noise,
    opacity: 0.10,
  },

    colors: {
      bgDark: '#161518',
      bgWarm: '#2B1F14',
      bgCool: '#3A2719',
      bgAccent: '#FF8A00',
      
      textPrimary: '#FFFFFF',
      textSecondary: '#B0B0C0',
      neonCyan: '#00FFE5',
      neonMagenta: '#FF00C8',
      neonAmber: '#FFC93C',
      errorRed: '#FF4E50',
  
      grainOverlay: 'rgba(255,255,255,0.06)',
    },
    gradients: {
      quantumFlow: [
        '#1A1A1D',
        '#2B1F14',
        '#FF8A00',
        '#FFC857',
        '#2B1F14',
      ] as const,
    },
  } as const;
  //bgDark → bgWarm → bgCool → bgAccent
