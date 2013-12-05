all: \
	dist/cwm.js \
	dist/cwm.min.js
  
dist/cwm.js: \
	js/lib/d3.v3.js \
	js/src/start.js \
	js/src/cwm.js \
	js/src/map.js \
	js/src/stories.js \
	js/src/render.js \
	js/src/util.js \
	js/src/util/MM.overrides.js \
	js/src/util/domhelpers.js \
	js/src/layers.js \
	js/src/layers/bing_layer.js \
	js/src/layers/mapbox_layer.js \
	js/src/layers/feature_layer.js \
	js/src/layers/marker_layer.js \
	js/src/handlers.js \
	js/src/handlers/drag_handler.js \
	js/src/handlers/flight_handler.js \
	js/src/handlers/scroll_handler.js \
	js/src/handlers/story_handler.js \
	js/src/handlers/marker_interaction.js \
	js/src/end.js

dist/cwm.js: node_modules/.install Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

dist/cwm.min.js: dist/cwm.js Makefile
	@rm -f $@
	node_modules/.bin/uglifyjs $< -c -m -o $@

node_modules/.install: package.json
	npm install && touch node_modules/.install
  
clean:
	rm -f dist/mapstory*.js dist/mapstory.css

D3_FILES = \
	node_modules/d3/src/start.js \
	node_modules/d3/src/arrays/index.js \
	node_modules/d3/src/behavior/behavior.js \
	node_modules/d3/src/behavior/drag.js \
	node_modules/d3/src/core/index.js \
	node_modules/d3/src/event/index.js \
	node_modules/d3/src/time/index.js \
	node_modules/d3/src/geo/path.js \
	node_modules/d3/src/geo/stream.js \
	node_modules/d3/src/selection/index.js \
	node_modules/d3/src/transition/index.js \
	node_modules/d3/src/xhr/index.js \
	node_modules/d3/src/end.js

js/lib/d3.v3.js: $(D3_FILES)
	node_modules/.bin/smash $(D3_FILES) > $@
	@echo 'd3 rebuilt. Please reapply 7e2485d, 4da529f, and 223974d'