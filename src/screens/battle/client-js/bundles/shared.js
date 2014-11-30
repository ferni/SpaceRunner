(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\client\\bundle-entries\\shared.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require*/

window.sh = require('../../shared');
},{"../../shared":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\index.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\index.js":[function(require,module,exports){
module.exports = require('./src/PathFinding');

},{"./src/PathFinding":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\PathFinding.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\PathFinding.js":[function(require,module,exports){
module.exports = {
    'Node'                 : require('./core/Node'),
    'Grid'                 : require('./core/Grid'),
    'Heap'                 : require('./core/Heap'),
    'Util'                 : require('./core/Util'),
    'Heuristic'            : require('./core/Heuristic'),
    'AStarFinder'          : require('./finders/AStarFinder'),
    'BestFirstFinder'      : require('./finders/BestFirstFinder'),
    'BreadthFirstFinder'   : require('./finders/BreadthFirstFinder'),
    'DijkstraFinder'       : require('./finders/DijkstraFinder'),
    'BiAStarFinder'        : require('./finders/BiAStarFinder'),
    'BiBestFirstFinder'    : require('./finders/BiBestFirstFinder'),
    'BiBreadthFirstFinder' : require('./finders/BiBreadthFirstFinder'),
    'BiDijkstraFinder'     : require('./finders/BiDijkstraFinder'),
    'JumpPointFinder'      : require('./finders/JumpPointFinder')
};

},{"./core/Grid":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Grid.js","./core/Heap":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Heap.js","./core/Heuristic":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Heuristic.js","./core/Node":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Node.js","./core/Util":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Util.js","./finders/AStarFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\AStarFinder.js","./finders/BestFirstFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BestFirstFinder.js","./finders/BiAStarFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BiAStarFinder.js","./finders/BiBestFirstFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BiBestFirstFinder.js","./finders/BiBreadthFirstFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BiBreadthFirstFinder.js","./finders/BiDijkstraFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BiDijkstraFinder.js","./finders/BreadthFirstFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BreadthFirstFinder.js","./finders/DijkstraFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\DijkstraFinder.js","./finders/JumpPointFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\JumpPointFinder.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Grid.js":[function(require,module,exports){
var Node = require('./Node');

/**
 * The Grid class, which serves as the encapsulation of the layout of the nodes.
 * @constructor
 * @param {number} width Number of columns of the grid.
 * @param {number} height Number of rows of the grid.
 * @param {Array.<Array.<(number|boolean)>>} [matrix] - A 0-1 matrix
 *     representing the walkable status of the nodes(0 or false for walkable).
 *     If the matrix is not supplied, all the nodes will be walkable.  */
function Grid(width, height, matrix) {
    /**
     * The number of columns of the grid.
     * @type number
     */
    this.width = width;
    /**
     * The number of rows of the grid.
     * @type number
     */
    this.height = height;

    /**
     * A 2D array of nodes.
     */
    this.nodes = this._buildNodes(width, height, matrix);
}

/**
 * Build and return the nodes.
 * @private
 * @param {number} width
 * @param {number} height
 * @param {Array.<Array.<number|boolean>>} [matrix] - A 0-1 matrix representing
 *     the walkable status of the nodes.
 * @see Grid
 */
Grid.prototype._buildNodes = function(width, height, matrix) {
    var i, j,
        nodes = new Array(height),
        row;

    for (i = 0; i < height; ++i) {
        nodes[i] = new Array(width);
        for (j = 0; j < width; ++j) {
            nodes[i][j] = new Node(j, i);
        }
    }


    if (matrix === undefined) {
        return nodes;
    }

    if (matrix.length !== height || matrix[0].length !== width) {
        throw new Error('Matrix size does not fit');
    }

    for (i = 0; i < height; ++i) {
        for (j = 0; j < width; ++j) {
            if (matrix[i][j]) {
                // 0, false, null will be walkable
                // while others will be un-walkable
                nodes[i][j].walkable = false;
            }
        }
    }

    return nodes;
};


Grid.prototype.getNodeAt = function(x, y) {
    return this.nodes[y][x];
};


/**
 * Determine whether the node at the given position is walkable.
 * (Also returns false if the position is outside the grid.)
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @return {boolean} - The walkability of the node.
 */
Grid.prototype.isWalkableAt = function(x, y) {
    return this.isInside(x, y) && this.nodes[y][x].walkable;
};


/**
 * Determine whether the position is inside the grid.
 * XXX: `grid.isInside(x, y)` is wierd to read.
 * It should be `(x, y) is inside grid`, but I failed to find a better
 * name for this method.
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
Grid.prototype.isInside = function(x, y) {
    return (x >= 0 && x < this.width) && (y >= 0 && y < this.height);
};


/**
 * Set whether the node on the given position is walkable.
 * NOTE: throws exception if the coordinate is not inside the grid.
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @param {boolean} walkable - Whether the position is walkable.
 */
Grid.prototype.setWalkableAt = function(x, y, walkable) {
    this.nodes[y][x].walkable = walkable;
};


/**
 * Get the neighbors of the given node.
 *
 *     offsets      diagonalOffsets:
 *  +---+---+---+    +---+---+---+
 *  |   | 0 |   |    | 0 |   | 1 |
 *  +---+---+---+    +---+---+---+
 *  | 3 |   | 1 |    |   |   |   |
 *  +---+---+---+    +---+---+---+
 *  |   | 2 |   |    | 3 |   | 2 |
 *  +---+---+---+    +---+---+---+
 *
 *  When allowDiagonal is true, if offsets[i] is valid, then
 *  diagonalOffsets[i] and
 *  diagonalOffsets[(i + 1) % 4] is valid.
 * @param {Node} node
 * @param {boolean} allowDiagonal
 * @param {boolean} dontCrossCorners
 */
Grid.prototype.getNeighbors = function(node, allowDiagonal, dontCrossCorners) {
    var x = node.x,
        y = node.y,
        neighbors = [],
        s0 = false, d0 = false,
        s1 = false, d1 = false,
        s2 = false, d2 = false,
        s3 = false, d3 = false,
        nodes = this.nodes;

    // ↑
    if (this.isWalkableAt(x, y - 1)) {
        neighbors.push(nodes[y - 1][x]);
        s0 = true;
    }
    // →
    if (this.isWalkableAt(x + 1, y)) {
        neighbors.push(nodes[y][x + 1]);
        s1 = true;
    }
    // ↓
    if (this.isWalkableAt(x, y + 1)) {
        neighbors.push(nodes[y + 1][x]);
        s2 = true;
    }
    // ←
    if (this.isWalkableAt(x - 1, y)) {
        neighbors.push(nodes[y][x - 1]);
        s3 = true;
    }

    if (!allowDiagonal) {
        return neighbors;
    }

    if (dontCrossCorners) {
        d0 = s3 && s0;
        d1 = s0 && s1;
        d2 = s1 && s2;
        d3 = s2 && s3;
    } else {
        d0 = s3 || s0;
        d1 = s0 || s1;
        d2 = s1 || s2;
        d3 = s2 || s3;
    }

    // ↖
    if (d0 && this.isWalkableAt(x - 1, y - 1)) {
        neighbors.push(nodes[y - 1][x - 1]);
    }
    // ↗
    if (d1 && this.isWalkableAt(x + 1, y - 1)) {
        neighbors.push(nodes[y - 1][x + 1]);
    }
    // ↘
    if (d2 && this.isWalkableAt(x + 1, y + 1)) {
        neighbors.push(nodes[y + 1][x + 1]);
    }
    // ↙
    if (d3 && this.isWalkableAt(x - 1, y + 1)) {
        neighbors.push(nodes[y + 1][x - 1]);
    }

    return neighbors;
};


/**
 * Get a clone of this grid.
 * @return {Grid} Cloned grid.
 */
Grid.prototype.clone = function() {
    var i, j,

        width = this.width,
        height = this.height,
        thisNodes = this.nodes,

        newGrid = new Grid(width, height),
        newNodes = new Array(height),
        row;

    for (i = 0; i < height; ++i) {
        newNodes[i] = new Array(width);
        for (j = 0; j < width; ++j) {
            newNodes[i][j] = new Node(j, i, thisNodes[i][j].walkable);
        }
    }

    newGrid.nodes = newNodes;

    return newGrid;
};

module.exports = Grid;

},{"./Node":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Node.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Heap.js":[function(require,module,exports){
// From https://github.com/qiao/heap.js
// Generated by CoffeeScript 1.3.1
(function() {
  var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

  floor = Math.floor, min = Math.min;

  /* 
  Default comparison function to be used
  */


  defaultCmp = function(x, y) {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  };

  /* 
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
  */


  insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
      lo = 0;
    }
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (lo < 0) {
      throw new Error('lo must be non-negative');
    }
    if (hi == null) {
      hi = a.length;
    }
    while (cmp(lo, hi) < 0) {
      mid = floor((lo + hi) / 2);
      if (cmp(x, a[mid]) < 0) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
  };

  /*
  Push item onto heap, maintaining the heap invariant.
  */


  heappush = function(array, item, cmp) {
    if (cmp == null) {
      cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
  };

  /*
  Pop the smallest item off the heap, maintaining the heap invariant.
  */


  heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
      returnitem = array[0];
      array[0] = lastelt;
      _siftup(array, 0, cmp);
    } else {
      returnitem = lastelt;
    }
    return returnitem;
  };

  /*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be 
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
  */


  heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
  };

  /*
  Fast version of a heappush followed by a heappop.
  */


  heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
      _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
      _siftup(array, 0, cmp);
    }
    return item;
  };

  /*
  Transform list into a heap, in-place, in O(array.length) time.
  */


  heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    _ref1 = (function() {
      _results1 = [];
      for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      i = _ref1[_i];
      _results.push(_siftup(array, i, cmp));
    }
    return _results;
  };

  /*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
  */


  updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
  };

  /*
  Find the n largest elements in a dataset.
  */


  nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
      return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
  };

  /*
  Find the n smallest elements in a dataset.
  */


  nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
      result = array.slice(0, n).sort(cmp);
      if (!result.length) {
        return result;
      }
      los = result[result.length - 1];
      _ref = array.slice(n);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (cmp(elem, los) < 0) {
          insort(result, elem, 0, null, cmp);
          result.pop();
          los = result[result.length - 1];
        }
      }
      return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      _results.push(heappop(array, cmp));
    }
    return _results;
  };

  _siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
      parentpos = (pos - 1) >> 1;
      parent = array[parentpos];
      if (cmp(newitem, parent) < 0) {
        array[pos] = parent;
        pos = parentpos;
        continue;
      }
      break;
    }
    return array[pos] = newitem;
  };

  _siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
      rightpos = childpos + 1;
      if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
        childpos = rightpos;
      }
      array[pos] = array[childpos];
      pos = childpos;
      childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
  };

  Heap = (function() {

    Heap.name = 'Heap';

    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
      this.cmp = cmp != null ? cmp : defaultCmp;
      this.nodes = [];
    }

    Heap.prototype.push = function(x) {
      return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
      return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
      return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
      return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
      return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
      return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
      return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
      return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
      return this.nodes = [];
    };

    Heap.prototype.empty = function() {
      return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
      return this.nodes.length;
    };

    Heap.prototype.clone = function() {
      var heap;
      heap = new Heap();
      heap.nodes = this.nodes.slice(0);
      return heap;
    };

    Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.remove = Heap.prototype.pop;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

  })();

  if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    module.exports = Heap;
  } else {
    window.Heap = Heap;
  }

}).call(this);

},{}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Heuristic.js":[function(require,module,exports){
/**
 * @namespace PF.Heuristic
 * @description A collection of heuristic functions.
 */
module.exports = {

  /**
   * Manhattan distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} dx + dy
   */
  manhattan: function(dx, dy) {
      return dx + dy;
  },

  /**
   * Euclidean distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} sqrt(dx * dx + dy * dy)
   */
  euclidean: function(dx, dy) {
      return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Chebyshev distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} max(dx, dy)
   */
  chebyshev: function(dx, dy) {
      return Math.max(dx, dy);
  }

};

},{}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Node.js":[function(require,module,exports){
/**
 * A node in grid. 
 * This class holds some basic information about a node and custom 
 * attributes may be added, depending on the algorithms' needs.
 * @constructor
 * @param {number} x - The x coordinate of the node on the grid.
 * @param {number} y - The y coordinate of the node on the grid.
 * @param {boolean} [walkable] - Whether this node is walkable.
 */
function Node(x, y, walkable) {
    /**
     * The x coordinate of the node on the grid.
     * @type number
     */
    this.x = x;
    /**
     * The y coordinate of the node on the grid.
     * @type number
     */
    this.y = y;
    /**
     * Whether this node can be walked through.
     * @type boolean
     */
    this.walkable = (walkable === undefined ? true : walkable);
};

module.exports = Node;

},{}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Util.js":[function(require,module,exports){
/**
 * Backtrace according to the parent records and return the path.
 * (including both start and end nodes)
 * @param {Node} node End node
 * @return {Array.<Array.<number>>} the path
 */
function backtrace(node) {
    var path = [[node.x, node.y]];
    while (node.parent) {
        node = node.parent;
        path.push([node.x, node.y]);
    }
    return path.reverse();
}
exports.backtrace = backtrace;

/**
 * Backtrace from start and end node, and return the path.
 * (including both start and end nodes)
 * @param {Node}
 * @param {Node}
 */
function biBacktrace(nodeA, nodeB) {
    var pathA = backtrace(nodeA),
        pathB = backtrace(nodeB);
    return pathA.concat(pathB.reverse());
}
exports.biBacktrace = biBacktrace;

/**
 * Compute the length of the path.
 * @param {Array.<Array.<number>>} path The path
 * @return {number} The length of the path
 */
function pathLength(path) {
    var i, sum = 0, a, b, dx, dy;
    for (i = 1; i < path.length; ++i) {
        a = path[i - 1];
        b = path[i];
        dx = a[0] - b[0];
        dy = a[1] - b[1];
        sum += Math.sqrt(dx * dx + dy * dy);
    }
    return sum;
}
exports.pathLength = pathLength;


/**
 * Given the start and end coordinates, return all the coordinates lying
 * on the line formed by these coordinates, based on Bresenham's algorithm.
 * http://en.wikipedia.org/wiki/Bresenham's_line_algorithm#Simplification
 * @param {number} x0 Start x coordinate
 * @param {number} y0 Start y coordinate
 * @param {number} x1 End x coordinate
 * @param {number} y1 End y coordinate
 * @return {Array.<Array.<number>>} The coordinates on the line
 */
