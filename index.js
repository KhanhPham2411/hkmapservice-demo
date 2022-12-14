//reference from https://api.portal.hkmapservice.gov.hk/js-samples-demo
// resize map
const mapdiv = document.getElementById("map");
var margin;
if (document.all) {
  margin =
    parseInt(document.body.currentStyle.marginTop, 10) +
    parseInt(document.body.currentStyle.marginBottom, 10);
} else {
  margin =
    parseInt(
      document.defaultView
        .getComputedStyle(document.body, "")
        .getPropertyValue("margin-top")
    ) +
    parseInt(
      document.defaultView
        .getComputedStyle(document.body, "")
        .getPropertyValue("margin-bottom")
    );
}
//mapdiv.style.height = window.innerHeight - margin + "px";
// mapdiv.style.height = "500px";
// mapdiv.style.width = "500px";

// location param
const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});
let mapImage = "";
let lon = Number(params.longitude) || 114.2082061;
let lat = Number(params.latitude) || 22.4272311;
let isView = Boolean(params.isView) || false;
let isDownload = Boolean(params.isDownload) || false;

let locationCorr = [lon, lat];

///// openlayer 3
var apikey = "584b2fa686f14ba283874318b3b8d6b0"; //api.hkmapservice.gov.hk starter key
function initMap() {
  return new ol.Map({
    target: "map",
    controls: ol.control.defaults({
      attributionOptions: {
        collapsible: false,
      },
    }),
    layers: [
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          attributions: new ol.Attribution({
            html: "<a href='https://api.portal.hkmapservice.gov.hk/disclaimer' target='_blank'>&copy; Map from Lands Department</a><div style='width:25px;height:25px;display:inline-flex;background:url(https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg);background-size:25px;margin-left:4px'></div>",
          }),
          crossOrigin: "anonymous",
          url:
            "https://api.hkmapservice.gov.hk/osm/xyz/basemap/WGS84/tile/{z}/{x}/{y}.png?key=" +
            apikey,
          // url: "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/WGS84/{z}/{x}/{y}.png",
        }),
      }),
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          crossOrigin: "anonymous",
          url:
            "https://api.hkmapservice.gov.hk/osm/xyz/label-tc/WGS84/tile/{z}/{x}/{y}.png?key=" +
            apikey,
          // url: "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/tc/WGS84/{z}/{x}/{y}.png",
        }),
      }),
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat(locationCorr),
      zoom: 18,
      minZoom: 10,
      maxZoom: 20,
    }),
  });
}

var map = initMap();

map.on("click", function (event) {
  var point = map.getCoordinateFromPixel(event.pixel);
  var lonLat = ol.proj.toLonLat(point);
  console.log("clicked on ([lon, lat]): ", lonLat); // note the ordering of the numbers
  console.log("zoom: ", map.getView().getZoom()); // note the ordering of the numbers
  console.log("center: "); // note the ordering of the numbers
});


var draw; // global so we can remove it later
var source = new ol.source.Vector();

function loadMap() {
  console.log("loadMap");
  locationCorr = [
    Number(document.getElementById("lon").value),
    Number(document.getElementById("lat").value),
  ];
  setMapView();
  removePin();
  addPin();
  addPolygonInteraction();
  addArea();

  checkMapLoaded();
}
function addArea() {
  var point1 = [114.2122061, 22.4252311];
  var point2 = [114.2082061, 22.4272311]; // current location
  var point3 = [114.2092561, 22.4292311];

  var line1 = [ point1, point2 ];
  var line2 = [ point2, point3 ];
  var line3 = [ point1, point3 ];
  addPolygon([line1, line2, line3]);
  // addLine(line2);
  // addLine(line3);
}

function addPolygon(vertices) {
  var feature = new ol.Feature({
    geometry: new ol.geom.Polygon(vertices)
  });

  feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
  feature.setStyle(new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.4)'
    }),
    stroke: new ol.style.Stroke({ color: '#FF0000', width: 2 })
  }));

  var vectorSource= new ol.source.Vector({
    features: [feature]
  });

  var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.4)'
      }),
      stroke: new ol.style.Stroke({ color: '#FF0000', width: 2 })
    })
  });
  map.addLayer(vectorLayer);
}


