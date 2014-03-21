cwm.views.Markers = function() {
    var map,
        markerSize = 8;

    // Used to sort featured places so they appear above others on the map
    // if the markers overlap

    function sortFeaturedLast(a, b) {
        return (a.attr("featured") === true) ? 1 : 0;
    }

    // Sorts points according to distance from center point of map
    // used for animating `show` making markers appear from center

    function sortFromLocation(location) {
        var loc = location || new MM.Location(0, 0);
        return function(a, b) {
            var ac = a.geometry.coordinates;
            var bc = b.geometry.coordinates;
            var ad = Math.pow(ac[0] - loc.lon, 2) + Math.pow(ac[1] - loc.lat, 2);
            var bd = Math.pow(bc[0] - loc.lon, 2) + Math.pow(bc[1] - loc.lat, 2);
            return d3.ascending(ad, bd);
        };
    }

    return {
        show: function(selection) {
            selection
                .sort(sortFromLocation(map.getCenter()))
                .transition()
                .duration(1000)
                .delay(function(d, i) {
                    return i * 20;
                })
                .ease("elastic", 2)
                .attr("r", markerSize);

            selection
                .sort(sortFeaturedLast);
        },

        hide: function(selection) {
            selection.transition()
                .attr("r", 0)
                .each("end", function() {
                    d3.select(this).remove();
                });
        },

        map: function(_) {
            map = _;
        }
    };
};