function getLine(x0, y0, x1, y1) {
    var abs = Math.abs,
        line = [],
        sx, sy, dx, dy, err, e2;

    dx = abs(x1 - x0);
    dy = abs(y1 - y0);

    sx = (x0 < x1) ? 1 : -1;
    sy = (y0 < y1) ? 1 : -1;

    err = dx - dy;

    while (true) {
        line.push([x0, y0]);

        if (x0 === x1 && y0 === y1) {
            break;
        }
        
        e2 = 2 * err;
        if (e2 > -dy) {
            err = err - dy;
            x0 = x0 + sx;
        }
        if (e2 < dx) {
            err = err + dx;
            y0 = y0 + sy;
        }
    }

    return line;
}
exports.getLine = getLine;


/**
 * Smoothen the give path.
 * The original path will not be modified; a new path will be returned.
 * @param {PF.Grid} grid
 * @param {Array.<Array.<number>>} path The path
 * @return {Array.<Array.<number>>} Smoothened path
 */
function smoothenPath(grid, path) {
    var len = path.length,
        x0 = path[0][0],        // path start x
        y0 = path[0][1],        // path start y
        x1 = path[len - 1][0],  // path end x
        y1 = path[len - 1][1],  // path end y
        sx, sy,                 // current start coordinate
        ex, ey,                 // current end coordinate
        lx, ly,                 // last valid end coordinate
        newPath,
        i, j, coord, line, testCoord, blocked;

    sx = x0;
    sy = y0;
    lx = path[1][0];
    ly = path[1][1];
    newPath = [[sx, sy]];

    for (i = 2; i < len; ++i) {
        coord = path[i];
        ex = coord[0];
        ey = coord[1];
        line = getLine(sx, sy, ex, ey);

        blocked = false;
        for (j = 1; j < line.length; ++j) {
            testCoord = line[j];

            if (!grid.isWalkableAt(testCoord[0], testCoord[1])) {
                blocked = true;
                newPath.push([lx, ly]);
                sx = lx;
                sy = ly;
                break;
            }
        }
        if (!blocked) {
            lx = ex;
            ly = ey;
        }
    }
    newPath.push([x1, y1]);

    return newPath;
}
exports.smoothenPath = smoothenPath;

},{}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\AStarFinder.js":[function(require,module,exports){
var Heap       = require('../core/Heap');
var Util       = require('../core/Util');
var Heuristic  = require('../core/Heuristic');

/**
 * A* path-finder.
 * based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 * @param {integer} opt.weight Weight to apply to the heuristic to allow for suboptimal paths, 
 *     in order to speed up the search.
 */
function AStarFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
    this.heuristic = opt.heuristic || Heuristic.manhattan;
    this.weight = opt.weight || 1;
}

/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
AStarFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var openList = new Heap(function(nodeA, nodeB) {
            return nodeA.f - nodeB.f;
        }),
        startNode = grid.getNodeAt(startX, startY),
        endNode = grid.getNodeAt(endX, endY),
        heuristic = this.heuristic,
        allowDiagonal = this.allowDiagonal,
        dontCrossCorners = this.dontCrossCorners,
        weight = this.weight,
        abs = Math.abs, SQRT2 = Math.SQRT2,
        node, neighbors, neighbor, i, l, x, y, ng;

    // set the `g` and `f` value of the start node to be 0
    startNode.g = 0;
    startNode.f = 0;

    // push the start node into the open list
    openList.push(startNode);
    startNode.opened = true;

    // while the open list is not empty
    while (!openList.empty()) {
        // pop the position of node which has the minimum `f` value.
        node = openList.pop();
        node.closed = true;

        // if reached the end position, construct the path and return it
        if (node === endNode) {
            return Util.backtrace(endNode);
        }

        // get neigbours of the current node
        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }

            x = neighbor.x;
            y = neighbor.y;

            // get the distance between current node and the neighbor
            // and calculate the next g score
            ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

            // check if the neighbor has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbor.opened || ng < neighbor.g) {
                neighbor.g = ng;
                neighbor.h = neighbor.h || weight * heuristic(abs(x - endX), abs(y - endY));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = node;

                if (!neighbor.opened) {
                    openList.push(neighbor);
                    neighbor.opened = true;
                } else {
                    // the neighbor can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    openList.updateItem(neighbor);
                }
            }
        } // end for each neighbor
    } // end while not open list empty

    // fail to find the path
    return [];
};

module.exports = AStarFinder;

},{"../core/Heap":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Heap.js","../core/Heuristic":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Heuristic.js","../core/Util":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Util.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BestFirstFinder.js":[function(require,module,exports){
var AStarFinder = require('./AStarFinder');

/**
 * Best-First-Search path-finder.
 * @constructor
 * @extends AStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 */
function BestFirstFinder(opt) {
    AStarFinder.call(this, opt);

    var orig = this.heuristic;
    this.heuristic = function(dx, dy) {
        return orig(dx, dy) * 1000000;
    };
};

BestFirstFinder.prototype = new AStarFinder();
BestFirstFinder.prototype.constructor = BestFirstFinder;

module.exports = BestFirstFinder;

},{"./AStarFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\AStarFinder.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BiAStarFinder.js":[function(require,module,exports){
var Heap       = require('../core/Heap');
var Util       = require('../core/Util');
var Heuristic  = require('../core/Heuristic');

/**
 * A* path-finder.
 * based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 * @param {integer} opt.weight Weight to apply to the heuristic to allow for suboptimal paths, 
 *     in order to speed up the search.
 */
function BiAStarFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
    this.heuristic = opt.heuristic || Heuristic.manhattan;
    this.weight = opt.weight || 1;
}

/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
BiAStarFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var cmp = function(nodeA, nodeB) {
            return nodeA.f - nodeB.f;
        },
        startOpenList = new Heap(cmp),
        endOpenList = new Heap(cmp),
        startNode = grid.getNodeAt(startX, startY),
        endNode = grid.getNodeAt(endX, endY),
        heuristic = this.heuristic,
        allowDiagonal = this.allowDiagonal,
        dontCrossCorners = this.dontCrossCorners,
        weight = this.weight,
        abs = Math.abs, SQRT2 = Math.SQRT2,
        node, neighbors, neighbor, i, l, x, y, ng,
        BY_START = 1, BY_END = 2;

    // set the `g` and `f` value of the start node to be 0
    // and push it into the start open list
    startNode.g = 0;
    startNode.f = 0;
    startOpenList.push(startNode);
    startNode.opened = BY_START;

    // set the `g` and `f` value of the end node to be 0
    // and push it into the open open list
    endNode.g = 0;
    endNode.f = 0;
    endOpenList.push(endNode);
    endNode.opened = BY_END;

    // while both the open lists are not empty
    while (!startOpenList.empty() && !endOpenList.empty()) {

        // pop the position of start node which has the minimum `f` value.
        node = startOpenList.pop();
        node.closed = true;

        // get neigbours of the current node
        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened === BY_END) {
                return Util.biBacktrace(node, neighbor);
            }

            x = neighbor.x;
            y = neighbor.y;

            // get the distance between current node and the neighbor
            // and calculate the next g score
            ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

            // check if the neighbor has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbor.opened || ng < neighbor.g) {
                neighbor.g = ng;
                neighbor.h = neighbor.h || weight * heuristic(abs(x - endX), abs(y - endY));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = node;

                if (!neighbor.opened) {
                    startOpenList.push(neighbor);
                    neighbor.opened = BY_START;
                } else {
                    // the neighbor can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    startOpenList.updateItem(neighbor);
                }
            }
        } // end for each neighbor


        // pop the position of end node which has the minimum `f` value.
        node = endOpenList.pop();
        node.closed = true;

        // get neigbours of the current node
        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened === BY_START) {
                return Util.biBacktrace(neighbor, node);
            }

            x = neighbor.x;
            y = neighbor.y;

            // get the distance between current node and the neighbor
            // and calculate the next g score
            ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

            // check if the neighbor has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbor.opened || ng < neighbor.g) {
                neighbor.g = ng;
                neighbor.h = neighbor.h || weight * heuristic(abs(x - startX), abs(y - startY));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = node;

                if (!neighbor.opened) {
                    endOpenList.push(neighbor);
                    neighbor.opened = BY_END;
                } else {
                    // the neighbor can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    endOpenList.updateItem(neighbor);
                }
            }
        } // end for each neighbor
    } // end while not open list empty

    // fail to find the path
    return [];
};

