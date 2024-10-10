// Check if the script is run as a panel or a standalone script
var myPanel =
  typeof this !== "undefined" && this instanceof Panel
    ? this
    : new Window("palette", "Randomize Layer Properties", undefined, {
        resizeable: true,
      });

// UI Elements
myPanel.add("statictext", undefined, "Randomization Settings");

// Selection for Radius or Rectangle
var selectionGroup = myPanel.add("group");
var useRadius = selectionGroup.add("radiobutton", undefined, "Use Radius");
var useRectangle = selectionGroup.add(
  "radiobutton",
  undefined,
  "Use Rectangle"
);
useRadius.value = true; // Default to Radius

// Radius Input
var radiusGroup = myPanel.add("group");
radiusGroup.add("statictext", undefined, "Initial Radius:");
var radiusInput = radiusGroup.add("edittext", undefined, "100");
radiusInput.characters = 5;

// Rectangle Size Inputs
var rectangleGroup = myPanel.add("group");
rectangleGroup.add("statictext", undefined, "Rectangle Width:");
var rectWidthInput = rectangleGroup.add("edittext", undefined, "200");
rectWidthInput.characters = 5;
rectangleGroup.add("statictext", undefined, "Height:");
var rectHeightInput = rectangleGroup.add("edittext", undefined, "100");
rectHeightInput.characters = 5;

// Scale Range Inputs
var scaleGroup = myPanel.add("group");
scaleGroup.add("statictext", undefined, "Scale Range:");
var scaleMinInput = scaleGroup.add("edittext", undefined, "50");
scaleMinInput.characters = 5;
scaleGroup.add("statictext", undefined, "to");
var scaleMaxInput = scaleGroup.add("edittext", undefined, "150");
scaleMaxInput.characters = 5;

// Additional Scale Control
var scaleControlGroup = myPanel.add("group");
scaleControlGroup.add("statictext", undefined, "Global Scale:");
var globalScaleInput = scaleControlGroup.add("edittext", undefined, "100");
globalScaleInput.characters = 5;

// Rotation Options
var rotationGroup = myPanel.add("group");
rotationGroup.add("statictext", undefined, "Rotation:");
var enableXRotation = rotationGroup.add("checkbox", undefined, "X");
var enableYRotation = rotationGroup.add("checkbox", undefined, "Y");
var enableZRotation = rotationGroup.add("checkbox", undefined, "Z");
enableXRotation.value = true; // Default to checked
enableYRotation.value = true; // Default to checked
enableZRotation.value = true; // Default to checked

// Randomize Button
var randomizeButton = myPanel.add("button", undefined, "Randomize Layers");
randomizeButton.onClick = function () {
  var scaleMin = parseFloat(scaleMinInput.text);
  var scaleMax = parseFloat(scaleMaxInput.text);
  var radius = parseFloat(radiusInput.text);
  var rectWidth = parseFloat(rectWidthInput.text);
  var rectHeight = parseFloat(rectHeightInput.text);
  var globalScale = parseFloat(globalScaleInput.text) / 100; // Convert to percentage
  randomizeLayers(
    useRadius.value,
    radius,
    rectWidth,
    rectHeight,
    scaleMin,
    scaleMax,
    globalScale,
    enableXRotation.value,
    enableYRotation.value,
    enableZRotation.value
  );
};

