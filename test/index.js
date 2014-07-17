var tape = require('tape');
var tutils = require('./test-utils');
var minidrag = require('../');

if (typeof window === 'undefined') {
  throw new Error('These tests must be run in a browser environment!');
}

var DEBUG = false;

function prepare() {
  tutils.mkElt('meta', {}, {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
  }, document.querySelector('head'));

  var container = tutils.mkElt('div', {}, {}, document.body);
  tutils.style(container, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '4000px',
    height: '4000px'
  });

  var handleStyles = {
    position: 'absolute',
    width: '40px',
    height: '40px',
    lineHeight: '40px',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    color: 'white',
    background: 'gold'
  };

  var dragFreeContainer = tutils.mkElt('div', {}, {}, container);
  tutils.style(dragFreeContainer, {
    'height': '40px'
  });

  var mkHandle = function(name, container) {
    if (!container) container = dragFreeContainer;
    if (!name) name = '';
    var handle = tutils.mkElt('div', {
      textContent: name
    }, {}, container);
    return tutils.style(handle, handleStyles);
  };

  return {
    handleCallbacksXY: mkHandle('xy'),
    handleFreeXY: mkHandle('xy'),
    handleFreeX: mkHandle('x'),
    handleFreeY: mkHandle('y'),
    handleFreeScrollXY: mkHandle('scroll xy')
  };
}

function dragTo(elt, x1, y1, x2, y2) {
  var touch = 'ontouchstart' in window;
  var up = touch? 'touchend' : 'mouseup';
  var down = touch? 'touchstart' : 'mousedown';
  var move = touch? 'touchmove' : 'mousemove';
  tutils.triggerMouseEvent(elt, down, x1, y1);
  tutils.triggerMouseEvent(elt, move, x2, y2);
  tutils.triggerMouseEvent(elt, up, x2, y2);
}

function scroll(x, y, cb) {
  window.scrollTo(x, y);
  setTimeout(cb, 100);
}

function testElt(elt, cb) {
  var pass = cb();
  tutils.style(elt, { background: pass? 'green' : 'red' });
  if (!DEBUG) setTimeout(function() {
    elt.parentElement.removeChild(elt);
  }, 300);
}

function endEltTest(elt, pass) {
  tutils.style(elt, { background: pass? 'green' : 'red' });
  if (!DEBUG) setTimeout(function() {
    elt.parentElement.removeChild(elt);
  }, 300);
}

function testEqualElt(t, elt, tests) {
  var passAll = true;
  var len = tests.length;
  for (var i = 0; i < len; i++) {
    if (tests[i][0] !== tests[i][1]) passAll = false;
    t.equal(tests[i][0], tests[i][1], tests[i][2]);
  }
  endEltTest(elt, passAll);
}

var elts = prepare();

// middle of the handles (width / 2)
var BASE_X = 20;
var BASE_Y = 20;

tape('options', function(test) {
  var handle = elts.handleCallbacksXY;
  var moveCalled = false;
  var passAll = false;

  minidrag(handle, {
    move: function() {
      if (moveCalled) return;
      test.pass('The move event is called');
      moveCalled = true;
    },
    drop: function() {
      test.pass('The drop event is called');
      passAll = moveCalled;
    }
  });

  dragTo(handle, BASE_X, BASE_Y, BASE_X + 50, BASE_Y + 50);
  endEltTest(handle, passAll);
  test.end();
});

tape('free drag', function(test) {

  var handleY = elts.handleFreeY;
  var handleX = elts.handleFreeX;
  var handleXY = elts.handleFreeXY;

  minidrag(handleY, { constraint: 'y' });
  dragTo(handleY, BASE_X, BASE_Y, BASE_X + 50, BASE_Y + 50);

  minidrag(handleX, { constraint: 'x' });
  dragTo(handleX, BASE_X, BASE_Y, BASE_X + 50, BASE_Y + 50);

  minidrag(handleXY, { constraint: 'xy' });
  dragTo(handleXY, BASE_X, BASE_Y, BASE_X + 50, BASE_Y + 50);

  setTimeout(function() {

    test.plan(6);

    // constraint: 'y'
    testEqualElt(test, handleY, [
      [handleY.offsetTop, 50, 'an "y" constraint must allow to move vertically'],
      [handleY.offsetLeft, 0, 'an "y" constraint must refuse to move horizontally']
    ]);

    // constraint: 'x'
    testEqualElt(test, handleX, [
      [handleX.offsetTop, 0, 'an "x" constraint must refuse to move vertically'],
      [handleX.offsetLeft, 50, 'an "x" constraint must allow to move horizontally']
    ]);

    // constraint: 'xy'
    testEqualElt(test, handleXY, [
      [handleXY.offsetTop, 50, 'an "xy" constraint must allow to move vertically'],
      [handleXY.offsetLeft, 50, 'an "xy" constraint must allow to move horizontally']
    ]);

  }, 100);
});

tape('free drag with scroll', function(test) {

  var handleXY = tutils.style(elts.handleFreeScrollXY, {
    top: '50px',
    left: '50px'
  });

  scroll(50, 50, function() {

    minidrag(handleXY, { constraint: 'xy' });
    dragTo(handleXY, BASE_X, BASE_Y, BASE_X + 100, BASE_Y + 100);

    setTimeout(function() {

      testEqualElt(test, handleXY, [
        [handleXY.offsetTop, 150, 'a dragged element must follow the vertical scroll'],
        [handleXY.offsetLeft, 150, 'a dragged element must follow the horizontal scroll']
      ]);

      scroll(0, 0, function() {
        test.end();
      });

    }, 100);
  });
});
