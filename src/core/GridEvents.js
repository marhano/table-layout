/**
 * GridEvents.js
 * Internal pub/sub event bus — per-instance.
 * Modules communicate through events — not direct calls.
 *
 * Usage:
 *   GridEvents.on('table:created', function(table) { ... });
 *   GridEvents.emit('table:created', newTable);
 */
var GridEvents = (function () {
  var _inst = {};

  function _ctx() {
    var id = _TL.cid();
    if (!_inst[id]) _inst[id] = {};
    return _inst[id];
  }

  function on(event, callback) {
    var L = _ctx();
    if (!L[event]) L[event] = [];
    L[event].push(callback);
  }

  function off(event, callback) {
    var L = _ctx();
    if (!L[event]) return;
    if (!callback) {
      L[event] = [];
    } else {
      L[event] = L[event].filter(function (cb) {
        return cb !== callback;
      });
    }
  }

  function emit(event, data) {
    var L = _ctx();
    if (!L[event]) return;
    L[event].forEach(function (cb) {
      cb(data);
    });
  }

  function reset() {
    _inst[_TL.cid()] = {};
  }

  function destroy() {
    delete _inst[_TL.cid()];
  }

  return { on: on, off: off, emit: emit, reset: reset, destroy: destroy };
})();
