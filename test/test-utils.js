function mkElt(name, props, attrs, container) {
  var elt = document.createElement(name);
  if (!props) props = {};
  if (!attrs) attrs = {};
  for (var i in props) elt[i] = props[i];
  for (var j in attrs) elt.setAttribute(i, attrs[i]);
  if (container) container.appendChild(elt);
  return elt;
}

function style(elt, props) {
  for (var i in props) elt.style[i] = props[i];
  return elt;
}

function triggerEvent(elt, name, cb) {
  var event = document.createEvent('HTMLEvents');
  event.initEvent(name, true, true);
  cb(event);
  elt.dispatchEvent(event);
}

function triggerMouseEvent(elt, name, x, y) {
  var event = document.createEvent('MouseEvents');
  event.initMouseEvent(name, true, true, window, 1, 0, 0, x, y,
                       false, false, false, false, 0, null);
  event.clientX = x;
  event.clientY = y;
  elt.dispatchEvent(event);
}

module.exports = {
  mkElt: mkElt,
  style: style,
  triggerEvent: triggerEvent,
  triggerMouseEvent: triggerMouseEvent
};
