

Rotating Disc:
--------------
TODO

Keybinds:
* `L` - Rotate disc left one frame
* `R` - Rotate disc right one frame
* `A` - Rotate disc automatically (Extension)

Source material:
* [Rotating Disc](https://opengameart.org/content/sweet-colorful-candies-free-game-assest) (Modified: Added spritesheet animation)

Animated spritesheet (Extension):
---------------------------------
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

<div class="butterfly" />

Source material:
* [Butterfly Spritesheet](https://opengameart.org/content/butterfly-animation) (Modified: Fixed Spritesheet animation grid/alignment)
