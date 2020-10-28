# GVT Task 2
[Sourcecode for Task](https://raw.githubusercontent.com/hendrikp/scratchpad/gh-pages/gvt/gvt2.md)

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

// generate data
function generateSpiral()
{
  var positions = [];
  
  // generate data (spiral)
  var a = 0.01; // space offset
  var b = 0.1; // space angle per rotation factor
  var angleScale = 0.1; // angle scale per point
  var rotations = 5; // 5 rotations
  var pi2 = 2 * Math.PI;
  var points = (rotations * pi2) / angleScale;
  for (var i = 0; i < points; ++i)
  {
    var angle = i * angleScale;
    var rotation = angle / pi2;
    
    var radius = (a + b * rotation);
    positions.push( radius * Math.cos(angle), radius * Math.sin(angle) );
  }
  
  return positions;
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
    var positions = generateSpiral();

    // store data
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

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