module.exports = BiAStarFinder;

},{"../core/Heap":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Heap.js","../core/Heuristic":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Heuristic.js","../core/Util":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Util.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BiBestFirstFinder.js":[function(require,module,exports){
var BiAStarFinder = require('./BiAStarFinder');

/**
 * Bi-direcitional Best-First-Search path-finder.
 * @constructor
 * @extends BiAStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 */
function BiBestFirstFinder(opt) {
    BiAStarFinder.call(this, opt);

    var orig = this.heuristic;
    this.heuristic = function(dx, dy) {
        return orig(dx, dy) * 1000000;
    };
}

BiBestFirstFinder.prototype = new BiAStarFinder();
BiBestFirstFinder.prototype.constructor = BiBestFirstFinder;

module.exports = BiBestFirstFinder;

},{"./BiAStarFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BiAStarFinder.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BiBreadthFirstFinder.js":[function(require,module,exports){
var Util = require('../core/Util');

/**
 * Bi-directional Breadth-First-Search path finder.
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function BiBreadthFirstFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
}


/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
BiBreadthFirstFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var startNode = grid.getNodeAt(startX, startY),
        endNode = grid.getNodeAt(endX, endY),
        startOpenList = [], endOpenList = [],
        neighbors, neighbor, node,
        allowDiagonal = this.allowDiagonal,
        dontCrossCorners = this.dontCrossCorners,
        BY_START = 0, BY_END = 1,
        i, l;

    // push the start and end nodes into the queues
    startOpenList.push(startNode);
    startNode.opened = true;
    startNode.by = BY_START;

    endOpenList.push(endNode);
    endNode.opened = true;
    endNode.by = BY_END;

    // while both the queues are not empty
    while (startOpenList.length && endOpenList.length) {

        // expand start open list

        node = startOpenList.shift();
        node.closed = true;

        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened) {
                // if this node has been inspected by the reversed search,
                // then a path is found.
                if (neighbor.by === BY_END) {
                    return Util.biBacktrace(node, neighbor);
                }
                continue;
            }
            startOpenList.push(neighbor);
            neighbor.parent = node;
            neighbor.opened = true;
            neighbor.by = BY_START;
        }

        // expand end open list

        node = endOpenList.shift();
        node.closed = true;

        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened) {
                if (neighbor.by === BY_START) {
                    return Util.biBacktrace(neighbor, node);
                }
                continue;
            }
            endOpenList.push(neighbor);
            neighbor.parent = node;
            neighbor.opened = true;
            neighbor.by = BY_END;
        }
    }

    // fail to find the path
    return [];
};

module.exports = BiBreadthFirstFinder;

},{"../core/Util":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Util.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BiDijkstraFinder.js":[function(require,module,exports){
var BiAStarFinder = require('./BiAStarFinder');

/**
 * Bi-directional Dijkstra path-finder.
 * @constructor
 * @extends BiAStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function BiDijkstraFinder(opt) {
    BiAStarFinder.call(this, opt);
    this.heuristic = function(dx, dy) {
        return 0;
    };
}

BiDijkstraFinder.prototype = new BiAStarFinder();
BiDijkstraFinder.prototype.constructor = BiDijkstraFinder;

module.exports = BiDijkstraFinder;

},{"./BiAStarFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BiAStarFinder.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\BreadthFirstFinder.js":[function(require,module,exports){
var Util = require('../core/Util');

/**
 * Breadth-First-Search path finder.
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function BreadthFirstFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
}

/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
BreadthFirstFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var openList = [],
        allowDiagonal = this.allowDiagonal,
        dontCrossCorners = this.dontCrossCorners,
        startNode = grid.getNodeAt(startX, startY),
        endNode = grid.getNodeAt(endX, endY),
        neighbors, neighbor, node, i, l;

    // push the start pos into the queue
    openList.push(startNode);
    startNode.opened = true;

    // while the queue is not empty
    while (openList.length) {
        // take the front node from the queue
        node = openList.shift();
        node.closed = true;

        // reached the end position
        if (node === endNode) {
            return Util.backtrace(endNode);
        }

        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            // skip this neighbor if it has been inspected before
            if (neighbor.closed || neighbor.opened) {
                continue;
            }

            openList.push(neighbor);
            neighbor.opened = true;
            neighbor.parent = node;
        }
    }
    
    // fail to find the path
    return [];
};

module.exports = BreadthFirstFinder;

},{"../core/Util":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Util.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\DijkstraFinder.js":[function(require,module,exports){
var AStarFinder = require('./AStarFinder');

/**
 * Dijkstra path-finder.
 * @constructor
 * @extends AStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function DijkstraFinder(opt) {
    AStarFinder.call(this, opt);
    this.heuristic = function(dx, dy) {
        return 0;
    };
}

DijkstraFinder.prototype = new AStarFinder();
DijkstraFinder.prototype.constructor = DijkstraFinder;

module.exports = DijkstraFinder;

},{"./AStarFinder":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\AStarFinder.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\finders\\JumpPointFinder.js":[function(require,module,exports){
/**
 * @author aniero / https://github.com/aniero
 */
var Heap       = require('../core/Heap');
var Util       = require('../core/Util');
var Heuristic  = require('../core/Heuristic');

/**
 * Path finder using the Jump Point Search algorithm
 * @param {object} opt
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 */
function JumpPointFinder(opt) {
    opt = opt || {};
    this.heuristic = opt.heuristic || Heuristic.manhattan;
}

/**
 * Find and return the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
JumpPointFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var openList = this.openList = new Heap(function(nodeA, nodeB) {
            return nodeA.f - nodeB.f;
        }),
        startNode = this.startNode = grid.getNodeAt(startX, startY),
        endNode = this.endNode = grid.getNodeAt(endX, endY), node;

    this.grid = grid;


    // set the `g` and `f` value of the start node to be 0
    startNode.g = 0;
    startNode.f = 0;

    // push the start node into the open list
    openList.push(startNode);
    startNode.opened = true;

    // while the open list is not empty
    while (!openList.empty()) {
        // pop the position of node which has the minimum `f` value.
        node = openList.pop();
        node.closed = true;

        if (node === endNode) {
            return Util.backtrace(endNode);
        }

        this._identifySuccessors(node);
    }

    // fail to find the path
    return [];
};

/**
 * Identify successors for the given node. Runs a jump point search in the
 * direction of each available neighbor, adding any points found to the open
 * list.
 * @protected
 */
JumpPointFinder.prototype._identifySuccessors = function(node) {
    var grid = this.grid,
        heuristic = this.heuristic,
        openList = this.openList,
        endX = this.endNode.x,
        endY = this.endNode.y,
        neighbors, neighbor,
        jumpPoint, i, l,
        x = node.x, y = node.y,
        jx, jy, dx, dy, d, ng, jumpNode,
        abs = Math.abs, max = Math.max;

    neighbors = this._findNeighbors(node);
    for(i = 0, l = neighbors.length; i < l; ++i) {
        neighbor = neighbors[i];
        jumpPoint = this._jump(neighbor[0], neighbor[1], x, y);
        if (jumpPoint) {

            jx = jumpPoint[0];
            jy = jumpPoint[1];
            jumpNode = grid.getNodeAt(jx, jy);

            if (jumpNode.closed) {
                continue;
            }

            // include distance, as parent may not be immediately adjacent:
            d = Heuristic.euclidean(abs(jx - x), abs(jy - y));
            ng = node.g + d; // next `g` value

            if (!jumpNode.opened || ng < jumpNode.g) {
                jumpNode.g = ng;
                jumpNode.h = jumpNode.h || heuristic(abs(jx - endX), abs(jy - endY));
                jumpNode.f = jumpNode.g + jumpNode.h;
                jumpNode.parent = node;

                if (!jumpNode.opened) {
                    openList.push(jumpNode);
                    jumpNode.opened = true;
                } else {
                    openList.updateItem(jumpNode);
                }
            }
        }
    }
};

/**
 Search recursively in the direction (parent -> child), stopping only when a
 * jump point is found.
 * @protected
 * @return {Array.<[number, number]>} The x, y coordinate of the jump point
 *     found, or null if not found
 */
JumpPointFinder.prototype._jump = function(x, y, px, py) {
    var grid = this.grid,
        dx = x - px, dy = y - py, jx, jy;

    if (!grid.isWalkableAt(x, y)) {
        return null;
    }
    else if (grid.getNodeAt(x, y) === this.endNode) {
        return [x, y];
    }

    // check for forced neighbors
    // along the diagonal
    if (dx !== 0 && dy !== 0) {
        if ((grid.isWalkableAt(x - dx, y + dy) && !grid.isWalkableAt(x - dx, y)) ||
            (grid.isWalkableAt(x + dx, y - dy) && !grid.isWalkableAt(x, y - dy))) {
            return [x, y];
        }
    }
    // horizontally/vertically
    else {
        if( dx !== 0 ) { // moving along x
            if((grid.isWalkableAt(x + dx, y + 1) && !grid.isWalkableAt(x, y + 1)) ||
               (grid.isWalkableAt(x + dx, y - 1) && !grid.isWalkableAt(x, y - 1))) {
                return [x, y];
            }
        }
        else {
            if((grid.isWalkableAt(x + 1, y + dy) && !grid.isWalkableAt(x + 1, y)) ||
               (grid.isWalkableAt(x - 1, y + dy) && !grid.isWalkableAt(x - 1, y))) {
                return [x, y];
            }
        }
    }

    // when moving diagonally, must check for vertical/horizontal jump points
    if (dx !== 0 && dy !== 0) {
        jx = this._jump(x + dx, y, x, y);
        jy = this._jump(x, y + dy, x, y);
        if (jx || jy) {
            return [x, y];
        }
    }

    // moving diagonally, must make sure one of the vertical/horizontal
    // neighbors is open to allow the path
    if (grid.isWalkableAt(x + dx, y) || grid.isWalkableAt(x, y + dy)) {
        return this._jump(x + dx, y + dy, x, y);
    } else {
        return null;
    }
};

/**
 * Find the neighbors for the given node. If the node has a parent,
 * prune the neighbors based on the jump point search algorithm, otherwise
 * return all available neighbors.
 * @return {Array.<[number, number]>} The neighbors found.
 */
JumpPointFinder.prototype._findNeighbors = function(node) {
    var parent = node.parent,
        x = node.x, y = node.y,
        grid = this.grid,
        px, py, nx, ny, dx, dy,
        neighbors = [], neighborNodes, neighborNode, i, l;

    // directed pruning: can ignore most neighbors, unless forced.
    if (parent) {
        px = parent.x;
        py = parent.y;
        // get the normalized direction of travel
        dx = (x - px) / Math.max(Math.abs(x - px), 1);
        dy = (y - py) / Math.max(Math.abs(y - py), 1);

        // search diagonally
        if (dx !== 0 && dy !== 0) {
            if (grid.isWalkableAt(x, y + dy)) {
                neighbors.push([x, y + dy]);
            }
            if (grid.isWalkableAt(x + dx, y)) {
                neighbors.push([x + dx, y]);
            }
            if (grid.isWalkableAt(x, y + dy) || grid.isWalkableAt(x + dx, y)) {
                neighbors.push([x + dx, y + dy]);
            }
            if (!grid.isWalkableAt(x - dx, y) && grid.isWalkableAt(x, y + dy)) {
                neighbors.push([x - dx, y + dy]);
            }
            if (!grid.isWalkableAt(x, y - dy) && grid.isWalkableAt(x + dx, y)) {
                neighbors.push([x + dx, y - dy]);
            }
        }
        // search horizontally/vertically
        else {
            if(dx === 0) {
                if (grid.isWalkableAt(x, y + dy)) {
                    if (grid.isWalkableAt(x, y + dy)) {
                        neighbors.push([x, y + dy]);
                    }
                    if (!grid.isWalkableAt(x + 1, y)) {
                        neighbors.push([x + 1, y + dy]);
                    }
                    if (!grid.isWalkableAt(x - 1, y)) {
                        neighbors.push([x - 1, y + dy]);
                    }
                }
            }
            else {
                if (grid.isWalkableAt(x + dx, y)) {
                    if (grid.isWalkableAt(x + dx, y)) {
                        neighbors.push([x + dx, y]);
                    }
                    if (!grid.isWalkableAt(x, y + 1)) {
                        neighbors.push([x + dx, y + 1]);
                    }
                    if (!grid.isWalkableAt(x, y - 1)) {
                        neighbors.push([x + dx, y - 1]);
                    }
                }
            }
        }
    }
    // return all neighbors
    else {
        neighborNodes = grid.getNeighbors(node, true);
        for (i = 0, l = neighborNodes.length; i < l; ++i) {
            neighborNode = neighborNodes[i];
            neighbors.push([neighborNode.x, neighborNode.y]);
        }
    }
    
    return neighbors;
};

module.exports = JumpPointFinder;

},{"../core/Heap":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Heap.js","../core/Heuristic":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Heuristic.js","../core/Util":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\src\\core\\Util.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js":[function(require,module,exports){
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var createCallback = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  _.iteratee = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    if (obj == null) return [];
    iteratee = _.iteratee(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== + obj.length && _.keys(obj),
        index = (keys || obj).length,
        currentKey;
    if (arguments.length < 3) {
      if (!index) throw new TypeError(reduceError);
      memo = obj[keys ? keys[--index] : --index];
    }
    while (index--) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    if (obj == null) return false;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = _.iteratee(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(array) {
    if (array == null) return [];
    var length = _.max(arguments, 'length').length;
    var results = Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var idx = array.length;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = hasher ? hasher.apply(this, arguments) : key;
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed before being called N times.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = createCallback(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\10_general-stuff.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, exports*/

var sh = module.exports;

(function() {
    'use strict';
    /**
     * The grid gets subdivided in its width and its height according to this
     * constant.
     * @type {number}
     */
    sh.GRID_SUB = 2;


    /**
     * Vector math.
     * @type {{sub: Function, add: Function, mul: Function, div: Function, equal: Function}}
     */
    sh.v = {
        sub: function(v1, v2) {
            return { x: v1.x - v2.x, y: v1.y - v2.y };
        },
        add: function(v1, v2) {
            return { x: v1.x + v2.x, y: v1.y + v2.y };
        },
        mul: function(v, scalar) {
            return { x: v.x * scalar, y: v.y * scalar};
        },
        div: function(v, scalar) {
            return { x: v.x / scalar, y: v.y / scalar};
        },
        equal: function(v1, v2) {
            if (!v1 || !v2) {
                return false;
            }
            return v1.x === v2.x && v1.y === v2.y;
        },
        map: function(v, fun) {
            return {x: fun(v.x), y: fun(v.y)};
        },
        str: function(v) {
            return '(' + v.x + ', ' + v.y + ')';
        },
        distance: function(v1, v2) {
            return Math.sqrt(Math.pow(v2.x - v1.x, 2) +
                Math.pow(v2.y - v1.y, 2));
        }
    };

    sh.tiles = {
        solid: 's',
        front: 'f',
        back: 'b',
        clear: '.'
    };

    sh.mapNames = [
        'test',
        'cyborg_battleship1',
        'cyborg_cruiser',
        'cyborg_drone',
        'cyborg_frigate',
        'humanoid_battleship',
        'humanoid_cruiser',
        'humanoid_drone',
        'humanoid_frigate',
        'liquid_battleship',
        'liquid_cruiser',
        'liquid_drone',
        'liquid_frigate',
        'mechanoid_battleship',
        'mechanoid_cruiser',
        'mechanoid_drone',
        'mechanoid_frigate'
    ];

    //Object holding references to functions that will be tested.
    sh.forTesting = {};

    //used in testing
    sh.getProperties = function(object) {
        var props = [], p;
        for (p in object) {
            if (object.hasOwnProperty(p)) {
                props.push(p);
            }
        }
        return props;
    };
}());


},{}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\12_utils.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var sh = module.exports,
    _ = require('underscore')._;

/**
 * Utilities
 * @type {{getEmptyMatrix: Function, matrixTiles: Function}}
 * @return {null}
 */
sh.utils = {
    getEmptyMatrix: function(width, height, initialValue) {
        'use strict';
        var matrix = [], i, j;
        for (i = 0; i < height; i++) {
            matrix.push([]);
            for (j = 0; j < width; j++) {
                matrix[i].push(initialValue);
            }
        }
        return matrix;
    },
    //useful when wanting to do something at every coordinate of a matrix
    matrixTiles: function(width, height, callback) { // callback(x, y)
        'use strict';
        var x, y;
        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                callback(x, y);
            }
        }
    },
    convertPosition: function(pos, fromGridSub, toGridSub) {
        'use strict';
        pos.x = pos.x * (toGridSub / fromGridSub);
        pos.y = pos.y * (toGridSub / fromGridSub);
    },
    mapToJson: function(arrayOfObjects) {
        'use strict';
        return _.map(arrayOfObjects, function(o) {
            return o.toJson();
        });
    },
    mapFromJson: function(arrayOfJsons, constructorCollection) {
        'use strict';
        return _.map(arrayOfJsons, function(json) {
            return new constructorCollection[json.type](json);
        });
    },
    removeFromArray: function(item, array) {
        'use strict';
        var index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
        }
    }
};


},{"underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\20_placement-rules.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var sh = module.exports,
    _ = require('underscore')._,
    Map = require('./25_classes/40_map').Map,
    gen = require('./10_general-stuff'),
    tiles = gen.tiles,
    GRID_SUB = gen.GRID_SUB;

/**
 * Library for facilitating configuring the rules for placement for the items.
 * @type {{PlacementRule: Function, make: {spaceRule: Function, nextToRule: Function}, utils: {checkAny: Function, checkAll: Function, checkAnyOrAll: Function}}}
 */
sh.pr = {
    /**
     * A placement rule
     * @param {{tile:{Object}, inAny:{Array}, inAll:{Array}}} settings
     * @constructor
     */
    PlacementRule: function(settings) { //settings: tile, inAny, inAll
        'use strict';
        var wantedTile;
        //sugar for tileSatisfies = function(tile){return tile == <tile>;}
        this.tile = settings.tile;
        this.inAny = settings.inAny;// Array of {x,y} (relative coordinates)
        this.inAll = settings.inAll;// Array of {x,y} (relative coordinates)
        this.tileCondition = settings.tileCondition; // function(tile)
        if (this.tileCondition === undefined && this.tile !== undefined) {
            wantedTile = this.tile;
            this.tileCondition = function(tile) {
                return tile === wantedTile;
            };
        }
        this.compliesAt = function(x, y, map) {
            if (!(map instanceof Map)) {
                throw 'map should be an instance of sh.Map';
            }
            return sh.pr.utils.checkAny(map, this.tileCondition, this.inAny, {
                x: x,
                y: y
            }) && sh.pr.utils.checkAll(map, this.tileCondition, this.inAll, {
                x: x,
                y: y
            });
        };
    },
    make: {
        //has to have enough space
        spaceRule: function(tileCondition, width, height) {
            'use strict';
            var coordArray = [], x, y, settings;
            for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                    coordArray.push({
                        x: x,
                        y: y
                    });
                }
            }
            settings = {
                inAll: coordArray
            };
            if (_.isFunction(tileCondition)) {
                settings.tileCondition = tileCondition;
            } else {
                settings.tile = tileCondition; //tileCondition is just a tile
            }
            return new sh.pr.PlacementRule(settings);
        },
        //has to be next to something
        nextToRule: function(tileCondition, width, height) {
            'use strict';
            var coordArray = [], x, y, settings;
            for (x = 0; x < width; x++) {
                coordArray.push({
                    x: x,
                    y: -1
                }); //top
                coordArray.push({
                    x: x,
                    y: height
                }); //bottom
            }
            for (y = 0; y < height; y++) {
                coordArray.push({
                    x: -1,
                    y: y
                }); //left
                coordArray.push({
                    x: width,
                    y: y
                }); //right
            }
            settings = {
                inAny: coordArray
            };
            if (_.isFunction(tileCondition)) {
                settings.tileCondition = tileCondition;
            } else {
                settings.tile = tileCondition; //tileCondition is just a tile
            }
            return new sh.pr.PlacementRule(settings);
        }
    },
    utils: {
        //check if a tile is at any of the positions in "relativeCoords"
        checkAny: function(tileMap, condition, relativeCoords, currentCoord) {
            'use strict';
            return sh.pr.utils.checkAnyOrAll(tileMap, condition, relativeCoords,
                currentCoord, true);
        },
        //check if a tile is at all of the positions in "relativeCoords"
        checkAll: function(tileMap, condition, relativeCoords, currentCoord) {
            'use strict';
            return sh.pr.utils.checkAnyOrAll(tileMap, condition, relativeCoords,
                currentCoord, false);
        },
        checkAnyOrAll: function(tileMap, tileCondition, relativeCoordinates,
                currentCoord, inAny) {
            'use strict';
            var coor, wantedTileCoord, tileAtCoord;
            if (!relativeCoordinates || relativeCoordinates.length === 0) {
                return true;
            }
            for (coor = 0; coor < relativeCoordinates.length; coor++) {
                wantedTileCoord = relativeCoordinates[coor];
                tileAtCoord = tileMap.at(currentCoord.x + wantedTileCoord.x,
                    currentCoord.y + wantedTileCoord.y);
                if (inAny && tileAtCoord &&
                        tileCondition(tileAtCoord)) {
                    return true;
                }
                if (!inAny && (!tileAtCoord ||
                    !tileCondition(tileAtCoord))) {
                    return false;
                }
            }
            return !inAny;
        }

    }
};

//add prebuilt placement rules for items
(function() {
    'use strict';
    function s(value) {
        return value * GRID_SUB;
    }
    var pr = sh.pr,
        space1x1 = pr.make.spaceRule(tiles.clear, s(1), s(1)),
        space2x1 = pr.make.spaceRule(tiles.clear, s(2), s(1)),
        space1x2 = pr.make.spaceRule(tiles.clear, s(1), s(2)),
        space2x2 = pr.make.spaceRule(tiles.clear, s(2), s(2));

    function and(ruleA, ruleB) {
        return {
            compliesAt: function(x, y, map) {
                return ruleA.compliesAt(x, y, map) &&
                    ruleB.compliesAt(x, y, map);
            }
        };
    }
    function or(ruleA, ruleB) {
        return {
            compliesAt: function(x, y, map) {
                return ruleA.compliesAt(x, y, map) ||
                    ruleB.compliesAt(x, y, map);
            }
        };
    }

    //SPECIAL PLACEMENT RULES FOR ITEMS

    pr.weapon = and(space2x2, new sh.pr.PlacementRule({
        tile: tiles.front,
        inAny: [{
            x: s(2),
            y: s(0)
        }, {
            x: s(2),
            y: s(1)
        }]
    }));

    pr.Engine = and(space2x2, new sh.pr.PlacementRule({
        tile: tiles.back,
        inAll: [{
            x: s(-1),
            y: s(0)
        }, {
            x: s(-1),
            y: s(1)
        }]
    }));

    pr.console = and(space1x1, sh.pr.make.nextToRule(function(tile) {
        return tile.type === 'Weapon' || tile.type === 'Engine' ||
            tile.type === 'Power';
    }, s(1), s(1)));

    pr.door = or(pr.make.spaceRule(function(tile) {
        return tile.type === 'Wall' && tile.isHorizontal();
    }, s(2), s(1)),
        //or...
        and(space2x1,
            //and...
            new pr.PlacementRule({tileCondition: function(tile) {
                return tile.type === 'Wall';
            }, inAll: [{x: s(-1), y: s(0)}, {x: s(2), y: s(0)}]}))
        );

    pr.doorRotated = or(pr.make.spaceRule(function(tile) {
        return tile.type === 'Wall' && tile.isVertical();
    }, s(1), s(2)),
        and(space1x2,
            new pr.PlacementRule({tileCondition: function(tile) {
                return tile.type === 'Wall';
            }, inAll: [{x: s(0), y: s(-1)}, {x: s(0), y: s(2)}]})));
}());

},{"./10_general-stuff":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\10_general-stuff.js","./25_classes/40_map":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\40_map.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\10_shared-class.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module, xyz*/

var sh = module.exports;

(function() {
    'use strict';
    var initializing = false, //for SharedClass
        fnTest = /xyz/.test(function() {xyz;}) ? /\bparent\b/ : /.*/;
    /**
     * JavaScript Inheritance Helper
     * (the same as in melonJS)
     * */
    sh.SharedClass = function() {};
    sh.SharedClass.extendShared = function(prop) {
        // _super rename to parent to ease code reading
        var parent = this.prototype,
            proto,
            name;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        proto = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (name in prop) {
            // Check if we're overwriting an existing function
            proto[name] = typeof prop[name] === 'function' &&
                typeof parent[name] === 'function' &&
                fnTest.test(prop[name]) ? (function(name, fn) {
                    return function() {
                        var tmp = this.parent,
                            ret;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this.parent = parent[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        ret = fn.apply(this, arguments);
                        this.parent = tmp;

                        return ret;
                    };
                }(name, prop[name])) : prop[name];
        }

        // The dummy class constructor
        function Class() {
            if (!initializing && this.init) {
                this.init.apply(this, arguments);
            }
            //return this;
        }
        // Populate our constructed prototype object
        Class.prototype = proto;
        // Enforce the constructor to be what we expect
        Class.constructor = Class;
        // And make this class extendable
        Class.extendShared = sh.SharedClass.extendShared;//arguments.callee;
        Class.extend = function() {
            throw new Error('"extendShared" should be called instead of' +
                ' "extend" on a shared entity.');
        };
        return Class;
    };

    sh.TestSharedEntity = sh.SharedClass.extendShared({});
}());

},{}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\20_jsonable.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var sh = module.exports,
    SharedClass = require('./10_shared-class').SharedClass,
    _ = require('underscore')._;

(function() {
    'use strict';
    sh.Jsonable = SharedClass.extendShared({
        _properties: [],
        /**
         * Sets the properties found in the json param to the object.
         * This properties are later used by toJson to return the json form
         * of the object.
         * @param {{type:string, properties:Array, json:Object}} settings
         */
        setJson: function (settings) {
            var type = settings.type,
                properties = settings.properties,
                json = settings.json;
            if (!json) {
                json = {};
            }
            this.type = type;
            this._properties = this._properties.concat(properties);
            _.each(properties, function (p) {
                if (json[p] === undefined) {
                    return;
                }
                //workaround for nodejs converting numbers in a
                //json string to string when the client sends it to
                // the server.
                //TODO: remove when socket.io is implemented (if it doesn't
                // have this problem)
                if (json._numbers && _.isString(json[p]) &&
                        _.contains(json._numbers, p)) {
                    this[p] = parseFloat(json[p]);
                } else {
                    this[p] = json[p];
                }


            }, this);
        },
        toJson: function () {
            var json = {
                _numbers: [],
                type: this.type
            };
            _.each(this._properties, function (p) {
                json[p] = this[p];
                if (_.isNumber(this[p])) {
                    json._numbers.push(p);
                }
            }, this);
            return json;
        }
    });
}());

},{"./10_shared-class":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\10_shared-class.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\25_player.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module, xyz*/

var sh = module.exports,
    Jsonable = require('./20_jsonable').Jsonable;

(function() {
    'use strict';
    sh.Player = Jsonable.extendShared({
        init: function(json) {
            this.setJson({
                type: 'Player',
                properties: ['id', 'name'],
                json: json
            });
        }
    });
}());

},{"./20_jsonable":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\20_jsonable.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\30_tile-entity.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = module.exports,
    Jsonable = require('./20_jsonable').Jsonable;
/**
 * An object on the ship. (An item, an unit, etc)
 * @type {*}
 */
sh.TileEntity = Jsonable.extendShared({
    id: null, //the ship is in charge of setting the id
    init: function(json) {
        'use strict';
        this.setJson({
            type: 'TileEntity',
            properties: ['id', 'x', 'y'],
            json: json
        });
    },
    //takes rotation into account
    trueSize: function(index) {
        'use strict';
        //(only items can rotate, not units)
        return this.size[index];
    },
    //callback must have x and y. withinSize is optional
    tiles: function(callback, withinSize) {
        'use strict';
        var x, y,
            width = this.trueSize(0),
            height = this.trueSize(1);
        for (x = this.x; x < width + this.x &&
                (!withinSize || x < withinSize.width) && x >= 0; x++) {
            for (y = this.y; y < height + this.y &&
                    (!withinSize || y < withinSize.height) && y >= 0; y++) {
                callback(x, y);
            }
        }
    },
    getTiles: function() {
        'use strict';
        var tiles = [], x, y,
            width = this.trueSize(0),
            height = this.trueSize(1);
        for (x = this.x; x < width + this.x && x >= 0; x++) {
            for (y = this.y; y < height + this.y && y >= 0; y++) {
                tiles.push({x: x, y: y});
            }
        }
        return tiles;
    },
    //returns true is some part of the entity is occupying the tile
    occupies: function(tile) {
        'use strict';
        var x = tile.x, y = tile.y;
        return x >= this.x && x < this.x + this.trueSize(0) &&
            y >= this.y && y < this.y + this.trueSize(1);
    }
});

},{"./20_jsonable":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\20_jsonable.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\32_items.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = module.exports,
    TileEntity = require('./30_tile-entity').TileEntity,
    _ = require('underscore')._,
    pr = require('../20_placement-rules').pr,
    gen = require('../10_general-stuff'),
    GRID_SUB = gen.GRID_SUB,
    tiles = gen.tiles;
/**
 * Represents a component from the ship (Engine, Weapon, etc).
 * @type {*}
 */
sh.Item = TileEntity.extendShared({
    size: [1, 1],
    walkable: false,
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Item',
            properties: [],
            json: json
        });
        if (json) {
            this.rotated(json.r);
            this.ship = json.ship;
        }
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        //default placement rule
        return this.placementRule
            .compliesAt(x, y, ship.map);
    },
    canBuildRotated: function() {//(x, y, ship)
        'use strict';
        //default placement rule
        return false;
    },
    _rotated: false,
    rotated: function(rotated) {
        'use strict';
        if (rotated === undefined) {
            return this._rotated;
        }
        this._rotated = rotated;
        return this;
    },
    //takes rotation into account
    trueSize: function(index) {
        'use strict';
        if (index === undefined) { //can pass an index: 0= width, 1= height
            return this.rotated() ? [this.size[1], this.size[0]] : this.size;
        }
        if (this.rotated()) {
            index = (index === 1) ? 0 : 1; //toggles 1 and 0
        }
        return this.size[index];
    },

    onBuilt: function() {
        'use strict';
        //abstract method
        return null;//for jsLint
    },
    onShip: function(ship) {
        'use strict';
        if (ship === undefined) {
            return this.ship;
        }
        this.ship = ship;
        return this;
    },
    toJson: function() {
        'use strict';
        var json = this.parent();
        json.r = this.rotated();
        return json;
    },
    setSize: function(width, height) {
        'use strict';
        this.size = [width, height];
        this.onSizeChanged();
    },
    onSizeChanged: function() {
        'use strict';
        this.placementRule = pr.make.spaceRule(tiles.clear,
            this.size[0], this.size[1]);
    }
});

