export type QualityOption = {
  key: string;
  label: string;
  resolution: number;
  itag: string;
  container: string;
  needsMux: boolean;
  audioItag: string | null;
  approxSizeMb: number | null;
  fps: number | null;
};

export type AudioOption = {
  key: string;
  label: string;
  bitrateKbps: number;
};

export type VideoInfoResult = {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  thumbnail: string;
  qualities: QualityOption[];
  audioOptions: AudioOption[];
  bestAudioItag: number;
};
