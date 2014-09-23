#!/bin/bash

mkdir -p lib/d3
mkdir -p lib/topojson
mkdir -p lib/queue

curl -o lib/d3/d3.js https://raw.githubusercontent.com/mbostock/d3/48ad44fdeef32b518c6271bb99a9aed376c1a1d6/d3.js
curl -o lib/topojson/topojson.js https://raw.githubusercontent.com/mbostock/topojson/834e274f0f08622cc8f76dbfdb3417dd3a716236/topojson.js
curl -o lib/queue/queue.js https://raw.githubusercontent.com/mbostock/queue/fec51d91370233b04b75519a202cf39afe66c0e7/queue.js