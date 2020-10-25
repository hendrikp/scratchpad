<style>
    .butterfly {
      width: 256px;
      height: 256px;
      background-image : url(butterfly.png);
      animation: moveButterfly 1s linear forwards;
    }
    @keyframes moveButterfly {
      from{background-position-x:0px;background-position-y:0px;}
      to{background-position-x:-768px;background-position-y:-768px;}
    }
</style>

Rotating Disc:
TODO

Keybinds:
* `L` - Rotate disc left one frame
* `R` - Rotate disc right one frame
* `A` - Rotate disc automatically

Animated spritesheet:
<div class="butterfly"/>
<img src="butterfly.png" style="width: 256px; height: 256px;" />

Source material:
* [Rotating Disc](https://opengameart.org/content/sweet-colorful-candies-free-game-assest) (Modified)
* [Butterfly Spritesheet](https://opengameart.org/content/butterfly-animation)
