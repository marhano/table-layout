/**
 * _TL.js
 * Instance context manager for multi-instance support.
 * Tracks which TableLayout instance is currently active.
 * All modules use _TL.cid() to look up per-instance state.
 */
var _TL = (function () {
  var _cid = null;

  return {
    /** Set the current active instance */
    use: function (id) { _cid = id; },

    /** Get the current active instance containerId */
    cid: function () { return _cid; },

    /** Resolve containerId from a DOM element (walks up to .tl-root) */
    resolve: function (el) {
      var $r = jQuery(el).closest(".tl-root");
      if ($r.length) _cid = $r.attr("id");
      return _cid;
    },

    /** Container-scoped jQuery find */
    $: function (sel) {
      return jQuery("#" + _cid).find(sel);
    }
  };
})();
