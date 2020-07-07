
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
      importLayer(this.files[0]);
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
   //if image is not loaded yet
   if(isNaN(ypSet.yaw))
   {tempNotification("Upload an Image",800);
   return ;
   }

   //for formated data used for copying
   var forCopy = "\"yaw\":"+ypSet.yaw.toFixed(2)+","+"\n"+"\"pitch\":"+ypSet.pitch.toFixed(2);
   document.getElementById("ypset").innerHTML="Yaw :&emsp;"+ypSet.yaw.toFixed(2)+"<br><br>"+"Pitch :&emsp;"+ypSet.pitch.toFixed(2);
   //pointer 
   var ypdiv =document.getElementById("ypset");
   document.getElementById("ypset").style.cursor="pointer";
   //diplay div
    ypdiv.style.display="block";
   //on click copy the data in format 
   ypdiv.addEventListener('click', function() { 
     copyToClipboard(forCopy);
    tempNotification("copied",800);
    });
    
    //notification snackbar
    function tempNotification(msg,duration){
   var notificationBar = document.getElementById("snackbar");
   notificationBar.style.letterSpacing="2px";
   notificationBar.className = "show";
   notificationBar.textContent=msg;
   setTimeout(function(){ notificationBar.className = notificationBar.className.replace("show", ""); }, duration);
  }
   //copy text to clipboard 
  function copyToClipboard(text) {
      var dummy = document.createElement("textarea");
      document.body.appendChild(dummy);
      dummy.value = text;
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
  } 
})

