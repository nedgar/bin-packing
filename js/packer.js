/******************************************************************************

This is a very simple binary tree based bin packing algorithm that is initialized
with a fixed width, height, depth and will fit each block into the first node where
it fits and then split that node into 3 parts (right, down, above) to track the
remaining free space.

Best results occur when the input blocks are sorted by height, or even better
when sorted by max(width,height,depth).

Inputs:
------

  w:      width of target block
  h:      height of target block
  d:      depth of target block
  blocks: array of any objects that have .w, .h, .d attributes

Outputs:
-------

  marks each block that fits with a .fit attribute pointing to a
  node with .x and .y coordinates

Example:
-------

  var blocks = [
    { w: 100, h: 100, d: 100 },
    { w: 100, h: 100, d: 100 },
    { w:  80, h:  80, d: 80 },
    { w:  80, h:  80, d: 80 },
    etc
  ];

  var packer = new Packer(500, 500, 500);
  packer.fit(blocks);

  for(var n = 0 ; n < blocks.length ; n++) {
    var block = blocks[n];
    if (block.fit) {
      Draw(block.fit.x, block.fit.y, block.fit.z, block.w, block.h, block.d);
    }
  }


******************************************************************************/

function Packer(w, h, d) {

  this.root = { x: 0, y: 0, z: 0, w: w, h: h, d: d };

  function fit(blocks) {
    var n, node, block;
    for (n = 0; n < blocks.length; n++) {
      block = blocks[n];
      if (node = findNode(this.root, block.w, block.h, block.d))
        block.fit = splitNode(node, block.w, block.h, block.d);
    }
  }

  function findNode(root, w, h, d) {
    if (root.used)
      return findNode(root.right, w, h, d)
          || findNode(root.down, w, h, d)
          || findNode(root.above, w, h, d);
    else if ((w <= root.w) && (h <= root.h) && (d <= root.d))
      return root;
    else
      return null;
  }

  function splitNode(node, w, h, d) {
    node.used = true;
    // node.right = { x: node.x + w, y: node.y,     z: node.z,     w: node.w - w, h: h         , d: node.d     };
    // node.down  = { x: node.x,     y: node.y + h, z: node.z,     w: node.w,     h: node.h - h, d: node.d     };
    // node.above = { x: node.x,     y: node.y,     z: node.z + d, w: w,          h: h         , d: node.d - d };
    node.right = { x: node.x + w, y: node.y,     z: node.z,     w: node.w - w, h: h         , d: d          };
    node.down  = { x: node.x,     y: node.y + h, z: node.z,     w: node.w,     h: node.h - h, d: d          };
    node.above = { x: node.x,     y: node.y,     z: node.z + d, w: node.w,     h: node.h    , d: node.d - d };
    return node;
  }

  this.fit = fit;

  return this;
}