function addLine(points) {

  for (var i = 0; i < points.length; i++) {
      points[i] = ol.proj.transform(points[i], 'EPSG:4326', 'EPSG:3857');
  }

  var featureLine = new ol.Feature({
      geometry: new ol.geom.LineString(points)
  });

  var vectorLine = new ol.source.Vector({});
  vectorLine.addFeature(featureLine);

  var vectorLineLayer = new ol.layer.Vector({
      source: vectorLine,
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.4)'
        }),
        stroke: new ol.style.Stroke({ color: '#FF0000', width: 2 }),
        
      })
  });
  map.addLayer(vectorLineLayer);
}

function addPolygonInteraction() {
  var type = "Polygon";

  draw = new ol.interaction.Draw({
    source: source,
    type: /** @type {ol.geom.GeometryType} */ (type),
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.4)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 1)',
        lineDash: [10, 10],
        width: 2
      }),
      image: new ol.style.Circle({
        radius: 5,
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0.7)'
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.4)'
        })
      })
    })
  });

  map.addInteraction(draw);
  // map.un("singleclick", mapOnClick);
  // draw.on('drawstart',
  //   function (evt) {
  //     map.un("singleclick", mapOnClick);
  //     // set sketch
  //     sketch = evt.feature;
  //   }, this);
}

function removePin() {
  console.log("removePin", map.getLayers().getArray());
  map
    .getLayers()
    .getArray()
    .filter((layer) => layer.get("name") === "Pin")
    .forEach((layer) => map.removeLayer(layer));
}

function setMapView() {
  map.getView().setCenter(ol.proj.fromLonLat(locationCorr));
}



//check map is loaded
//"Dirty" tiles can be in one of two states: Either they are being downloaded,
//or the map is holding off downloading their replacement, and they are "wanted."
//We can tell when the map is ready when there are no tiles in either of these
//states, and rendering is done.

function checkMapLoaded() {
  var numInFlightTiles = 0;
  map.getLayers().forEach(function (layer) {
    console.log("getLayers");
    var source = layer.getSource();
    if (source instanceof ol.source.TileImage) {
      source.on("tileloadstart", function () {
        ++numInFlightTiles;
      });
      source.on("tileloadend", function () {
        --numInFlightTiles;
      });
    }
  });

  map.on("postrender", function (evt) {
    if (!evt.frameState) return;

    var numHeldTiles = 0;
    var wanted = evt.frameState.wantedTiles;
    for (var layer in wanted)
      if (wanted.hasOwnProperty(layer))
        numHeldTiles += Object.keys(wanted[layer]).length;

    var ready = numInFlightTiles === 0 && numHeldTiles === 0;
    if (map.get("ready") !== ready) map.set("ready", ready);
  });
}

function whenMapIsReady(callback) {
  console.log("whenMapIsReady");
  if (map.get("ready")) callback();
  else map.once("change:ready", whenMapIsReady.bind(null, callback));
}

//auto download
function DownloadMapAsImage() {
  //console.log("DownloadMapAsImage", mapCanvas);
  let downloadLink = document.createElement("a");
  downloadLink.setAttribute("download", "map.png");
  let dataURL = getMapImage();
  map.renderSync();
  downloadLink.setAttribute("href", dataURL);
  downloadLink.click();
}

function getMapImage() {
  return document.getElementsByTagName("canvas")[0].toDataURL("image/png");
}

function setMapImage() {
  console.log("setMapImage", Date.now());
  mapImage = getMapImage();
  console.log("mapImage", mapImage);
  map.renderSync();
}

//control location pin
function setLonLat(lonVal, latVal) {
  lonEle = document.getElementById("lon");
  latEle = document.getElementById("lat");
  lonEle.value = lonVal;
  latEle.value = latVal;
  generateMapImage();
  return "";
}

function generateMapImage() {
  console.log("generateMapImage", Date.now());
  mapImage = "";
  map.set("ready", false);
  loadMap();
  whenMapIsReady(setMapImage);
}

setLonLat(lon, lat);

function addPin() {
  // add location pin
  var features = [];

  var iconPath = "./placeholder.png";
  //create Feature... with coordinates
  var iconFeature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat(locationCorr)),
  });

  //create style for your feature...
  var iconStyle = new ol.style.Style({
    text: new ol.style.Text({
      text: "\uf3c5",
      font: "normal 38px FontAwesome",
      fill: new ol.style.Fill({
        color: "#ff0000",
      }),
    }),
  });

  iconFeature.setStyle(iconStyle);
  features.push(iconFeature);

  /*
   * create vector source
   * you could set the style for all features in your vectoreSource as well
   */
  var vectorSource = new ol.source.Vector({
    features: features, //add an array of features
    //,style: iconStyle     //to set the style for all your features...
  });

  var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    name: "Pin",
  });

  map.addLayer(vectorLayer);
}