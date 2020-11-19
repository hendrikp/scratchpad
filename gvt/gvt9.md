
<script type="text/javascript" src="gl-matrix.js"></script>
<script type="text/javascript" src="dat.gui.min.js"></script>

# GVT Task 9
[Sourcecode for Task](https://raw.githubusercontent.com/hendrikp/scratchpad/gh-pages/gvt/gvt8.md)

Use controls at top to change parameters.

Render-Styles (use control `renderStyle`)
* `0` - Vertex Color
* `1` - Z-Depth
* `2` - Normals
* `3` - Phong-Lighting
* `4` - Cartoon Shading
* `5` - **Textures + Phong-Lighting (Task 9)**

Keybinds (Standard FPS/Fly Controls)
* Hold `Shift` to move faster
* `W` / `Up-Arrow` - Move Camera Forward
* `S` / `Down-Arrow` - Move Camera Backward
* `A` / `Left-Arrow` - Strafe Camera Left
* `D` / `Right-Arrow` - Strafe Camera Right
* `SPACE` - Move Camera Upward
* `C` - Move Camera Down
* Drag Canvas with mouse to rotate camera

Scene Keybinds (or use control `lightAngle`)
* `I` - Rotate Lights forward
* `L` - Rotate Lights backward

## WebGL Texturing
<canvas id="wgl" width="768" height="768" style="outline: grey 2px solid;"></canvas>

<script id="wgl_vertex" type="nojs">
attribute vec4 pos;
attribute vec3 normal;
attribute vec4 col;
attribute vec2 texpos;

varying vec4 vPosition;
varying vec4 vColor;
varying vec3 vNormal;
varying vec2 vTexPosition;

uniform mat4 projection;

uniform mat4 modelview;
uniform mat4 camera;
uniform mat4 modelmatrix;

uniform mat3 normalmatrix;

void main()
{
  vColor = col;
  vTexPosition = texpos;

  // gl_Position = projection * camera * modelmatrix * pos; // use precalulate modelview now.. (as needed for normalmatrix too)
  vPosition = modelview * pos;
  gl_Position = projection * vPosition;

  vNormal = normalize(normalmatrix * normal);
}
</script>

<script id="wgl_fragment" type="nojs">
precision mediump float;

varying vec4 vPosition;
varying vec4 vColor;
varying vec3 vNormal;
varying vec2 vTexPosition;

uniform int renderStyle;

// Material // Task 8 Phong
struct PhongMaterial
{
  vec3 ambient;
  vec3 diffuse;
  vec3 specular;
  float shininess;
  bool outline; // task8 ext cartoon
  sampler2D diffuseTexture; // task9
  float textureScale;
};
uniform PhongMaterial material;

const int MAX_LIGHTS = 2;
struct Light
{
  bool active;
  vec3 position;
  vec3 color;
};

uniform vec3 ambientLight;
uniform Light light[MAX_LIGHTS];

uniform vec2 cameraZ; // z-depth (task 7)

// Phong illumination for single light source, no ambient light. (BEL-3)
vec3 phong(vec3 diffuse, vec3 p, vec3 n, vec3 v, Light l)
{
  vec3 L = l.color;

  vec3 s = normalize(l.position - p);
  vec3 r = reflect(-s, n);

  float sn = max( dot(s,n), 0.0);
  float rv = max( dot(r,v), 0.0);
      
  diffuse *= L * sn;
              
  vec3 specular = material.specular * L * pow(rv, material.shininess);

  return diffuse + specular;			
}

// add up ambient light and lights 
vec3 phong(vec3 diffuse, vec3 p, vec3 n, vec3 v)
{
  // ambient light
  vec3 result = material.ambient * ambientLight;

  // light from sources
  for (int i=0; i < MAX_LIGHTS; i++)
  {
    if (light[i].active)
    {
      result += phong(diffuse, p, n, v, light[i]);
    }
  }
  return result;
}

// z-depth (task 7)
float transformZ(float z)
{
  float inv = 2.0 * cameraZ[0];
  float difZ = cameraZ[1] + cameraZ[0] - z * (cameraZ[1] - cameraZ[0]);
  return inv / difZ;
}

// Colorspace conversion from on https://www.shadertoy.com/view/4dKcWK - for cartoon shading
const float EPSILON = 1e-10;
vec3 RGBtoHCV(in vec3 rgb)
{
    // RGB [0..1] to Hue-Chroma-Value [0..1]
    // Based on work by Sam Hocevar and Emil Persson
    vec4 p = (rgb.g < rgb.b) ? vec4(rgb.bg, -1., 2. / 3.) : vec4(rgb.gb, 0., -1. / 3.);
    vec4 q = (rgb.r < p.x) ? vec4(p.xyw, rgb.r) : vec4(rgb.r, p.yzx);
    float c = q.x - min(q.w, q.y);
    float h = abs((q.w - q.y) / (6. * c + EPSILON) + q.z);
    return vec3(h, c, q.x);
}
vec3 RGBtoHSL(in vec3 rgb)
{
    // RGB [0..1] to Hue-Saturation-Lightness [0..1]
    vec3 hcv = RGBtoHCV(rgb);
    float z = hcv.z - hcv.y * 0.5;
    float s = hcv.y / (1. - abs(z * 2. - 1.) + EPSILON);
    return vec3(hcv.x, s, z);
}
vec3 HUEtoRGB(in float hue)
{
    // Hue [0..1] to RGB [0..1]
    // See http://www.chilliant.com/rgb2hsv.html
    vec3 rgb = abs(hue * 6. - vec3(3, 2, 4)) * vec3(1, -1, -1) + vec3(-1, 2, 2);
    return clamp(rgb, 0., 1.);
}
vec3 HSLtoRGB(in vec3 hsl)
{
    // Hue-Saturation-Lightness [0..1] to RGB [0..1]
    vec3 rgb = HUEtoRGB(hsl.x);
    float c = (1. - abs(2. * hsl.z - 1.)) * hsl.y;
    return (rgb - 0.5) * c + hsl.z;
}

const vec3 outlineColor = vec3(0.1,0.1,0.3); // for toon shader slightly blue black

void main()
{
  if (renderStyle == 1)
  {
    // z-depth (task 7)
    gl_FragColor = vec4(vec3(transformZ(gl_FragCoord.z)), 1.0);
  }
  else if (renderStyle == 2)
  {
    // normals (debug)
    gl_FragColor = vec4((vNormal*0.5)+0.5, 1.0);
  }
  else if (renderStyle == 3)
  {
    // phong (task 8)
    gl_FragColor = vec4( phong(material.diffuse, vPosition.xyz, normalize(vNormal), normalize(-vPosition.xyz)), 1.0);
  }
  else if (renderStyle == 4)
  {
    // Cartoon (task 8 extension)
    vec3 fcartoon;
    vec3 normal = normalize(vNormal);
    // Optional Outline
    // Outline is shown using dot product of fragment normal and direction of fragment pos to camera
    vec3 viewDir = normalize(vPosition.xyz);
    if( material.outline && dot(viewDir, normal) > -0.25 )
    {
      fcartoon = outlineColor;
    }
    else
    {
      // use phong shading as base for the cartoon shader
      vec3 pcolor = phong(material.diffuse, vPosition.xyz, normal, -viewDir);

      // simple brightness
      float colorL = length(pcolor); 

      /*
      // Simpler version without color conversion, doesnt look as good thus use HSL colorspace
      if( colorL > 0.9)
      {
        fcartoon = clamp(material.diffuse * 2.0, 0.0, 1.0);
      }
      else if( colorL > 0.5)
      {
        fcartoon = clamp(material.diffuse, 0.0, 1.0);
      }
      else
      {
        fcartoon = clamp(material.diffuse * 0.6, 0.0, 1.0);
      }
      */

      // new more complex HSL colorspace based cartoon shading
      // 0=hue, 1=saturation, 2=light
      vec3 dcartoon = RGBtoHSL(material.diffuse);
      if( colorL > 0.9)
      {
        dcartoon[2] = 0.8;
      }
      else if( colorL > 0.5)
      {
        dcartoon[2] = 0.6;
      }
      else
      {
        dcartoon[2] = 0.4;
      }
      fcartoon = HSLtoRGB(dcartoon);
    }

    gl_FragColor = vec4(fcartoon, 1.0);
  }
  else if (renderStyle == 5)
  {
    // textured (task 9) + phong
    vec3 diffuse = material.diffuse;
    if (material.textureScale > 0.0)
    {
      diffuse = texture2D( material.diffuseTexture, vTexPosition * material.textureScale ).xyz;
    }

    gl_FragColor = vec4( phong(diffuse, vPosition.xyz, normalize(vNormal), normalize(-vPosition.xyz)), 1.0);
  }
  else
  {
    // vertex color
    gl_FragColor = vColor;
  }
}
</script>

<script>

// Use DAT GUI
var gui = new dat.GUI();
var context;
var start = undefined;
var tTotal = 0.0;
var renderContinous = true;
function renderContext(timestamp)
{
  var elapsed = 0.0;
  const minFrametime = 1/60; // max 60fps
  const maxFrametime = 1/10; // min 10fps
  if (timestamp)
  {
    if (start === undefined)
    {
      start = timestamp;
    }

    elapsed = (timestamp - start) / 1000; // we want elapsed time in seconds
    if (elapsed < minFrametime)
    {
      elapsed = minFrametime;
    }
    else if(elapsed > maxFrametime)
    {
      elapsed = maxFrametime;
    }
    tTotal += elapsed;
  }

  if( context.render(elapsed, tTotal) )
  {
    requestFrame(renderContext);
  }
}

function requestFrame(requester)
{
  if (renderContinous && requester === renderContext)
  {
    window.requestAnimationFrame(renderContext);
  }
  else if(!renderContinous && requester !== renderContext)
  {
    window.requestAnimationFrame(renderContext);
  }
}

// Use glMatrix
const {mat4, mat3, vec3, quat} = glMatrix;

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
function hsl2rgb(h, s, l)
{
    var r, g, b;

    if(s == 0)
    {
        r = g = b = l; // achromatic
    }
    else
    {
        function hue2rgb(p, q, t)
        {
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

// camera/rotation helpers
function normalizeRad(r)
{
  while (r < 0)
    r += Math.PI*2;
  while (r >= Math.PI*2)
    r -= Math.PI*2;
  return r;
}

function restrainPitch(r)
{
  if (r < -Math.PI*0.5)
    r = -Math.PI*0.5;
  if (r > Math.PI*0.5)
    r = Math.PI*0.5;
  return r;
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
  var shape = { m: {v: positions, i: indices, c: colors}, params: params, modelmatrix: glMatrix.mat4.create() };

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
  var dv = (vMax-vMin)/Nv;

  var positions = [];
  var indices = [];
  var colors = [];
  var normals = [];
  var coords = [];

  var shape = { m: {v: positions, n: normals, i: indices, c: colors, t: coords}, params: params, modelmatrix: glMatrix.mat4.create() };

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

      coords.push(u/uMax, v/vMax);

      normals.push(
        Math.cos(v) * Math.cos(u),
        Math.cos(v) * Math.sin(u),
        Math.sin(v)
      );

      var c = hsl2rgb(j/Nv, 0.5, 0.5);
      colors.push(c[0], c[1], c[2], 1);

      // generate triangles
      if(i < Nu && j < Nv)
      {
        // points - CCW order
        var p = [
          i * (Nv + 1) + j,
          (i + 1) * (Nv + 1) + j,
          (i + 1) * (Nv + 1) + j + 1,
          i * (Nv + 1) + j + 1
        ];

        indices.push( p[0], p[1], p[2] );
        indices.push( p[2], p[3], p[0] );
      }
    }
  }

  return shape;
}

// based on http://www.3d-meier.de/tut3/Seite120.html
function generateUVsphere( params )
{
  const {N} = params;

  var Nv = N;
  var Nu = N;

  var vertices = [];
  var positions = [];
  var indices = [];
  var colors = [];
  var normals = [];
  var coords = [];

  var pi2 = 2 * Math.PI;

  var uMin = 0.0;
  var uMax = Math.PI;
  var vMin = 0.0;
  var vMax = pi2;
  
  var du = (uMax-uMin)/Nu;
  var dv = (vMax-vMin)/Nv;

  var shape = { m: {v: positions, n: normals, i: indices, c: colors, t: coords}, params: params, modelmatrix: glMatrix.mat4.create() };

  // generate points
  for (var i=0; i<=Nu; i++)
  {
    for (var j=0; j<=Nv; j++)
    {
      var u = uMin + i * du;
      var v = vMin + j * dv;

      var p = vec3.fromValues(
        Math.sin(u) * Math.cos(v),
        Math.cos(u),
        Math.sin(u) * Math.sin(v)
      );
      vec3.normalize(p, p);

      positions.push( p[0], p[1], p[2] );

      coords.push(
        Math.atan2(p[2], p[0]) / pi2 + 0.5,
        0.5 +Math.asin(p[1]) / Math.PI
      );
      //coords.push(u/uMax, v/vMax);

      // same as pos.. but flipped
      normals.push( -p[0], -p[1], -p[2] );

      var c = hsl2rgb(j/Nv, 0.5, 0.5);
      colors.push(c[0], c[1], c[2], 1);

      // generate triangles
      if(i < Nu && j <= Nv)
      {
        if( j == Nv)
        {
          // points - CCW order
          var p = [
            i * (Nv + 1) + j,
            (i + 1) * (Nv + 1) + j,
            (i + 1) * (Nv + 1) + j + 1,
            i * (Nv + 1) + j + 1
          ];

          indices.push( p[0], p[1], p[2] );
          indices.push( p[2], p[3], p[0] );
        }
        else
        {
          // points - CCW order
          var p = [
            i * (Nv + 1) + j,
            (i + 1) * (Nv + 1) + j,
            (i + 1) * (Nv + 1) + j + 1,
            i * (Nv + 1) + j + 1
          ];

          indices.push( p[0], p[1], p[2] );
          indices.push( p[2], p[3], p[0] );
        }
      }
    }
  }

  return shape;
}

// generate icosphere based on http://blog.andreaskahler.com/2009/06/creating-icosphere-mesh-in-code.html
function generateIcosphere( params )
{
  const {N} = params;

  var t = (1.0 + Math.sqrt(5.0)) * 0.5;

  var vertices = [];
  var positions = [];
  var indices = [];
  var colors = [];
  var normals = [];
  var coords = [];

  function addVertex(v)
  {
    vec3.normalize(v,v);
    vertices.push(v);
    return vertices.length-1;
  }

  function getMiddlePoint(a, b)
  {
    // center between both points
    var mid = vec3.create();
    vec3.lerp(mid, vertices[a], vertices[b], 0.5);
    vec3.normalize(mid, mid);
    
    // check if not already exists
    for (var i = 0; i < vertices.length; i++)
    {
      if (vec3.equals(mid, vertices[i]))
      {
        return i;
      }
    }

    return addVertex(mid);
	}

  // create 12 vertices of a icosahedron
  addVertex(vec3.fromValues(-1,  t,  0));
  addVertex(vec3.fromValues( 1,  t,  0));
  addVertex(vec3.fromValues(-1, -t,  0));
  addVertex(vec3.fromValues( 1, -t,  0));

  addVertex(vec3.fromValues( 0, -1,  t));
  addVertex(vec3.fromValues( 0,  1,  t));
  addVertex(vec3.fromValues( 0, -1, -t));
  addVertex(vec3.fromValues( 0,  1, -t));

  addVertex(vec3.fromValues( t,  0, -1));
  addVertex(vec3.fromValues( t,  0,  1));
  addVertex(vec3.fromValues(-t,  0, -1));
  addVertex(vec3.fromValues(-t,  0,  1));

  // create 20 triangles of the icosahedron
  indices.push(0, 11, 5);
  indices.push(0, 5, 1);
  indices.push(0, 1, 7);
  indices.push(0, 7, 10);
  indices.push(0, 10, 11);

  // 5 adjacent faces 
  indices.push(1, 5, 9);
  indices.push(5, 11, 4);
  indices.push(11, 10, 2);
  indices.push(10, 7, 6);
  indices.push(7, 1, 8);

  // 5 faces around point 3
  indices.push(3, 9, 4);
  indices.push(3, 4, 2);
  indices.push(3, 2, 6);
  indices.push(3, 6, 8);
  indices.push(3, 8, 9);

  // 5 adjacent faces 
  indices.push(4, 9, 5);
  indices.push(2, 4, 11);
  indices.push(6, 2, 10);
  indices.push(8, 6, 7);
  indices.push(9, 8, 1);

  // refine triangles
  for (var i = 0; i < N; i++)
  {
      var indices2 = [];
      for (var tri = 0; tri < indices.length; tri += 3)
      {
          // replace triangle by 4 triangles
          var a = getMiddlePoint(indices[tri+0], indices[tri+1]);
          var b = getMiddlePoint(indices[tri+1], indices[tri+2]);
          var c = getMiddlePoint(indices[tri+2], indices[tri+0]);

          indices2.push(indices[tri+0], a, c);
          indices2.push(indices[tri+1], b, a);
          indices2.push(indices[tri+2], c, b);
          indices2.push(a, b, c);
      }
      indices = indices2;
  }

  var pi2 = 2*Math.PI;

  // convert vertices to position array
  for (var i=0; i < vertices.length; ++i)
  {
    positions.push(vertices[i][0], vertices[i][1], vertices[i][2]);
    normals.push(vertices[i][0], vertices[i][1], vertices[i][2]); // already normalized
    coords.push(
      (Math.PI+Math.atan2(vertices[i][0], vertices[i][2])) / pi2,
      (Math.PI+Math.atan2(vertices[i][0], vertices[i][1])) / pi2,
     ); // angle based texture coordinates (bit inaccurate )

    // not better.. probably based on seed or uv interpolation at wrap around when scale not 1 so instead use for now an uv sphere
    //  alternative would be to find and fix the warped faces at those transition points
    //  Math.atan2(vertices[i][2], vertices[i][0]) / pi2,
    // 0.5 + Math.asin(vertices[i][1]) / Math.PI,

    // coloration
    // looks also ok (front facing hue change)
    //var len = vec3.length(vertices[i]);
    //var hue = Math.abs(vertices[i][0]/len);

    // but this xz angle based hue change is looking better  
    var hue = (Math.PI+Math.atan2(vertices[i][0], vertices[i][2])) / pi2;

    var c = hsl2rgb(hue, 0.7, 0.5);
    
    colors.push(c[0], c[1], c[2], 1);
  }

  var shape = { m: {v: positions, n: normals, i: indices, c: colors, t: coords }, params: params, modelmatrix: glMatrix.mat4.create() };
  return shape;
}

// generate drop based on http://www.3d-meier.de/tut3/Seite44.html
function generateDrop( params )
{
  const {a, b, Nu, Nv} = params;

  var pi2 = 2 * Math.PI;

  var uMin = 0.0;
  var uMax = Math.PI;
  var vMin = 0.0;
  var vMax = pi2;
  
  var du = (uMax-uMin)/Nu;
  var dv = (vMax-vMin)/Nv;

  var positions = [];
  var indices = [];
  var colors = [];
  var shape = { m: {v: positions, i: indices, c: colors}, params: params, modelmatrix: glMatrix.mat4.create() };

  // generate points
  for (var i=0; i<=Nu; i++)
  {
    for (var j=0; j<=Nv; j++)
    {
      var u = uMin + i * du;
      var v = vMin + j * dv;

      positions.push(
        a * (b - Math.cos(u)) *Math.sin(u) *Math.cos(v),
        a * (b - Math.cos(u)) *Math.sin(u) *Math.sin(v),
        Math.cos(u)
      );

      var c = hsl2rgb(i/Nv, 1-i/Nu, 0.5);
      colors.push(c[0], c[1], c[2], 1);

      // generate triangles
      if(i < Nu && j < Nv)
      {
        // points - CCW order
        var p = [
          i * (Nv + 1) + j,
          (i + 1) * (Nv + 1) + j,
          (i + 1) * (Nv + 1) + j + 1,
          i * (Nv + 1) + j + 1
        ];

        indices.push( p[0], p[1], p[2] );
        indices.push( p[2], p[3], p[0] );
      }
    }
  }

  return shape;
}

// generate a grid for horizon line (better for camera movement)
function generateGrid( params )
{
  const {gridsize, N} = params;

  var Nu = N;
  var Nv = N;

  var uMin = 0.0;
  var uMax = gridsize;
  var vMin = 0.0;
  var vMax = gridsize;
  
  var du = (uMax-uMin)/Nu;
  var dv = (vMax-vMin)/Nv;

  var positions = [];
  var indices = [];
  var colors = [];
  var normals = [];
  var coords = [];
  var shape = { m: {v: positions, n: normals, i: indices, c: colors, t: coords}, params: params, modelmatrix: glMatrix.mat4.create() };

  // generate points
  for (var i=0; i<=Nu; i++)
  {
    for (var j=0; j<=Nv; j++)
    {
      var u = uMin + i * du;
      var v = vMin + j * dv;

      positions.push(u,v,0);

      coords.push(u/uMax, v/vMax); // texture coordinates

      normals.push(0.0, 0.0, 1.0); // z up

      var c = hsl2rgb(i/Nv, 0.5, 0.4);
      colors.push(c[0], c[1], c[2], 1);

      // generate triangles
      if(i < Nu && j < Nv)
      {
        // points - CCW order
        var p = [
          i * (Nv + 1) + j,
          (i + 1) * (Nv + 1) + j,
          (i + 1) * (Nv + 1) + j + 1,
          i * (Nv + 1) + j + 1
        ];

        indices.push( p[0], p[1], p[2] );
        indices.push( p[2], p[3], p[0] );
      }
    }
  }

  return shape;
}

// task 7 basic element
function generatePyramid( params )
{
  var positions = [];
  var indices = [];
  var colors = [];

 var positions = [
    // Front 
    0.0,  1.0,  0.0,
    -1.0, -1.0,  1.0,
    1.0, -1.0,  1.0,
    // Right
    0.0,  1.0,  0.0,
    1.0, -1.0,  1.0,
    1.0, -1.0, -1.0,
    // Back
    0.0,  1.0,  0.0,
    1.0, -1.0, -1.0,
    -1.0, -1.0, -1.0,
    // Left 
    0.0,  1.0,  0.0,
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0
  ];

  for(var i = 0; i < positions.length; i+=3)
  {
    colors.push(0.9, 0, 0, 1); // red
    indices.push( i/3 );
  }

  // bottom CCW
  indices.push( 1+2*3, 1+1*3, 1+0*3);
  indices.push( 1+0*3, 1+3*3, 1+2*3);

  var shape = { m: {v: positions, i: indices, c: colors}, params: params, modelmatrix: glMatrix.mat4.create() };
  return shape;
}

function rad2deg(r)
{
  return r * (180.0/Math.PI);
}


function loadImage(material, filename)
{
  var imageObj = new Image();
  imageObj.onload = function()
  {
    material.diffuseTextureImage = imageObj;
  };
  imageObj.src = filename;

  return imageObj;
}

function createPhongMaterial(material)
{
  material = material || {};

  // defaults
  material.ambient = material.ambient || [ 0.3, 0.3, 0.3 ];
  material.diffuse = material.diffuse || [ 0.6, 0.6, 0.6 ];
  material.specular = material.specular || [ 0.8, 0.8, 0.8 ];
  material.shininess = material.shininess || 10.;
  material.outline = material.outline === undefined ? false : material.outline;

  // Load textures
  if (material.diffuseTexture)
  {
    material.textureScale = material.textureScale || 1.0;

    material.diffuseTextureImage = undefined;
    material.diffuseTextureLoaded = undefined;
    material.diffuseTextureUnit = undefined;
    loadImage(material, material.diffuseTexture);
  }
  else
  {
    // shaders knows texture scale <= 0.0 means no texture
    material.textureScale = material.textureScale || -1.0;
  }

  return material;
}

// init context
function initContext(id)
{
  var _canvas = document.getElementById(id);
  var gl = _canvas.getContext("webgl", {antialias: true});

  function cleanBg()
  {
    if (context.renderStyle >= 3 && context.renderStyle <= 5)
    {
       gl.clearColor(context.ambientLight[0], context.ambientLight[1], context.ambientLight[2], 1);
    }
    else
    {
      gl.clearColor(1, 1, 1, 1); // white
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  if (gl)
  {
    var vs = getShader(gl, gl.VERTEX_SHADER, "wgl_vertex");
    var fs = getShader(gl, gl.FRAGMENT_SHADER, "wgl_fragment");
    
    var context = {gl: gl, vs: vs, fs: fs, canvas: _canvas};

    var program = initProgram(gl);
    context.program = program;

    // prepare canvas
    gl.useProgram(program);

    // clean + enable depth / features
    cleanBg();

    // Backface culling.
    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Polygon offset of rastered Fragments.
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(0.5, 0);

    // prepare viewport
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
    // prepare attributes of shaders
    var posAttribute = gl.getAttribLocation(program, "pos");
    context.posAttribute = posAttribute;
    var colAttribute = gl.getAttribLocation(program, "col");
    context.colAttribute = colAttribute;
    var normalAttribute = gl.getAttribLocation(program, "normal");
    context.normalAttribute = normalAttribute;
    var texposAttribute = gl.getAttribLocation(program, "texpos");
    context.texposAttribute = texposAttribute;

    // modelmatrix
    var u_modelmatrix = gl.getUniformLocation(program, "modelmatrix");
    context.u_modelmatrix = u_modelmatrix;

    // modelview
    var u_modelview = gl.getUniformLocation(program, "modelview");
    context.u_modelview = u_modelmatrix;

    // normalmatrix
    var u_normalmatrix = gl.getUniformLocation(program, "normalmatrix");
    context.u_normalmatrix = u_normalmatrix;

    // ambient light (task 8)
    context.u_ambientLight = gl.getUniformLocation(program, "ambientLight");
    context.ambientLight = [0.4, 0.4, 0.4];

    // phong lights (task 8)
    context.maxLights = 2;
    context.u_light = [];
    context.light = [];
    for (var i = 0; i < context.maxLights; i++)
    {
      context.light.push({
        active:   false,
        position: [0, 0, 0],
        tpos:     vec3.create(),
        color:    [1, 1, 1],
        u: {
          active:   gl.getUniformLocation(program, "light[" + i + "].active"),
          position: gl.getUniformLocation(program, "light[" + i + "].position"),
          color:    gl.getUniformLocation(program, "light[" + i + "].color")
        },
      });
    }

    // material (task 8)
    context.u_materialAmbient = gl.getUniformLocation(program, "material.ambient");
    context.u_materialDiffuse = gl.getUniformLocation(program, "material.diffuse");
    context.u_materialSpecular = gl.getUniformLocation(program, "material.specular");
    context.u_materialShininess = gl.getUniformLocation(program, "material.shininess");
    context.u_materialOutline = gl.getUniformLocation(program, "material.outline");

    // task 9
    context.u_materialDiffuseTexture = gl.getUniformLocation(program, "material.diffuseTexture");
    context.u_materialTextureScale = gl.getUniformLocation(program, "material.textureScale");

    // projection
    var u_projection = gl.getUniformLocation(program, "projection");
    context.u_projection = u_projection;
    var projection = mat4.create();
    context.projection = projection;
    var fovy = 0.5; // radians vertical

    var cameraZ = [0.1, 50]; // near, far
    mat4.perspective(projection, fovy, gl.canvas.width / gl.canvas.height, cameraZ[0], cameraZ[1]);
    gl.uniformMatrix4fv(u_projection, false, projection );
    // near, far for Z-depth rendering style
    var u_cameraZ = gl.getUniformLocation(program, "cameraZ");
    gl.uniform2fv(u_cameraZ, cameraZ );

    // render style
    context.renderStyle = 5;
    var u_renderStyle = gl.getUniformLocation(program, "renderStyle");
    context.u_renderStyle = u_renderStyle;

    // camera (used to move with keybinds)
    var camera = mat4.create();
    context.camera = camera;
    var u_camera = gl.getUniformLocation(program, "camera");
    context.u_camera = u_camera;
    var cameraPos = vec3.create();
    context.cameraPos = cameraPos;
    var cameraAngle = [0,0,0];
    context.cameraAngle = cameraAngle;
    var cameraRotation = mat4.create();
    context.cameraRotation = cameraRotation;
    
    function updateCamera()
    {
      // create camera rotation from camera angles
      var rot = quat.create();
      quat.fromEuler(rot, rad2deg(cameraAngle[0]), rad2deg(cameraAngle[1]), rad2deg(cameraAngle[2]));
      mat4.fromQuat(context.cameraRotation, rot);
      mat4.invert(context.cameraRotation, context.cameraRotation);

      // finalize camera (rot+pos)
      mat4.identity(camera);
      mat4.multiply(camera, cameraRotation, camera);
      mat4.translate(camera, camera, cameraPos);
      requestFrame();
    }
    context.updateCamera = updateCamera;
    function resetCamera()
    {
      vec3.set(cameraPos, 0,0,-4); // initial pos

      // rotation
      cameraAngle[0]=0;
      cameraAngle[1]=0;
      cameraAngle[2]=0;
      mat4.identity(cameraRotation);

      updateCamera();
    }
    context.resetCamera = resetCamera;

    // creation of buffers
    function createBuffers(shape)
    {
      // store vertices
      if (shape.m.v)
      {
        console.assert((shape.m.v.length%3) == 0, "[%s] Vertices malformed", shape.params.name );

        shape.m.pBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.m.pBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.m.v), gl.STATIC_DRAW);
      }
      else
      {
        console.assert(false, "[%s] No vertices", shape.params.name);
      }

      // store indices
      if (shape.m.i)
      {
        var indices = shape.m.i;
        console.assert((indices.length%3) == 0, "[%s] Indices %d not triangles", shape.params.name, indices.length);

        // check out of bound index
        var maxIndex = shape.m.v.length / 3;
        for (var i = 0; i < indices.length; i++)
        {
          console.assert( indices[i] < maxIndex, "[%s] Index %d -> %d not in bounds", shape.params.name, i, indices[i] );
        }

        shape.m.iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.m.iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      }

      // store texture coords
      if (shape.m.t)
      {
        var coords = shape.m.t;
        console.assert( (coords.length/2) == (shape.m.v.length/3), "[%s] Texture coords %d not matching vertices", shape.params.name, coords.length);
      
        shape.m.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.m.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
      }

      // store normals
      if (shape.m.n)
      {        
        console.assert(shape.m.n.length == shape.m.v.length, "[%s] Vertices %d and Normals %d not matching", shape.params.name, shape.m.n.length, shape.m.v.length);

        shape.m.nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.m.nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.m.n), gl.STATIC_DRAW);
      }

      // store colors
      if (shape.m.c)
      {        
        console.assert((shape.m.v.length/3) == (shape.m.c.length/4), "[%s] Vertices %d and Colors %d not matching", shape.params.name, shape.m.v.length, shape.m.c.length);

        shape.m.cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.m.cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.m.c), gl.STATIC_DRAW);
      }
    }

    // create a default texture (red pixel)
    var defaultTexture = gl.createTexture();
    defaultTexture.unit = 0;
    context.defaultTexture = defaultTexture;
    gl.bindTexture(gl.TEXTURE_2D, defaultTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));

    // create loading textures
    context.textureUnit = defaultTexture.unit + 1; 
    function createTextures(shape)
    {
      if (shape.params.mat.diffuseTextureImage)
      {
        shape.params.mat.diffuseTextureUnit = context.textureUnit++;

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // want textures for now to also repeat if using different texture scaling for testing
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        // interpolation
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        // Upload the image into the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, shape.params.mat.diffuseTextureImage);

        // create a mipmap
		    gl.generateMipmap(gl.TEXTURE_2D);

        // texture buffer now loaded
        shape.params.mat.diffuseTextureLoaded = texture;
      }
    }

    /*
    // method to draw line strip
    function drawArrays(shape)
    {
      // if buffer not yet created try (cached)
      if (!shape.m.pBuffer)
      {
        createBuffers(shape);
      }

      // vertices
      if (shape.m.pBuffer)
      {
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.m.pBuffer);
        gl.enableVertexAttribArray(posAttribute);
        gl.vertexAttribPointer(posAttribute, 3, gl.FLOAT, false, 0, 0);
      }

      // position
      gl.uniformMatrix4fv(u_modelmatrix, false, shape.modelmatrix );

      // draw
      gl.drawArrays(gl.LINE_STRIP, 0, shape.m.v.length / 3);
    }
    */

    // method to draw
    function drawElements(shape)
    {
      // if buffer not yet created try (cached)
      if (!shape.m.pBuffer)
      {
        createBuffers(shape);
      }

      // if texture not yet created try and now loaded (cached)
      if (shape.params.mat.diffuseTextureImage && !shape.params.mat.diffuseTextureLoaded)
      {
        createTextures(shape);
      }

      // vertices
      if (shape.m.pBuffer)
      {
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.m.pBuffer);
        gl.enableVertexAttribArray(posAttribute);
        gl.vertexAttribPointer(posAttribute, 3, gl.FLOAT, false, 0, 0);
      }
      else
      {
        gl.disableVertexAttribArray(posAttribute);
      }

      // texture pos
      if (shape.m.tBuffer)
      {
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.m.tBuffer);
        gl.enableVertexAttribArray(texposAttribute);
        gl.vertexAttribPointer(texposAttribute, 2, gl.FLOAT, false, 0, 0);
      }
      else
      {
        gl.disableVertexAttribArray(texposAttribute);
      }

      // normals
      if (shape.m.nBuffer)
      {
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.m.nBuffer);
        gl.enableVertexAttribArray(normalAttribute);
        gl.vertexAttribPointer(normalAttribute, 3, gl.FLOAT, false, 0, 0);
      }
      else
      {
        gl.disableVertexAttribArray(normalAttribute);
      }

      // colors
      if (shape.m.cBuffer)
      {
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.m.cBuffer);
        gl.enableVertexAttribArray(colAttribute);
        gl.vertexAttribPointer(colAttribute, 4, gl.FLOAT, false, 0, 0);
      }
      else
      {
        gl.disableVertexAttribArray(colAttribute);
      }

      // indices
      if (shape.m.iBuffer)
      {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.m.iBuffer);
      }

      // position
      gl.uniformMatrix4fv(u_modelmatrix, false, shape.modelmatrix );

      // modelview
      gl.uniformMatrix4fv(u_modelview, false, shape.modelview );

      // normal matrix
      gl.uniformMatrix3fv(u_normalmatrix, false, shape.normalmatrix );

      // phong material
      if (shape.params.mat)
      {
        gl.uniform3fv(context.u_materialAmbient, shape.params.mat.ambient);
        gl.uniform3fv(context.u_materialDiffuse, shape.params.mat.diffuse);
        gl.uniform3fv(context.u_materialSpecular, shape.params.mat.specular);
        gl.uniform1f( context.u_materialShininess, shape.params.mat.shininess);
        gl.uniform1i( context.u_materialOutline, shape.params.mat.outline);

        // set texture, or temporary default while still loading
        if (shape.params.mat.diffuseTextureUnit && shape.params.mat.diffuseTextureLoaded )
        {
          gl.activeTexture(gl.TEXTURE0 + shape.params.mat.diffuseTextureUnit);
          gl.bindTexture(gl.TEXTURE_2D, shape.params.mat.diffuseTextureLoaded);
          gl.uniform1i(context.u_materialDiffuseTexture, shape.params.mat.diffuseTextureUnit);
        }
        else if (defaultTexture)
        {
          gl.activeTexture(gl.TEXTURE0 + defaultTexture.unit);
          gl.bindTexture(gl.TEXTURE_2D, defaultTexture);
          gl.uniform1i(context.u_materialDiffuseTexture, defaultTexture.unit);
        }

        gl.uniform1f( context.u_materialTextureScale, shape.params.mat.textureScale);
      }

      // ui options for drawing
      if (shape.params.drawLines == true)
      {
        // draw lines
        gl.drawElements(gl.LINES, shape.m.i.length, gl.UNSIGNED_SHORT, 0);
      }
      else 
      {
        // draw triangles based on indices
        gl.drawElements(gl.TRIANGLES, shape.m.i.length, gl.UNSIGNED_SHORT, 0);
      }
    }

    // generate data
    var scene = {};
    context.scene = scene;

    // update camera dependend matrix
    function updateSceneObjectModelViewMatrix(shape)
    {
      // calculate normal matrix and modelview matrix
      if (!shape.normalmatrix)
      {
        shape.normalmatrix = mat3.create();
        shape.modelview = mat4.create();
      }

      mat4.multiply(shape.modelview, context.camera, shape.modelmatrix);
      mat3.normalFromMat4(shape.normalmatrix, shape.modelview);
    }

    // update model instance dependent matrix
    function updateSceneObjectMatrix(shape)
    {
      // reposition + resize
      mat4.identity(shape.modelmatrix);
      mat4.translate(shape.modelmatrix, shape.modelmatrix, shape.params.pos);
      mat4.scale(shape.modelmatrix, shape.modelmatrix, shape.params.scale);
      mat4.rotateX(shape.modelmatrix, shape.modelmatrix, shape.params.rotate[0]);
      mat4.rotateY(shape.modelmatrix, shape.modelmatrix, shape.params.rotate[1]);
      mat4.rotateZ(shape.modelmatrix, shape.modelmatrix, shape.params.rotate[2]);

      updateSceneObjectModelViewMatrix(shape);
    }

    function createSceneObject(params)
    {
      if (params.name != '')
      {
        if (params.pos === undefined && params.posOrigin !== undefined)
        {
          params.pos = Array.from(params.posOrigin);
        }

        var shape = params.generator(params);

        updateSceneObjectMatrix(shape);
        scene[shape.params.name] = shape; // place into scene

        return shape;
      }
    }

    function duplicateSceneObject(source, params)
    {
      if (params.name != '')
      {
        if (params.pos === undefined && params.posOrigin !== undefined)
        {
          params.pos = Array.from(params.posOrigin);
        }

        var shape = {};
        Object.assign(shape, source);
        shape.params = params;
        shape.params.draw = source.params.draw;

        shape.modelmatrix = glMatrix.mat4.create();

        updateSceneObjectMatrix(shape);
        scene[shape.params.name] = shape; // place into scene

        return shape;
      }
    }

    // grid
    var gridsize = 30;
    var grid = createSceneObject({
      name: 'grid',
      generator: generateGrid,
      pos: [-gridsize*0.5, -1, gridsize*0.5],
      scale: [1, 1, 1],
      rotate: [-Math.PI*0.5, 0, 0.0],
      gridsize: gridsize,
      N: 50,
      drawLines: false,
      draw: drawElements,
      mat: createPhongMaterial( {diffuseTexture: "uv_test.png", textureScale: 5.0 }  ),
    });

    var ui = gui.addFolder('Scene Grid');
    ui.add(grid.params, "gridsize", 1, 100, 1).onChange( function() {
      gridsize = grid.params.gridsize;
      grid.params.pos = [-gridsize*0.5, -1, gridsize*0.5]; // when size changes need to also recenter grid
      createSceneObject(grid.params);
      
      } );
    ui.add(grid.params, "N", 2, 100, 1).onChange( function() { createSceneObject(grid.params); requestFrame();} );
    ui.add(grid.params, "drawLines").onChange( requestFrame );

    // 4.1 + 4.2 procedural shape 1 - torus 
    var torus = createSceneObject({
      name: 'torus',
      generator: generateTorus,
      pos: [0, 0.0, 0.0],
      scale: [0.5, 0.5, 0.5],
      rotate: [0, 0, 0],
      r: 0.1, R: 1.0,
      Nu: 50, Nv: 40,
      drawLines: false,
      draw: drawElements,
      mat: createPhongMaterial({outline: true, diffuseTexture: "uv_test.png", textureScale: 2.0}),
    });
    /*
    var ui = gui.addFolder('Torus - 4.1+2');
    ui.add(torus.params, "r", 0, 0.5, 0.0002).onChange( function() { createSceneObject(torus.params); requestFrame(); } );
    ui.add(torus.params, "R", 0, 1, 0.005).onChange( function() { createSceneObject(torus.params); requestFrame(); } );
    ui.add(torus.params, "Nu", 3, 40, 1).onChange( function() { createSceneObject(torus.params); requestFrame(); } );
    ui.add(torus.params, "Nv", 3, 40, 1).onChange( function() { createSceneObject(torus.params); requestFrame(); } );
    ui.add(torus.params, "drawLines").onChange( requestFrame );

    // 4.1 + 4.2 procedural shape 2 - drop
    var drop = createSceneObject({
      name: 'drop',
      generator: generateDrop,
      pos: [0.5, -0.5, 0.0],
      scale: [0.3, 0.3, 0.3],
      rotate: [-Math.PI*0.5, 0, 0.0],
      a: 0.5, b: 1.0,
      Nu: 20, Nv: 20,
      drawLines: false,
      draw: drawElements,
    });
    var ui = gui.addFolder('Drop - 4.1+2');
    ui.add(drop.params, "a", 0, 1, 0.02).onChange( function() { createSceneObject(drop.params); requestFrame();} );
    ui.add(drop.params, "b", 0, 1, 0.02).onChange( function() { createSceneObject(drop.params); requestFrame();} );
    ui.add(drop.params, "Nu", 3, 40, 1).onChange( function() { createSceneObject(drop.params); requestFrame();} );
    ui.add(drop.params, "Nv", 3, 40, 1).onChange( function() { createSceneObject(drop.params); requestFrame();} );
    ui.add(drop.params, "drawLines").onChange( requestFrame );
    
    // 4.3 - custom procedural shape - extended task 3
    var wspiral = createSceneObject({
      name: 'wspiral',
      generator: generateSpiral,
      pos: [-0.5, -0.5, 0.0],
      scale: [0.5, 0.5, 0.5],
      rotate: [0.25, 0.25, 0.0],
      a: 0.003, b: 0.03,
      angleScale: 0.1, rotations: 5,
      drawLines: false,
      draw: drawElements,
    });
    var ui = gui.addFolder('Wobbly Spiral - 4.3 (only frontface)');
    ui.add(wspiral.params, "a", 0, 0.3, 0.0002).onChange( function() { createSceneObject(wspiral.params); requestFrame(); } );
    ui.add(wspiral.params, "b", 0, 0.3, 0.005).onChange( function() { createSceneObject(wspiral.params); requestFrame();} );
    ui.add(wspiral.params, "rotations", 0, 20, 0.3).onChange( function() { createSceneObject(wspiral.params); requestFrame();} );
    ui.add(wspiral.params, "drawLines").onChange( requestFrame );
    */

    // 5 - icosphere
    var sscale = [0.1, 0.1, 0.1];
    var sphere = createSceneObject({
      name: 'sphere',
      generator: generateUVsphere,
      posOrigin: [0, 0.0, 0.0],
      scale: sscale,
      rotate: [0.0, 0.0, 0.0],
      N: 100,
      drawLines: false,
      draw: drawElements,
      mat: createPhongMaterial({diffuse:[1.,1.,0.], outline: true, diffuseTexture: "uv_test.png", textureScale: 2.0}), // yellow
    });
    /*
    var ui = gui.addFolder('Icosphere - 5');
    ui.add(sphere.params, "N", 0, 4, 1).onChange( function() { createSceneObject(sphere.params); requestFrame();} );
    ui.add(sphere.params, "drawLines").onChange( requestFrame );
    */

    // 6. we need 3 more spheres to animate them
    var sphere2 = duplicateSceneObject(sphere, {
      name: 'sphere2',
      posOrigin: [0, 0.0, 0.0],
      scale: sscale,
      rotate: [0.0, 0.0, 0.0],
      drawLines: false,
      mat: createPhongMaterial({diffuse:[0.,1.,0.],outline: true,}), // green
    });
    var sphere3 = duplicateSceneObject(sphere, {
      name: 'sphere3',
      posOrigin: [0, 0.0, 0.0],
      scale: sscale,
      rotate: [0.0, 0.0, 0.0],
      drawLines: false,
      mat: createPhongMaterial({diffuse:[1.,0.,0.],outline: true,}), // red
    });
    var sphere4 = duplicateSceneObject(sphere, {
      name: 'sphere4',
      posOrigin: [0, 0.0, 0.0],
      scale: sscale,
      rotate: [0.0, 0.0, 0.0],
      drawLines: false,
      mat: createPhongMaterial({diffuse:[0.,0.,1.],outline: true,}), // blue
    });

    // 7. add more interecting shapes for Z-Visualization
    /*
    var pyramid = createSceneObject({
      name: 'pyramid',
      generator: generatePyramid,
      posOrigin: [0, -0.25, 0.0],
      scale: [0.5, 0.25, 0.5],
      rotate: [0.0, 0.0, 0.0],
      drawLines: false,
      draw: drawElements,
    });
    var pyramid2 = duplicateSceneObject(pyramid, {
      name: 'pyramid2',
      posOrigin: [0, 0.25, 0.0],
      scale: [0.5, 0.25, 0.5],
      rotate: [Math.PI, 0 , 0.0],
      drawLines: false,
    });
    */

    var torus2 = duplicateSceneObject(torus, {
      name: 'torus2',
      posOrigin: [0, 0.0, 0.0],
      scale: [1.25, 0.7, 1.0],
      rotate: [0, 0 , 0.0],
      drawLines: false,
      mat: createPhongMaterial({outline: true}),
    });

    // reset camera gui
    gui.add(context, "resetCamera");

    // task 6 animation speed
    context.animationSpeed = 0.2;
    gui.add(context, "animationSpeed", 0.2, 0.4, 0.01);

    // task 7 z-Depth visualization
    gui.add(context, "renderStyle", 0, 5, 1);

    // task 8-dummy visualization of lights (optional)
    var dummyLight1 = createSceneObject({
      name: 'light1',
      generator: generateIcosphere,
      posOrigin: [0, 0.0, 0.0],
      scale: [0.05, 0.05, 0.05],
      rotate: [0.0, 0.0, 0.0],
      N: 0,
      drawLines: true,
      draw: drawElements,
      mat: createPhongMaterial({diffuse:[1.,1.,1],outline: false,}), // white
    });
    var dummyLight2 = createSceneObject({
      name: 'light2',
      generator: generateIcosphere,
      posOrigin: [0, 0.0, 0.0],
      scale: [0.05, 0.05, 0.05],
      rotate: [0.0, 0.0, 0.0],
      N: 0,
      drawLines: true,
      draw: drawElements,
      mat: createPhongMaterial({diffuse:[1.,1.,1],outline: false,}), // white
    });

    // based on https://de.wikipedia.org/wiki/Lemniskate_von_Bernoulli
    function infinityRotatePath(shape, speed, tTotal, offset, offset2)
    {
      // restore origin pos (shallow-clone)
      shape.params.pos = Array.from(shape.params.posOrigin);

      // calculate animated position
      var t = offset + speed * (tTotal + offset2);
      var axisScale = 2.0 / (3.0-Math.cos(2.0*t));
      shape.params.pos[0] += axisScale * Math.cos(t);
      shape.params.pos[1] += axisScale * Math.sin(2.0*t) * 0.5;

      shape.params.rotate[2] = Math.PI * t;

      // update matrix
      updateSceneObjectMatrix(shape);
    }

    function infinityRotatePath2(shape, speed, tTotal, offset, offset2)
    {
      // restore origin pos (shallow-clone)
      shape.params.pos = Array.from(shape.params.posOrigin);

      // calculate animated position
      var t = offset + speed * (tTotal + offset2);
      var axisScale = 2.0 / (3.0-Math.cos(2.0*t));
      shape.params.pos[2] += axisScale * Math.cos(t);
      shape.params.pos[1] += axisScale * Math.sin(2.0*t) * 0.5;

      shape.params.rotate[0] = Math.PI * t;

      // update matrix
      updateSceneObjectMatrix(shape);
    }

    function rotateTorus(shape, speed, tTotal, offset, offset2)
    {
      var t = offset + speed * tTotal;
      shape.params.rotate[1] = offset2 + Math.PI * 2 * t;

      // update matrix
      updateSceneObjectMatrix(shape);
    }

    // animation task
    function animate(elapsed, tTotal)
    {
      var speed = context.animationSpeed;

      var s1 = scene['sphere'];
      infinityRotatePath(s1, speed, tTotal, Math.PI*0.5, -1);
      var s2 = scene['sphere2'];
      infinityRotatePath(s2, speed, tTotal, 0, 1);
      var s3 = scene['sphere3'];
      infinityRotatePath2(s3, speed, tTotal, 0, -1);
      var s4 = scene['sphere4'];
      infinityRotatePath2(s4, speed, tTotal, Math.PI*0.5, 1);

      var sceneTorus = scene['torus'];
      rotateTorus(sceneTorus, 0.5 * (speed/Math.PI), tTotal, 0, -Math.PI*0.5 ); 
    }

    // Task 8
    // enable light 1
    context.light[0].active = true;
    context.light[0].color = [1,1,1];
    context.light[0].dummy = scene["light1"];

    // enable light 2
    context.light[1].active = true;
    context.light[1].color = [1,1,1];
    context.light[1].dummy = scene["light2"];

    context.lightAngle = Math.PI*0.5;
    gui.add(context, "lightAngle", 0.0, Math.PI*2.0, 0.01).listen();

    function updateLights()
    {
      {
        // scene specific light animation/handling

        // update positions in circles
        var l = context.light[0];
        l.position[0] = Math.cos(context.lightAngle);
        l.position[1] = Math.sin(context.lightAngle);
        l.dummy.params.pos = l.position;
        updateSceneObjectMatrix(l.dummy);

        l = context.light[1];
        l.position[0] = Math.cos(context.lightAngle);
        l.position[2] = Math.sin(context.lightAngle);
        l.dummy.params.pos = l.position;
        updateSceneObjectMatrix(l.dummy);
      }

      // ambient
      gl.uniform3fv(context.u_ambientLight, context.ambientLight);

      for (var i = 0; i < context.light.length; i++)
      {
        var l = context.light[i];
        var lu = l.u;
        gl.uniform1i(lu.active, l.active);

        if (l.active)
        {
          gl.uniform3fv(lu.color, l.color);

          // transform light to camera space
          vec3.transformMat4(l.tpos, l.position, context.camera);
          gl.uniform3fv(lu.position, l.tpos);
        }
      }
    }

    // draw task
    context.render = function(elapsed, tTotal)
    {
      animate(elapsed, tTotal);

      cleanBg();

      // update style
      gl.uniform1i(u_renderStyle, context.renderStyle );

      // update camera
      gl.uniformMatrix4fv(u_camera, false, camera );

      // update lights
      if (context.renderStyle >= 3 && context.renderStyle <= 5)
      {
        updateLights();
      }

      // draw all shapes in scene
      for (shape in scene)
      {
        var s = scene[shape];

        updateSceneObjectModelViewMatrix(s);
        s.params.draw(s);
      }

      return renderContinous; // true for continous animation, false for no update required
    }

    return context;
  }
}

