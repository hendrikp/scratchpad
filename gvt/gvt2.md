# GVT Task 2
[Sourcecode for Task 1](https://raw.githubusercontent.com/hendrikp/scratchpad/gh-pages/gvt/gvt2.md)

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
  gl_FragColor = vec4(0.22, 1, 0.07, 1); // neon
}
</script>

<script>
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

// init context
function initContext(id)
{
  var _canvas = document.getElementById(id);
  var gl = _canvas.getContext("webgl");

  if (gl)
  {
    var vs = getShader(gl, gl.VERTEX_SHADER, "wgl_vertex");
    var fs = getShader(gl, gl.FRAGMENT_SHADER, "wgl_fragment");
    
    var program = initProgram(gl);
    
    // prepare canvas
    gl.useProgram(program);
    gl.clearColor(1, 1, 1, 0); // white
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // prepare pos attribute of vertex shader (2D vertex positions)
    var posAttribute = gl.getAttribLocation(program, "pos");

    // prepare data
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    var positions =
    [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
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
