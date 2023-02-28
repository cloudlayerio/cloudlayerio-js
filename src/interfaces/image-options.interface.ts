export interface CloudlayerImageOptions {
  quality?: number;
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  delay?: number;
}
