(function () {

	var window = this;

	// The top-level namespace. All public classes and modules will
	// be attached to this.
	var MapStory = window.MapStory = {};
  
  var retina = false; //window.devicePixelRatio >= 2;
  
  //-- *************** --//
  //-- Customize below --//
  //-- *************** --//
    
  // Bing Maps API key for satellite layer
  // Register for key at http://...
  // NEEDS CHANGED: is currently only a trial key for 90 days
  var BING_API_KEY = "AnadQ9NziZo9MYVo8394fMtJjPrkZMasNfSqpt5wz4vUMSaATniZnKxvDgxrsrGB";
  
  // Bounds for the initial view of the map (Ecuador)
  var startBounds = [{ lat: -5.2, lon: -81.2 }, { lat: 1.8, lon: -74.9 }]; 
  var PROJECT_BOUNDS = [ [-1.1, -77.7], [0.5, -75.2]];
  
  // Array of locations for each story on the map
  // The first location is for the initial map view
  // it should be attached to the body element which has offset().top = 0
  // TODO change this - not very obvious.
  var storyLocations = [
    { id: 'body', lat: -1.703, lon : -78.050, zoom : 7 },
    { id: '#nor-oriente', lat : -0.109, lon : -76.833, zoom : 10 },
    { id: '#cofan-cover', lat : 0.009, lon : -76.717, zoom : 13 }
  ];
  
  // Data sources for overlay and markers (loaded with JSONP)
  var overlaySQL = 'SELECT ST_Simplify(the_geom, 0.001)' +
                   'AS the_geom, nombre, nacion ' + 
                   'FROM nationalities';
  var markerSQL = 'SELECT * FROM clearwater_well_installations';

  //-- ***************************** --//
  //-- End of customizable variables --//
  //-- ***************************** --//
  
  var satLayer,
      labelLayer,
      communityLayer,
      markerLayer,
      map,
      storyScrollPoints = [],
      easings = [];

  //--- Start of public functions of MapStory ---//

  MapStory.init = function (storyContainerId, mapContainerId, baseLayerId) {

    //--- Set up map layer objects ---//
    // composite false is necessary to stop mapbox trying to composite server-side
    satLayer = mapbox.layer().composite(false);
    labelLayer = mapbox.layer();
    communityLayer = d3layer();
    markerLayer = mapbox.markers.layer();
    
    // Set up the map, with no layers and no handlers.
    map = mapbox.map('map',null,null,[]).setExtent(startBounds);
    MapStory.map = map;
    
    // Add all the map layers to the map, in order (they are empty at this point)
    map.addLayer(satLayer);
    map.addLayer(labelLayer);
    map.addLayer(communityLayer);
    map.addLayer(markerLayer);

    // Set small tilesize if retina display. Set tilesource according to retina.
    if (retina) {
      map.tileSize = { x: 128, y: 128 };
      labelLayer.id('gmaclennan.map-lb73ione');
    } else {
      labelLayer.id('gmaclennan.map-y7pgvo15');
    }
    
    // Load GeoJSON for polygons and markers from CartoDB
    _loadData(overlaySQL, _onOverlayLoad);
    _loadData(markerSQL, _onMarkerLoad);
    
    // Load sat tiles from Bing
    // *TODO* Remove need for async function in MM.BingProvider
    var bingProvider = new MM.BingProvider(BING_API_KEY, 'Aerial', function() {
      satLayer.setProvider(bingProvider);
    });
    
    _initEasing(map);

    window.onscroll = $.throttle(_ease,40);
    
  };

  //--- End of public functions of MapStory ---//
  
  
  //--- Private helper functions ---//

  // Sets up easings between each story location on the map
  var _initEasing = function (map) {
    for (var i = 0; i < storyLocations.length; i++) {

      // Populate scroll points of each story in the #stories column
      storyScrollPoints[i] = $(storyLocations[i].id).offset().top;
      
      var lat = storyLocations[i].lat;
      var lon = storyLocations[i].lon;
      var zoom = storyLocations[i].zoom
      var loc = map.locationCoordinate({ lat: lat, lon: lon }).zoomTo(zoom);
      
      // Setup easings between each story location
      // By default an easing just goes to itself
      easings[i] = mapbox.ease().map(map).from(loc).to(loc);
      
      // One easing's start position is the previous easing's end position
      if (typeof easings[i-1] === 'object') {
        easings[i-1].to(loc);
      }
    }
  }

  // Loads data from external dataSrc via JSONP
  var _loadData = function (sql, callback) {
    $.ajax({
      url: 'http://clearwater.cartodb.com/api/v2/sql',
      data: { q: sql, format: 'geojson' },
      dataType: 'jsonp',
      success: callback
    });
  }
  
  // _onOverlayLoad adds geojson returned from the JSONP call to the map
  // and caches the bounds of each nationality in bounds[]
  var _onOverlayLoad = function(geojson) {
    communityLayer.data(geojson);
  }

  // _onMarkerLoad processes the Google JSON returned from the spreadsheet
  // and adds it to the marker layer.
  var _onMarkerLoad = function(geojson) {
    markerLayer.features(geojson.features);
    var interaction = mapbox.markers.interaction(markerLayer);
    // Set a custom formatter for tooltips
    // Provide a function that returns html to be used in tooltip
    interaction.formatter(function(feature) {
        var o = feature.properties.name;
        return o;
    });
  }

  var _ease = function () {
    var scrollTop = $(window).scrollTop();
    
    // On a Mac "bouncy scrolling" you can get -ve scrollTop, not good
    scrollTop = scrollTop >= 0 ? scrollTop : 0;
    
    // Iterate over storyScrollPoints to find the index of the easing we want
    var i = _find(scrollTop, storyScrollPoints);
    
    // Don't do anything if we are beyond the last storyScrollPoint
    if (!i) return;
    
    // 0 < t < 1 represents where we are between two storyScrollPoints    
    var t = (scrollTop - storyScrollPoints[i-1]) / 
            (storyScrollPoints[i] - storyScrollPoints[i-1]);

    // Move the map to the position on the easing path according to t
    easings[i-1].t(t);
  }
  
  // Simple function to iterate over an ascending ordered array and
  // return the index of the first value greater than the search value
  // Returns null if value is outside range in the array.
  var _find = function (val, array) {
    for (var i = 0; i < array.length; i++) {
      if (val < array[i]) return i;
    }
    return null;
  }
  

  // Helper to _sanitize a string, replacing spaces with "-" and lowercasing
  function _sanitize(string) {
    if (typeof(string) != "undefined")
    return string.toLowerCase()
          .replace('http://www.giveclearwater.org/','a-')
          .split(" ").join("-").split("/").join("-");
  }
  
  function d3layer() {
      var f = {}, bounds, feature, collection;
      var div = d3.select(document.body)
          .append("div")
          .attr('class', 'd3-vec'),
          svg = div.append('svg'),
          g = svg.append("g");
          
      var click = function (d) {
          window.location = "#" + d.properties.name;
      }

      f.parent = div.node();

      f.project = function(x) {
        var point = f.map.locationPoint({ lat: x[1], lon: x[0] });
        return [point.x, point.y];
      };

      var first = true;
      f.draw = function() {
        first && svg.attr("width", f.map.dimensions.x)
            .attr("height", f.map.dimensions.y)
            .style("margin-left", "0px")
            .style("margin-top", "0px") && (first = false);

        path = d3.geo.path().projection(f.project);
        if (typeof feature !== 'undefined') feature.attr("d", path);
      };

      f.data = function(x) {
          collection = x;
          bounds = d3.geo.bounds(collection);
          feature = g.selectAll("path")
              .data(collection.features)
              .enter().append("path")
              .on("click", click);
          return f;
      };

      f.extent = function() {
          return new MM.Extent(
              new MM.Location(bounds[0][1], bounds[0][0]),
              new MM.Location(bounds[1][1], bounds[1][0]));
      };
      return f;
  };


}).call(this);