/******************************************************************************

This is a binary tree based bin packing algorithm that is more complex than
the simple Packer (packer.js). Instead of starting off with a fixed width and
height, it starts with the width and height of the first block passed and then
grows as necessary to accomodate each subsequent block. As it grows it attempts
to maintain a roughly square ratio by making 'smart' choices about whether to
grow right or down.

When growing, the algorithm can only grow to the right OR down. Therefore, if
the new block is BOTH wider and taller than the current target then it will be
rejected. This makes it very important to initialize with a sensible starting
width and height. If you are providing sorted input (largest first) then this
will not be an issue.

A potential way to solve this limitation would be to allow growth in BOTH
directions at once, but this requires maintaining a more complex tree
with 3 children (down, right and center) and that complexity can be avoided
by simply chosing a sensible starting block.

Best results occur when the input blocks are sorted by height, or even better
when sorted by max(width,height).

Inputs:
------

  blocks: array of any objects that have .w and .h attributes

Outputs:
-------

  marks each block that fits with a .fit attribute pointing to a
  node with .x and .y coordinates

Example:
-------

  var blocks = [
    { w: 100, h: 100 },
    { w: 100, h: 100 },
    { w:  80, h:  80 },
    { w:  80, h:  80 },
    etc
    etc
  ];

  var packer = new GrowingPacker();
  packer.fit(blocks);

  for(var n = 0 ; n < blocks.length ; n++) {
    var block = blocks[n];
    if (block.fit) {
      Draw(block.fit.x, block.fit.y, block.w, block.h);
    }
  }


******************************************************************************/
'use strict';

function GrowingPacker() {

  this.fit = (blocks) => {
    var n, node, block, len = blocks.length;
    var w = len > 0 ? blocks[0].w : 0;
    var h = len > 0 ? blocks[0].h : 0;
    var d = len > 0 ? blocks[0].d : 0;
    this.root = { x: 0, y: 0, z: 0, w: w, h: h, d: d };
    for (n = 0; n < len ; n++) {
      block = blocks[n];
      if (node = this.findNode(this.root, block.w, block.h, block.d)) {
        block.fit = this.splitNode(node, block.w, block.h, block.d);
      } else {
        block.fit = this.growNode(block.w, block.h, block.d);
      }
    }
  };

  this.findNode = (root, w, h, d) => {
    if (root.used)
      return this.findNode(root.right, w, h, d)
          || this.findNode(root.down, w, h, d)
          || this.findNode(root.above, w, h, d);
    else if ((w <= root.w) && (h <= root.h) && (d <= root.d))
      return root;
    else
      return null;
  };

  this.splitNode = (node, w, h, d) => {
    node.used = true;
    node.right = { x: node.x + w, y: node.y,     z: node.z,     w: node.w - w, h: h         , d: d          };
    node.down  = { x: node.x,     y: node.y + h, z: node.z,     w: node.w,     h: node.h - h, d: d          };
    node.above = { x: node.x,     y: node.y,     z: node.z + d, w: node.w,     h: node.h    , d: node.d - d };
    return node;
  };

  this.growNode = (w, h, d) => {
    var canGrowDown  = (w <= this.root.w) && (d <= this.root.d);
    var canGrowRight = (h <= this.root.h) && (d <= this.root.d);
    var canGrowAbove = (w <= this.root.w) && (h <= this.root.h);

    var shouldGrowRight = canGrowRight && (this.root.h >= (this.root.w + w)); // attempt to keep square-ish by growing right when height is much greater than width
    var shouldGrowDown  = canGrowDown  && (this.root.w >= (this.root.h + h)); // attempt to keep square-ish by growing down  when width  is much greater than height
    var shouldGrowAbove = canGrowAbove && (this.root.w >= (this.root.d + d) || this.root.h >= (this.root.d + d)); // attempt to keep cube-ish by growing above when width or height is much greater than depth

    if (shouldGrowRight)
      return this.growRight(w, h, d);
    else if (shouldGrowDown)
      return this.growDown(w, h, d);
    else if (shouldGrowAbove)
      return this.growAbove(w, h, d);
    else if (canGrowRight)
     return this.growRight(w, h, d);
    else if (canGrowDown)
      return this.growDown(w, h, d);
    else if (canGrowAbove)
      return this.growAbove(w, h, d);
    else
      return null; // need to ensure sensible root starting size to avoid this happening
  };

  this.growRight = (w, h, d) => {
    var node;

    this.root = {
      used: true,
      x: 0,
      y: 0,
      z: 0,
      w: this.root.w + w,
      h: this.root.h,
      d: this.root.d,
      down: this.root,
      right: { x: this.root.w, y: 0, z: 0, w: w, h: this.root.h, d: this.root.d },
      above: { x: 0, y: 0, z: 0, w: this.root.w, h: this.root.h, d: 0}
    };
    if (node = this.findNode(this.root, w, h, d))
      return this.splitNode(node, w, h, d);
    else
      return null;
  };

  this.growDown = (w, h, d) => {
    var node;

    this.root = {
      used: true,
      x: 0,
      y: 0,
      z: 0,
      w: this.root.w,
      h: this.root.h + h,
      d: this.root.d,
      down:  { x: 0, y: this.root.h, z: 0, w: this.root.w, h: h, d: this.root.d },
      right: this.root,
      above: { x: 0, y: 0, z: 0, w: this.root.w, h: this.root.h, d: 0}
    };
    if (node = this.findNode(this.root, w, h, d))
      return this.splitNode(node, w, h, d);
    else
      return null;
  };

  this.growAbove = (w, h, d) => {
    var node;

    this.root = {
      used: true,
      x: 0,
      y: 0,
      z: 0,
      w: this.root.w,
      h: this.root.h,
      d: this.root.d + d,
      right: this.root,
      down: { x: 0, y: 0, z: 0, w: this.root.w, h: 0, d: this.root.d },
      above:  { x: 0, y: 0, z: this.root.d, w: this.root.w, h: this.root.h, d: d }
    };
    if (node = this.findNode(this.root, w, h, d))
      return this.splitNode(node, w, h, d);
    else
      return null;
  };

  return this;
}
