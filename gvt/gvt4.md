
<script type="text/javascript" src="gl-matrix.js"></script>
<script type="text/javascript" src="dat.gui.min.js"></script>

# GVT Task 4
[Sourcecode for Task](https://raw.githubusercontent.com/hendrikp/scratchpad/gh-pages/gvt/gvt4.md)

## WebGL 3x Procedural Shapes
<canvas id="wgl" width="1024" height="1024"></canvas>

<script id="wgl_vertex" type="nojs">
attribute vec4 pos;
attribute vec4 col;
varying vec4 vColor;
uniform mat4 modelviewProjection;
void main()
{
  vColor = col;
  gl_Position = modelviewProjection * pos;
}
</script>

<script id="wgl_fragment" type="nojs">
precision mediump float;
varying vec4 vColor;
void main()
{
  gl_FragColor = vColor;
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

// Use glMatrix
const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

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
function generateSpiral( params )
{
  const {a, b, angleScale, rotations} = params;
  //a - space offset
  //b - space angle per rotation factor
  //angleScale - angle scale per point
  //rotations - rotations

  var positions = [];
  var indices = [];
  var colors = [];
  var shape = { v: positions, i: indices, c: colors, params: params, modelview: glMatrix.mat4.create() };

  // generate data (spiral)
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

    positions.push( radius * Math.cos(angle), radius * Math.sin(angle), 0.5*radius*Math.sin(5*(angle)) );
    
    var progressRotation = (i % (pointsPerRotation+1)) / pointsPerRotation;
    var gradientHue = progressRotation;
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

// generate torus based on http://www.3d-meier.de/tut3/Seite58.html
function generateTorus( params )
{
  const {r, R, Nu, Nv} = params;
  
  var pi2 = 2 * Math.PI;

  var uMin = 0.0;
  var uMax = pi2;
  var vMin = 0.0;
  var vMax = pi2;
  
  var du = (uMax-uMin)/Nu;
  var dv = (uMax-uMin)/Nu;

  var positions = [];
  var indices = [];
  var colors = [];
  var shape = { v: positions, i: indices, c: colors, params: params, modelview: glMatrix.mat4.create() };

  // generate points
  for (var i=0; i<=Nu; i++)
  {
    for (var j=0; j<=Nv; j++)
    {
      var u = uMin + i * du;
      var v = vMin + j * dv;

      positions.push(
        (R + r * Math.cos(v)) * Math.cos(u),
        (R + r * Math.cos(v)) * Math.sin(u),
        r * Math.sin(v)
      );

      colors.push( 0.0, 0.0, 0.0, 1.0 );

      // points - CCW order
      var p = [
        i * (Nv + 1) + j,
        (i + 1) * (Nv + 1) + j,
        (i + 1) * (Nv + 1) + j + 1,
        i * (Nv + 1) + j + 1
      ];

      // generate triangles
      indices.push( p[0], p[1], p[2] );
      indices.push( p[0], p[2], p[3] );
    }
  }

  return shape;
}

// init context
function initContext(id)
{
  var _canvas = document.getElementById(id);
  var gl = _canvas.getContext("webgl", {antialias: true});

  function cleanBg()
  {
      gl.clearColor(1, 1, 1, 1); // white
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  var projection = mat4.create();  // projection matrix
  var modelviewProjection = mat4.create();  // combined matrix

  if (gl)
  {
    var vs = getShader(gl, gl.VERTEX_SHADER, "wgl_vertex");
    var fs = getShader(gl, gl.FRAGMENT_SHADER, "wgl_fragment");
    
    var context = {gl: gl, vs: vs, fs: fs};

    var program = initProgram(gl);
    context.program = program;

    // prepare canvas
    gl.useProgram(program);

    // clean + enable depth / features
    cleanBg();
    gl.enable(gl.DEPTH_TEST);

    // prepare viewport
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
    // prepare attributes of shaders
    var posAttribute = gl.getAttribLocation(program, "pos");
    context.posAttribute = posAttribute;
    var colAttribute = gl.getAttribLocation(program, "col");
    context.colAttribute = colAttribute;
    var u_modelviewProjection = gl.getUniformLocation(program, "modelviewProjection");
    context.modelviewProjection = u_modelviewProjection;

    // creation of buffers
    function createBuffers(shape)
    {
      // store vertices
      if (shape.c)
      {
        shape.pBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.pBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.v), gl.STATIC_DRAW);
      }

      // store indices
      if (shape.c)
      {
        shape.iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.i), gl.STATIC_DRAW);
      }

      // store colors
      if (shape.c)
      {
        shape.cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.c), gl.STATIC_DRAW);
      }
    }

    // method to draw line strip
    function drawArrays(shape)
    {
      // if buffer not yet created try (cached)
      if (!shape.pBuffer)
      {
        createBuffers(shape);
      }

      // vertices
      if (shape.pBuffer)
      {
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.pBuffer);
        gl.enableVertexAttribArray(posAttribute);
        gl.vertexAttribPointer(posAttribute, 3, gl.FLOAT, false, 0, 0);
      }

      gl.drawArrays(gl.LINE_STRIP, 0, shape.v.length / 2);
    }

    // method to draw
    function drawElements(shape)
    {
      // if buffer not yet created try (cached)
      if (!shape.pBuffer)
      {
        createBuffers(shape);
      }

      // vertices
      if (shape.pBuffer)
      {
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.pBuffer);
        gl.enableVertexAttribArray(posAttribute);
        gl.vertexAttribPointer(posAttribute, 3, gl.FLOAT, false, 0, 0);
      }

      // colors
      if (shape.cBuffer)
      {
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.cBuffer);
        gl.enableVertexAttribArray(colAttribute);
        gl.vertexAttribPointer(colAttribute, 4, gl.FLOAT, false, 0, 0);
      }

      // indices
      if (shape.iBuffer)
      {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.iBuffer);
      }

      // position
      mat4.multiply( modelviewProjection, projection, shape.modelview );
      gl.uniformMatrix4fv(u_modelviewProjection, false, modelviewProjection );

      // ui options for drawing
      if (shape.params.drawLines == true)
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

    // generate data
    var scene = {};
    context.scene = scene;
    function createSceneObject(params)
    {
      if (params.name != '')
      {
        var shape = params.generator(params);

        // reposition + resize
        mat4.translate(shape.modelview, shape.modelview, params.pos);
        mat4.scale(shape.modelview, shape.modelview, params.scale);
        mat4.rotateX(shape.modelview, shape.modelview, params.rotate[0]);
        mat4.rotateY(shape.modelview, shape.modelview, params.rotate[1]);
        mat4.rotateZ(shape.modelview, shape.modelview, params.rotate[2]);

        scene[shape.params.name] = shape; // place spiral into scene

        return shape;
      }
    }

    var wspiral = createSceneObject({
      name: 'wspiral',
      generator: generateSpiral,
      pos: [-0.5, 0.5, 0.0],
      scale: [0.5, 0.5, 0.5],
      rotate: [0.5, 0.5, 0.0],
      a: 0.003, b: 0.03,
      angleScale: 0.1, rotations: 5,
      drawLines: true,
      draw: drawElements,
    });


    var torus = createSceneObject({
      name: 'torus',
      generator: generateTorus,
      pos: [0.5, 0.5, 0.0],
      scale: [0.5, 0.5, 0.5],
      rotate: [0.25, 0.25, 0.0],
      r: 0.03, R: 0.3,
      Nu: 10, Nv: 8,
      drawLines: true,
      draw: drawElements,
    });
    //{r, R, Nu, Nv} 

    // create folder to control shape in dat.gui
    var ui = gui.addFolder('Wobbly Spiral');
    ui.add(wspiral.params, "a", 0, 0.3, 0.0002).onChange( function() { createSceneObject(wspiral.params); requestAnimationFrame(renderContext);} );
    ui.add(wspiral.params, "b", 0, 0.3, 0.005).onChange( function() { createSceneObject(wspiral.params); requestAnimationFrame(renderContext);} );
    ui.add(wspiral.params, "rotations", 0, 20, 0.3).onChange( function() { createSceneObject(wspiral.params); requestAnimationFrame(renderContext);} );
    ui.add(wspiral.params, "drawLines").onChange( renderContext );

    var ui = gui.addFolder('Torus');
    ui.add(torus.params, "r", 0, 0.3, 0.0002).onChange( function() { createSceneObject(torus.params); requestAnimationFrame(renderContext);} );
    ui.add(torus.params, "R", 0, 0.3, 0.005).onChange( function() { createSceneObject(torus.params); requestAnimationFrame(renderContext);} );
    ui.add(torus.params, "Nu", 0, 20, 1).onChange( function() { createSceneObject(torus.params); requestAnimationFrame(renderContext);} );
    ui.add(torus.params, "Nv", 0, 20, 1).onChange( function() { createSceneObject(torus.params); requestAnimationFrame(renderContext);} );
    ui.add(torus.params, "drawLines").onChange( renderContext );

    // draw task
    context.render = function()
    {
      cleanBg();

      // draw all schapes in scene
      for (shape in scene)
      {
        scene[shape].params.draw(scene[shape]);
      }
    }
    return context;
  }
}

// create context and render once
context = initContext("wgl");
requestAnimationFrame(renderContext);
</script>