// create context and render once
context = initContext("wgl");
context.resetCamera(); // init camera pos and draw

requestFrame(renderContext); // start continous rendering

// Camera/Key handler
window.onkeydown = function(evt)
{
  var key = evt.which ? evt.which : evt.keyCode;
  var c = String.fromCharCode(key);
  
  var change = 0.01;

  if(evt.shiftKey)
  {
    change *= 3.0;
  }

  var ct = vec3.create();

  if (c == 'W'|| key == 38)
  {
    ct[2]=change;
  }
  else if(c == 'S' || key == 40)
  {
    ct[2]=-change;
  }
  else if(c == 'A' || key == 37)
  {
    ct[0]=change;
  }
  else if(c == 'D' || key == 39)
  {
    ct[0]=-change;
  }
  else if(c == ' ')
  {
    ct[1]=-change;
  }
  else if(c == 'C')
  {
    ct[1]=change;
  }
  // task 8 rotate lights
  else if(c == 'L')
  {
    context.lightAngle = normalizeRad(context.lightAngle + change*5);
  }
  else if(c == 'I')
  {
    context.lightAngle = normalizeRad(context.lightAngle - change*5);
  }

  // we want to move relative to viewing direction
  var transformDir = mat4.clone(context.cameraRotation);
  mat4.invert(transformDir, transformDir);
  vec3.transformMat4(ct, ct, transformDir);

  vec3.add(context.cameraPos, context.cameraPos, ct);
  context.updateCamera();
};

// Camera/Mouse handler
function mouseDrag(evt)
{
  if ((evt.buttons & 1) == 1) // mouse primary down?
  {
    var changeX = evt.movementX / context.canvas.clientWidth;
    var changeY = evt.movementY / context.canvas.clientHeight;
    changeX *= Math.PI;
    changeY *= Math.PI;

    // handle angles
    var camRotation = context.cameraAngle;
    camRotation[0] -= changeY;
    camRotation[1] -= changeX;
    camRotation[0] = restrainPitch(camRotation[0]); // pitch
    camRotation[1] = normalizeRad(camRotation[1]); // yaw

    context.updateCamera();
  }
}

context.canvas.addEventListener("mousemove", mouseDrag, false);

</script>
