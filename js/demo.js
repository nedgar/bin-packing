/******************************************************************************

 This is a demo page to experiment with binary tree based
 algorithms for packing blocks into a single 3-dimensional bin.

 See individual .js files for descriptions of each algorithm:

  * packer.js         - simple algorithm for a fixed width/height bin
  * packer.growing.js - complex algorithm that grows automatically

 TODO
 ====
  * step by step animated render to watch packing in action (and help debug)
  * optimization - mark branches as "full" to avoid walking them
  * optimization - dont bother with nodes that are less than some threshold w/h (2? 5?)

*******************************************************************************/
'use strict';

function Demo() {

  this.init = () => {

    this.el = {
      examples: $('#examples'),
      blocks:   $('#blocks'),
      canvas:   $('#canvas')[0],
      size:     $('#size'),
      sort:     $('#sort'),
      color:    $('#color'),
      ratio:    $('#ratio'),
      nofit:    $('#nofit')
    };

    if (!this.el.canvas.getContext) // no support for canvas
      return false;

    this.el.draw = this.el.canvas.getContext("2d");
    this.el.blocks.val(this.blocks.serialize(this.blocks.current()));
    this.el.blocks.change(this.run);
    this.el.size.change(this.run);
    this.el.sort.change(this.run);
    this.el.color.change(this.run);
    this.el.examples.change(this.blocks.change);
    this.run();

    this.el.blocks.keypress((ev) => {
      if (ev.which == 13)
        this.run(); // run on <enter> while entering block information
    });

    return this;
  }

  //---------------------------------------------------------------------------

  this.run = () => {

    var blocks = this.blocks.deserialize(this.el.blocks.val());
    var packer = this.packer();

    this.sort.now(blocks);

    packer.fit(blocks);

    this.canvas.reset(packer.root.w, packer.root.h);
    this.canvas.blocks(blocks);
    this.canvas.boundary(packer.root);
    this.report(blocks, packer.root);
  };

  //---------------------------------------------------------------------------

  this.packer = () => {
    var size = this.el.size.val();
    if (size == 'automatic') {
      return new GrowingPacker();
    }
    else {
      var dims = size.split("x");
      return new Packer(parseInt(dims[0]), parseInt(dims[1]), parseInt(dims[2]));
    }
  };

  //---------------------------------------------------------------------------

  this.report = (blocks, root) => {
    var fit = 0, nofit = [], block, n, len = blocks.length;
    for (n = 0 ; n < len ; n++) {
      block = blocks[n];
      if (block.fit)
        fit = fit + block.volume;
      else
        nofit.push("" + block.w + "x" + block.h + "x" + block.d);
    }
    this.el.ratio.text(Math.round(100 * fit / (root.w * root.h * root.d)));
    this.el.nofit.html("Did not fit (" + nofit.length + ") :<br>" + nofit.join(", ")).toggle(nofit.length > 0);
  };

  //---------------------------------------------------------------------------

  this.sort = {

    random  : (a,b) => { return Math.random() - 0.5; },
    w       : (a,b) => { return b.w - a.w; },
    h       : (a,b) => { return b.h - a.h; },
    d       : (a,b) => { return b.d - a.d; },
    a       : (a,b) => { return b.area - a.area; },
    v       : (a,b) => { return b.volume - a.volume; },
    max     : (a,b) => { return Math.max(b.w, b.h, b.d) - Math.max(a.w, a.h, a.d); },
    min     : (a,b) => { return Math.min(b.w, b.h, b.d) - Math.min(a.w, a.h, a.d); },

    height  : (a,b) => { return this.sort.msort(a, b, ['h', 'w', 'd']);               },
    width   : (a,b) => { return this.sort.msort(a, b, ['w', 'h', 'd']);               },
    depth   : (a,b) => { return this.sort.msort(a, b, ['d', 'w', 'h']);               },
    area    : (a,b) => { return this.sort.msort(a, b, ['a', 'h', 'w', 'd']);          },
    volume  : (a,b) => { return this.sort.msort(a, b, ['v', 'a', 'h', 'w', 'd']);     },
    maxside : (a,b) => { return this.sort.msort(a, b, ['max', 'min', 'h', 'w', 'd']); },

    msort: (a, b, criteria) => { /* sort by multiple criteria */
      var diff, n;
      for (n = 0 ; n < criteria.length ; n++) {
        diff = this.sort[criteria[n]](a,b);
        if (diff != 0)
          return diff;
      }
      return 0;
    },

    now: (blocks) => {
      var sel = this.el.sort.val();
      if (sel !== 'none') {
        blocks.sort(this.sort[sel]);
      }
    }

  };

  //---------------------------------------------------------------------------

  this.canvas = {

    z_scale: 0.08,

    reset: (width, height) => {
      this.el.canvas.width  = width  + 1; // add 1 because we draw boundaries offset by 0.5 in order to pixel align and get crisp boundaries
      this.el.canvas.height = height + 1; // (ditto)
      this.el.draw.clearRect(0, 0, this.el.canvas.width, this.el.canvas.height);
    },

    rect: (x, y, w, h, color) => {
      this.el.draw.fillStyle = color;
      this.el.draw.fillRect(x + 0.5, y + 0.5, w, h);
    },

    stroke: (x, y, w, h) => {
      this.el.draw.strokeRect(x + 0.5, y + 0.5, w, h);
    },

    blocks: (blocks) => {
      var n, block, offset;
      for (n = 0 ; n < blocks.length ; n++) {
        block = blocks[n];
        if (block.fit) {
          // console.log(block.fit);
          offset = block.fit.z * this.canvas.z_scale;
          this.canvas.rect(block.fit.x + offset, block.fit.y + offset, block.w - 2*offset, block.h - 2*offset, this.color(n));
          this.canvas.stroke(block.fit.x + offset, block.fit.y + offset, block.w - 2*offset, block.h - 2*offset, this.color(n));
        }
      }
    },

    boundary: (node) => {
      if (node) {
        var offset = node.z * this.canvas.z_scale;
        this.canvas.stroke(node.x + offset, node.y + offset, node.w - 2*offset, node.h - 2*offset);
        // this.canvas.boundary(node.right);
        // this.canvas.boundary(node.down);
        // this.canvas.boundary(node.above);
      }
    }
  };

  //---------------------------------------------------------------------------

  this.blocks = {

    examples: {

      simple: [
        { w: 500, h: 200, d: 50, num:  1 },
        { w: 250, h: 200, d: 50, num:  1 },
        { w: 50,  h: 50,  d: 50, num: 20 }
      ],

      cube: [
        { w: 50, h: 50, d: 50, num: 150 }
      ],

      power2: [
        { w:   2, h:   2, d:   2, num: 256 },
        { w:   4, h:   4, d:   4, num: 128 },
        { w:   8, h:   8, d:   8, num:  64 },
        { w:  16, h:  16, d:  16, num:  32 },
        { w:  32, h:  32, d:  32, num:  16 },
        { w:  64, h:  64, d:  64, num:   8 },
        { w: 128, h: 128, d: 128, num:   4 },
        { w: 256, h: 256, d: 256, num:   2 }
      ],

      tall: [
        { w: 50,  h: 400, d: 50, num:  2 },
        { w: 50,  h: 300, d: 50, num:  5 },
        { w: 50,  h: 200, d: 50, num: 10 },
        { w: 50,  h: 100, d: 50, num: 20 },
        { w: 50,  h:  50, d: 50, num: 40 }
      ],

      wide: [
        { w: 400, h:  50, d: 50, num:  2 },
        { w: 300, h:  50, d: 50, num:  5 },
        { w: 200, h:  50, d: 50, num: 10 },
        { w: 100, h:  50, d: 50, num: 20 },
        { w:  50, h:  50, d: 50, num: 40 }
      ],

      deep: [
        { w: 50, h: 50, d: 400, num:  2 },
        { w: 50, h: 50, d: 300, num:  5 },
        { w: 50, h: 50, d: 200, num: 10 },
        { w: 50, h: 50, d: 100, num: 20 },
        { w: 50, h: 50, d:  50, num: 40 }
      ],

      tallwide: [ /* alternate tall then wide */
        { w: 400, h: 100, d: 50 },
        { w: 100, h: 400, d: 50 },
        { w: 400, h: 100, d: 50 },
        { w: 100, h: 400, d: 50 },
        { w: 400, h: 100, d: 50 },
        { w: 100, h: 400, d: 50 }
      ],

      oddeven: [ /* both odd and even sizes leaves little areas of whitespace */
        { w:  50, h:  50, d: 10, num: 20 },
        { w:  47, h:  31, d: 10, num: 20 },
        { w:  23, h:  17, d: 10, num: 20 },
        { w: 109, h:  42, d: 10, num: 20 },
        { w:  42, h: 109, d: 10, num: 20 },
        { w:  17, h:  33, d: 10, num: 20 },
      ],

      complex: [
        {w: 100, h: 100, d: 5, num:   3},
        {w:  60, h:  60, d: 5, num:   3},
        {w:  50, h:  20, d: 5, num:  20},
        {w:  20, h:  50, d: 5, num:  20},
        {w: 250, h: 250, d: 5, num:   1},
        {w: 250, h: 100, d: 5, num:   1},
        {w: 100, h: 250, d: 5, num:   1},
        {w: 400, h:  80, d: 5, num:   1},
        {w: 80,  h: 400, d: 5, num:   1},
        {w:  10, h:  10, d: 5, num: 100},
        {w:   5, h:   5, d: 5, num: 500}
      ]
    },

    current: () => {
      return this.blocks.examples[this.el.examples.val()];
    },

    change: () => {
      this.el.blocks.val(this.blocks.serialize(this.blocks.current()));
      this.run();
    },

    deserialize: (val) => {
      var i, j, block, blocks = val.split("\n"), result = [];
      for(i = 0 ; i < blocks.length ; i++) {
        block = blocks[i].split("x");
        if (block.length >= 3)
          result.push({w: parseInt(block[0]), h: parseInt(block[1]), d: parseInt(block[2]), num: (block.length == 3 ? 1 : parseInt(block[3])) });
      }
      var expanded = [];
      for(i = 0 ; i < result.length ; i++) {
        for(j = 0 ; j < result[i].num ; j++) {
          var r = result[i];
          expanded.push({w: r.w, h: r.h, d: r.d, area: r.w * r.h, volume: r.w * r.h * r.d});
        }
      }
      return expanded;
    },

    serialize: (blocks) => {
      var i, block, str = "";
      for(i = 0; i < blocks.length ; i++) {
        block = blocks[i];
        str = str + block.w + "x" + block.h + "x" + block.d + (block.num > 1 ? "x" + block.num : "") + "\n";
      }
      return str;
    }

  };

  //---------------------------------------------------------------------------

  this.colors = {
    pastel:         [ "#FFF7A5", "#FFA5E0", "#A5B3FF", "#BFFFA5", "#FFCBA5" ],
    basic:          [ "silver", "gray", "red", "maroon", "yellow", "olive", "lime", "green", "aqua", "teal", "blue", "navy", "fuchsia", "purple" ],
    gray:           [ "#111", "#222", "#333", "#444", "#555", "#666", "#777", "#888", "#999", "#AAA", "#BBB", "#CCC", "#DDD", "#EEE" ],
    vintage:        [ "#EFD279", "#95CBE9", "#024769", "#AFD775", "#2C5700", "#DE9D7F", "#7F9DDE", "#00572C", "#75D7AF", "#694702", "#E9CB95", "#79D2EF" ],
    solarized:      [ "#b58900", "#cb4b16", "#dc322f", "#d33682", "#6c71c4", "#268bd2", "#2aa198", "#859900" ],
    none:           [ "transparent" ]
  };

  this.color = (n) => {
    var cols = this.colors[this.el.color.val()];
    return cols[n % cols.length];
  };

  //---------------------------------------------------------------------------

  return this.init();
}

$(window.demo = new Demo);
