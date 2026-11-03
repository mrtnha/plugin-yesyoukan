#!/bin/bash
npm run dist
PLUGIN_ID="$(node -p "require('./src/manifest.json').id")"
PLUGIN_VERSION="$(npm pkg get version | tr -d '"')"
mv "publish/$PLUGIN_ID.jpl" "publish/$PLUGIN_ID-$PLUGIN_VERSION.jpl"