/**
 * Enumerates all the concrete item constructors.
 * @type {{}}
 */
sh.items = {};

/**
 * A Weapon.
 * @type {*}
 */
sh.items.Weapon = sh.Item.extendShared({
    chargeTime: 2500,
    damage: 100,
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Weapon',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, 2 * GRID_SUB);
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return pr.weapon.compliesAt(x, y, ship.map);
    }
});

/**
 * An Engine.
 * @type {*}
 */
sh.items.Engine = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Engine',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, 2 * GRID_SUB);
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return pr.Engine.compliesAt(x, y, ship.map);
    }
});

/**
 * Power!
 * @type {*}
 */
sh.items.Power = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Power',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, 2 * GRID_SUB);
    }
});

/**
 * The Console next to the Power, Weapon or Engine.
 * A unit must run these items from the console.
 * @type {*}
 */
sh.items.Console = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Console',
            properties: [],
            json: json
        });
        this.setSize(GRID_SUB, GRID_SUB);
        this.walkable = true;
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return pr.console.compliesAt(x, y, ship.map);
    },
    /**
     * Get the item that is controlled by this console.
     * @return {sh.Item}
     */
    getControlled: function() {
        'use strict';
        var x, y, atTile;
        if (this.controlled) {
            return this.controlled;
        }
        //assign controlled (the item being controlled by this console)
        for (y = this.y + GRID_SUB; y >= this.y - GRID_SUB;
                y -= GRID_SUB) {
            for (x = this.x - GRID_SUB; x <= this.x + GRID_SUB;
                    x += GRID_SUB) {
                atTile = this.ship.itemsMap.at(x, y);
                if (atTile.type === 'Weapon' || atTile.type === 'Engine' ||
                        atTile.type === 'Power') {
                    this.controlled = atTile;
                    return this.controlled;
                }
            }
        }
    }
});

/**
 * Component.
 * @type {*}
 */
sh.items.Component = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Component',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, 2 * GRID_SUB);
    }
});

/**
 * Door. Can be placed on top of a Wall or between two Walls.
 * @type {*}
 */
sh.items.Door = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Door',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, GRID_SUB);
        this.walkable = true;
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return pr.door.compliesAt(x, y, ship.map);
    },
    canBuildRotated: function(x, y, ship) {
        'use strict';
        return pr.doorRotated.compliesAt(x, y, ship.map);
    }
});

/**
 * An individual Wall tile.
 * @type {*}
 */
sh.items.Wall = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Wall',
            properties: [],
            json: json
        });
        this.setSize(GRID_SUB, GRID_SUB);
        this.connected = {
            top: false,
            left: true,
            bottom: false,
            right: true
        };
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return this.parent(x, y, ship) ||
            ship.at(x, y) instanceof sh.items.Wall;
    },
    onBuilt: function() {
        'use strict';

        var top = this.ship.at(this.x, this.y - GRID_SUB),
            left = this.ship.at(this.x - GRID_SUB, this.y),
            bot = this.ship.at(this.x, this.y + GRID_SUB),
            right = this.ship.at(this.x + GRID_SUB, this.y);
        this.updateConnections(top, left, bot, right);
    },
    updateConnections: function(top, left, bot, right) {
        'use strict';
        //modify self and surrounding Walls' connections
        var it = sh.items,
            x = this.x,
            y = this.y;
        //reset
        this.connected.top = false;
        this.connected.left = false;
        this.connected.bottom = false;
        this.connected.right = false;

        if (top instanceof it.Wall) {
            top.connected.bottom = true;
            this.connected.top = true;
        } else if (top instanceof it.Door && top.rotated() &&
                top.y === y - 2 * GRID_SUB) {
            this.connected.top = true;
        }
        if (left instanceof it.Wall) {
            left.connected.right = true;
            this.connected.left = true;
        } else if (left instanceof it.Door && !left.rotated() &&
                left.x === x - 2 * GRID_SUB) {
            this.connected.left = true;
        }
        if (bot instanceof it.Wall) {
            bot.connected.top = true;
            this.connected.bottom = true;
        } else if (bot instanceof it.Door && bot.rotated() &&
                bot.y === y + GRID_SUB) {
            this.connected.bottom = true;
        }
        if (right instanceof it.Wall) {
            right.connected.left = true;
            this.connected.right = true;
        } else if (right instanceof it.Door && !right.rotated() &&
                right.x === x + GRID_SUB) {
            this.connected.right = true;
        }
    },
    isHorizontal: function() {
        'use strict';
        return !this.connected.top && !this.connected.bottom;
        //(because it's the default state)
    },
    isVertical: function() {
        'use strict';
        return !this.connected.left && !this.connected.right &&
            (this.connected.top || this.connected.bottom);
    }
});

