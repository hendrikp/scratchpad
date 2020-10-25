# GVT Task 1
Sourcecode for Task 1:
https://raw.githubusercontent.com/hendrikp/scratchpad/gh-pages/gvt/gvt1.md

## Rotating Disc

<style>
    .spiral {
      display: inline-block;
      width: 256px;
      height: 256px;
    }
    .spiral_auto {
      animation: moveSpiralX 0.4s steps(12) infinite;
    }
    @keyframes moveSpiralX {
      from{background-position-x:0px;}
      to{background-position-x:-3072px;}
    }
</style>

<script>
// As requested in task load image indirectly, via javascript
function loadImage(id, filename)
{
    var imageObj = new Image();
    imageObj.onload = function()
    {
        var img = document.getElementById(id);
        img.setAttribute("style", "background-image: url(" + filename + ");");
    };
    imageObj.src = filename;
}

// Load image once window loaded
window.onload = function() { loadImage('spiral1', 'spiral.png'); };

// Handle autorotate (Extension)
var _stateAutoRotate = false;
function toggleSpiralAutoRotate()
{
  var autoRotate = !_stateAutoRotate;
  var rotateClass = "spiral_auto";
  
  var img = document.getElementById("spiral1");
  img.style.removeProperty("background-position-x"); // Reset frame-based animation
  
  // add/remove css class for autorotation
  if (autoRotate)
  {
    img.classList.add(rotateClass);
  }
  else
  {
    if (img.classList.contains(rotateClass))
    {
        img.classList.remove(rotateClass);
    }
  }
 
  _stateAutoRotate = autoRotate;
}

// Handle frame based animation
var _animationFrame = 0;
function spiralAnimate(frameDelta)
{
    if (!_stateAutoRotate)
    {
        _animationFrame += frameDelta;

        // this potentially supports angle based rotation, with more then one frame delta too
        while (_animationFrame < 0)
        {
            _animationFrame += 12;
        }

        while (_animationFrame >= 12)
        {
            _animationFrame -= 12;
        }

        var xPos = _animationFrame * -256;

        // Frame wise animation by moving offset
        var img = document.getElementById("spiral1");
        img.style.setProperty("background-position-x", xPos + "px");
    }
}

// Key handler
window.onkeydown = function(evt)
{
    var key = evt.which ? evt.which : evt.keyCode;
    var c = String.fromCharCode(key);
    
    if (c == 'A')
    {
        toggleSpiralAutoRotate();
    }
    else if(c == 'R')
    {
        spiralAnimate(1);
    }
    else if(c == 'L')
    {
        spiralAnimate(-1);
    }
};

</script>

<div id="spiral1" class="spiral"></div>

Keybinds:
* `L` - Rotate disc left one frame (if not autorotating)
* `R` - Rotate disc right one frame (if not autorotating)
* `A` - Toggle rotate disc automatically (Extension)

Source material:
* Selfcreated, with scripted action to duplicate, move, rotate layer. (Additionally applied bevel and glow filter ontop all - after rotation)

## Animated spritesheet (Extension)
<style>
    .butterfly {
      display: inline-block;
      width: 256px;
      height: 256px;
      background-image : url(butterfly.png);
      animation: moveButterflyX 0.25s steps(4) infinite,
                 moveButterflyY 1s steps(4) infinite;
    }
    @keyframes moveButterflyX {
      from{background-position-x:0px;}
      to{background-position-x:-1024px;}
    }
    @keyframes moveButterflyY {
      from{background-position-y:0px;}
      to{background-position-y:-1024px;}
    }
</style>

<div class="butterfly"></div>

Source material:
* [Butterfly Spritesheet](https://opengameart.org/content/butterfly-animation) (Modified: Fixed Spritesheet animation grid/alignment)
