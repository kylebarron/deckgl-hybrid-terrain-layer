import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {load} from '@loaders.gl/core';
import {TerrainLoader} from '@loaders.gl/terrain';
import {TileLayer} from '@deck.gl/geo-layers';
import {
  TERRAIN_IMAGE,
  NAIP_IMAGE,
  SURFACE_IMAGE,
  ELEVATION_DECODER,
  MAPBOX_SATELLITE
} from './util';
import {GeoJsonLayer} from '@deck.gl/layers';
import {MVTLoader} from '@loaders.gl/mvt';
import {Matrix4} from 'math.gl';
import {SnapFeatures} from '@kylebarron/snap-features-to-tin';
import { parseMapboxStyle, featuresArrayToObject } from "@kylebarron/deckgl-style-spec";

const MESH_MAX_ERROR = 10;
const DUMMY_DATA = [1];

function getTerrainUrl({x, y, z}) {
  return TERRAIN_IMAGE.replace('{x}', x)
    .replace('{y}', y)
    .replace('{z}', z);
}

function getTextureUrl({x, y, z}) {
  // return MAPBOX_SATELLITE.replace('{x}', x)
  //   .replace('{y}', y)
  //   .replace('{z}', z);
  if (z >= 12) {
    return NAIP_IMAGE.replace('{x}', x)
      .replace('{y}', y)
      .replace('{z}', z);
  }

  return SURFACE_IMAGE.replace('{x}', x)
    .replace('{y}', y)
    .replace('{z}', z);
}

function getOpenMapTilesUrl({x, y, z}) {
  return `https://mbtiles.nst.guide/services/openmaptiles/own/tiles/${z}/${x}/${y}.pbf`;
}

export function TerrainTileLayer() {
  return new TileLayer({
    id: 'terrain-tiles',
    minZoom: 0,
    maxZoom: 17,
    getTileData,
    renderSubLayers
  });
}

async function getTileData({x, y, z}) {
  const terrainUrl = getTerrainUrl({x, y, z});
  const textureUrl = getTextureUrl({x, y, z});
  const mvtUrl = getOpenMapTilesUrl({x, y, z});

  // minx, miny, maxx, maxy
  // This is used to flip the image so that the origin is at the top left
  const bounds = [0, 1, 1, 0];

  // Load vector tile
  const mvtLoaderOptions = {
    mvt: {
      coordinates: 'local',
      layerProperty: 'layerName',
    }
  }
  const mvttile = load(mvtUrl, MVTLoader, mvtLoaderOptions);
  // Load terrain tile
  const terrain = loadTerrain({
    terrainImage: terrainUrl,
    bounds,
    elevationDecoder: ELEVATION_DECODER,
    meshMaxError: MESH_MAX_ERROR
  });
  // Load satellite image
  const texture = textureUrl
    ? // If surface image fails to load, the tile should still be displayed
      load(textureUrl).catch(_ => null)
    : Promise.resolve(null);

  const [mesh, mvtFeatures] = await Promise.all([terrain, mvttile])
  const snap = new SnapFeatures({
    indices: mesh.indices.value,
    positions: mesh.attributes.POSITION.value,
    bounds: [0, 0, 1, 1]
  })
  const newFeatures = snap.snapFeatures(mvtFeatures)
  return Promise.all([mesh, texture, newFeatures])
}

function renderSubLayers(props) {
  const {data, tile} = props;

  // Resolve promises
  const mesh = data.then(result => result && result[0]);
  const texture = data.then(result => result && result[1]);
  const features = data.then(result => result && result[2]);
  return [
    new GeoJsonLayer(props, {
      // NOTE: currently you need to set each sublayer id so they don't conflict
      id: `geojson-layer-${tile.x}-${tile.y}-${tile.z}`,
      data: features,
      // Important for z-fighting
      getPolygonOffset: d => [0, -1000],
      lineWidthMinPixels: 5,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      modelMatrix: getModelMatrix(tile),
      pickable: true
    }),
    new SimpleMeshLayer(props, {
      // NOTE: currently you need to set each sublayer id so they don't conflict
      id: `terrain-simple-mesh-layer-${tile.x}-${tile.y}-${tile.z}`,
      data: DUMMY_DATA,
      mesh,
      texture,
      getPolygonOffset: null,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      modelMatrix: getModelMatrix(tile),
      getPosition: d => [0, 0, 0],
      // Color to use if surfaceImage is unavailable
      getColor: [255, 255, 255]
    })
  ];
}

// From https://github.com/uber/deck.gl/blob/b1901b11cbdcb82b317e1579ff236d1ca1d03ea7/modules/geo-layers/src/mvt-tile-layer/mvt-tile-layer.js#L41-L52
function getModelMatrix(tile) {
  const WORLD_SIZE = 512;
  const worldScale = Math.pow(2, tile.z);

  const xScale = WORLD_SIZE / worldScale;
  const yScale = -xScale;

  const xOffset = (WORLD_SIZE * tile.x) / worldScale;
  const yOffset = WORLD_SIZE * (1 - tile.y / worldScale);

  return new Matrix4().translate([xOffset, yOffset, 0]).scale([xScale, yScale, 1]);
}

function loadTerrain({terrainImage, bounds, elevationDecoder, meshMaxError, workerUrl}) {
  if (!terrainImage) {
    return null;
  }
  const options = {
    terrain: {
      bounds,
      meshMaxError,
      elevationDecoder
    }
  };
  if (workerUrl) {
    options.terrain.workerUrl = workerUrl;
  }
  return load(terrainImage, TerrainLoader, options);
}
