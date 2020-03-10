/* eslint-disable max-statements */
import React from 'react';
import {render} from 'react-dom';
import DeckGL from '@deck.gl/react';
import {StaticMap} from 'react-map-gl';
import {TerrainTileLayer} from './terrain-tile-layer';

const INITIAL_VIEW_STATE = {
  latitude: 46.21,
  longitude: -122.18,
  zoom: 11.5,
  bearing: 140
  // pitch: 60
};

export default function App() {
  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      layers={[TerrainTileLayer()]}
      onClick={console.log}
      // onHover={x => console.log(x)}
      // pickingRadius={5}
    >
      <StaticMap
        mapStyle="https://raw.githubusercontent.com/kylebarron/fiord-color-gl-style/master/style.json"
        mapOptions={{hash: true}}
      />
    </DeckGL>
  );
}

export function renderToDOM(container) {
  render(<App />, container);
}