// Function to randomize layers based on user inputs
function randomizeLayers(
  useRadius,
  radius,
  rectWidth,
  rectHeight,
  scaleMin,
  scaleMax,
  globalScale,
  rotateX,
  rotateY,
  rotateZ
) {
  var comp = app.project.activeItem;

  if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
    var selectedLayers = comp.selectedLayers;
    var totalPosition = [0, 0, 0];
    var midpoint = [0, 0, 0];

    // Calculate the midpoint of all selected layers
    for (var i = 0; i < selectedLayers.length; i++) {
      var layer = selectedLayers[i];
      totalPosition[0] += layer.transform.position.value[0];
      totalPosition[1] += layer.transform.position.value[1];
      if (layer.threeDLayer) {
        totalPosition[2] += layer.transform.position.value[2];
      }
    }

    // Find the average/midpoint position
    midpoint[0] = totalPosition[0] / selectedLayers.length;
    midpoint[1] = totalPosition[1] / selectedLayers.length;
    midpoint[2] = totalPosition[2] / selectedLayers.length;

    // Randomize position, scale, and rotation for each layer
    for (var i = 0; i < selectedLayers.length; i++) {
      var layer = selectedLayers[i];

      var randomX, randomY, randomZ;
      if (useRadius) {
        // Randomize position within the specified radius
        var angle = Math.random() * Math.PI * 2; // Random angle in radians
        var radiusMultiplier = Math.random() * radius; // Random distance up to the radius

        randomX = midpoint[0] + Math.cos(angle) * radiusMultiplier;
        randomY = midpoint[1] + Math.sin(angle) * radiusMultiplier;
        randomZ = layer.threeDLayer
          ? midpoint[2] + (Math.random() * radius * 2 - radius)
          : midpoint[2];
      } else {
        // Randomize position within the specified rectangle
        randomX = midpoint[0] + (Math.random() * rectWidth - rectWidth / 2);
        randomY = midpoint[1] + (Math.random() * rectHeight - rectHeight / 2);
        randomZ = layer.threeDLayer
          ? midpoint[2] + (Math.random() * rectWidth - rectWidth / 2)
          : midpoint[2];
      }

      layer.transform.position.setValue([randomX, randomY, randomZ]);

      // Randomize scale
      var randomScale = scaleMin + Math.random() * (scaleMax - scaleMin);
      layer.transform.scale.setValue([
        randomScale * globalScale,
        randomScale * globalScale,
        randomScale * globalScale,
      ]);

      // Randomize rotation
      if (layer.threeDLayer) {
        if (rotateX) layer.transform.xRotation.setValue(Math.random() * 360);
        if (rotateY) layer.transform.yRotation.setValue(Math.random() * 360);
        if (rotateZ) layer.transform.zRotation.setValue(Math.random() * 360);
      } else {
        if (rotateZ) layer.transform.rotation.setValue(Math.random() * 360);
      }
    }

    // Create Null Layer for Radius, Scale, and Seed Control
    createNullLayer(
      radius,
      rectWidth,
      rectHeight,
      globalScale,
      scaleMin,
      scaleMax
    );

    app.endUndoGroup();
  } else {
    alert("Please select layers in a composition.");
  }
}

// Function to create a null layer for radius, scale, and seed control
function createNullLayer(
  initialRadius,
  initialRectWidth,
  initialRectHeight,
  initialGlobalScale,
  scaleMin,
  scaleMax
) {
  var comp = app.project.activeItem;
  if (comp && comp instanceof CompItem) {
    app.beginUndoGroup("Create Null Layer");
    var nullLayer = comp.layers.addNull();
    nullLayer.name = "Randomization Control";

    // Add Slider Controls for radius, rectangle size, global scale, and seed
    var radiusControl = nullLayer.effect.addProperty("ADBE Slider Control");
    radiusControl.name = "Radius";
    radiusControl.property("Slider").setValue(initialRadius);

    var globalScaleControl = nullLayer.effect.addProperty(
      "ADBE Slider Control"
    );
    globalScaleControl.name = "Global Scale";
    globalScaleControl.property("Slider").setValue(initialGlobalScale * 100); // Store as percentage

    var seedControl = nullLayer.effect.addProperty("ADBE Slider Control");
    seedControl.name = "Seed";
    seedControl.property("Slider").setValue(1); // Default seed value

    // Create expression for layer position adjustment
    var radiusExpression =
      "var control = thisComp.layer('Randomization Control');\n" +
      "var radius = control.effect('Radius')('Slider');\n" +
      "var basePos = value;\n" +
      "var dir = normalize(basePos - [thisComp.width / 2, thisComp.height / 2, 0]);\n" + // Direction from center
      "dir * radius + [thisComp.width / 2, thisComp.height / 2, 0];"; // Update position

    // Create expression for scale adjustment with seed
    var scaleExpression =
      "var control = thisComp.layer('Randomization Control');\n" +
      "var globalScale = control.effect('Global Scale')('Slider') / 100;\n" +
      "var seed = Math.floor(control.effect('Seed')('Slider'));\n" +
      "seedRandom(index + seed, true);\n" +
      "var minScale = " +
      scaleMin +
      ";\n" +
      "var maxScale = " +
      scaleMax +
      ";\n" +
      "var randomScale = minScale + Math.random() * (maxScale - minScale);\n" +
      "[randomScale, randomScale, randomScale] * globalScale;";

    // Apply expressions to each selected layer
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);
      if (!layer.nullLayer) {
        layer.transform.position.expression = radiusExpression;
        layer.transform.scale.expression = scaleExpression;
      }
    }
  }
}

myPanel.layout.layout(true);
myPanel.layout.resize();
if (myPanel instanceof Window) {
  myPanel.center();
  myPanel.show();
}
