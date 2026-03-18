import { Wind, Droplets, Thermometer, Flame, TriangleAlert } from 'lucide-react';

export const SEVERITY_LEVELS = {
  YELLOW: {
    color:       '#fbbf24',
    label:       'Yellow',
    description: 'Potentially Dangerous',
    bg:          'bg-yellow-500/20',
    ring:        'ring-yellow-500/30',
  },
  ORANGE: {
    color:       '#f97316',
    label:       'Orange',
    description: 'Dangerous',
    bg:          'bg-orange-500/20',
    ring:        'ring-orange-500/30',
  },
  RED: {
    color:       '#ef4444',
    label:       'Red',
    description: 'Very Dangerous',
    bg:          'bg-red-500/20',
    ring:        'ring-red-500/30',
  },
};

export const HAZARD_TYPES = [
  { id: 'wind',  label: 'High Wind',      icon: Wind },
  { id: 'flood', label: 'Flooding',       icon: Droplets },
  { id: 'heat',  label: 'Heatwave',       icon: Thermometer },
  { id: 'fire',  label: 'Forest Fire',    icon: Flame },
  { id: 'storm', label: 'Thunderstorms',  icon: TriangleAlert },
];
