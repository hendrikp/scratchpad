# GVT Task 3
[Sourcecode for Task](https://raw.githubusercontent.com/hendrikp/scratchpad/gh-pages/gvt/gvt3.md)

## WebGL Lines
<canvas id="wgl" width="512" height="512"></canvas>

<script id="wgl_vertex" type="nojs">
attribute vec4 pos;
void main()
{
  gl_Position = pos;
}
</script>

<script id="wgl_fragment" type="nojs">
void main()
{
  gl_FragColor = vec4(0, 0, 0, 1); // black
  //gl_FragColor = vec4(0.22, 1, 0.07, 1); // neon
}
</script>

<script>
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
function hsv2rgb(h, s, v) {
    var r, g, b, i, f, p, q, t;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [r, g, b];
}

// generate data
function generateSpiral()
{
  var positions = [];
  var indices = [];
  var colors = [];
  
  // generate data (spiral)
  var a = 0.003; // space offset
  var b = 0.03; // space angle per rotation factor
  var angleScale = 0.1; // angle scale per point
  var rotations = 5; // 5 rotations
  var pi2 = 2 * Math.PI;
  
  var pointsPerRotation = pi2 / angleScale;
  var pointsTotal = rotations * pointsPerRotation;
  var origins = pointsTotal - pointsPerRotation; // one less rotation
  
  for (var i = 0; i <= points; ++i)
  {
    var angle = i * angleScale;
    var rotation = angle / pi2;
    
    var radius = a + b * rotation * rotation;
    positions.push( radius * Math.cos(angle), radius * Math.sin(angle) );
    
    var gradientHue = i / points;
    
    // hsv based gradient
    var c = hsv2rgb(gradientHue, 0.5, 0.5);
    colors.push(c[0], c[1], c[2]);
    
    // still generate triangles?
    if (i < origins)
    {
      if (i % 1 == 0) // even (two point this rotation)
      {
        indices.push( i, i+pointsPerRotation, i+1);
      }
      else // odd (one points this rotation)
      {
        indices.push( i, i+pointsPerRotation-1, i+pointsPerRotation);
      }
    }
  }
  
  return { v: positions, i: indices, c: colors };
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
    gl.clear(gl.COLOR_BUFFER_BIT);
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
    // prepare pos attribute of vertex shader (2D vertex positions)
    var posAttribute = gl.getAttribLocation(program, "pos");

    // prepare data
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // start
    var shape = generateSpiral();

    // store data
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.p), gl.STATIC_DRAW);

    // method to draw
    function performTask()
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(posAttribute);
      gl.vertexAttribPointer(posAttribute, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINE_STRIP, 0, positions.length / 2);
    }
    
    return { performTask: performTask };
  }
}

initContext("wgl").performTask();
</script>
