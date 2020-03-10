# deckgl-hybrid-terrain-layer

An extruded terrain layer with vector features for deck.gl


## Developing

I currently develop this on deck.gl master, since version 8.1 hasn't been
released yet. But since deck.gl is a monorepo, I don't know of a way to load
packages from Github master into my `package.json`.

Here's the workaround I found:
```bash
git clone https://github.com/uber/deck.gl
cd deck.gl
npm run bootstrap
cd examples/website
git clone https://github.com/kylebarron/deckgl-hybrid-terrain-layer
cd deckgl-hybrid-terrain-layer
npm install
export MapboxAccessToken=...
npm run start-local
```
