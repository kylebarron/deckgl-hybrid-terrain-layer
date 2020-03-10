export const landsatUrl = () => {
  const params = {
    bands: '4,3,2',
    color_ops: 'gamma RGB 3.5, saturation 1.7, sigmoidal RGB 15 0.35'
  };
  const searchParams = new URLSearchParams(params);
  let baseUrl =
    'https://landsat-lambda.kylebarron.dev/tiles/e276a5acd25d7f2abc6c1233067628822d4de9c96b3c8977a168fee7/{z}/{x}/{y}@2x.png?';
  baseUrl += searchParams.toString();
  return baseUrl;
};

export const TERRAIN_IMAGE = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`;
export const NAIP_IMAGE =
  'https://naip-lambda.kylebarron.dev/4c4d507790e8afa837215677bd6f74f58711bfaf3e1d5f7226193e12/{z}/{x}/{y}@2x.jpg';
export const SURFACE_IMAGE = landsatUrl();

export const ELEVATION_DECODER = {
  rScaler: 256,
  gScaler: 1,
  bScaler: 1 / 256,
  offset: -32768
};
