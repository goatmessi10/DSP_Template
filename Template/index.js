
'use strict';

// Create viewer.
// WebGL support is required to showcase the transformation effects.
var viewerOpts = { stageType: 'webgl' };
var viewer = new Marzipano.Viewer(document.getElementById('pano'), viewerOpts);

// Create view.
var limiter = Marzipano.RectilinearView.limit.traditional(2048, 120*Math.PI/180);
var view = new Marzipano.RectilinearView(null, limiter);

// Create an empty scene into which layers will be added.
var scene = viewer.createEmptyScene({ view: view });

// Query the stage for the maximum supported texture size.
var maxSize = viewer.stage().maxTextureSize();
var maxDimensions = maxSize + 'x' + maxSize;

// Create a knockout.js observable array to hold the layers.
var layers = ko.observableArray([]);

// Set up the user interface for importing layers.
var selectFilesInput = document.getElementById('selectFilesInput');
selectFilesInput.addEventListener('change', function() {
  if (this.files && this.files.length > 0) {
    for (var i = 0; i < this.files.length; i++) {
      importLayer(this.files[i]);
    }
  }
  this.value = null;
});
var selectFilesButton = document.getElementById('selectFilesButton');
selectFilesButton.addEventListener('click', function() {
  selectFilesInput.click();
});

// Convert an image file into a canvas.
function fileToCanvas(file, done) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var img = document.createElement('img');
  img.onload = function() {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    done(null, canvas);
  };
  img.onerror = function(err) {
    done(err);
  };
  img.src = URL.createObjectURL(file);
  console.log(img.naturalWidth,img.naturalHeight);
}

// Import a canvas into a layer.
function importLayer(file) {
  fileToCanvas(file, function(err, canvas) {
    if (err) {
      alert('Unable to load image file.');
      return;
    }
    if (canvas.width > maxSize || canvas.height > maxSize) {
      alert('Image is too large. The maximum supported size is ' +
        maxSize + ' by ' + maxSize + ' pixels.');
      return;
    }

    // Create layer.
    var asset = new Marzipano.DynamicAsset(canvas);
    var source = new Marzipano.SingleAssetSource(asset);
    var geometry = new Marzipano.EquirectGeometry([{ width: canvas.width }]);
    var layer = scene.createLayer({
      source: source,
      geometry: geometry
    });

  

    // Add layer into the view model.
    layers.unshift({
      name: file.name,
      layer: layer,
      canvas: canvas
    });
  });
}

// Discard an existing layer.
function discardLayer(item) {
  if (confirm('Remove this layer?')) {
    scene.destroyLayer(item.layer);
    layers.remove(item);
  }
}



// Display the initially empty scene.
scene.switchTo({ transitionDuration: 0 });

var viewModel = {
  layers: layers,
  discardLayer: discardLayer,
  maxDimensions: maxDimensions
};

ko.bindingHandlers.element = {
    init: function(element, valueAccessor) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      element.appendChild(valueAccessor());
    }
};

ko.applyBindings(viewModel);
var pano = document.getElementById("pano");
pano.addEventListener("click", function (e) {
   var view = viewer.view();
   var ypSet=view.screenToCoordinates({x: e.clientX, y: e.clientY});
  document.getElementById("ypset").textContent="\"yaw\":"+ypSet.yaw.toFixed(2)+","+"\n"+"\"pitch\":"+ypSet.pitch.toFixed(2);
  var ypdiv =document.getElementById("ypcontent");
  document.getElementById("ypset").style.cursor="pointer";

  ypdiv.addEventListener('click', function() { 
    var data=document.getElementById("ypset").textContent;
     copyToClipboard(data);
    tempAlert("copied",800);
    });
    
    function tempAlert(msg,duration){
   var el = document.createElement("div");
   el.setAttribute("style","position:absolute;top:40%;left:87%;background-color:rgb(104,96,96);  box-shadow: 2px 4px #888888;");
   el.style.color="white";
   el.style.padding="5px";
   el.innerHTML = msg;
   setTimeout(function(){
   el.parentNode.removeChild(el);
  },duration);
   document.body.appendChild(el);
  }
    
    function copyToClipboard(text) {
      var dummy = document.createElement("textarea");
      document.body.appendChild(dummy);
      dummy.value = text;
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
  } 
})

