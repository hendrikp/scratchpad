
<script type="text/javascript" src="gl-matrix.js"></script>
<script type="text/javascript" src="dat.gui.min.js"></script>

# GVT Task 4
[Sourcecode for Task](https://raw.githubusercontent.com/hendrikp/scratchpad/gh-pages/gvt/gvt4.md)

## WebGL HSV Triangle Spiral
<canvas id="wgl" width="1024" height="1024"></canvas>

<script id="wgl_vertex" type="nojs">
attribute vec4 pos;
attribute vec4 col;
varying vec4 vColor;
void main()
{
  vColor = col;
  gl_Position = pos;
}
</script>

<script id="wgl_fragment" type="nojs">
precision mediump float;
varying vec4 vColor;
void main()
{
  gl_FragColor = vColor;
  //gl_FragColor = vec4(0, 0, 0, 1); // black
  //gl_FragColor = vec4(0.22, 1, 0.07, 1); // neon
}
</script>

<script>

// Use DAT GUI
var gui = new dat.GUI();
var context;
function renderContext()
{
  context.render();
}

// resize helper from https://webgl2fundamentals.org/webgl/resources/webgl-utils.js
function resizeCanvasToDisplaySize(canvas, multiplier) {
  multiplier = multiplier || 1;
  const width  = canvas.clientWidth  * multiplier | 0;
  const height = canvas.clientHeight * multiplier | 0;
  if (canvas.width !== width ||  canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
      return true;
  }
  return false;
}
  
// Compile shader
var _shaders = [];
function getShader(gl, type, id)
{
  var source = document.getElementById(id).text;
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
  {
    console.log(gl.getShaderInfoLog(shader));
  }
  else
  {
    _shaders.push(shader);
    return shader;
  }
}

// link program
function initProgram(gl)
{
  var program = gl.createProgram();
  
  _shaders.forEach(element => gl.attachShader(program, element));
  
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
  {
    console.log(gl.getProgramInfoLog(program));
  }
  else
  {
    return program;
  }
}

// color conversion for gradient (based on: https://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c)
function hsl2rgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r,g,b];
}

// generate data
function generateSpiral()
{
  // create folder to control shape in dat.gui
  var ui = gui.addFolder('Spiral');
  ui.drawLines = false;
  gui.add(ui, "drawLines").onChange( renderContext );

  var positions = [];
  var indices = [];
  var colors = [];
  var shape = { v: positions, i: indices, c: colors, ui: ui };

  // generate data (spiral)
  var a = 0.003; // space offset
  var b = 0.03; // space angle per rotation factor
  var angleScale = 0.1; // angle scale per point
  var rotations = 5; // 5 rotations
  var pi2 = 2 * Math.PI;
  
  var pointsPerRotation = Math.ceil( pi2 / angleScale );
  var pointsTotal = Math.ceil( rotations * pointsPerRotation );
  var origins = pointsTotal - pointsPerRotation; // one less rotation
  var pointsPerRotation2 = 2*pointsPerRotation;
  var fadeOut = (rotations*0.45)*pointsPerRotation;
  
  for (var i = 0; i < pointsTotal; ++i)
  {
    var angle = i * angleScale;
    var rotation = angle / pi2;
    
    var radius = a + b * rotation * rotation;
    positions.push( radius * Math.cos(angle), radius * Math.sin(angle) );
    
    var gradientHue = (i % (pointsPerRotation+1)) / pointsPerRotation;
    var saturation = i / pointsTotal;
    var light = 1.0;
    
    var nearEnd = pointsTotal - i - fadeOut;
    if (nearEnd < 0)
    {
      light += nearEnd/fadeOut;
    }
    
    var nearStart = i - fadeOut
    if (nearStart < 0)
    {
      light += nearStart/fadeOut;
    }

    // hsv based gradient
    var c = hsl2rgb(gradientHue, saturation, light);
    colors.push(c[0], c[1], c[2], 1);
    
    // still generate triangles?
    if (i < origins)
    {
      // fully filled
      indices.push( i, i+pointsPerRotation, i+1);
      indices.push( i, i+pointsPerRotation-1, i+pointsPerRotation);
    }
  }
  
  return shape;
}

// init context
function initContext(id)
{
  var _canvas = document.getElementById(id);
  var gl = _canvas.getContext("webgl", {antialias: true});

  if (gl)
  {
    var vs = getShader(gl, gl.VERTEX_SHADER, "wgl_vertex");
    var fs = getShader(gl, gl.FRAGMENT_SHADER, "wgl_fragment");
    
    var program = initProgram(gl);
    
    // prepare canvas
    gl.useProgram(program);
    gl.clearColor(1, 1, 1, 1); // white
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
    // prepare attributes of shaders
    var posAttribute = gl.getAttribLocation(program, "pos");
    var colAttribute = gl.getAttribLocation(program, "col");

    // generate data
    var shape = generateSpiral();
    
    // store vertices
    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.v), gl.STATIC_DRAW);
    
    // store indices
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.i), gl.STATIC_DRAW);
    
    // store colors
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.c), gl.STATIC_DRAW);

    // method to draw (task 2)
    function drawSpiralLineStrip()
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
      gl.enableVertexAttribArray(posAttribute);
      gl.vertexAttribPointer(posAttribute, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINE_STRIP, 0, shape.v.length / 2);
    }
    
    // method to draw (task 3)
    function drawSpiral()
    {
      // vertices
      gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
      gl.enableVertexAttribArray(posAttribute);
      gl.vertexAttribPointer(posAttribute, 2, gl.FLOAT, false, 0, 0);
      
      // colors
      gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
      gl.enableVertexAttribArray(colAttribute);
      gl.vertexAttribPointer(colAttribute, 4, gl.FLOAT, false, 0, 0);
      
      // indices
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);

      if (shape.ui.drawLines == true)
      {
        // draw lines
        gl.drawElements(gl.LINES, shape.i.length, gl.UNSIGNED_SHORT, 0);
      }
      else 
      {
        // draw triangles based on indices
        gl.drawElements(gl.TRIANGLES, shape.i.length, gl.UNSIGNED_SHORT, 0);
      }
    }
    
    function render()
    {
      gl.clearColor(1, 1, 1, 1); // white
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      drawSpiral();
    }

    return { render: render };
  }
}

context = initContext("wgl");
context.render();

</script>