/**
 * Weak spot.
 * @type {*}
 */
sh.items.WeakSpot = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'WeakSpot',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, 2 * GRID_SUB);
        this.walkable = true;
    }
});

/**
 * Teleports units that are standing on it.
 * @type {*}
 */
sh.items.Teleporter = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Teleporter',
            properties: [],
            json: json
        });
        this.setSize(GRID_SUB, GRID_SUB);
        this.walkable = true;
    },
    /**
     * This method will be called by the script creator every time something
     * changed. The item's properties should not be changed in this method;
     * the script creator does that through the modelChanges array found in
     * each action.
     * @param {int} turnTime The current time.
     * @param {sh.Battle} battle The battle, representing the entire model
     * @return {Array}
     */
    getActions: function(turnTime, battle) {
        'use strict';
        var self = this,
            actions = [],
            Teleport = require('./60_actions').actions.Teleport;
        this.tiles(function(x, y) {
            _.each(self.ship.unitsMap.at(x, y), function(unit) {
                actions.push(new Teleport({
                    unitID: unit.id,
                    targetShipID: _.find(battle.ships, function(ship) {
                        return ship.id !== self.ship.id;
                    }).id,
                    teleporterID: self.id
                }));
            });
        });
        return actions;
    }
});

},{"../10_general-stuff":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\10_general-stuff.js","../20_placement-rules":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\20_placement-rules.js","./30_tile-entity":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\30_tile-entity.js","./60_actions":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\60_actions.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\34_units.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = module.exports,
    _ = require('underscore')._,
    TileEntity = require('./30_tile-entity').TileEntity,
    UnitOrders = require('./70_orders').UnitOrders,
    items = require('./32_items').items,
    act = require('./60_actions').actions,
    v = require('../10_general-stuff').v;

/**
 * A crew member.
 * @type {*}
 */
sh.Unit = TileEntity.extendShared({
    imgIndex: 0,
    speed: 1, //tiles per second
    maxHP: 100,
    meleeDamage: 20,
    attackCooldown: 500,//time (ms) between each attack
    attackRange: 1,
    imageFacesRight: true,
    blocking: true,//if it slows enemy units passing by
    init: function(json) {
        'use strict';
        this.parent(json);
        this.size = [1, 1];
        this.setJson({
            type: 'Unit',
            properties: ['imgIndex', 'speed', 'maxHP', 'meleeDamage',
                'attackCooldown', 'attackRange', 'imageFacesRight', 'ownerID',
                'chargingShipWeapon', 'teleportSource'],
            json: json
        });
        this.hp = this.maxHP;
        this.inCombat = false;
        this.orders = [];
    },
    makeUnitOrders: function() {
        'use strict';
        var unitOrders = new UnitOrders({
            unitID: this.id
        });
        unitOrders.array = this.orders;
        return unitOrders;
    },
    isAlive: function() {
        'use strict';
        return this.hp > 0;
    },
    getTimeForOneTile: function() {
        'use strict';
        return 1000 / this.speed;
    },
    getTimeForMoving: function(from, to, ship) {
        'use strict';
        var self = this,
            oneTileTime = this.getTimeForOneTile(),
            tileDistance,
            isDiagonal,
            time;
        tileDistance = (function() {
            var a = to.x - from.x,
                b = to.y - from.y;
            if (a === 0) {
                if (b < 0) {
                    return -b;
                }
                return b;
            }
            if (a < 0) {
                return -a;
            }
            return a;
        }());
        isDiagonal = to.x - from.x !== 0 && to.y - from.y !== 0;
        if (isDiagonal) {
            time = tileDistance * oneTileTime * 1.41421356;
        } else {
            time = tileDistance * oneTileTime;
        }
        if (_.any(ship.at(from.x, from.y), function(u) {
                //an enemy blocks
                return u.isAlive() && u.ownerID !== self.ownerID && u.blocking;
            })) {
            //takes 4 times longer
            time *= 4;
        }
        return time;
    },
    getAttackActions: function() {//(turnTime, battle)
        'use strict';
        var actions = [],
            self = this,
            enemiesInRange,
            enemyToAttack;
        if (!this.onCooldown && !this.moving && !this.dizzy) {//attack ready
            enemiesInRange = _.filter(this.ship.units,
                function(u) {
                    return u.isAlive() &&
                        self.isEnemy(u) &&
                        self.isInRange(u);
                });
            if (this.targetID !== null && this.targetID !== undefined) {
                //if targetID is set, it has attack priority
                enemyToAttack = _.where(enemiesInRange,
                    {id: this.targetID})[0] ||
                    enemiesInRange[0];
            } else {
                enemyToAttack = enemiesInRange[0];
            }
            if (enemyToAttack) {
                actions.push(new act.Attack({
                    attackerID: self.id,
                    receiverID: enemyToAttack.id,
                    damage: self.meleeDamage,
                    duration: self.attackCooldown
                }));
            }
        }
        return actions;
    },
    inTeleporter: function() {
        'use strict';
        return this.ship.itemsMap.at(this.x, this.y) instanceof
            items.Teleporter;
    },
    getOrdersActions: function(turnTime, battle) {
        'use strict';
        var actions;
        if (this.orders.length > 0 && !this.inTeleporter()) {
            actions = this.orders[0].getActions(turnTime, battle);
            //if it's not gonna make it,
            //force arrival to the tile at end of turn
            if (turnTime < battle.turnDuration) {
                _.chain(actions)
                    .where({type: 'Move'})
                    .each(function(a) {
                        if (a.duration + turnTime > battle.turnDuration) {
                            a.duration = battle.turnDuration - turnTime;
                        }
                    });
            }
            return actions;
        }
        return [];
    },
    getDamageShipActions: function() {//(turnTime, battle)
        'use strict';
        if (this.ownerID !== this.ship.owner.id &&
                !this.moving &&
                !this.onCooldown && //attack ready
                !this.dizzy &&
                !this.inCombat &&
                this.ship.itemsMap.at(this.x, this.y) instanceof
                    items.WeakSpot) {
            return [new act.DamageShip({
                shipID: this.ship.id,
                unitID: this.id,
                tile: {x: this.x, y: this.y},
                damage: this.meleeDamage,
                cooldown: this.attackCooldown
            })];
        }
        return [];
    },
    /**
     * If it's in a console controlling some ship structure.
     */
    getShipControlActions: function() {//(turnTime, battle)
        'use strict';
        if (this.ownerID !== this.ship.owner.id) {
            return [];
        }
        var standingOn = this.ship.itemsMap.at(this.x, this.y),
            controlled;
        if (standingOn instanceof items.Console) {
            controlled = standingOn.getControlled();
        }
        if (controlled instanceof items.Weapon && !controlled.chargedBy) {
            return [new act.BeginShipWeaponCharge({
                unitID: this.id,
                weaponID: controlled.id,
                chargeTime: controlled.chargeTime
            })];
        }
        return [];
    },
    /**
     * This method will be called by the script creator every time something
     * changed. The unit's properties should not be changed in this method;
     * the script creator does that through the modelChanges array found in
     * each action.
     * @param {int} turnTime The current time.
     * @param {sh.Battle} battle The battle, representing the entire model
     * @return {Array}
     */
    getActions: function(turnTime, battle) {
        'use strict';
        var actions = [],
            shipWeapon;
        if (!this.isAlive()) {
            return [];
        }
        //turn start reset
        if (turnTime === 0 && !this.moving) {
            this.blocking = true;
        }
        if (!this.chargingShipWeapon) {
            actions = actions.concat(this.getAttackActions(turnTime, battle));
            if (actions.length === 0) {//damage ship only if it didn't attack
                actions = actions.concat(this.getDamageShipActions(turnTime,
                    battle));
            }
            if (!this.distracted) {
                actions = actions.concat(
                    this.getShipControlActions(turnTime, battle)
                );
            }
        } else {
            shipWeapon = this.ship.getItemByID(
                this.chargingShipWeapon.weaponID
            );
            if (turnTime >= this.chargingShipWeapon.startingTime +
                    shipWeapon.chargeTime) {
                actions.push(new act.FireShipWeapon({
                    unitID: this.id,
                    weaponID: this.chargingShipWeapon.weaponID,
                    targetID: battle.getEnemyShips(this.ownerID)[0].id
                }));
            }
        }
        actions = actions.concat(this.getOrdersActions(turnTime, battle));

        return actions;
    },
    isEnemy: function(unit) {
        'use strict';
        return unit.ownerID !== this.ownerID;
    },
    isInRange: function(unit) {
        'use strict';
        return v.distance(unit, this) <= this.attackRange;
    },
    cancelShipWeaponFire: function() {
        'use strict';
        var weapon;
        if (this.chargingShipWeapon) {
            weapon = this.ship.getItemByID(this.chargingShipWeapon.weaponID);
            weapon.chargedBy = null;
            this.chargingShipWeapon = null;
        }
    }

});

/**
 * All the different types of units.
 */
sh.units = (function() {
    'use strict';
    var u = {};
    u.Zealot = sh.Unit.extendShared({
        init: function(json) {
            this.imgIndex = 0;
            this.speed = 2;
            this.maxHP = 100;
            this.attackCooldown = 800;
            this.meleeDamage = 20;
            this.attackRange = 3;
            this.parent(json);
            this.setJson({
                type: 'Zealot',
                properties: [],
                json: json
            });
        },
        getAttackActions: function(turnTime, battle) {
            return _.map(this.parent(turnTime, battle), function(action) {
                action.damageDelay = 300;
                return action;
            });
        }
    });
    u.Critter = sh.Unit.extendShared({
        init: function(json) {
            this.imgIndex = 5;
            this.speed = 1;
            this.maxHP = 50;
            this.attackCooldown = 420;
            this.meleeDamage = 8;
            this.imageFacesRight = false;
            this.parent(json);
            this.setJson({
                type: 'Critter',
                properties: [],
                json: json
            });
        }
    });
    u.MetalSpider = sh.Unit.extendShared({
        init: function(json) {
            this.imgIndex = 28;
            this.speed = 3;
            this.maxHP = 160;
            this.attackCooldown = 1500;
            this.meleeDamage = 25;
            this.imageFacesRight = false;
            this.parent(json);
            this.setJson({
                type: 'MetalSpider',
                properties: [],
                json: json
            });
        }
    });
    return u;
}());

},{"../10_general-stuff":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\10_general-stuff.js","./30_tile-entity":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\30_tile-entity.js","./32_items":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\32_items.js","./60_actions":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\60_actions.js","./70_orders":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\70_orders.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\40_map.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = module.exports,
    _ = require('underscore')._,
    SharedClass = require('./10_shared-class').SharedClass,
    utils = require('../12_utils').utils;

/**
 * An Array2d.
 * @type {*}
 */
sh.Map = SharedClass.extendShared({
    init: function(raw) {
        'use strict';
        //check consistent width
        var i, width;
        if (!raw) {
            throw 'raw parameter mandatory.';
        }
        width = raw[0].length;
        for (i = raw.length - 2; i >= 0; i--) {
            if (raw[i].length !== width) {
                throw 'the raw map has not consistent width';
            }
        }
        this.width = width;
        this.height = raw.length;
        this.raw = raw;
    },
    clear: function() {
        'use strict';
        var raw = this.raw;
        this.tiles(function(x, y) {
            raw[y][x] = 0;
        });
    },
    set: function(x, y, value) {
        'use strict';
        if (this.isInBounds(x, y)) {
            this.raw[y][x] = value;
        } else {
            throw 'Cannot set map at ' + x + ',' + y + ': out of bounds.';
        }
    },
    at: function(x, y) {
        'use strict';
        return this.raw[y] !== undefined ? this.raw[y][x] : undefined;
    },
    isInBounds: function(x, y) {
        'use strict';
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    },
    tiles: function(callback) {
        'use strict';
        var y, x;
        for (y = this.height - 1; y >= 0; y--) {
            for (x = this.width - 1; x >= 0; x--) {
                callback(x, y);
            }
        }
    },
    /**
     * Makes the map twice as large, three times at large, etc, according to
     * the multiplier.
     * @param {int} multiplier
     */
    scale: function(multiplier) {
        'use strict';
        var newMap = [],
            i,
            j;
        if (multiplier === 1) {
            return this;
        }
        _.each(this.raw, function(row, y) {
            y *= multiplier;
            for (i = 0; i < multiplier; i++) {
                newMap.push([]);//add <multiplier> rows for each row
            }
            _.each(row, function(tile, x) {
                x *= multiplier;
                for (i = 0; i < multiplier; i++) {
                    for (j = 0; j < multiplier; j++) {
                        newMap[y + i][x + j] = tile;
                    }
                }
            });
        });
        this.raw = newMap;
        this.width = newMap[0].length;
        this.height = newMap.length;
        return this;
    }
});

/**
 * A map of sh.TileEntity (which have x and y position)
 * @type {*}
 */
sh.EntityMap = sh.Map.extendShared({
    init: function(width, height, entityArray) {
        'use strict';
        this.parent(utils.getEmptyMatrix(width, height, 0));
        this.changed = true;
        this.entities = entityArray;
        this.update();
    },
    update: function() {
        'use strict';
        var self = this;
        this.clear();
        _.each(this.entities, function(e) {
            e.tiles(function(x, y) {
                self.set(x, y, e);
            }, self);
        });
        this.changed = true;
    }
});

/**
 * Each tile holds an array of entities.
 * @type {*}
 */
sh.EntityMap3d = sh.Map.extendShared({
    init: function(width, height, entityArray) {
        'use strict';
        this.parent(utils.getEmptyMatrix(width, height, 0));
        this.changed = true;
        this.entities = entityArray;
        this.update();
    },
    update: function() {
        'use strict';
        var self = this;
        this.clear();
        _.each(this.entities, function(e) {
            e.tiles(function(x, y) {
                if (!self.at(x, y)) {
                    self.set(x, y, []);
                }
                self.at(x, y).push(e);
            }, self);
        });
        this.changed = true;
    }
});

/**
 * A group of maps. The at function returns the last map that
 * has something in position (parameter) that is other than 0.
 * @type {*}
 */
sh.CompoundMap = sh.Map.extendShared({
    init: function(maps) {
        'use strict';
        if (!maps) {
            throw 'maps parameter mandatory.';
        }
        //check sizes
        (function() {
            var width = maps[0].width,
                height = maps[0].height,
                i;
            for (i = 1; i < maps.length; i++) {
                if (maps[i].width !== width ||
                        maps[i].height !== height) {
                    throw 'Maps for Compound should be the same size.';
                }
            }
        }());
        this.width = maps[0].width;
        this.height = maps[0].height;
        this.maps = maps;
    },
    at: function(x, y) {
        'use strict';
        var i, what;
        for (i = this.maps.length - 1; i >= 0; i--) {
            what = this.maps[i].at(x, y);
            if (what) {
                return what;
            }
        }
        return null;
    }
});


},{"../12_utils":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\12_utils.js","./10_shared-class":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\10_shared-class.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\50_ship.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module, hullMaps*/

var sh = module.exports,
    _ = require('underscore')._,
    SharedClass = require('./10_shared-class').SharedClass,
    maps = require('./40_map'),
    gen = require('../10_general-stuff'),
    GRID_SUB = gen.GRID_SUB,
    tiles = gen.tiles,
    items = require('./32_items').items,
    utils = require('../12_utils').utils,
    Player = require('./25_player').Player,
    Unit = require('./34_units').Unit,
    units = require('./34_units').units,
    Item = require('./32_items').Item,
    orders = require('./70_orders').orders;

/**
 * A ship.
 * @type {*}
 */
sh.Ship = SharedClass.extendShared({
    id: null,
    owner: null,
    hullMap: {},
    itemsMap: {},
    hp: 2000,
    init: function(settings) {
        'use strict';
        if (!settings.tmxName && !settings.json) {
            throw 'Ship settings must have tmxName or jsonData';
        }
        if (settings.json) {
            this.tmxName = settings.json.tmxName;
        } else {
            this.tmxName = settings.tmxName;
        }
        this.loadMap();
        //Array of items built
        this.built = [];
        this.itemsMap = new maps.EntityMap(this.width, this.height,
            this.built);
        this.units = [];
        this.unitsMap = new maps.EntityMap3d(this.width, this.height,
            this.units);
        this.map = new maps.CompoundMap([
            new maps.Map(this.hullMap).scale(GRID_SUB), this.itemsMap,
            this.unitsMap
        ]);
        if (settings.json) {
            this.fromJson(settings.json);
        }
    },
    loadMap: function() {
        'use strict';
        var hull;
        if (!hullMaps) {
            throw 'hullMaps global object not found';
        }
        hull = hullMaps[this.tmxName.toLowerCase()];
        if (!hull) {
            throw 'hullMap "' + this.tmxName.toLowerCase() + '" not found';
        }
        this.hullMap = hull.map;
        this.width = hull.width * GRID_SUB;
        this.height = hull.height * GRID_SUB;
    },
    //this should be called when the user builds something
    buildAt: function(x, y, buildingType) {
        'use strict';
        var self, building, canBuild, canBuildRotated;
        self = this;
        if (!items[buildingType]) {
            throw 'No such item type "' + buildingType + '".';
        }
        building = new items[buildingType]({});
        canBuild = building.canBuildAt(x, y, this);
        if (!canBuild) {
            canBuildRotated = building.canBuildRotated(x, y, this);
            if (canBuildRotated) {
                building.rotated(true);
            }
        }
        if (canBuild || canBuildRotated) {
            building.x = x;
            building.y = y;
            //remove anything in its way
            building.tiles(function(iX, iY) {
                self.removeAt(iX, iY);
            }, this);
            this.addItem(building);
            building.onBuilt();
            return building; //building successful
        }
        return null; //building failed
    },
    //finds a clear spot and creates a new unit there
    putUnit: function(unit, position) {
        'use strict';
        //find empty spot
        var empty = null, ship = this;
        if (!position) {
            position = {//center of the ship
                x: Math.floor(ship.width / 2),
                y: Math.floor(ship.height / 2)
            };
        }
        empty = this.closestTile(position.x, position.y,
            function(tile) {
                return tile === tiles.clear;
            });
        utils.matrixTiles(ship.width, ship.height,
            function(x, y) {
                if (empty) {
                    return;
                }
                if (ship.at(x, y) === tiles.clear) {
                    empty = {x: x, y: y};
                }
            });
        unit.x = empty.x;
        unit.y = empty.y;
        if (unit.ownerID === undefined) {
            unit.ownerID = this.owner.id;
        }
        this.addUnit(unit);
        return unit;
    },
    /**
     * Finds the closest position to x, y that satisfies the condition
     * for the tile at that position.
     * It searches the map in a spiral fashion from the starting tile.
     * @param {int} x
     * @param {int} y
     * @param {Function} condition
     * @return {{x: int, y: int}}
     */
    closestTile: function(x, y, condition) {
        'use strict';
        var squareWidth = 1,
            going = 'right',
            direction,
            i,
            widthTimes2,
            heightTimes2;
        if (condition(this.map.at(x, y))) {
            return {x: x, y: y};
        }
        widthTimes2 = this.width * 2;
        heightTimes2 = this.height * 2;
        do {
            //change direction
            switch (going) {
            case 'down':
                going = 'left';
                direction = [-1, 0];
                break;
            case 'left':
                going = 'up';
                direction = [0, -1];
                break;
            case 'up':
                going = 'right';
                direction = [1, 0];
                break;
            case 'right':
                going = 'down';
                direction = [0, 1];
                //move to next outer square
                squareWidth += 2;
                x++;
                y--;
                break;
            }
            //traverse one side
            for (i = 0; i < squareWidth - 1; i++) {
                x += direction[0];
                y += direction[1];
                if (condition(this.map.at(x, y))) {
                    return {x: x, y: y};
                }
            }
        } while (squareWidth < widthTimes2 && squareWidth < heightTimes2);
        //didn't find any
        return null;
    },
    //Adds an item to the ship ignoring its placement rules
    addItem: function(item) {
        'use strict';
        if (item.id === undefined || item.id === null) {
            this.assignItemID(item);
        }
        this.built.push(item);
        item.onShip(this);
        this.buildingsChanged();
    },
    assignItemID: function(item) {
        'use strict';
        if (this.built.length === 0) {
            item.id = 1;
            return;
        }
        item.id = _.max(this.built, function(e) {
            return e.id;
        }).id + 1;
    },
    addUnit: function(unit) {
        'use strict';
        if (unit.id === undefined || unit.id === null) {
            this.battle.assignUnitID(unit);
        }
        this.units.push(unit);
        unit.ship = this;
        this.unitsMap.update();
    },
    getUnitByID: function(id) {
        'use strict';
        return _.find(this.units, function(u) {
            return u.id === parseInt(id, 10);
        });
    },
    getItemByID: function(id) {
        'use strict';
        return _.find(this.built, function(b) {
            return b.id === parseInt(id, 10);
        });
    },
    getPlayerUnits: function(playerID) {
        'use strict';
        return _.filter(this.units, function(unit) {
            return unit.ownerID === playerID;
        });
    },
    removeAt: function(x, y) {
        'use strict';
        //remove while is not string (is an item or unit)
        while (!(_.isString(this.at(x, y)))) {
            this.remove(this.at(x, y), true);
        }
    },
    remove: function(item, updateBuildings) {
        'use strict';
        var index;
        if (!item) {
            return;
        }
        if (updateBuildings === undefined) {
            updateBuildings = true; //updates by default
        }
        index = _.indexOf(this.built, item);
        this.built.splice(index, 1);
        if (updateBuildings) {
            this.buildingsChanged();
        }
    },
    removeAll: function() {
        'use strict';
        var self = this,
            i;
        for (i = this.built.length - 1; i >= 0; i--) {
            self.remove(this.built[i], false);
        }
        this.buildingsChanged();
    },
    removeUnit: function(unit) {
        'use strict';
        var index = _.indexOf(this.units, unit);
        this.units.splice(index, 1);
        this.unitsMap.update();
    },
    //to call whenever buildings change
    buildingsChanged: function() {
        'use strict';
        this.itemsMap.update();
        this.onBuildingsChanged();
    },
    onBuildingsChanged: function() {
        'use strict';
        return 0;
    },
    at: function(x, y) {
        'use strict';
        return this.map.at(x, y);
    },
    hasUnits: function(position) {
        'use strict';
        return this.unitsMap.at(position.x, position.y);
    },
    isInside: function(x, y) {
        'use strict';
        var tile = this.at(x, y);
        return tile !== tiles.solid && tile !== tiles.front &&
            tile !== tiles.back;
    },
    toJson: function() {
        'use strict';
        return {
            'tmxName': this.tmxName,
            'id': this.id,
            'hp': this.hp,
            'owner': this.owner ? this.owner.toJson() : null,
            'buildings': utils.mapToJson(this.built),
            'units': utils.mapToJson(this.units),
            'GRID_SUB': GRID_SUB
        };
    },
    fromJson: function(json) {
        'use strict';
        var ship = this,
            jsonGridSub;
        if (json.id !== undefined) {
            this.id = parseInt(json.id, 10);
        }
        if (json.hp !== undefined) {
            this.hp = parseInt(json.hp, 10);
        }
        this.owner = new Player(json.owner);
        if (json.GRID_SUB !== undefined) {
            jsonGridSub = parseInt(json.GRID_SUB, 10);
        } else {
            jsonGridSub = 1;
        }
        ship.removeAll();
        if (GRID_SUB !== jsonGridSub) {
            console.warn('GRID_SUB from json differs from current GRID_SUB,' +
                ' the values will be converted.');
        }
        _.each(json.buildings, function(b) {
            if (GRID_SUB !== jsonGridSub) {
                utils.convertPosition(b, jsonGridSub, GRID_SUB);
            }
            ship.addItem(new items[b.type](b));
        });
        _.each(json.units, function(u) {
            if (u.type === 'Unit') {//is generic unit
                ship.addUnit(new Unit(u));
            } else { //is specific unit
                ship.addUnit(new units[u.type](u));
            }
        });
        this.buildingsChanged();
    },
    getPfMatrix: function() {
        'use strict';
        var ship = this,
            pfMatrix = utils.getEmptyMatrix(this.width, this.height, 1);
        ship.map.tiles(function(x, y) {
            if (ship.isWalkable(x, y)) {
                pfMatrix[y][x] = 0;
            }
        });
        return pfMatrix;
    },
    isWalkable: function(x, y) {
        'use strict';
        var tile = this.map.at(x, y);
        //clear tiles and units are walkable
        return tile === tiles.clear || this.hasUnits({x: x, y: y}) ||
            (tile instanceof Item && tile.walkable);
    },
    endOfTurnReset: function(turnDuration) {
        'use strict';
        var self = this,
            i,
            unit;
        for (i = 0; i < this.units.length; i++) {
            unit = this.units[i];
            if (!unit.isAlive()) {
                self.removeUnit(unit);
                i--;
            } else {
                if (unit.chargingShipWeapon) {
                    unit.chargingShipWeapon.startingTime -= turnDuration;
                }
                unit.distracted = false;
                unit.teleported = false;
            }
        }
        this.unitsMap.update();
    },
    getValidOrderForPos: function(unit, pos) {
        'use strict';
        var stuff = this.map.at(pos.x, pos.y),
            enemies,
            order;
        if (_.isArray(stuff)) {
            enemies = _.filter(stuff, function(u) {
                return u instanceof Unit && u.isEnemy(unit);
            });
            if (enemies.length > 0) {
                order = new orders.SeekAndDestroy({
                    unitID: unit.id,
                    targetID: enemies[0].id
                });
            }
        } else {
            if (stuff instanceof items.Console) {
                order = new orders.MoveToConsole({
                    unitID: unit.id,
                    destination: {x: pos.x, y: pos.y}
                });
            } else if (this.isWalkable(pos.x, pos.y)) {
                order = new orders.Move({
                    unitID: unit.id,
                    destination: {x: pos.x, y: pos.y}
                });
            }
        }
        if (order && order.isValid(this, unit.ownerID)) {
            return order;
        }
        return null;
    }
});


},{"../10_general-stuff":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\10_general-stuff.js","../12_utils":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\12_utils.js","./10_shared-class":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\10_shared-class.js","./25_player":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\25_player.js","./32_items":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\32_items.js","./34_units":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\34_units.js","./40_map":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\40_map.js","./70_orders":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\70_orders.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\55_battle.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/
var sh = module.exports,
    Jsonable = require('./20_jsonable').Jsonable,
    _ = require('underscore')._,
    actions = require('./60_actions').actions,
    Ship = require('./50_ship').Ship,
    Player = require('./25_player').Player,
    OrderCollection = require('./70_orders').OrderCollection,
    utils = require('../12_utils').utils;

/**
 * A battle.
 */
sh.Battle = Jsonable.extendShared({
    ships: [],
    arbiter: {//actor that declares a winner
        type: 'Arbiter',
        getActions: function(turnTime, battle) {
            'use strict';
            if (battle.winner !== undefined) {
                return [];//winner already declared
            }
            var shipsByStatus = _.groupBy(battle.ships, function(ship) {
                return ship.hp <= 0 ? 'destroyed' : 'alive';
            }),
                unitsByPlayer;

            if (shipsByStatus.destroyed) {
                if (shipsByStatus.alive) {
                    return [new actions.DeclareWinner({
                        playerID: shipsByStatus.alive[0].owner.id
                    })];
                }
                //all ships destroyed... (draw?)
            }

            //Lose when player has no units left.
            unitsByPlayer = _.chain(battle.getUnits())
                .filter(function(u) {return u.isAlive(); })
                .groupBy('ownerID').value();

            if (_.size(unitsByPlayer) === 1) {
                return [new actions.DeclareWinner({
                    playerID: parseInt(_.keys(unitsByPlayer)[0], 10)
                })];
            }

            return [];
        }
    },
    init: function(json) {
        'use strict';
        this.setJson({
            type: 'Battle',
            properties: ['id', 'turnDuration', 'winner'],
            json: json
        });
        this.ships = _.map(json.ships, function(shipJson) {
            var ship = new Ship({json: shipJson});
            ship.battle = this;
            return ship;
        }, this);
        this.players = _.map(json.players, function(playerJson) {
            return new Player(playerJson);
        });
        this.pendingActions = [];
        this.orderCollection = new OrderCollection();
    },
    toJson: function() {
        'use strict';
        var json = this.parent();
        json.ships = utils.mapToJson(this.ships);
        json.players = utils.mapToJson(this.players);
        return json;
    },
    addShip: function(ship) {
        'use strict';
        ship.battle = this;
        ship.id = this.ships.length + 1;
        this.ships.push(ship);
    },
    getShipByID: function(id) {
        'use strict';
        return _.findWhere(this.ships, {id: id});
    },
    getPlayers: function() {
        'use strict';
        return _.pluck(this.ships, 'owner');
    },
    /**
     *@return Array Objects that have the .getActions method.
     */
    getActors: function() {
        'use strict';
        var actors = this.getUnits();
        actors = actors.concat(_.filter(this.getItems(), function(item) {
            return item.getActions !== undefined;
        }));
        actors.push(this.arbiter);
        return actors;
    },
    getUnits: function() {
        'use strict';
        return _.flatten(_.pluck(this.ships, 'units'));
    },
    getItems: function() {
        'use strict';
        return _.flatten(_.pluck(this.ships, 'built'));
    },
    getUnitByID: function(id) {
        'use strict';
        id = parseInt(id, 10);
        return _.findWhere(this.getUnits(), {id: id});
    },
    assignUnitID: function(unit) {
        'use strict';
        var units = this.getUnits();
        if (units.length === 0) {
            unit.id = 1;
            return;
        }
        unit.id = _.max(units, function(e) {
            return e.id;
        }).id + 1;
    },
    /**
     * Gets the orders from all the units as an sh.OrderCollection
     * @return {sh.OrderCollection}
     */
    extractOrders: function() {
        'use strict';
        return this.orderCollection;
    },
    /**
     * Distribute the orders among the units.
     * @param {sh.OrderCollection} orderCollection
     */
    insertOrders: function(orderCollection) {
        'use strict';
        var self = this;
        _.each(orderCollection.allUnitOrders, function(unitOrders) {
            self.addUnitOrders(unitOrders);
        });
    },
    addUnitOrders: function(unitOrders) {
        'use strict';
        this.orderCollection.addUnitOrders(unitOrders);
        this.getUnitByID(unitOrders.unitID).orders = unitOrders.array;
    },
    endOfTurnReset: function() {
        'use strict';
        _.invoke(this.ships, 'endOfTurnReset', this.turnDuration);
        //remove orders from dead units
        _.each(this.orderCollection.allUnitOrders, function(unitOrders) {
            if (!this.getUnitByID(unitOrders.unitID)) {
                delete this.orderCollection.allUnitOrders[unitOrders.unitID];
            }
        }, this);
    },
    getPlayerShips: function(playerID) {
        'use strict';
        return _.filter(this.ships, function(ship) {
            return ship.owner.id === playerID;
        });
    },
    getEnemyShips: function(playerID) {
        'use strict';
        return _.filter(this.ships, function(ship) {
            return ship.owner.id !== playerID;
        });
    }
});

},{"../12_utils":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\12_utils.js","./20_jsonable":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\20_jsonable.js","./25_player":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\25_player.js","./50_ship":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\50_ship.js","./60_actions":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\60_actions.js","./70_orders":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\70_orders.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\60_actions.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = module.exports,
    _ = require('underscore')._,
    Jsonable = require('./20_jsonable').Jsonable,
    v = require('../10_general-stuff').v;

(function() {
    'use strict';
    var ModelChange;

    /**
     * A point in time in the Script in which a change in the model happens.
     * Each action has a modelChanges Array,
     * with the model changes made by that action.
     * @param {int} timeOffset The time in ms in which this change occurs,
     * relative to the action's time.
     * @param {Function} apply The function that would change stuff around.
     * @param {Action} action The action that originated the model change.
     * @param {Action} label The model change label. Useful to have to animate.
     * @constructor
     */
    ModelChange = function(timeOffset, apply, action, label) {
        this.type = 'ModelChange[' + action.type + ':' + label + ']';
        if (timeOffset < 0) {
            throw 'ModelChange timeOffset can\'t be negative';
        }
        this.timeOffset = timeOffset;
        this.label = label;
        this.apply = function(battle) {
            apply(battle);
        };
        this.action = action;
        this.updateTime();
    };
    ModelChange.prototype.updateTime = function() {
        this.time = this.action.time + this.timeOffset;
    };
    sh.ModelChange = ModelChange;

    /**
     * A point in time in the Script in which an action happens.
     * Whereas ModelChange represents a raw change in the model,
     * the action describes why those changes occurred.
     * Example:
     * If I have the action "Attack" , the change in the model from that attack
     * is that some unit loses health.
     * @type {*|extendShared}
     */
    sh.Action = Jsonable.extendShared({
        time: 0,//ms
        modelChanges: [],
        init: function(json) {
            this.setJson({
                type: 'Action',
                properties: ['time'],
                json: json
            });
        },
        /**
         * Sets the time updating the model changes;
         * @param {int} time
         */
        setTime: function(time) {
            this.time = time;
            _.invoke(this.modelChanges, 'updateTime');
        },
        /**
         * Set the action's model changes.
         * @param {Array.<{offset:int, label:string, changer:Function}>} changeArray
         * an array of changes.
         */
        setChanges: function(changeArray) {
            this.modelChanges = [];
            _.each(changeArray, function(c) {
                this.modelChanges.push(new ModelChange(c.offset,
                    c.changer, this, c.label));
            }, this);
        },
        toString: function() {
            return this.time + 'ms: ' + this.type;
        }
    });

    sh.actions = {};

    /**
     * The unit changes tiles.
     * @type {*}
     */
    sh.actions.Move = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'Move',
                properties: ['unitID', 'from', 'to', 'duration'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        if (unit && unit.isAlive()) {
                            unit.moving = {
                                dest: self.to,
                                arrivalTime: self.time + self.duration
                            };
                            unit.blocking = false;
                            //cancel weapon charging
                            unit.cancelShipWeaponFire();
                        }
                    }
                },
                {
                    offset: self.duration,
                    label: 'arrive',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            prev;
                        if (unit && unit.isAlive() && !unit.teleported) {
                            prev = {x: unit.x, y: unit.y};
                            unit.y = self.to.y;
                            unit.x = self.to.x;
                            unit.moving = null;
                            unit.dizzy = true;//can't attack if just got there
                            unit.moveLock = null;
                            if (!v.equal(prev, self.to)) {
                                unit.ship.unitsMap.update();
                            }
                            //cancel weapon charging
                            unit.cancelShipWeaponFire();
                        }
                    }
                },
                {
                    offset: self.duration + 100,
                    label: 'undizzy',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        if (unit && unit.isAlive()) {
                            unit.dizzy = false;//now it can attack
                        }
                    }
                }
            ]);
        },
        toString: function() {
            return this.time + 'ms: Move ' + this.unitID + ' to ' +
                v.str(this.to);
        }
    });

    sh.actions.Attack = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            if (!json.damageDelay) {
                json.damageDelay = 0;
            }
            this.setJson({
                type: 'Attack',
                properties: ['attackerID', 'receiverID', 'damage', 'duration',
                    'damageDelay'],
                json: json
            });
            if (this.damageDelay > this.duration) {
                throw 'Attack action\'s damage delay can\'t be more than the ' +
                    'duration';
            }
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var attacker = battle.getUnitByID(self.attackerID);
                        attacker.onCooldown = true;
                    }
                },
                {
                    offset: self.damageDelay,
                    label: 'hit',
                    changer: function(battle) {
                        var attacker = battle.getUnitByID(self.attackerID),
                            receiver = battle.getUnitByID(self.receiverID);
                        if (attacker && attacker.isAlive() &&
                                receiver && receiver.isAlive()) {
                            receiver.hp -= self.damage;
                            //cancel weapon charging
                            receiver.cancelShipWeaponFire();
                            receiver.distracted = true;
                        }
                    }
                },
                {
                    offset: self.duration,
                    label: 'cooldown complete',
                    changer: function(battle) {
                        var attacker = battle.getUnitByID(self.attackerID);
                        if (attacker) {
                            attacker.onCooldown = false;
                        }
                    }
                }
            ]);
        },
        toString: function() {
            return this.time + 'ms: Attack ' + this.attackerID + ' -> ' +
                this.receiverID;
        }
    });

    sh.actions.DamageShip = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'DamageShip',
                properties: ['shipID', 'unitID', 'tile', 'damage', 'cooldown'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            ship = battle.getShipByID(self.shipID);
                        unit.onCooldown = true;
                        ship.hp -= self.damage;
                    }
                },
                {
                    offset: self.cooldown,
                    label: 'cooldown complete',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        if (unit) {
                            unit.onCooldown = false;
                        }
                    }
                }
            ]);
        },
        toString: function() {
            return this.time + 'ms: DamageShip, damage: ' + this.damage;
        }
    });

    sh.actions.DeclareWinner = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'DeclareWinner',
                properties: ['playerID'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        battle.winner = self.playerID;
                    }
                }
            ]);
        }
    });

    sh.actions.SetUnitProperty = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'SetUnitProperty',
                properties: ['unitID', 'property', 'value'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        unit[self.property] = self.value;
                    }
                }
            ]);
        },
        toString: function() {
            return this.time + 'ms: SetUnitProperty (' + this.unitID + '): ' +
                this.property + ' = ' + this.value;
        }
    });

    sh.actions.FinishOrder = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'FinishOrder',
                properties: ['unitID'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        unit.orders.shift();
                        battle.addUnitOrders(unit.makeUnitOrders());
                    }
                }
            ]);
        }
    });

    sh.actions.BeginShipWeaponCharge = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'BeginShipWeaponCharge',
                properties: ['unitID', 'weaponID', 'chargeTime'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            ship = unit.ship,
                            weapon = ship.getItemByID(self.weaponID);
                        unit.chargingShipWeapon = {
                            weaponID: self.weaponID,
                            startingTime: self.time
                        };
                        weapon.chargedBy = unit;
                    }
                },
                {
                    offset: self.chargeTime,
                    label: 'end',
                    changer: function() {//(battle)
                        //empty function: this change is here
                        //to trigger a getActions call from the
                        //unit responsible for firing.
                        return null;//for jsLint
                    }
                }
            ]);
        }
    });

    sh.actions.FireShipWeapon = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'FireShipWeapon',
                properties: ['unitID', 'weaponID', 'targetID'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [];
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        unit.cancelShipWeaponFire();
                    }
                },
                {
                    offset: 800,
                    label: 'hit',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            shooterShip = unit.ship,
                            damagedShip = battle.getShipByID(self.targetID);
                        damagedShip.hp -= shooterShip
                            .getItemByID(self.weaponID).damage;
                    }
                }
            ]);
        }
    });

    sh.actions.Teleport = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'Teleport',
                properties: ['unitID', 'targetShipID', 'teleporterID'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            sourceShipID = unit.ship.id,
                            targetShip = battle.getShipByID(self.targetShipID);
                        unit.orders = [];
                        battle.addUnitOrders(unit.makeUnitOrders());
                        unit.ship.removeUnit(unit);
                        targetShip.putUnit(unit);
                        unit.teleported = true;
                        unit.teleportSource = {
                            teleporterID: self.teleporterID,
                            shipID: sourceShipID
                        };
                    }
                }
            ]);
        }
    });

    sh.actions.Recall = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'Recall',
                properties: ['unitID'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            sourceShip = battle
                                .getShipByID(unit.teleportSource.shipID),
                            teleporter = sourceShip
                                .getItemByID(unit.teleportSource.teleporterID);
                        unit.orders = [];
                        battle.addUnitOrders(unit.makeUnitOrders());
                        unit.ship.removeUnit(unit);
                        sourceShip.putUnit(unit, teleporter);
                        unit.teleported = true;
                        unit.teleportSource = null;
                    }
                }
            ]);
        }
    });
}());

},{"../10_general-stuff":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\10_general-stuff.js","./20_jsonable":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\20_jsonable.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\70_orders.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/
var sh = module.exports,
    _ = require('underscore')._,
    PF = require('pathfinding'),
    SharedClass = require('./10_shared-class').SharedClass,
    Jsonable = require('./20_jsonable').Jsonable,
    utils = require('../12_utils').utils,
    v = require('../10_general-stuff').v,
    actions = require('./60_actions').actions,
    items = require('./32_items').items;

(function() {
    'use strict';
    var pathfinder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        });

    sh.OrderCollection = SharedClass.extendShared({
        init: function(json) {
            this.allUnitOrders = {};
            if (json) {
                _.each(json, function(unitOrdersJson, unitID) {
                    this.allUnitOrders[unitID] =
                        new sh.UnitOrders(unitOrdersJson);
                }, this);
            }
        },
        /**
         * Adds a unit's orders to the collection.
         * @param {sh.UnitOrders} unitOrders
         */
        addUnitOrders: function(unitOrders) {
            this.allUnitOrders[unitOrders.unitID] = unitOrders;
        },
        getUnitOrders: function(unitID) {
            return this.allUnitOrders[unitID];
        },
        /**
         *
         * @param {sh.OrderCollection} orderCollection Another collection.
         */
        merge: function(orderCollection) {
            _.each(orderCollection.allUnitOrders, function(orders) {
                if (this.getUnitOrders(orders.unitID)) {
                    throw 'The collection already had orders for unit ' +
                        orders.unitID;
                }
                this.addUnitOrders(orders);
            }, this);
        },
        clone: function() {
            return new sh.OrderCollection(this.toJson());
        },
        toJson: function() {
            var json = {};
            _.each(this.allUnitOrders, function(unitOrders, unitID) {
                json[unitID] = unitOrders.toJson();
            });
            return json;
        }
    });

    sh.UnitOrders = SharedClass.extendShared({
        type: 'UnitOrders',
        init: function(json) {
            this.unitID = parseInt(json.unitID, 10);
            this.array = utils.mapFromJson(json.array, sh.orders);
            this.validate(this.unitID);
        },
        validate: function(unitID) {
            if (_.any(this.array, function(order) {
                    return order.unitID !== unitID;
                })) {
                throw 'There are orders that don\'t belong to the unit';
            }
        },
        add: function(order) {
            if (order.unitID !== this.unitID) {
                throw 'The order does not belong to the unit';
            }
            this.array.push(order);
        },
        toJson: function() {
            return {
                type: this.type,
                unitID: this.unitID,
                array: utils.mapToJson(this.array)
            };
        }
    });

    sh.Order = Jsonable.extendShared({
        init: function(json) {
            this.setJson({
                type: 'Order',
                properties: ['unitID'],
                json: json
            });
        },
        isValid: function(battle, playerID) {
            var unit = battle.getUnitByID(this.unitID);
            return unit && unit.ownerID === playerID;
        }
    });

    function tileIsClear(time, ship, unit, tile) {
        var units = ship.unitsMap.at(tile.x, tile.y),
            arrivalTime = time + unit.getTimeForMoving(unit, tile, ship);
        return (!units ||//there's no unit ahead
            _.all(units, function(u) {
                return !u.isAlive() ||//or they're either dead...
                    (u.moving && //...or they're going away
                    !v.equal(u.moving.dest, tile) &&
                    u.moving.arrivalTime <= arrivalTime
                    );
            })) &&

            !_.any(ship.units,
                function(u) {
                    //no unit is moving there
                    return u.id !== unit.id &&
                        u.moving &&
                        v.equal(u.moving.dest, tile);
                });
    }

    sh.orders = {};

    //Abstract class
    sh.orders.GoTo = sh.Order.extendShared({
        init: function(json) {
            this.parent(json);
        },
        goTo: function(pos, battle) {
            var self = this,
                unit = battle.getUnitByID(this.unitID),
                ship = unit.ship;
            this.goToState = {
                to: pos,
                arrived: false,
                path: self.getPath(unit, pos, ship),
                pathIndex: 1
            };
        },
        getPath: function(from, to, ship) {
            if (!this.gridForPath) {
                this.gridForPath = new PF.Grid(ship.width, ship.height,
                    ship.getPfMatrix());
            }
            return pathfinder.findPath(from.x, from.y, to.x, to.y,
                this.gridForPath.clone());
        },
        getMoveAction: function(time, battle) {
            var state = this.goToState,
                unit,
                ship,
                nextTile,
                from;
            if (state && !state.arrived) {
                unit = battle.getUnitByID(this.unitID);
                ship = unit.ship;
                if (v.equal(unit, state.to)) {
                    //unit is already at destination
                    state.arrived = true;
                    return null;
                }
                if (unit.moving) {
                    return null;
                }
                if (!state.path || state.pathIndex >= state.path.length) {
                    this.goToState.arrived = true;
                    return null;
                }
                nextTile = {x: state.path[state.pathIndex][0],
                    y: state.path[state.pathIndex][1]};
                if (tileIsClear(time, ship, unit, nextTile)) {
                    from = {x: unit.x, y: unit.y};
                    state.pathIndex++;
                    return new actions.Move({
                        unitID: unit.id,
                        from: from,
                        to: nextTile,
                        duration: unit.getTimeForMoving(from, nextTile, ship)
                    });
                }
                return null;
            }
            return null;
        }
    });
    sh.orders.Move = sh.orders.GoTo.extendShared({
        init: function(json) {
            this.parent(json);
            //in case its a me.Vector2D
            json.destination = {
                x: parseInt(json.destination.x, 10),
                y: parseInt(json.destination.y, 10)
            };
            this.setJson({
                type: 'Move',
                properties: ['destination'],
                json: json
            });
        },
        /**
         * Returns the actions for the unit to do while the order is the
         * active one.
         * @param {int} time
         * @param {sh.Battle} battle
         * @return {Array}
         */
        getActions: function(time, battle) {
            var move;
            if (!this.goToState) {
                this.goTo(this.destination, battle);
            }
            if (!this.goToState.arrived) {
                move = this.getMoveAction(time, battle);
                return move ? [move] : [];
            }
            return [new actions.FinishOrder({
                unitID: this.unitID
            })];
        },
        toString: function() {
            return 'Move to ' + v.str(this.destination);
        },
        isValid: function(battle, playerID) {
            var ship = battle.getUnitByID(this.unitID).ship;
            return this.parent(battle, playerID) &&
                ship.isWalkable(this.destination.x, this.destination.y);
        }
    });

    sh.orders.MoveToConsole = sh.orders.Move.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'MoveToConsole',
                properties: [],
                json: json
            });
        },
        toString: function() {
            return 'Move to Console';
        },
        isValid: function(battle, playerID) {
            var ship = battle.getUnitByID(this.unitID).ship;
            return this.parent(battle, playerID) &&
                ship.itemsMap.at(this.destination.x,
                    this.destination.y) instanceof items.Console;
        }
    });

    sh.orders.SeekAndDestroy = sh.orders.GoTo.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'SeekAndDestroy',
                properties: ['targetID'],
                json: json
            });
        },
        getActions: function(time, battle) {
            var unit, target, move;
            unit = battle.getUnitByID(this.unitID);
            target = battle.getUnitByID(this.targetID);
            if (!target || !target.isAlive() || unit.ship !== target.ship) {
                //unit is already dead
                return [new actions.SetUnitProperty({
                    unitID: unit.id,
                    property: 'targetID',
                    value: null
                }),
                    new actions.FinishOrder({
                        unitID: unit.id
                    })];
            }
            if (unit.targetID === null || unit.targetID === undefined) {
                return [new actions.SetUnitProperty({
                    unitID: unit.id,
                    property: 'targetID',
                    value: target.id
                })];
            }
            if (unit.moving) {
                return [];
            }
            if (unit.isInRange(target)) {
                return [];
            }
            if (!this.goToState ||
                    this.pathOutOfTarget(this.goToState.path, target)) {
                this.goTo(target, battle);
            }
            move = this.getMoveAction(time, battle);
            return move ? [move] : [];
        },
        pathOutOfTarget: function(path, target) {
            var pathLast = _.last(path);
            pathLast = {x: pathLast[0], y: pathLast[1]};
            return !v.equal(pathLast, target);
        },
        toString: function() {
            return 'Seek & Destroy';
        },
        isValid: function(battle, playerID) {
            var unit = battle.getUnitByID(this.unitID),
                target = battle.getUnitByID(this.targetID);
            return this.parent(battle, playerID) &&
                target &&
                target.isAlive() &&
                unit.isEnemy(target) &&
                unit.ship === target.ship;
        }
    });

    sh.orders.Recall = sh.Order.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'Recall',
                properties: [],
                json: json
            });
        },
        getActions: function() {//(turnTime, battle)
            return [new actions.Recall({
                unitID: this.unitID
            }),
                new actions.FinishOrder({
                    unitID: this.unitID
                })];
        },
        toString: function() {
            return 'Recall';
        },
        isValid: function(battle, playerID) {
            var unit = battle.getUnitByID(this.unitID);
            return this.parent(battle, playerID) &&
                unit.teleportSource;
        }
    });
}());

},{"../10_general-stuff":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\10_general-stuff.js","../12_utils":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\12_utils.js","./10_shared-class":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\10_shared-class.js","./20_jsonable":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\20_jsonable.js","./32_items":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\32_items.js","./60_actions":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\60_actions.js","pathfinding":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\index.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\80_script.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = module.exports,
    _ = require('underscore')._,
    SharedClass = require('./10_shared-class').SharedClass,
    utils = require('../12_utils').utils,
    actions = require('./60_actions').actions;

(function() {
    'use strict';
    /**
     * A collection of Actions.
     * @type {*}
     */
    sh.Script = SharedClass.extendShared({
        turnDuration: 0,
        actions: [],
        sortedModelChangesIndex: [],
        init: function(parameters) {
            if (parameters) {
                this.actions = parameters.actions;
                this.turnDuration = parameters.turnDuration;
                this.sort();
            }
            this.sortedModelChangesIndex = [];
        },
        fromJson: function(json) {
            //logic here
            this.turnDuration = json.turnDuration;
            this.actions = utils.mapFromJson(json.actions, actions);
            _.invoke(this.actions, 'updateModelChanges');
            this.sortedModelChangesIndex = json.sortedModelChangesIndex;
            this.pendingActionsJson = json.pendingActionsJson;
            return this;
        },
        toJson: function() {
            return {
                type: 'Script',
                turnDuration: this.turnDuration,
                actions: utils.mapToJson(this.actions),
                sortedModelChangesIndex: this.sortedModelChangesIndex,
                pendingActionsJson: this.pendingActionsJson
            };
        },
        isWithinTurn: function(action) {
            return action.time < this.turnDuration && action.time >= 0;
        },
        sort: function() {
            this.actions = _.sortBy(this.actions, 'time');
        },
        /**
         * Inserts an action maintaining their order
         * @param {Action} action The action to be inserted.
         * @return {int} the index of the action.
         */
        insertAction: function(action) {
            var insertionIndex = _.sortedIndex(this.actions, action, 'time');
            //after actions of the same time
            while (this.actions[insertionIndex] &&
                    this.actions[insertionIndex].time === action.time) {
                insertionIndex++;
            }
            this.actions.splice(insertionIndex, 0, action);
            return insertionIndex;
        },
        /**
         * Filter the actions by type (String).
         * @param {String} type
         */
        byType: function(type) {
            return _.filter(this.actions, function(a) {
                return a.type === type;
            });
        },
        registerChange: function(modelChange) {
            if (modelChange.actionIndex === undefined) {
                return;
            }
            this.sortedModelChangesIndex.push({
                actionIndex: modelChange.actionIndex,
                index: modelChange.index
            });
        },
        /**
         * Returns the model changes in the order in which they
         * were registered by registerChange.
         * @return {Array}
         */
        getSortedModelChanges: function() {
            return _.map(this.sortedModelChangesIndex, function(i) {
                return this.actions[i.actionIndex].modelChanges[i.index];
            }, this);
        }
    });
}());

},{"../12_utils":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\12_utils.js","./10_shared-class":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\10_shared-class.js","./60_actions":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\60_actions.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\40_create-script.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, exports*/

var sh = module.exports,
    _ = require('underscore')._,
    Script = require('./25_classes/80_script').Script,
    utils = require('./12_utils').utils,
    ModelChange = require('./25_classes/60_actions').ModelChange;

(function() {
    'use strict';
    var maxLoopsAtSameTime = 500;//to prevent endless loops.
    function insertByTime(array, item) {
        var insertionIndex = _.sortedIndex(array, item, 'time');
        array.splice(insertionIndex, 0, item);
    }

    function getVoidModelChange(time) {
        return new ModelChange(0, function() {
            return null;//for jslint
        }, {time: time});
    }

    /**
     * Generates a "script" for the units given all the orders issued.
     * @param {sh.OrderCollection} orderCollection
     * @param {sh.Battle} battle
     * @param {Boolean} resetBattle Should the battle be cleaned up at the end.
     * @return {sh.Script}
     */
    function createScript(orderCollection, battle, resetBattle) {
        var script, queue, changes, time, actors, actor, i,
            registerActionReturned = {}, turnDuration = battle.turnDuration,
            changesAtSameTime = [];
        script = new Script({turnDuration: turnDuration});
        queue = [];
        function insertInQueue(item) {
            insertByTime(queue, item);
        }

        function registerAction(returned, time) {
            return function(action) {
                action.time = time;
                action.updateModelChanges();
                script.actions.push(action);
                _.each(action.modelChanges, function(mc, index) {
                    if (mc.time >= 0) {
                    //Add actionIndex and index used by script.registerChange
                        mc.actionIndex = script.actions.length - 1;
                        mc.index = index;
                        if (mc.time === action.time) {
                            //apply immediate changes
                            mc.apply(battle);
                            script.registerChange(mc);
                            returned.immediateChanges.push(action.toString());
                        } else {
                            insertInQueue(mc);
                        }
                    }
                });
            };
        }

        //set the orders to the units
        battle.insertOrders(orderCollection);

        //null change to kick-start the process
        queue.push(getVoidModelChange(0));

        _.each(battle.pendingActions, function(action) {
            registerAction({}, action.time - turnDuration)(action);
        });

        //simulation loop (the battle gets modified and actions get added
        // to the script over time)
        while (queue.length > 0 && queue[0].time <= turnDuration) {
            time = queue[0].time;
            changes = _.where(queue, {time: time});
            _.invoke(changes, 'apply', battle);
            _.each(changes, script.registerChange, script);
            queue = queue.slice(changes.length);

            if (time < turnDuration) {
                //actions can't start at end of turn
                registerActionReturned.immediateChanges = [];
                actors = battle.getActors();
                for (i = 0; i < actors.length; i++) {
                    actor = actors[i];
                    _.each(actor.getActions(time, battle),
                        registerAction(registerActionReturned, time));
                }
                if (registerActionReturned.immediateChanges.length > 0) {
                    //If any actor returned any action with immediate model
                    //changes, the loop enters again at the same time.
                    changesAtSameTime.push(
                        registerActionReturned.immediateChanges
                    );
                    if (changesAtSameTime.length >= maxLoopsAtSameTime) {
                        throw 'Too much model changes at the same time (' +
                            time + 'ms). Changes stack: ' + changesAtSameTime
                            .slice(changesAtSameTime.length - 11,
                                changesAtSameTime.length - 1).toString() +
                            ' ...';
                    }
                    insertInQueue(getVoidModelChange(time));
                } else {
                    changesAtSameTime = [];
                }
            }
        }

        battle.pendingActions = _.chain(queue)
            .pluck('action')
            .uniq()
            .value();
        script.pendingActionsJson = utils.mapToJson(battle.pendingActions);

        //clean up
        if (resetBattle) {
            battle.endOfTurnReset();
        }
        return script;
    }

    //export
    sh.createScript = createScript;
}());

},{"./12_utils":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\12_utils.js","./25_classes/60_actions":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\60_actions.js","./25_classes/80_script":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\80_script.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}],"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\index.js":[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var _ = require('underscore')._,
    sh = {};

sh.PF = require('pathfinding');
module.exports = _.extend(sh,
    require('./10_general-stuff'),
    require('./12_utils'),
    require('./20_placement-rules'),
    require('./25_classes/10_shared-class'),
    require('./25_classes/20_jsonable'),
    require('./25_classes/25_player'),
    require('./25_classes/30_tile-entity'),
    require('./25_classes/32_items'),
    require('./25_classes/34_units'),
    require('./25_classes/40_map'),
    require('./25_classes/50_ship'),
    require('./25_classes/55_battle'),
    require('./25_classes/60_actions'),
    require('./25_classes/70_orders'),
    require('./25_classes/80_script'),
    require('./40_create-script')
    );
},{"./10_general-stuff":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\10_general-stuff.js","./12_utils":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\12_utils.js","./20_placement-rules":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\20_placement-rules.js","./25_classes/10_shared-class":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\10_shared-class.js","./25_classes/20_jsonable":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\20_jsonable.js","./25_classes/25_player":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\25_player.js","./25_classes/30_tile-entity":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\30_tile-entity.js","./25_classes/32_items":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\32_items.js","./25_classes/34_units":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\34_units.js","./25_classes/40_map":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\40_map.js","./25_classes/50_ship":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\50_ship.js","./25_classes/55_battle":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\55_battle.js","./25_classes/60_actions":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\60_actions.js","./25_classes/70_orders":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\70_orders.js","./25_classes/80_script":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\25_classes\\80_script.js","./40_create-script":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\shared\\40_create-script.js","pathfinding":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\pathfinding\\index.js","underscore":"D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\node_modules\\underscore\\underscore.js"}]},{},["D:\\Projects\\SpaceRunner stuff\\SpaceRunner\\src\\client\\bundle-entries\\shared.js"]);
