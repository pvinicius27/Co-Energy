//#region \0rolldown/runtime.js
var e = Object.defineProperty, t = (t, n) => {
	let r = {};
	for (var i in t) e(r, i, {
		get: t[i],
		enumerable: !0
	});
	return n || e(r, Symbol.toStringTag, { value: "Module" }), r;
}, n = function(e, t) {
	return n = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, t) {
		e.__proto__ = t;
	} || function(e, t) {
		for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
	}, n(e, t);
};
function r(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Class extends value " + String(t) + " is not a constructor or null");
	n(e, t);
	function r() {
		this.constructor = e;
	}
	e.prototype = t === null ? Object.create(t) : (r.prototype = t.prototype, new r());
}
var i = "12px sans-serif", a = 20, o = 100, s = "007LLmW'55;N0500LLLLLLLLLL00NNNLzWW\\\\WQb\\0FWLg\\bWb\\WQ\\WrWWQ000CL5LLFLL0LL**F*gLLLL5F0LF\\FFF5.5N";
function c(e) {
	var t = {};
	if (typeof JSON > "u") return t;
	for (var n = 0; n < e.length; n++) {
		var r = String.fromCharCode(n + 32);
		t[r] = (e.charCodeAt(n) - a) / o;
	}
	return t;
}
var l = c(s), u = {
	createCanvas: function() {
		return typeof document < "u" && document.createElement("canvas");
	},
	measureText: (function() {
		var e, t;
		return function(n, r) {
			if (!e) {
				var i = u.createCanvas();
				e = i && i.getContext("2d");
			}
			if (e) return t !== r && (t = e.font = r || "12px sans-serif"), e.measureText(n);
			n ||= "", r ||= "12px sans-serif";
			var a = /((?:\d+)?\.?\d*)px/.exec(r), o = a && +a[1] || 12, s = 0;
			if (r.indexOf("mono") >= 0) s = o * n.length;
			else for (var c = 0; c < n.length; c++) {
				var d = l[n[c]];
				s += d == null ? o : d * o;
			}
			return { width: s };
		};
	})(),
	loadImage: function(e, t, n) {
		var r = new Image();
		return r.onload = t, r.onerror = n, r.src = e, r;
	},
	getTime: function() {
		return Date.now ? Date.now() : +/* @__PURE__ */ new Date();
	}
}, d = te([
	"Function",
	"RegExp",
	"Date",
	"Error",
	"CanvasGradient",
	"CanvasPattern",
	"Image",
	"Canvas"
], function(e, t) {
	return e["[object " + t + "]"] = !0, e;
}, {}), f = te([
	"Int8",
	"Uint8",
	"Uint8Clamped",
	"Int16",
	"Uint16",
	"Int32",
	"Uint32",
	"Float32",
	"Float64"
], function(e, t) {
	return e["[object " + t + "Array]"] = !0, e;
}, {}), p = Object.prototype.toString, m = Array.prototype, h = m.forEach, g = m.filter, _ = m.slice, v = m.map, y = function() {}.constructor, b = y ? y.prototype : null, x = "__proto__", S = 2311, C = 2 ** 53 - 1;
function w() {
	return S >= C && (S = 0), S++;
}
function T() {
	var e = [...arguments];
	typeof console < "u" && console.error.apply(console, e);
}
function E(e) {
	if (typeof e != "object" || !e) return e;
	var t = e, n = p.call(e);
	if (n === "[object Array]") {
		if (!ve(e)) {
			t = [];
			for (var r = 0, i = e.length; r < i; r++) t[r] = E(e[r]);
		}
	} else if (f[n]) {
		if (!ve(e)) {
			var a = e.constructor;
			if (a.from) t = a.from(e);
			else {
				t = new a(e.length);
				for (var r = 0, i = e.length; r < i; r++) t[r] = e[r];
			}
		}
	} else if (!d[n] && !ve(e) && !se(e)) for (var o in t = {}, e) e.hasOwnProperty(o) && o !== x && (t[o] = E(e[o]));
	return t;
}
function D(e, t, n) {
	if (!G(t) || !G(e)) return n ? E(t) : e;
	for (var r in t) if (t.hasOwnProperty(r) && r !== x) {
		var i = e[r], a = t[r];
		G(a) && G(i) && !V(a) && !V(i) && !se(a) && !se(i) && !ae(a) && !ae(i) && !ve(a) && !ve(i) ? D(i, a, n) : (n || !(r in e)) && (e[r] = E(t[r]));
	}
	return e;
}
function O(e, t) {
	for (var n = e[0], r = 1, i = e.length; r < i; r++) n = D(n, e[r], t);
	return n;
}
function k(e, t) {
	if (Object.assign) Object.assign(e, t);
	else for (var n in t) t.hasOwnProperty(n) && n !== x && (e[n] = t[n]);
	return e;
}
function A(e, t, n) {
	e ||= {};
	for (var r = 0; r < n.length; r++) {
		var i = n[r];
		e[i] = t[i];
	}
	return e;
}
function j(e, t, n) {
	for (var r = R(t), i = 0, a = r.length; i < a; i++) {
		var o = r[i];
		(n ? t[o] != null : e[o] == null) && (e[o] = t[o]);
	}
	return e;
}
u.createCanvas;
function M(e, t) {
	if (e) {
		if (e.indexOf) return e.indexOf(t);
		for (var n = 0, r = e.length; n < r; n++) if (e[n] === t) return n;
	}
	return -1;
}
function ee(e, t) {
	var n = e.prototype;
	function r() {}
	for (var i in r.prototype = t.prototype, e.prototype = new r(), n) n.hasOwnProperty(i) && (e.prototype[i] = n[i]);
	e.prototype.constructor = e, e.superClass = t;
}
function N(e, t, n) {
	if (e = "prototype" in e ? e.prototype : e, t = "prototype" in t ? t.prototype : t, Object.getOwnPropertyNames) for (var r = Object.getOwnPropertyNames(t), i = 0; i < r.length; i++) {
		var a = r[i];
		a !== "constructor" && (n ? t[a] != null : e[a] == null) && (e[a] = t[a]);
	}
	else j(e, t, n);
}
function P(e) {
	return !e || typeof e == "string" ? !1 : typeof e.length == "number";
}
function F(e, t, n) {
	if (e && t) {
		if (e.forEach && e.forEach === h) e.forEach(t, n);
		else if (e.length === +e.length) for (var r = 0, i = e.length; r < i; r++) t.call(n, e[r], r, e);
		else for (var a in e) e.hasOwnProperty(a) && t.call(n, e[a], a, e);
	}
}
function I(e, t, n) {
	if (!e) return [];
	if (!t) return fe(e);
	if (e.map && e.map === v) return e.map(t, n);
	for (var r = [], i = 0, a = e.length; i < a; i++) r.push(t.call(n, e[i], i, e));
	return r;
}
function te(e, t, n, r) {
	if (e && t) {
		for (var i = 0, a = e.length; i < a; i++) n = t.call(r, n, e[i], i, e);
		return n;
	}
}
function L(e, t, n) {
	if (!e) return [];
	if (!t) return fe(e);
	if (e.filter && e.filter === g) return e.filter(t, n);
	for (var r = [], i = 0, a = e.length; i < a; i++) t.call(n, e[i], i, e) && r.push(e[i]);
	return r;
}
function ne(e, t, n) {
	if (e && t) {
		for (var r = 0, i = e.length; r < i; r++) if (t.call(n, e[r], r, e)) return e[r];
	}
}
function R(e) {
	if (!e) return [];
	if (Object.keys) return Object.keys(e);
	var t = [];
	for (var n in e) e.hasOwnProperty(n) && t.push(n);
	return t;
}
function re(e, t) {
	var n = [...arguments].slice(2);
	return function() {
		return e.apply(t, n.concat(_.call(arguments)));
	};
}
var z = b && H(b.bind) ? b.call.bind(b.bind) : re;
function B(e) {
	var t = [...arguments].slice(1);
	return function() {
		return e.apply(this, t.concat(_.call(arguments)));
	};
}
function V(e) {
	return Array.isArray ? Array.isArray(e) : p.call(e) === "[object Array]";
}
function H(e) {
	return typeof e == "function";
}
function U(e) {
	return typeof e == "string";
}
function ie(e) {
	return p.call(e) === "[object String]";
}
function W(e) {
	return typeof e == "number";
}
function G(e) {
	var t = typeof e;
	return t === "function" || !!e && t === "object";
}
function ae(e) {
	return !!d[p.call(e)];
}
function oe(e) {
	return !!f[p.call(e)];
}
function se(e) {
	return typeof e == "object" && typeof e.nodeType == "number" && typeof e.ownerDocument == "object";
}
function ce(e) {
	return e.colorStops != null;
}
function le(e) {
	return e !== e;
}
function ue() {
	for (var e = [...arguments], t = 0, n = e.length; t < n; t++) if (e[t] != null) return e[t];
}
function K(e, t) {
	return e ?? t;
}
function de(e, t, n) {
	return e ?? t ?? n;
}
function fe(e) {
	var t = [...arguments].slice(1);
	return _.apply(e, t);
}
function pe(e) {
	if (typeof e == "number") return [
		e,
		e,
		e,
		e
	];
	var t = e.length;
	return t === 2 ? [
		e[0],
		e[1],
		e[0],
		e[1]
	] : t === 3 ? [
		e[0],
		e[1],
		e[2],
		e[1]
	] : e;
}
function me(e, t) {
	if (!e) throw Error(t);
}
function he(e) {
	return e == null ? null : typeof e.trim == "function" ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
}
var ge = "__ec_primitive__";
function _e(e) {
	e[ge] = !0;
}
function ve(e) {
	return e[ge];
}
var ye = function() {
	function e() {
		this.data = {};
	}
	return e.prototype.delete = function(e) {
		var t = this.has(e);
		return t && delete this.data[e], t;
	}, e.prototype.has = function(e) {
		return this.data.hasOwnProperty(e);
	}, e.prototype.get = function(e) {
		return this.data[e];
	}, e.prototype.set = function(e, t) {
		return this.data[e] = t, this;
	}, e.prototype.keys = function() {
		return R(this.data);
	}, e.prototype.forEach = function(e) {
		var t = this.data;
		for (var n in t) t.hasOwnProperty(n) && e(t[n], n);
	}, e;
}(), be = typeof Map == "function";
function xe() {
	return be ? /* @__PURE__ */ new Map() : new ye();
}
var Se = function() {
	function e(t) {
		var n = V(t);
		this.data = xe();
		var r = this;
		t instanceof e ? t.each(i) : t && F(t, i);
		function i(e, t) {
			n ? r.set(e, t) : r.set(t, e);
		}
	}
	return e.prototype.hasKey = function(e) {
		return this.data.has(e);
	}, e.prototype.get = function(e) {
		return this.data.get(e);
	}, e.prototype.set = function(e, t) {
		return this.data.set(e, t), t;
	}, e.prototype.each = function(e, t) {
		this.data.forEach(function(n, r) {
			e.call(t, n, r);
		});
	}, e.prototype.keys = function() {
		var e = this.data.keys();
		return be ? Array.from(e) : e;
	}, e.prototype.removeKey = function(e) {
		this.data.delete(e);
	}, e;
}();
function q(e) {
	return new Se(e);
}
function Ce(e, t) {
	for (var n = new e.constructor(e.length + t.length), r = 0; r < e.length; r++) n[r] = e[r];
	for (var i = e.length, r = 0; r < t.length; r++) n[r + i] = t[r];
	return n;
}
function we(e, t) {
	var n;
	if (Object.create) n = Object.create(e);
	else {
		var r = function() {};
		r.prototype = e, n = new r();
	}
	return t && k(n, t), n;
}
function Te(e, t) {
	return e.hasOwnProperty(t);
}
function Ee() {}
var De = 180 / Math.PI, Oe = function() {
	function e() {
		this.firefox = !1, this.ie = !1, this.edge = !1, this.newEdge = !1, this.weChat = !1;
	}
	return e;
}(), J = new (function() {
	function e() {
		this.browser = new Oe(), this.node = !1, this.wxa = !1, this.worker = !1, this.svgSupported = !1, this.touchEventsSupported = !1, this.pointerEventsSupported = !1, this.domSupported = !1, this.transformSupported = !1, this.transform3dSupported = !1, this.hasGlobalWindow = typeof window < "u";
	}
	return e;
}())();
typeof wx == "object" && typeof wx.getSystemInfoSync == "function" ? (J.wxa = !0, J.touchEventsSupported = !0) : typeof document > "u" && typeof self < "u" ? J.worker = !0 : !J.hasGlobalWindow || "Deno" in window || typeof navigator < "u" && typeof navigator.userAgent == "string" && navigator.userAgent.indexOf("Node.js") > -1 ? (J.node = !0, J.svgSupported = !0) : ke(navigator.userAgent, J);
function ke(e, t) {
	var n = t.browser, r = e.match(/Firefox\/([\d.]+)/), i = e.match(/MSIE\s([\d.]+)/) || e.match(/Trident\/.+?rv:(([\d.]+))/), a = e.match(/Edge?\/([\d.]+)/), o = /micromessenger/i.test(e);
	if (r && (n.firefox = !0, n.version = r[1]), i && (n.ie = !0, n.version = i[1]), a && (n.edge = !0, n.version = a[1], n.newEdge = +a[1].split(".")[0] > 18), o && (n.weChat = !0), t.svgSupported = typeof SVGRect < "u", t.touchEventsSupported = "ontouchstart" in window && !n.ie && !n.edge, t.pointerEventsSupported = "onpointerdown" in window && (n.edge || n.ie && +n.version >= 11), t.domSupported = typeof document < "u") {
		var s = document.documentElement.style;
		t.transform3dSupported = (n.ie && "transition" in s || n.edge || "WebKitCSSMatrix" in window && "m11" in new WebKitCSSMatrix() || "MozPerspective" in s) && !("OTransition" in s), t.transformSupported = t.transform3dSupported || n.ie && +n.version >= 9;
	}
}
//#endregion
//#region node_modules/echarts/lib/util/clazz.js
var Ae = ".", je = "___EC__COMPONENT__CONTAINER___", Me = "___EC__EXTENDED_CLASS___";
function Ne(e) {
	var t = {
		main: "",
		sub: ""
	};
	if (e) {
		var n = e.split(Ae);
		t.main = n[0] || "", t.sub = n[1] || "";
	}
	return t;
}
function Pe(e) {
	me(/^[a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)?$/.test(e), "componentType \"" + e + "\" illegal");
}
function Fe(e) {
	return !!(e && e[Me]);
}
function Ie(e, t) {
	e.$constructor = e, e.extend = function(e) {
		var t = this, n;
		return Le(t) ? n = function(e) {
			r(t, e);
			function t() {
				return e.apply(this, arguments) || this;
			}
			return t;
		}(t) : (n = function() {
			(e.$constructor || t).apply(this, arguments);
		}, ee(n, this)), k(n.prototype, e), n[Me] = !0, n.extend = this.extend, n.superCall = Ve, n.superApply = He, n.superClass = t, n;
	};
}
function Le(e) {
	return H(e) && /^class\s/.test(Function.prototype.toString.call(e));
}
function Re(e, t) {
	e.extend = t.extend;
}
var ze = Math.round(Math.random() * 10);
function Be(e) {
	var t = ["__\0is_clz", ze++].join("_");
	e.prototype[t] = !0, e.isInstance = function(e) {
		return !!(e && e[t]);
	};
}
function Ve(e, t) {
	var n = [...arguments].slice(2);
	return this.superClass.prototype[t].apply(e, n);
}
function He(e, t, n) {
	return this.superClass.prototype[t].apply(e, n);
}
function Ue(e) {
	var t = {};
	e.registerClass = function(e) {
		var r = e.type || e.prototype.type;
		if (r) {
			Pe(r), e.prototype.type = r;
			var i = Ne(r);
			if (!i.sub) t[i.main] = e;
			else if (i.sub !== je) {
				var a = n(i);
				a[i.sub] = e;
			}
		}
		return e;
	}, e.getClass = function(e, n, r) {
		var i = t[e];
		if (i && i[je] && (i = n ? i[n] : null), r && !i) throw Error(n ? "Component " + e + "." + (n || "") + " is used but not imported." : e + ".type should be specified.");
		return i;
	}, e.getClassesByMainType = function(e) {
		var n = Ne(e), r = [], i = t[n.main];
		return i && i[je] ? F(i, function(e, t) {
			t !== je && r.push(e);
		}) : r.push(i), r;
	}, e.hasClass = function(e) {
		return !!t[Ne(e).main];
	}, e.getAllClassMainTypes = function() {
		var e = [];
		return F(t, function(t, n) {
			e.push(n);
		}), e;
	}, e.hasSubTypes = function(e) {
		var n = t[Ne(e).main];
		return n && n[je];
	};
	function n(e) {
		var n = t[e.main];
		return (!n || !n[je]) && (n = t[e.main] = {}, n[je] = !0), n;
	}
}
//#endregion
//#region node_modules/echarts/lib/model/mixin/makeStyleMapper.js
function We(e, t) {
	for (var n = 0; n < e.length; n++) e[n][1] || (e[n][1] = e[n][0]);
	return t ||= !1, function(n, r, i) {
		for (var a = {}, o = 0; o < e.length; o++) {
			var s = e[o][1];
			if (!(r && M(r, s) >= 0 || i && M(i, s) < 0)) {
				var c = n.getShallow(s, t);
				c != null && (a[e[o][0]] = c);
			}
		}
		return a;
	};
}
var Ge = We([
	["fill", "color"],
	["shadowBlur"],
	["shadowOffsetX"],
	["shadowOffsetY"],
	["opacity"],
	["shadowColor"]
]), Ke = function() {
	function e() {}
	return e.prototype.getAreaStyle = function(e, t) {
		return Ge(this, e, t);
	}, e;
}(), qe = function() {
	function e(e) {
		this.value = e;
	}
	return e;
}(), Je = function() {
	function e() {
		this._len = 0;
	}
	return e.prototype.insert = function(e) {
		var t = new qe(e);
		return this.insertEntry(t), t;
	}, e.prototype.insertEntry = function(e) {
		this.head ? (this.tail.next = e, e.prev = this.tail, e.next = null, this.tail = e) : this.head = this.tail = e, this._len++;
	}, e.prototype.remove = function(e) {
		var t = e.prev, n = e.next;
		t ? t.next = n : this.head = n, n ? n.prev = t : this.tail = t, e.next = e.prev = null, this._len--;
	}, e.prototype.len = function() {
		return this._len;
	}, e.prototype.clear = function() {
		this.head = this.tail = null, this._len = 0;
	}, e;
}(), Ye = function() {
	function e(e) {
		this._list = new Je(), this._maxSize = 10, this._map = {}, this._maxSize = e;
	}
	return e.prototype.put = function(e, t) {
		var n = this._list, r = this._map, i = null;
		if (r[e] == null) {
			var a = n.len(), o = this._lastRemovedEntry;
			if (a >= this._maxSize && a > 0) {
				var s = n.head;
				n.remove(s), delete r[s.key], i = s.value, this._lastRemovedEntry = s;
			}
			o ? o.value = t : o = new qe(t), o.key = e, n.insertEntry(o), r[e] = o;
		}
		return i;
	}, e.prototype.get = function(e) {
		var t = this._map[e], n = this._list;
		if (t != null) return t !== n.tail && (n.remove(t), n.insertEntry(t)), t.value;
	}, e.prototype.clear = function() {
		this._list.clear(), this._map = {};
	}, e.prototype.len = function() {
		return this._list.len();
	}, e;
}(), Xe = new Ye(50);
function Ze(e) {
	if (typeof e == "string") {
		var t = Xe.get(e);
		return t && t.image;
	}
	return e;
}
function Qe(e, t, n, r, i) {
	if (!e) return t;
	if (typeof e == "string") {
		if (t && t.__zrImageSrc === e || !n) return t;
		var a = Xe.get(e), o = {
			hostEl: n,
			cb: r,
			cbPayload: i
		};
		return a ? (t = a.image, !et(t) && a.pending.push(o)) : (t = u.loadImage(e, $e, $e), t.__zrImageSrc = e, Xe.put(e, t.__cachedImgObj = {
			image: t,
			pending: [o]
		})), t;
	}
	return e;
}
function $e() {
	var e = this.__cachedImgObj;
	this.onload = this.onerror = this.__cachedImgObj = null;
	for (var t = 0; t < e.pending.length; t++) {
		var n = e.pending[t], r = n.cb;
		r && r(this, n.cbPayload), n.hostEl.dirty();
	}
	e.pending.length = 0;
}
function et(e) {
	return e && e.width && e.height;
}
//#endregion
//#region node_modules/zrender/lib/core/matrix.js
function tt() {
	return [
		1,
		0,
		0,
		1,
		0,
		0
	];
}
function nt(e) {
	return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 1, e[4] = 0, e[5] = 0, e;
}
function rt(e, t) {
	return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = t[4], e[5] = t[5], e;
}
function it(e, t, n) {
	var r = t[0] * n[0] + t[2] * n[1], i = t[1] * n[0] + t[3] * n[1], a = t[0] * n[2] + t[2] * n[3], o = t[1] * n[2] + t[3] * n[3], s = t[0] * n[4] + t[2] * n[5] + t[4], c = t[1] * n[4] + t[3] * n[5] + t[5];
	return e[0] = r, e[1] = i, e[2] = a, e[3] = o, e[4] = s, e[5] = c, e;
}
function at(e, t, n) {
	return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = t[4] + n[0], e[5] = t[5] + n[1], e;
}
function ot(e, t, n, r) {
	r === void 0 && (r = [0, 0]);
	var i = t[0], a = t[2], o = t[4], s = t[1], c = t[3], l = t[5], u = Math.sin(n), d = Math.cos(n);
	return e[0] = i * d + s * u, e[1] = -i * u + s * d, e[2] = a * d + c * u, e[3] = -a * u + d * c, e[4] = d * (o - r[0]) + u * (l - r[1]) + r[0], e[5] = d * (l - r[1]) - u * (o - r[0]) + r[1], e;
}
function st(e, t, n) {
	var r = n[0], i = n[1];
	return e[0] = t[0] * r, e[1] = t[1] * i, e[2] = t[2] * r, e[3] = t[3] * i, e[4] = t[4] * r, e[5] = t[5] * i, e;
}
function ct(e, t) {
	var n = t[0], r = t[2], i = t[4], a = t[1], o = t[3], s = t[5], c = n * o - a * r;
	return c ? (c = 1 / c, e[0] = o * c, e[1] = -a * c, e[2] = -r * c, e[3] = n * c, e[4] = (r * s - o * i) * c, e[5] = (a * i - n * s) * c, e) : null;
}
//#endregion
//#region node_modules/zrender/lib/core/vector.js
function lt(e, t) {
	return e ??= 0, t ??= 0, [e, t];
}
function ut(e, t) {
	return e[0] = t[0], e[1] = t[1], e;
}
function dt(e) {
	return [e[0], e[1]];
}
function ft(e, t, n) {
	return e[0] = t, e[1] = n, e;
}
function pt(e, t, n) {
	return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e;
}
function mt(e, t, n) {
	return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e;
}
function ht(e) {
	return Math.sqrt(gt(e));
}
function gt(e) {
	return e[0] * e[0] + e[1] * e[1];
}
function _t(e, t, n) {
	return e[0] = t[0] * n, e[1] = t[1] * n, e;
}
function vt(e, t) {
	var n = ht(t);
	return n === 0 ? (e[0] = 0, e[1] = 0) : (e[0] = t[0] / n, e[1] = t[1] / n), e;
}
function yt(e, t) {
	return Math.sqrt((e[0] - t[0]) * (e[0] - t[0]) + (e[1] - t[1]) * (e[1] - t[1]));
}
var bt = yt;
function xt(e, t) {
	return (e[0] - t[0]) * (e[0] - t[0]) + (e[1] - t[1]) * (e[1] - t[1]);
}
var St = xt;
function Ct(e, t, n) {
	var r = t[0], i = t[1];
	return e[0] = n[0] * r + n[2] * i + n[4], e[1] = n[1] * r + n[3] * i + n[5], e;
}
function wt(e, t, n) {
	return e[0] = Math.min(t[0], n[0]), e[1] = Math.min(t[1], n[1]), e;
}
function Tt(e, t, n) {
	return e[0] = Math.max(t[0], n[0]), e[1] = Math.max(t[1], n[1]), e;
}
//#endregion
//#region node_modules/zrender/lib/core/Point.js
var Et = function() {
	function e(e, t) {
		this.x = e || 0, this.y = t || 0;
	}
	return e.prototype.copy = function(e) {
		return this.x = e.x, this.y = e.y, this;
	}, e.prototype.clone = function() {
		return new e(this.x, this.y);
	}, e.prototype.set = function(e, t) {
		return this.x = e, this.y = t, this;
	}, e.prototype.equal = function(e) {
		return e.x === this.x && e.y === this.y;
	}, e.prototype.add = function(e) {
		return this.x += e.x, this.y += e.y, this;
	}, e.prototype.scale = function(e) {
		this.x *= e, this.y *= e;
	}, e.prototype.scaleAndAdd = function(e, t) {
		this.x += e.x * t, this.y += e.y * t;
	}, e.prototype.sub = function(e) {
		return this.x -= e.x, this.y -= e.y, this;
	}, e.prototype.dot = function(e) {
		return this.x * e.x + this.y * e.y;
	}, e.prototype.len = function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}, e.prototype.lenSquare = function() {
		return this.x * this.x + this.y * this.y;
	}, e.prototype.normalize = function() {
		var e = this.len();
		return this.x /= e, this.y /= e, this;
	}, e.prototype.distance = function(e) {
		var t = this.x - e.x, n = this.y - e.y;
		return Math.sqrt(t * t + n * n);
	}, e.prototype.distanceSquare = function(e) {
		var t = this.x - e.x, n = this.y - e.y;
		return t * t + n * n;
	}, e.prototype.negate = function() {
		return this.x = -this.x, this.y = -this.y, this;
	}, e.prototype.transform = function(e) {
		if (e) {
			var t = this.x, n = this.y;
			return this.x = e[0] * t + e[2] * n + e[4], this.y = e[1] * t + e[3] * n + e[5], this;
		}
	}, e.prototype.toArray = function(e) {
		return e[0] = this.x, e[1] = this.y, e;
	}, e.prototype.fromArray = function(e) {
		this.x = e[0], this.y = e[1];
	}, e.set = function(e, t, n) {
		e.x = t, e.y = n;
	}, e.copy = function(e, t) {
		e.x = t.x, e.y = t.y;
	}, e.len = function(e) {
		return Math.sqrt(e.x * e.x + e.y * e.y);
	}, e.lenSquare = function(e) {
		return e.x * e.x + e.y * e.y;
	}, e.dot = function(e, t) {
		return e.x * t.x + e.y * t.y;
	}, e.add = function(e, t, n) {
		e.x = t.x + n.x, e.y = t.y + n.y;
	}, e.sub = function(e, t, n) {
		e.x = t.x - n.x, e.y = t.y - n.y;
	}, e.scale = function(e, t, n) {
		e.x = t.x * n, e.y = t.y * n;
	}, e.scaleAndAdd = function(e, t, n, r) {
		e.x = t.x + n.x * r, e.y = t.y + n.y * r;
	}, e.lerp = function(e, t, n, r) {
		var i = 1 - r;
		e.x = i * t.x + r * n.x, e.y = i * t.y + r * n.y;
	}, e;
}(), Dt = Math.min, Ot = Math.max, kt = Math.abs, At = ["x", "y"], jt = ["width", "height"], Mt = new Et(), Nt = new Et(), Pt = new Et(), Ft = new Et(), It = Xt(), Lt = It.minTv, Rt = It.maxTv, zt = [0, 0], Y = function() {
	function e(e, t, n, r) {
		Vt(this, e, t, n, r);
	}
	return e.set = function(e, t, n, r, i) {
		return r < 0 && (t += r, r = -r), i < 0 && (n += i, i = -i), e.x = t, e.y = n, e.width = r, e.height = i, e;
	}, e.prototype.union = function(e) {
		var t = Dt(e.x, this.x), n = Dt(e.y, this.y);
		this.width = isFinite(this.x) && isFinite(this.width) ? Ot(e.x + e.width, this.x + this.width) - t : e.width, this.height = isFinite(this.y) && isFinite(this.height) ? Ot(e.y + e.height, this.y + this.height) - n : e.height, this.x = t, this.y = n;
	}, e.prototype.applyTransform = function(t) {
		e.applyTransform(this, this, t);
	}, e.prototype.calculateTransform = function(e) {
		return Ut(tt(), this, e);
	}, e.prototype.intersect = function(t, n, r) {
		return e.intersect(this, t, n, r);
	}, e.intersect = function(t, n, r, i) {
		r && Et.set(r, 0, 0);
		var a = i && i.outIntersectRect || null, o = i && i.clamp;
		if (a && (a.x = a.y = a.width = a.height = NaN), !t || !n) return !1;
		t instanceof e || (t = Vt(Kt, t.x, t.y, t.width, t.height)), n instanceof e || (n = Vt(qt, n.x, n.y, n.width, n.height));
		var s = !!r;
		It.reset(i, s);
		var c = It.touchThreshold, l = t.x + c, u = t.x + t.width - c, d = t.y + c, f = t.y + t.height - c, p = n.x + c, m = n.x + n.width - c, h = n.y + c, g = n.y + n.height - c;
		if (l > u || d > f || p > m || h > g) return !1;
		var _ = !(u < p || m < l || f < h || g < d);
		return (s || a) && (zt[0] = Infinity, zt[1] = 0, Yt(l, u, p, m, 0, s, a, o), Yt(d, f, h, g, 1, s, a, o), s && Et.copy(r, _ ? It.useDir ? It.dirMinTv : Lt : Rt)), _;
	}, e.contain = function(e, t, n) {
		return t >= e.x && t <= e.x + e.width && n >= e.y && n <= e.y + e.height;
	}, e.prototype.contain = function(t, n) {
		return e.contain(this, t, n);
	}, e.prototype.clone = function() {
		return new e(this.x, this.y, this.width, this.height);
	}, e.prototype.copy = function(e) {
		Ht(this, e);
	}, e.prototype.plain = function() {
		return {
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height
		};
	}, e.prototype.isFinite = function() {
		return isFinite(this.x) && isFinite(this.y) && isFinite(this.width) && isFinite(this.height);
	}, e.prototype.isZero = function() {
		return this.width === 0 || this.height === 0;
	}, e.create = function(t) {
		return new e(t ? t.x : 0, t ? t.y : 0, t ? t.width : 0, t ? t.height : 0);
	}, e.copy = function(e, t) {
		return e.x = t.x, e.y = t.y, e.width = t.width, e.height = t.height, e;
	}, e.applyTransform = function(e, t, n) {
		if (!n) {
			e !== t && Ht(e, t);
			return;
		}
		if (n[1] < 1e-5 && n[1] > -1e-5 && n[2] < 1e-5 && n[2] > -1e-5) {
			var r = n[0], i = n[3], a = n[4], o = n[5];
			e.x = t.x * r + a, e.y = t.y * i + o, e.width = t.width * r, e.height = t.height * i, e.width < 0 && (e.x += e.width, e.width = -e.width), e.height < 0 && (e.y += e.height, e.height = -e.height);
			return;
		}
		Mt.x = Pt.x = t.x, Mt.y = Ft.y = t.y, Nt.x = Ft.x = t.x + t.width, Nt.y = Pt.y = t.y + t.height, Mt.transform(n), Ft.transform(n), Nt.transform(n), Pt.transform(n), e.x = Dt(Mt.x, Nt.x, Pt.x, Ft.x), e.y = Dt(Mt.y, Nt.y, Pt.y, Ft.y);
		var s = Ot(Mt.x, Nt.x, Pt.x, Ft.x), c = Ot(Mt.y, Nt.y, Pt.y, Ft.y);
		e.width = s - e.x, e.height = c - e.y;
	}, e.calculateTransform = function(e, t, n) {
		var r = n.width / t.width, i = n.height / t.height;
		return e = nt(e || []), at(e, e, ft(Jt, -t.x, -t.y)), st(e, e, ft(Jt, r, i)), at(e, e, ft(Jt, n.x, n.y)), e;
	}, e;
}(), Bt = Y.create, Vt = Y.set, Ht = Y.copy, Ut = Y.calculateTransform, Wt = Y.applyTransform, Gt = Y.contain, Kt = new Y(0, 0, 0, 0), qt = new Y(0, 0, 0, 0), Jt = [];
function Yt(e, t, n, r, i, a, o, s) {
	var c = kt(t - n), l = kt(r - e), u = Dt(c, l), d = At[i], f = At[1 - i], p = jt[i];
	t < n || r < e ? c < l ? (a && (Rt[d] = -c), s && (o[d] = t, o[p] = 0)) : (a && (Rt[d] = l), s && (o[d] = e, o[p] = 0)) : (o && (o[d] = Ot(e, n), o[p] = Dt(t, r) - o[d]), a && (u < zt[0] || It.useDir) && (zt[0] = Dt(u, zt[0]), (c < l || !It.bidirectional) && (Lt[d] = c, Lt[f] = 0, It.useDir && It.calcDirMTV()), (c >= l || !It.bidirectional) && (Lt[d] = -l, Lt[f] = 0, It.useDir && It.calcDirMTV())));
}
function Xt() {
	var e = 0, t = new Et(), n = new Et(), r = {
		minTv: new Et(),
		maxTv: new Et(),
		useDir: !1,
		dirMinTv: new Et(),
		touchThreshold: 0,
		bidirectional: !0,
		negativeSize: !1,
		reset: function(i, a) {
			r.touchThreshold = 0, i && i.touchThreshold != null && (r.touchThreshold = Ot(0, i.touchThreshold)), r.negativeSize = !1, a && (r.minTv.set(Infinity, Infinity), r.maxTv.set(0, 0), r.useDir = !1, i && i.direction != null && (r.useDir = !0, r.dirMinTv.copy(r.minTv), n.copy(r.minTv), e = i.direction, r.bidirectional = i.bidirectional == null || !!i.bidirectional, r.bidirectional || t.set(Math.cos(e), Math.sin(e))));
		},
		calcDirMTV: function() {
			var a = r.minTv, o = r.dirMinTv, s = a.y * a.y + a.x * a.x, c = Math.sin(e), l = Math.cos(e), u = c * a.y + l * a.x;
			if (i(u)) {
				i(a.x) && i(a.y) && o.set(0, 0);
				return;
			}
			if (n.x = s * l / u, n.y = s * c / u, i(n.x) && i(n.y)) {
				o.set(0, 0);
				return;
			}
			(r.bidirectional || t.dot(n) > 0) && n.len() < o.len() && o.copy(n);
		}
	};
	function i(e) {
		return kt(e) < 1e-10;
	}
	return r;
}
//#endregion
//#region node_modules/zrender/lib/contain/text.js
function Zt(e) {
	Qt ||= new Ye(100), e ||= "12px sans-serif";
	var t = Qt.get(e);
	return t || (t = {
		font: e,
		strWidthCache: new Ye(500),
		asciiWidthMap: null,
		asciiWidthMapTried: !1,
		stWideCharWidth: u.measureText("国", e).width,
		asciiCharWidth: u.measureText("a", e).width
	}, Qt.put(e, t)), t;
}
var Qt;
function $t(e) {
	if (!(en >= tn)) {
		e ||= "12px sans-serif";
		for (var t = [], n = +/* @__PURE__ */ new Date(), r = 0; r <= 127; r++) t[r] = u.measureText(String.fromCharCode(r), e).width;
		var i = +/* @__PURE__ */ new Date() - n;
		return i > 16 ? en = tn : i > 2 && en++, t;
	}
}
var en = 0, tn = 5;
function nn(e, t) {
	return e.asciiWidthMapTried ||= (e.asciiWidthMap = $t(e.font), !0), 0 <= t && t <= 127 ? e.asciiWidthMap == null ? e.asciiCharWidth : e.asciiWidthMap[t] : e.stWideCharWidth;
}
function rn(e, t) {
	var n = e.strWidthCache, r = n.get(t);
	return r ?? (r = u.measureText(t, e.font).width, n.put(t, r)), r;
}
function an(e, t, n, r) {
	var i = rn(Zt(t), e), a = ln(t);
	return new Y(sn(0, i, n), cn(0, a, r), i, a);
}
function on(e, t, n, r) {
	var i = ((e || "") + "").split("\n");
	if (i.length === 1) return an(i[0], t, n, r);
	for (var a = new Y(0, 0, 0, 0), o = 0; o < i.length; o++) {
		var s = an(i[o], t, n, r);
		o === 0 ? a.copy(s) : a.union(s);
	}
	return a;
}
function sn(e, t, n, r) {
	return n === "right" ? r ? e += t : e -= t : n === "center" && (r ? e += t / 2 : e -= t / 2), e;
}
function cn(e, t, n, r) {
	return n === "middle" ? r ? e += t / 2 : e -= t / 2 : n === "bottom" && (r ? e += t : e -= t), e;
}
function ln(e) {
	return Zt(e).stWideCharWidth;
}
function un(e, t) {
	return typeof e == "string" ? e.lastIndexOf("%") >= 0 ? parseFloat(e) / 100 * t : parseFloat(e) : e;
}
function dn(e, t, n) {
	var r = t.position || "inside", i = t.distance == null ? 5 : t.distance, a = n.height, o = n.width, s = a / 2, c = n.x, l = n.y, u = "left", d = "top";
	if (r instanceof Array) c += un(r[0], n.width), l += un(r[1], n.height), u = null, d = null;
	else switch (r) {
		case "left":
			c -= i, l += s, u = "right", d = "middle";
			break;
		case "right":
			c += i + o, l += s, d = "middle";
			break;
		case "top":
			c += o / 2, l -= i, u = "center", d = "bottom";
			break;
		case "bottom":
			c += o / 2, l += a + i, u = "center";
			break;
		case "inside":
			c += o / 2, l += s, u = "center", d = "middle";
			break;
		case "insideLeft":
			c += i, l += s, d = "middle";
			break;
		case "insideRight":
			c += o - i, l += s, u = "right", d = "middle";
			break;
		case "insideTop":
			c += o / 2, l += i, u = "center";
			break;
		case "insideBottom":
			c += o / 2, l += a - i, u = "center", d = "bottom";
			break;
		case "insideTopLeft":
			c += i, l += i;
			break;
		case "insideTopRight":
			c += o - i, l += i, u = "right";
			break;
		case "insideBottomLeft":
			c += i, l += a - i, d = "bottom";
			break;
		case "insideBottomRight": c += o - i, l += a - i, u = "right", d = "bottom";
	}
	return e ||= {}, e.x = c, e.y = l, e.align = u, e.verticalAlign = d, e;
}
//#endregion
//#region node_modules/zrender/lib/graphic/helper/parseText.js
var fn = /\{([a-zA-Z0-9_]+)\|([^}]*)\}/g;
function pn(e, t, n, r, i, a) {
	if (!n) {
		e.text = "", e.isTruncated = !1;
		return;
	}
	var o = (t + "").split("\n");
	a = mn(n, r, i, a);
	for (var s = !1, c = {}, l = 0, u = o.length; l < u; l++) hn(c, o[l], a), o[l] = c.textLine, s ||= c.isTruncated;
	e.text = o.join("\n"), e.isTruncated = s;
}
function mn(e, t, n, r) {
	r ||= {};
	var i = k({}, r);
	n = K(n, "..."), i.maxIterations = K(r.maxIterations, 2);
	var a = i.minChar = K(r.minChar, 0), o = i.fontMeasureInfo = Zt(t), s = o.asciiCharWidth;
	i.placeholder = K(r.placeholder, "");
	for (var c = e = Math.max(0, e - 1), l = 0; l < a && c >= s; l++) c -= s;
	var u = rn(o, n);
	return u > c && (n = "", u = 0), c = e - u, i.ellipsis = n, i.ellipsisWidth = u, i.contentWidth = c, i.containerWidth = e, i;
}
function hn(e, t, n) {
	var r = n.containerWidth, i = n.contentWidth, a = n.fontMeasureInfo;
	if (!r) {
		e.textLine = "", e.isTruncated = !1;
		return;
	}
	var o = rn(a, t);
	if (o <= r) {
		e.textLine = t, e.isTruncated = !1;
		return;
	}
	for (var s = 0;; s++) {
		if (o <= i || s >= n.maxIterations) {
			t += n.ellipsis;
			break;
		}
		var c = s === 0 ? gn(t, i, a) : o > 0 ? Math.floor(t.length * i / o) : 0;
		t = t.substr(0, c), o = rn(a, t);
	}
	t === "" && (t = n.placeholder), e.textLine = t, e.isTruncated = !0;
}
function gn(e, t, n) {
	for (var r = 0, i = 0, a = e.length; i < a && r < t; i++) r += nn(n, e.charCodeAt(i));
	return i;
}
function _n(e, t, n, r) {
	var i = An(e), a = t.overflow, o = t.padding, s = o ? o[1] + o[3] : 0, c = o ? o[0] + o[2] : 0, l = t.font, u = a === "truncate", d = ln(l), f = K(t.lineHeight, d), p = t.lineOverflow === "truncate", m = !1, h = t.width;
	h == null && n != null && (h = n - s);
	var g = t.height;
	g == null && r != null && (g = r - c);
	var _ = h != null && (a === "break" || a === "breakAll") ? i ? En(i, t.font, h, a === "breakAll", 0).lines : [] : i ? i.split("\n") : [], v = _.length * f;
	if (g ??= v, v > g && p) {
		var y = Math.floor(g / f);
		m ||= _.length > y, _ = _.slice(0, y), v = _.length * f;
	}
	if (i && u && h != null) for (var b = mn(h, l, t.ellipsis, {
		minChar: t.truncateMinChar,
		placeholder: t.placeholder
	}), x = {}, S = 0; S < _.length; S++) hn(x, _[S], b), _[S] = x.textLine, m ||= x.isTruncated;
	for (var C = g, w = 0, T = Zt(l), S = 0; S < _.length; S++) w = Math.max(rn(T, _[S]), w);
	h ??= w;
	var E = h;
	return C += c, E += s, {
		lines: _,
		height: g,
		outerWidth: E,
		outerHeight: C,
		lineHeight: f,
		calculatedLineHeight: d,
		contentWidth: w,
		contentHeight: v,
		width: h,
		isTruncated: m
	};
}
var vn = function() {
	function e() {}
	return e;
}(), yn = function() {
	function e(e) {
		this.tokens = [], e && (this.tokens = e);
	}
	return e;
}(), bn = function() {
	function e() {
		this.width = 0, this.height = 0, this.contentWidth = 0, this.contentHeight = 0, this.outerWidth = 0, this.outerHeight = 0, this.lines = [], this.isTruncated = !1;
	}
	return e;
}();
function xn(e, t, n, r, i) {
	var a = new bn(), o = An(e);
	if (!o) return a;
	var s = t.padding, c = s ? s[1] + s[3] : 0, l = s ? s[0] + s[2] : 0, u = t.width;
	u == null && n != null && (u = n - c);
	var d = t.height;
	d == null && r != null && (d = r - l);
	for (var f = t.overflow, p = (f === "break" || f === "breakAll") && u != null ? {
		width: u,
		accumWidth: 0,
		breakAll: f === "breakAll"
	} : null, m = fn.lastIndex = 0, h; (h = fn.exec(o)) != null;) {
		var g = h.index;
		g > m && Sn(a, o.substring(m, g), t, p), Sn(a, h[2], t, p, h[1]), m = fn.lastIndex;
	}
	m < o.length && Sn(a, o.substring(m, o.length), t, p);
	var _ = [], v = 0, y = 0, b = f === "truncate", x = t.lineOverflow === "truncate", S = {};
	function C(e, t, n) {
		e.width = t, e.lineHeight = n, v += n, y = Math.max(y, t);
	}
	outer: for (var w = 0; w < a.lines.length; w++) {
		for (var T = a.lines[w], E = 0, D = 0, O = 0; O < T.tokens.length; O++) {
			var k = T.tokens[O], A = k.styleName && t.rich[k.styleName] || {}, j = k.textPadding = A.padding, M = j ? j[1] + j[3] : 0, ee = k.font = A.font || t.font;
			k.contentHeight = ln(ee);
			var N = K(A.height, k.contentHeight);
			if (k.innerHeight = N, j && (N += j[0] + j[2]), k.height = N, k.lineHeight = de(A.lineHeight, t.lineHeight, N), k.align = A && A.align || i, k.verticalAlign = A && A.verticalAlign || "middle", x && d != null && v + k.lineHeight > d) {
				var P = a.lines.length;
				O > 0 ? (T.tokens = T.tokens.slice(0, O), C(T, D, E), a.lines = a.lines.slice(0, w + 1)) : a.lines = a.lines.slice(0, w), a.isTruncated = a.isTruncated || a.lines.length < P;
				break outer;
			}
			var F = A.width, I = F == null || F === "auto";
			if (typeof F == "string" && F.charAt(F.length - 1) === "%") k.percentWidth = F, _.push(k), k.contentWidth = rn(Zt(ee), k.text);
			else {
				if (I) {
					var te = A.backgroundColor, L = te && te.image;
					L && (L = Ze(L), et(L) && (k.width = Math.max(k.width, L.width * N / L.height)));
				}
				var ne = b && u != null ? u - D : null;
				ne != null && ne < k.width ? !I || ne < M ? (k.text = "", k.width = k.contentWidth = 0) : (pn(S, k.text, ne - M, ee, t.ellipsis, { minChar: t.truncateMinChar }), k.text = S.text, a.isTruncated = a.isTruncated || S.isTruncated, k.width = k.contentWidth = rn(Zt(ee), k.text)) : k.contentWidth = rn(Zt(ee), k.text);
			}
			k.width += M, D += k.width, A && (E = Math.max(E, k.lineHeight));
		}
		C(T, D, E);
	}
	a.outerWidth = a.width = K(u, y), a.outerHeight = a.height = K(d, v), a.contentHeight = v, a.contentWidth = y, a.outerWidth += c, a.outerHeight += l;
	for (var w = 0; w < _.length; w++) {
		var k = _[w], R = k.percentWidth;
		k.width = parseInt(R, 10) / 100 * a.width;
	}
	return a;
}
function Sn(e, t, n, r, i) {
	var a = t === "", o = i && n.rich[i] || {}, s = e.lines, c = o.font || n.font, l = !1, u, d;
	if (r) {
		var f = o.padding, p = f ? f[1] + f[3] : 0;
		if (o.width != null && o.width !== "auto") {
			var m = un(o.width, r.width) + p;
			s.length > 0 && m + r.accumWidth > r.width && (u = t.split("\n"), l = !0), r.accumWidth = m;
		} else {
			var h = En(t, c, r.width, r.breakAll, r.accumWidth);
			r.accumWidth = h.accumWidth + p, d = h.linesWidths, u = h.lines;
		}
	}
	u ||= t.split("\n");
	for (var g = Zt(c), _ = 0; _ < u.length; _++) {
		var v = u[_], y = new vn();
		if (y.styleName = i, y.text = v, y.isLineHolder = !v && !a, y.width = typeof o.width == "number" ? o.width : d ? d[_] : rn(g, v), !_ && !l) {
			var b = (s[s.length - 1] || (s[0] = new yn())).tokens, x = b.length;
			x === 1 && b[0].isLineHolder ? b[0] = y : (v || !x || a) && b.push(y);
		} else s.push(new yn([y]));
	}
}
function Cn(e) {
	var t = e.charCodeAt(0);
	return t >= 32 && t <= 591 || t >= 880 && t <= 4351 || t >= 4608 && t <= 5119 || t >= 7680 && t <= 8303;
}
var wn = te(",&?/;] ".split(""), function(e, t) {
	return e[t] = !0, e;
}, {});
function Tn(e) {
	return !Cn(e) || !!wn[e];
}
function En(e, t, n, r, i) {
	for (var a = [], o = [], s = "", c = "", l = 0, u = 0, d = Zt(t), f = 0; f < e.length; f++) {
		var p = e.charAt(f);
		if (p === "\n") {
			c && (s += c, u += l), a.push(s), o.push(u), s = "", c = "", l = 0, u = 0;
			continue;
		}
		var m = nn(d, p.charCodeAt(0)), h = !r && !Tn(p);
		if (a.length ? u + m > n : i + u + m > n) {
			u ? (s || c) && (h ? (s || (s = c, c = "", l = 0, u = l), a.push(s), o.push(u - l), c += p, l += m, s = "", u = l) : (c && (s += c, c = "", l = 0), a.push(s), o.push(u), s = p, u = m)) : h ? (a.push(c), o.push(l), c = p, l = m) : (a.push(p), o.push(m));
			continue;
		}
		u += m, h ? (c += p, l += m) : (c && (s += c, c = "", l = 0), s += p);
	}
	return c && (s += c), s && (a.push(s), o.push(u)), a.length === 1 && (u += i), {
		accumWidth: u,
		lines: a,
		linesWidths: o
	};
}
function Dn(e, t, n, r, i, a) {
	if (e.baseX = n, e.baseY = r, e.outerWidth = e.outerHeight = null, t) {
		var o = t.width * 2, s = t.height * 2;
		Y.set(On, sn(n, o, i), cn(r, s, a), o, s), Y.intersect(t, On, null, kn);
		var c = kn.outIntersectRect;
		e.outerWidth = c.width, e.outerHeight = c.height, e.baseX = sn(c.x, c.width, i, !0), e.baseY = cn(c.y, c.height, a, !0);
	}
}
var On = new Y(0, 0, 0, 0), kn = {
	outIntersectRect: {},
	clamp: !0
};
function An(e) {
	return e == null ? e = "" : e += "";
}
function jn(e) {
	var t = An(e.text), n = e.font;
	return Mn(e, rn(Zt(n), t), ln(n), null);
}
function Mn(e, t, n, r) {
	var i = new Y(sn(e.x || 0, t, e.textAlign), cn(e.y || 0, n, e.textBaseline), t, n), a = r ?? (Nn(e) ? e.lineWidth : 0);
	return a > 0 && (i.x -= a / 2, i.y -= a / 2, i.width += a, i.height += a), i;
}
function Nn(e) {
	var t = e.stroke;
	return t != null && t !== "none" && e.lineWidth > 0;
}
//#endregion
//#region node_modules/zrender/lib/core/Transformable.js
var Pn = nt, Fn = 5e-5;
function In(e) {
	return e > Fn || e < -Fn;
}
var Ln = [], Rn = [], zn = tt(), Bn = Math.abs, Vn = function() {
	function e() {}
	return e.prototype.getLocalTransform = function(e) {
		return Hn(this, e);
	}, e.prototype.setPosition = function(e) {
		this.x = e[0], this.y = e[1];
	}, e.prototype.setScale = function(e) {
		this.scaleX = e[0], this.scaleY = e[1];
	}, e.prototype.setSkew = function(e) {
		this.skewX = e[0], this.skewY = e[1];
	}, e.prototype.setOrigin = function(e) {
		this.originX = e[0], this.originY = e[1];
	}, e.prototype.needLocalTransform = function() {
		return In(this.rotation) || In(this.x) || In(this.y) || In(this.scaleX - 1) || In(this.scaleY - 1) || In(this.skewX) || In(this.skewY);
	}, e.prototype.updateTransform = function() {
		var e = this.parent && this.parent.transform, t = this.needLocalTransform(), n = this.transform;
		if (!(t || e)) {
			n && (Pn(n), this.invTransform = null);
			return;
		}
		n ||= tt(), t ? this.getLocalTransform(n) : Pn(n), e && (t ? it(n, e, n) : rt(n, e)), this.transform = n, this._resolveGlobalScaleRatio(n), this.invTransform = this.invTransform || tt(), ct(this.invTransform, n);
	}, e.prototype._resolveGlobalScaleRatio = function(e) {
		var t = this.globalScaleRatio;
		if (t != null && t !== 1) {
			this.getGlobalScale(Ln);
			var n = Ln[0] < 0 ? -1 : 1, r = Ln[1] < 0 ? -1 : 1, i = ((Ln[0] - n) * t + n) / Ln[0] || 0, a = ((Ln[1] - r) * t + r) / Ln[1] || 0;
			e[0] *= i, e[1] *= i, e[2] *= a, e[3] *= a;
		}
	}, e.prototype.getComputedTransform = function() {
		for (var e = this, t = []; e;) t.push(e), e = e.parent;
		for (; e = t.pop();) e.updateTransform();
		return this.transform;
	}, e.prototype.setLocalTransform = function(e) {
		if (e) {
			var t = e[0] * e[0] + e[1] * e[1], n = e[2] * e[2] + e[3] * e[3], r = Math.atan2(e[1], e[0]), i = Math.PI / 2 + r - Math.atan2(e[3], e[2]);
			n = Math.sqrt(n) * Math.cos(i), t = Math.sqrt(t), this.skewX = i, this.skewY = 0, this.rotation = -r, this.x = +e[4], this.y = +e[5], this.scaleX = t, this.scaleY = n, this.originX = 0, this.originY = 0;
		}
	}, e.prototype.decomposeTransform = function() {
		if (this.transform) {
			var e = this.parent, t = this.transform;
			e && e.transform && (e.invTransform = e.invTransform || tt(), it(Rn, e.invTransform, t), t = Rn);
			var n = this.originX, r = this.originY;
			(n || r) && (zn[4] = n, zn[5] = r, it(Rn, t, zn), Rn[4] -= n, Rn[5] -= r, t = Rn), this.setLocalTransform(t);
		}
	}, e.prototype.getGlobalScale = function(e) {
		var t = this.transform;
		return e ||= [], t ? (e[0] = Math.sqrt(t[0] * t[0] + t[1] * t[1]), e[1] = Math.sqrt(t[2] * t[2] + t[3] * t[3]), t[0] < 0 && (e[0] = -e[0]), t[3] < 0 && (e[1] = -e[1]), e) : (e[0] = 1, e[1] = 1, e);
	}, e.prototype.transformCoordToLocal = function(e, t) {
		var n = [e, t], r = this.invTransform;
		return r && Ct(n, n, r), n;
	}, e.prototype.transformCoordToGlobal = function(e, t) {
		var n = [e, t], r = this.transform;
		return r && Ct(n, n, r), n;
	}, e.prototype.getLineScale = function() {
		var e = this.transform;
		return e && Bn(e[0] - 1) > 1e-10 && Bn(e[3] - 1) > 1e-10 ? Math.sqrt(Bn(e[0] * e[3] - e[2] * e[1])) : 1;
	}, e.prototype.copyTransform = function(e) {
		Gn(this, e);
	}, e.getLocalTransform = function(e, t) {
		t ||= [];
		var n = e.originX || 0, r = e.originY || 0, i = e.scaleX, a = e.scaleY, o = e.anchorX, s = e.anchorY, c = e.rotation || 0, l = e.x, u = e.y, d = e.skewX ? Math.tan(e.skewX) : 0, f = e.skewY ? Math.tan(-e.skewY) : 0;
		if (n || r || o || s) {
			var p = n + o, m = r + s;
			t[4] = -p * i - d * m * a, t[5] = -m * a - f * p * i;
		} else t[4] = t[5] = 0;
		return t[0] = i, t[3] = a, t[1] = f * i, t[2] = d * a, c && ot(t, t, c), t[4] += n + l, t[5] += r + u, t;
	}, e.initDefaultProps = (function() {
		var t = e.prototype;
		t.scaleX = t.scaleY = t.globalScaleRatio = 1, t.x = t.y = t.originX = t.originY = t.skewX = t.skewY = t.rotation = t.anchorX = t.anchorY = 0;
	})(), e;
}(), Hn = Vn.getLocalTransform;
function Un() {
	return new Vn();
}
var Wn = [
	"x",
	"y",
	"originX",
	"originY",
	"anchorX",
	"anchorY",
	"rotation",
	"scaleX",
	"scaleY",
	"skewX",
	"skewY"
];
function Gn(e, t) {
	return A(e, t, Wn);
}
//#endregion
//#region node_modules/zrender/lib/animation/easing.js
var Kn = {
	linear: function(e) {
		return e;
	},
	quadraticIn: function(e) {
		return e * e;
	},
	quadraticOut: function(e) {
		return e * (2 - e);
	},
	quadraticInOut: function(e) {
		return (e *= 2) < 1 ? .5 * e * e : -.5 * (--e * (e - 2) - 1);
	},
	cubicIn: function(e) {
		return e * e * e;
	},
	cubicOut: function(e) {
		return --e * e * e + 1;
	},
	cubicInOut: function(e) {
		return (e *= 2) < 1 ? .5 * e * e * e : .5 * ((e -= 2) * e * e + 2);
	},
	quarticIn: function(e) {
		return e * e * e * e;
	},
	quarticOut: function(e) {
		return 1 - --e * e * e * e;
	},
	quarticInOut: function(e) {
		return (e *= 2) < 1 ? .5 * e * e * e * e : -.5 * ((e -= 2) * e * e * e - 2);
	},
	quinticIn: function(e) {
		return e * e * e * e * e;
	},
	quinticOut: function(e) {
		return --e * e * e * e * e + 1;
	},
	quinticInOut: function(e) {
		return (e *= 2) < 1 ? .5 * e * e * e * e * e : .5 * ((e -= 2) * e * e * e * e + 2);
	},
	sinusoidalIn: function(e) {
		return 1 - Math.cos(e * Math.PI / 2);
	},
	sinusoidalOut: function(e) {
		return Math.sin(e * Math.PI / 2);
	},
	sinusoidalInOut: function(e) {
		return .5 * (1 - Math.cos(Math.PI * e));
	},
	exponentialIn: function(e) {
		return e === 0 ? 0 : 1024 ** (e - 1);
	},
	exponentialOut: function(e) {
		return e === 1 ? 1 : 1 - 2 ** (-10 * e);
	},
	exponentialInOut: function(e) {
		return e === 0 ? 0 : e === 1 ? 1 : (e *= 2) < 1 ? .5 * 1024 ** (e - 1) : .5 * (-(2 ** (-10 * (e - 1))) + 2);
	},
	circularIn: function(e) {
		return 1 - Math.sqrt(1 - e * e);
	},
	circularOut: function(e) {
		return Math.sqrt(1 - --e * e);
	},
	circularInOut: function(e) {
		return (e *= 2) < 1 ? -.5 * (Math.sqrt(1 - e * e) - 1) : .5 * (Math.sqrt(1 - (e -= 2) * e) + 1);
	},
	elasticIn: function(e) {
		var t, n = .1, r = .4;
		return e === 0 ? 0 : e === 1 ? 1 : (!n || n < 1 ? (n = 1, t = r / 4) : t = r * Math.asin(1 / n) / (2 * Math.PI), -(n * 2 ** (10 * --e) * Math.sin((e - t) * (2 * Math.PI) / r)));
	},
	elasticOut: function(e) {
		var t, n = .1, r = .4;
		return e === 0 ? 0 : e === 1 ? 1 : (!n || n < 1 ? (n = 1, t = r / 4) : t = r * Math.asin(1 / n) / (2 * Math.PI), n * 2 ** (-10 * e) * Math.sin((e - t) * (2 * Math.PI) / r) + 1);
	},
	elasticInOut: function(e) {
		var t, n = .1, r = .4;
		return e === 0 ? 0 : e === 1 ? 1 : (!n || n < 1 ? (n = 1, t = r / 4) : t = r * Math.asin(1 / n) / (2 * Math.PI), (e *= 2) < 1 ? -.5 * (n * 2 ** (10 * --e) * Math.sin((e - t) * (2 * Math.PI) / r)) : n * 2 ** (-10 * --e) * Math.sin((e - t) * (2 * Math.PI) / r) * .5 + 1);
	},
	backIn: function(e) {
		var t = 1.70158;
		return e * e * ((t + 1) * e - t);
	},
	backOut: function(e) {
		var t = 1.70158;
		return --e * e * ((t + 1) * e + t) + 1;
	},
	backInOut: function(e) {
		var t = 2.5949095;
		return (e *= 2) < 1 ? .5 * (e * e * ((t + 1) * e - t)) : .5 * ((e -= 2) * e * ((t + 1) * e + t) + 2);
	},
	bounceIn: function(e) {
		return 1 - Kn.bounceOut(1 - e);
	},
	bounceOut: function(e) {
		return e < 1 / 2.75 ? 7.5625 * e * e : e < 2 / 2.75 ? 7.5625 * (e -= 1.5 / 2.75) * e + .75 : e < 2.5 / 2.75 ? 7.5625 * (e -= 2.25 / 2.75) * e + .9375 : 7.5625 * (e -= 2.625 / 2.75) * e + .984375;
	},
	bounceInOut: function(e) {
		return e < .5 ? Kn.bounceIn(e * 2) * .5 : Kn.bounceOut(e * 2 - 1) * .5 + .5;
	}
}, qn = Math.pow, Jn = Math.sqrt, Yn = 1e-8, Xn = 1e-4, Zn = Jn(3), Qn = 1 / 3, $n = lt(), er = lt(), tr = lt();
function nr(e) {
	return e > -Yn && e < Yn;
}
function rr(e) {
	return e > Yn || e < -Yn;
}
function ir(e, t, n, r, i) {
	var a = 1 - i;
	return a * a * (a * e + 3 * i * t) + i * i * (i * r + 3 * a * n);
}
function ar(e, t, n, r, i) {
	var a = 1 - i;
	return 3 * (((t - e) * a + 2 * (n - t) * i) * a + (r - n) * i * i);
}
function or(e, t, n, r, i, a) {
	var o = r + 3 * (t - n) - e, s = 3 * (n - t * 2 + e), c = 3 * (t - e), l = e - i, u = s * s - 3 * o * c, d = s * c - 9 * o * l, f = c * c - 3 * s * l, p = 0;
	if (nr(u) && nr(d)) {
		if (nr(s)) a[0] = 0;
		else {
			var m = -c / s;
			m >= 0 && m <= 1 && (a[p++] = m);
		}
	} else {
		var h = d * d - 4 * u * f;
		if (nr(h)) {
			var g = d / u, m = -s / o + g, _ = -g / 2;
			m >= 0 && m <= 1 && (a[p++] = m), _ >= 0 && _ <= 1 && (a[p++] = _);
		} else if (h > 0) {
			var v = Jn(h), y = u * s + 1.5 * o * (-d + v), b = u * s + 1.5 * o * (-d - v);
			y = y < 0 ? -qn(-y, Qn) : qn(y, Qn), b = b < 0 ? -qn(-b, Qn) : qn(b, Qn);
			var m = (-s - (y + b)) / (3 * o);
			m >= 0 && m <= 1 && (a[p++] = m);
		} else {
			var x = (2 * u * s - 3 * o * d) / (2 * Jn(u * u * u)), S = Math.acos(x) / 3, C = Jn(u), w = Math.cos(S), m = (-s - 2 * C * w) / (3 * o), _ = (-s + C * (w + Zn * Math.sin(S))) / (3 * o), T = (-s + C * (w - Zn * Math.sin(S))) / (3 * o);
			m >= 0 && m <= 1 && (a[p++] = m), _ >= 0 && _ <= 1 && (a[p++] = _), T >= 0 && T <= 1 && (a[p++] = T);
		}
	}
	return p;
}
function sr(e, t, n, r, i) {
	var a = 6 * n - 12 * t + 6 * e, o = 9 * t + 3 * r - 3 * e - 9 * n, s = 3 * t - 3 * e, c = 0;
	if (nr(o)) {
		if (rr(a)) {
			var l = -s / a;
			l >= 0 && l <= 1 && (i[c++] = l);
		}
	} else {
		var u = a * a - 4 * o * s;
		if (nr(u)) i[0] = -a / (2 * o);
		else if (u > 0) {
			var d = Jn(u), l = (-a + d) / (2 * o), f = (-a - d) / (2 * o);
			l >= 0 && l <= 1 && (i[c++] = l), f >= 0 && f <= 1 && (i[c++] = f);
		}
	}
	return c;
}
function cr(e, t, n, r, i, a) {
	var o = (t - e) * i + e, s = (n - t) * i + t, c = (r - n) * i + n, l = (s - o) * i + o, u = (c - s) * i + s, d = (u - l) * i + l;
	a[0] = e, a[1] = o, a[2] = l, a[3] = d, a[4] = d, a[5] = u, a[6] = c, a[7] = r;
}
function lr(e, t, n, r, i, a, o, s, c, l, u) {
	var d, f = .005, p = Infinity, m, h, g, _;
	$n[0] = c, $n[1] = l;
	for (var v = 0; v < 1; v += .05) er[0] = ir(e, n, i, o, v), er[1] = ir(t, r, a, s, v), g = St($n, er), g < p && (d = v, p = g);
	p = Infinity;
	for (var y = 0; y < 32 && !(f < Xn); y++) m = d - f, h = d + f, er[0] = ir(e, n, i, o, m), er[1] = ir(t, r, a, s, m), g = St(er, $n), m >= 0 && g < p ? (d = m, p = g) : (tr[0] = ir(e, n, i, o, h), tr[1] = ir(t, r, a, s, h), _ = St(tr, $n), h <= 1 && _ < p ? (d = h, p = _) : f *= .5);
	return u && (u[0] = ir(e, n, i, o, d), u[1] = ir(t, r, a, s, d)), Jn(p);
}
function ur(e, t, n, r, i, a, o, s, c) {
	for (var l = e, u = t, d = 0, f = 1 / c, p = 1; p <= c; p++) {
		var m = p * f, h = ir(e, n, i, o, m), g = ir(t, r, a, s, m), _ = h - l, v = g - u;
		d += Math.sqrt(_ * _ + v * v), l = h, u = g;
	}
	return d;
}
function dr(e, t, n, r) {
	var i = 1 - r;
	return i * (i * e + 2 * r * t) + r * r * n;
}
function fr(e, t, n, r) {
	return 2 * ((1 - r) * (t - e) + r * (n - t));
}
function pr(e, t, n, r, i) {
	var a = e - 2 * t + n, o = 2 * (t - e), s = e - r, c = 0;
	if (nr(a)) {
		if (rr(o)) {
			var l = -s / o;
			l >= 0 && l <= 1 && (i[c++] = l);
		}
	} else {
		var u = o * o - 4 * a * s;
		if (nr(u)) {
			var l = -o / (2 * a);
			l >= 0 && l <= 1 && (i[c++] = l);
		} else if (u > 0) {
			var d = Jn(u), l = (-o + d) / (2 * a), f = (-o - d) / (2 * a);
			l >= 0 && l <= 1 && (i[c++] = l), f >= 0 && f <= 1 && (i[c++] = f);
		}
	}
	return c;
}
function mr(e, t, n) {
	var r = e + n - 2 * t;
	return r === 0 ? .5 : (e - t) / r;
}
function hr(e, t, n, r, i) {
	var a = (t - e) * r + e, o = (n - t) * r + t, s = (o - a) * r + a;
	i[0] = e, i[1] = a, i[2] = s, i[3] = s, i[4] = o, i[5] = n;
}
function gr(e, t, n, r, i, a, o, s, c) {
	var l, u = .005, d = Infinity;
	$n[0] = o, $n[1] = s;
	for (var f = 0; f < 1; f += .05) {
		er[0] = dr(e, n, i, f), er[1] = dr(t, r, a, f);
		var p = St($n, er);
		p < d && (l = f, d = p);
	}
	d = Infinity;
	for (var m = 0; m < 32 && !(u < Xn); m++) {
		var h = l - u, g = l + u;
		er[0] = dr(e, n, i, h), er[1] = dr(t, r, a, h);
		var p = St(er, $n);
		if (h >= 0 && p < d) l = h, d = p;
		else {
			tr[0] = dr(e, n, i, g), tr[1] = dr(t, r, a, g);
			var _ = St(tr, $n);
			g <= 1 && _ < d ? (l = g, d = _) : u *= .5;
		}
	}
	return c && (c[0] = dr(e, n, i, l), c[1] = dr(t, r, a, l)), Jn(d);
}
function _r(e, t, n, r, i, a, o) {
	for (var s = e, c = t, l = 0, u = 1 / o, d = 1; d <= o; d++) {
		var f = d * u, p = dr(e, n, i, f), m = dr(t, r, a, f), h = p - s, g = m - c;
		l += Math.sqrt(h * h + g * g), s = p, c = m;
	}
	return l;
}
//#endregion
//#region node_modules/zrender/lib/animation/cubicEasing.js
var vr = /cubic-bezier\(([0-9,\.e ]+)\)/;
function yr(e) {
	var t = e && vr.exec(e);
	if (t) {
		var n = t[1].split(","), r = +he(n[0]), i = +he(n[1]), a = +he(n[2]), o = +he(n[3]);
		if (isNaN(r + i + a + o)) return;
		var s = [];
		return function(e) {
			return e <= 0 ? 0 : e >= 1 ? 1 : or(0, r, a, 1, e, s) && ir(0, i, o, 1, s[0]);
		};
	}
}
//#endregion
//#region node_modules/zrender/lib/animation/Clip.js
var br = function() {
	function e(e) {
		this._inited = !1, this._startTime = 0, this._pausedTime = 0, this._paused = !1, this._life = e.life || 1e3, this._delay = e.delay || 0, this.loop = e.loop || !1, this.onframe = e.onframe || Ee, this.ondestroy = e.ondestroy || Ee, this.onrestart = e.onrestart || Ee, e.easing && this.setEasing(e.easing);
	}
	return e.prototype.step = function(e, t) {
		if (this._inited ||= (this._startTime = e + this._delay, !0), this._paused) {
			this._pausedTime += t;
			return;
		}
		var n = this._life, r = e - this._startTime - this._pausedTime, i = r / n;
		i < 0 && (i = 0), i = Math.min(i, 1);
		var a = this.easingFunc, o = a ? a(i) : i;
		if (this.onframe(o), i === 1) {
			if (this.loop) {
				var s = r % n;
				this._startTime = e - s, this._pausedTime = 0, this.onrestart();
			} else return !0;
		}
		return !1;
	}, e.prototype.pause = function() {
		this._paused = !0;
	}, e.prototype.resume = function() {
		this._paused = !1;
	}, e.prototype.setEasing = function(e) {
		this.easing = e, this.easingFunc = H(e) ? e : Kn[e] || yr(e);
	}, e;
}(), xr = {
	transparent: [
		0,
		0,
		0,
		0
	],
	aliceblue: [
		240,
		248,
		255,
		1
	],
	antiquewhite: [
		250,
		235,
		215,
		1
	],
	aqua: [
		0,
		255,
		255,
		1
	],
	aquamarine: [
		127,
		255,
		212,
		1
	],
	azure: [
		240,
		255,
		255,
		1
	],
	beige: [
		245,
		245,
		220,
		1
	],
	bisque: [
		255,
		228,
		196,
		1
	],
	black: [
		0,
		0,
		0,
		1
	],
	blanchedalmond: [
		255,
		235,
		205,
		1
	],
	blue: [
		0,
		0,
		255,
		1
	],
	blueviolet: [
		138,
		43,
		226,
		1
	],
	brown: [
		165,
		42,
		42,
		1
	],
	burlywood: [
		222,
		184,
		135,
		1
	],
	cadetblue: [
		95,
		158,
		160,
		1
	],
	chartreuse: [
		127,
		255,
		0,
		1
	],
	chocolate: [
		210,
		105,
		30,
		1
	],
	coral: [
		255,
		127,
		80,
		1
	],
	cornflowerblue: [
		100,
		149,
		237,
		1
	],
	cornsilk: [
		255,
		248,
		220,
		1
	],
	crimson: [
		220,
		20,
		60,
		1
	],
	cyan: [
		0,
		255,
		255,
		1
	],
	darkblue: [
		0,
		0,
		139,
		1
	],
	darkcyan: [
		0,
		139,
		139,
		1
	],
	darkgoldenrod: [
		184,
		134,
		11,
		1
	],
	darkgray: [
		169,
		169,
		169,
		1
	],
	darkgreen: [
		0,
		100,
		0,
		1
	],
	darkgrey: [
		169,
		169,
		169,
		1
	],
	darkkhaki: [
		189,
		183,
		107,
		1
	],
	darkmagenta: [
		139,
		0,
		139,
		1
	],
	darkolivegreen: [
		85,
		107,
		47,
		1
	],
	darkorange: [
		255,
		140,
		0,
		1
	],
	darkorchid: [
		153,
		50,
		204,
		1
	],
	darkred: [
		139,
		0,
		0,
		1
	],
	darksalmon: [
		233,
		150,
		122,
		1
	],
	darkseagreen: [
		143,
		188,
		143,
		1
	],
	darkslateblue: [
		72,
		61,
		139,
		1
	],
	darkslategray: [
		47,
		79,
		79,
		1
	],
	darkslategrey: [
		47,
		79,
		79,
		1
	],
	darkturquoise: [
		0,
		206,
		209,
		1
	],
	darkviolet: [
		148,
		0,
		211,
		1
	],
	deeppink: [
		255,
		20,
		147,
		1
	],
	deepskyblue: [
		0,
		191,
		255,
		1
	],
	dimgray: [
		105,
		105,
		105,
		1
	],
	dimgrey: [
		105,
		105,
		105,
		1
	],
	dodgerblue: [
		30,
		144,
		255,
		1
	],
	firebrick: [
		178,
		34,
		34,
		1
	],
	floralwhite: [
		255,
		250,
		240,
		1
	],
	forestgreen: [
		34,
		139,
		34,
		1
	],
	fuchsia: [
		255,
		0,
		255,
		1
	],
	gainsboro: [
		220,
		220,
		220,
		1
	],
	ghostwhite: [
		248,
		248,
		255,
		1
	],
	gold: [
		255,
		215,
		0,
		1
	],
	goldenrod: [
		218,
		165,
		32,
		1
	],
	gray: [
		128,
		128,
		128,
		1
	],
	green: [
		0,
		128,
		0,
		1
	],
	greenyellow: [
		173,
		255,
		47,
		1
	],
	grey: [
		128,
		128,
		128,
		1
	],
	honeydew: [
		240,
		255,
		240,
		1
	],
	hotpink: [
		255,
		105,
		180,
		1
	],
	indianred: [
		205,
		92,
		92,
		1
	],
	indigo: [
		75,
		0,
		130,
		1
	],
	ivory: [
		255,
		255,
		240,
		1
	],
	khaki: [
		240,
		230,
		140,
		1
	],
	lavender: [
		230,
		230,
		250,
		1
	],
	lavenderblush: [
		255,
		240,
		245,
		1
	],
	lawngreen: [
		124,
		252,
		0,
		1
	],
	lemonchiffon: [
		255,
		250,
		205,
		1
	],
	lightblue: [
		173,
		216,
		230,
		1
	],
	lightcoral: [
		240,
		128,
		128,
		1
	],
	lightcyan: [
		224,
		255,
		255,
		1
	],
	lightgoldenrodyellow: [
		250,
		250,
		210,
		1
	],
	lightgray: [
		211,
		211,
		211,
		1
	],
	lightgreen: [
		144,
		238,
		144,
		1
	],
	lightgrey: [
		211,
		211,
		211,
		1
	],
	lightpink: [
		255,
		182,
		193,
		1
	],
	lightsalmon: [
		255,
		160,
		122,
		1
	],
	lightseagreen: [
		32,
		178,
		170,
		1
	],
	lightskyblue: [
		135,
		206,
		250,
		1
	],
	lightslategray: [
		119,
		136,
		153,
		1
	],
	lightslategrey: [
		119,
		136,
		153,
		1
	],
	lightsteelblue: [
		176,
		196,
		222,
		1
	],
	lightyellow: [
		255,
		255,
		224,
		1
	],
	lime: [
		0,
		255,
		0,
		1
	],
	limegreen: [
		50,
		205,
		50,
		1
	],
	linen: [
		250,
		240,
		230,
		1
	],
	magenta: [
		255,
		0,
		255,
		1
	],
	maroon: [
		128,
		0,
		0,
		1
	],
	mediumaquamarine: [
		102,
		205,
		170,
		1
	],
	mediumblue: [
		0,
		0,
		205,
		1
	],
	mediumorchid: [
		186,
		85,
		211,
		1
	],
	mediumpurple: [
		147,
		112,
		219,
		1
	],
	mediumseagreen: [
		60,
		179,
		113,
		1
	],
	mediumslateblue: [
		123,
		104,
		238,
		1
	],
	mediumspringgreen: [
		0,
		250,
		154,
		1
	],
	mediumturquoise: [
		72,
		209,
		204,
		1
	],
	mediumvioletred: [
		199,
		21,
		133,
		1
	],
	midnightblue: [
		25,
		25,
		112,
		1
	],
	mintcream: [
		245,
		255,
		250,
		1
	],
	mistyrose: [
		255,
		228,
		225,
		1
	],
	moccasin: [
		255,
		228,
		181,
		1
	],
	navajowhite: [
		255,
		222,
		173,
		1
	],
	navy: [
		0,
		0,
		128,
		1
	],
	oldlace: [
		253,
		245,
		230,
		1
	],
	olive: [
		128,
		128,
		0,
		1
	],
	olivedrab: [
		107,
		142,
		35,
		1
	],
	orange: [
		255,
		165,
		0,
		1
	],
	orangered: [
		255,
		69,
		0,
		1
	],
	orchid: [
		218,
		112,
		214,
		1
	],
	palegoldenrod: [
		238,
		232,
		170,
		1
	],
	palegreen: [
		152,
		251,
		152,
		1
	],
	paleturquoise: [
		175,
		238,
		238,
		1
	],
	palevioletred: [
		219,
		112,
		147,
		1
	],
	papayawhip: [
		255,
		239,
		213,
		1
	],
	peachpuff: [
		255,
		218,
		185,
		1
	],
	peru: [
		205,
		133,
		63,
		1
	],
	pink: [
		255,
		192,
		203,
		1
	],
	plum: [
		221,
		160,
		221,
		1
	],
	powderblue: [
		176,
		224,
		230,
		1
	],
	purple: [
		128,
		0,
		128,
		1
	],
	red: [
		255,
		0,
		0,
		1
	],
	rosybrown: [
		188,
		143,
		143,
		1
	],
	royalblue: [
		65,
		105,
		225,
		1
	],
	saddlebrown: [
		139,
		69,
		19,
		1
	],
	salmon: [
		250,
		128,
		114,
		1
	],
	sandybrown: [
		244,
		164,
		96,
		1
	],
	seagreen: [
		46,
		139,
		87,
		1
	],
	seashell: [
		255,
		245,
		238,
		1
	],
	sienna: [
		160,
		82,
		45,
		1
	],
	silver: [
		192,
		192,
		192,
		1
	],
	skyblue: [
		135,
		206,
		235,
		1
	],
	slateblue: [
		106,
		90,
		205,
		1
	],
	slategray: [
		112,
		128,
		144,
		1
	],
	slategrey: [
		112,
		128,
		144,
		1
	],
	snow: [
		255,
		250,
		250,
		1
	],
	springgreen: [
		0,
		255,
		127,
		1
	],
	steelblue: [
		70,
		130,
		180,
		1
	],
	tan: [
		210,
		180,
		140,
		1
	],
	teal: [
		0,
		128,
		128,
		1
	],
	thistle: [
		216,
		191,
		216,
		1
	],
	tomato: [
		255,
		99,
		71,
		1
	],
	turquoise: [
		64,
		224,
		208,
		1
	],
	violet: [
		238,
		130,
		238,
		1
	],
	wheat: [
		245,
		222,
		179,
		1
	],
	white: [
		255,
		255,
		255,
		1
	],
	whitesmoke: [
		245,
		245,
		245,
		1
	],
	yellow: [
		255,
		255,
		0,
		1
	],
	yellowgreen: [
		154,
		205,
		50,
		1
	]
};
function Sr(e) {
	return e = Math.round(e), e < 0 ? 0 : e > 255 ? 255 : e;
}
function Cr(e) {
	return e = Math.round(e), e < 0 ? 0 : e > 360 ? 360 : e;
}
function wr(e) {
	return e < 0 ? 0 : e > 1 ? 1 : e;
}
function Tr(e) {
	var t = e;
	return t.length && t.charAt(t.length - 1) === "%" ? Sr(parseFloat(t) / 100 * 255) : Sr(parseInt(t, 10));
}
function Er(e) {
	var t = e;
	return t.length && t.charAt(t.length - 1) === "%" ? wr(parseFloat(t) / 100) : wr(parseFloat(t));
}
function Dr(e, t, n) {
	return n < 0 ? n += 1 : n > 1 && --n, n * 6 < 1 ? e + (t - e) * n * 6 : n * 2 < 1 ? t : n * 3 < 2 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function Or(e, t, n) {
	return e + (t - e) * n;
}
function kr(e, t, n, r, i) {
	return e[0] = t, e[1] = n, e[2] = r, e[3] = i, e;
}
function Ar(e, t) {
	return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e;
}
var jr = new Ye(20), Mr = null;
function Nr(e, t) {
	Mr && Ar(Mr, t), Mr = jr.put(e, Mr || t.slice());
}
function Pr(e, t) {
	if (e) {
		t ||= [];
		var n = jr.get(e);
		if (n) return Ar(t, n);
		e += "";
		var r = e.replace(/ /g, "").toLowerCase();
		if (r in xr) return Ar(t, xr[r]), Nr(e, t), t;
		var i = r.length;
		if (r.charAt(0) === "#") {
			if (i === 4 || i === 5) {
				var a = parseInt(r.slice(1, 4), 16);
				if (!(a >= 0 && a <= 4095)) {
					kr(t, 0, 0, 0, 1);
					return;
				}
				return kr(t, (a & 3840) >> 4 | (a & 3840) >> 8, a & 240 | (a & 240) >> 4, a & 15 | (a & 15) << 4, i === 5 ? parseInt(r.slice(4), 16) / 15 : 1), Nr(e, t), t;
			}
			if (i === 7 || i === 9) {
				var a = parseInt(r.slice(1, 7), 16);
				if (!(a >= 0 && a <= 16777215)) {
					kr(t, 0, 0, 0, 1);
					return;
				}
				return kr(t, (a & 16711680) >> 16, (a & 65280) >> 8, a & 255, i === 9 ? parseInt(r.slice(7), 16) / 255 : 1), Nr(e, t), t;
			}
			return;
		}
		var o = r.indexOf("("), s = r.indexOf(")");
		if (o !== -1 && s + 1 === i) {
			var c = r.substr(0, o), l = r.substr(o + 1, s - (o + 1)).split(","), u = 1;
			switch (c) {
				case "rgba":
					if (l.length !== 4) return l.length === 3 ? kr(t, +l[0], +l[1], +l[2], 1) : kr(t, 0, 0, 0, 1);
					u = Er(l.pop());
				case "rgb":
					if (l.length >= 3) return kr(t, Tr(l[0]), Tr(l[1]), Tr(l[2]), l.length === 3 ? u : Er(l[3])), Nr(e, t), t;
					kr(t, 0, 0, 0, 1);
					return;
				case "hsla":
					if (l.length !== 4) {
						kr(t, 0, 0, 0, 1);
						return;
					}
					return l[3] = Er(l[3]), Fr(l, t), Nr(e, t), t;
				case "hsl":
					if (l.length !== 3) {
						kr(t, 0, 0, 0, 1);
						return;
					}
					return Fr(l, t), Nr(e, t), t;
				default: return;
			}
		}
		kr(t, 0, 0, 0, 1);
	}
}
function Fr(e, t) {
	var n = (parseFloat(e[0]) % 360 + 360) % 360 / 360, r = Er(e[1]), i = Er(e[2]), a = i <= .5 ? i * (r + 1) : i + r - i * r, o = i * 2 - a;
	return t ||= [], kr(t, Sr(Dr(o, a, n + 1 / 3) * 255), Sr(Dr(o, a, n) * 255), Sr(Dr(o, a, n - 1 / 3) * 255), 1), e.length === 4 && (t[3] = e[3]), t;
}
function Ir(e) {
	if (e) {
		var t = e[0] / 255, n = e[1] / 255, r = e[2] / 255, i = Math.min(t, n, r), a = Math.max(t, n, r), o = a - i, s = (a + i) / 2, c, l;
		if (o === 0) c = 0, l = 0;
		else {
			l = s < .5 ? o / (a + i) : o / (2 - a - i);
			var u = ((a - t) / 6 + o / 2) / o, d = ((a - n) / 6 + o / 2) / o, f = ((a - r) / 6 + o / 2) / o;
			t === a ? c = f - d : n === a ? c = 1 / 3 + u - f : r === a && (c = 2 / 3 + d - u), c < 0 && (c += 1), c > 1 && --c;
		}
		var p = [
			c * 360,
			l,
			s
		];
		return e[3] != null && p.push(e[3]), p;
	}
}
function Lr(e, t) {
	var n = Pr(e);
	if (n) {
		for (var r = 0; r < 3; r++) t < 0 ? n[r] = n[r] * (1 - t) | 0 : n[r] = (255 - n[r]) * t + n[r] | 0, n[r] > 255 ? n[r] = 255 : n[r] < 0 && (n[r] = 0);
		return Hr(n, n.length === 4 ? "rgba" : "rgb");
	}
}
function Rr(e, t, n) {
	if (!(!(t && t.length) || !(e >= 0 && e <= 1))) {
		n ||= [];
		var r = e * (t.length - 1), i = Math.floor(r), a = Math.ceil(r), o = t[i], s = t[a], c = r - i;
		return n[0] = Sr(Or(o[0], s[0], c)), n[1] = Sr(Or(o[1], s[1], c)), n[2] = Sr(Or(o[2], s[2], c)), n[3] = wr(Or(o[3], s[3], c)), n;
	}
}
function zr(e, t, n) {
	if (!(!(t && t.length) || !(e >= 0 && e <= 1))) {
		var r = e * (t.length - 1), i = Math.floor(r), a = Math.ceil(r), o = Pr(t[i]), s = Pr(t[a]), c = r - i, l = Hr([
			Sr(Or(o[0], s[0], c)),
			Sr(Or(o[1], s[1], c)),
			Sr(Or(o[2], s[2], c)),
			wr(Or(o[3], s[3], c))
		], "rgba");
		return n ? {
			color: l,
			leftIndex: i,
			rightIndex: a,
			value: r
		} : l;
	}
}
function Br(e, t, n, r) {
	var i = Pr(e);
	if (e) return i = Ir(i), t != null && (i[0] = Cr(H(t) ? t(i[0]) : t)), n != null && (i[1] = Er(H(n) ? n(i[1]) : n)), r != null && (i[2] = Er(H(r) ? r(i[2]) : r)), Hr(Fr(i), "rgba");
}
function Vr(e, t) {
	var n = Pr(e);
	if (n && t != null) return n[3] = wr(t), Hr(n, "rgba");
}
function Hr(e, t) {
	if (!(!e || !e.length)) {
		var n = e[0] + "," + e[1] + "," + e[2];
		return (t === "rgba" || t === "hsva" || t === "hsla") && (n += "," + e[3]), t + "(" + n + ")";
	}
}
function Ur(e, t) {
	var n = Pr(e);
	return n ? (.299 * n[0] + .587 * n[1] + .114 * n[2]) * n[3] / 255 + (1 - n[3]) * t : 0;
}
var Wr = new Ye(100);
function Gr(e) {
	if (U(e)) {
		var t = Wr.get(e);
		return t || (t = Lr(e, -.1), Wr.put(e, t)), t;
	}
	if (ce(e)) {
		var n = k({}, e);
		return n.colorStops = I(e.colorStops, function(e) {
			return {
				offset: e.offset,
				color: Lr(e.color, -.1)
			};
		}), n;
	}
	return e;
}
//#endregion
//#region node_modules/zrender/lib/svg/helper.js
var Kr = Math.round;
function qr(e) {
	var t;
	if (!e || e === "transparent") e = "none";
	else if (typeof e == "string" && e.indexOf("rgba") > -1) {
		var n = Pr(e);
		n && (e = "rgb(" + n[0] + "," + n[1] + "," + n[2] + ")", t = n[3]);
	}
	return {
		color: e,
		opacity: t ?? 1
	};
}
var Jr = 1e-4;
function Yr(e) {
	return e < Jr && e > -Jr;
}
function Xr(e) {
	return Kr(e * 1e3) / 1e3;
}
function Zr(e) {
	return Kr(e * 1e4) / 1e4;
}
function Qr(e) {
	return "matrix(" + Xr(e[0]) + "," + Xr(e[1]) + "," + Xr(e[2]) + "," + Xr(e[3]) + "," + Zr(e[4]) + "," + Zr(e[5]) + ")";
}
var $r = {
	left: "start",
	right: "end",
	center: "middle",
	middle: "middle"
};
function ei(e, t, n) {
	return n === "top" ? e += t / 2 : n === "bottom" && (e -= t / 2), e;
}
function ti(e) {
	return e && (e.shadowBlur || e.shadowOffsetX || e.shadowOffsetY);
}
function ni(e) {
	var t = e.style, n = e.getGlobalScale();
	return [
		t.shadowColor,
		(t.shadowBlur || 0).toFixed(2),
		(t.shadowOffsetX || 0).toFixed(2),
		(t.shadowOffsetY || 0).toFixed(2),
		n[0],
		n[1]
	].join(",");
}
function ri(e) {
	return e && !!e.image;
}
function ii(e) {
	return e && !!e.svgElement;
}
function ai(e) {
	return ri(e) || ii(e);
}
function oi(e) {
	return e.type === "linear";
}
function si(e) {
	return e.type === "radial";
}
function ci(e) {
	return e && (e.type === "linear" || e.type === "radial");
}
function li(e) {
	return "url(#" + e + ")";
}
function ui(e) {
	var t = e.getGlobalScale(), n = Math.max(t[0], t[1]);
	return Math.max(Math.ceil(Math.log(n) / Math.log(10)), 1);
}
function di(e) {
	var t = e.x || 0, n = e.y || 0, r = (e.rotation || 0) * De, i = K(e.scaleX, 1), a = K(e.scaleY, 1), o = e.skewX || 0, s = e.skewY || 0, c = [];
	return (t || n) && c.push("translate(" + t + "px," + n + "px)"), r && c.push("rotate(" + r + ")"), (i !== 1 || a !== 1) && c.push("scale(" + i + "," + a + ")"), (o || s) && c.push("skew(" + Kr(o * De) + "deg, " + Kr(s * De) + "deg)"), c.join(" ");
}
var fi = (function() {
	return typeof Buffer < "u" && typeof Buffer.from == "function" ? function(e) {
		return Buffer.from(e).toString("base64");
	} : typeof btoa == "function" && typeof unescape == "function" && typeof encodeURIComponent == "function" ? function(e) {
		return btoa(unescape(encodeURIComponent(e)));
	} : function(e) {
		return null;
	};
})(), pi = Array.prototype.slice;
function mi(e, t, n) {
	return (t - e) * n + e;
}
function hi(e, t, n, r) {
	for (var i = t.length, a = 0; a < i; a++) e[a] = mi(t[a], n[a], r);
	return e;
}
function gi(e, t, n, r) {
	for (var i = t.length, a = i && t[0].length, o = 0; o < i; o++) {
		e[o] || (e[o] = []);
		for (var s = 0; s < a; s++) e[o][s] = mi(t[o][s], n[o][s], r);
	}
	return e;
}
function _i(e, t, n, r) {
	for (var i = t.length, a = 0; a < i; a++) e[a] = t[a] + n[a] * r;
	return e;
}
function vi(e, t, n, r) {
	for (var i = t.length, a = i && t[0].length, o = 0; o < i; o++) {
		e[o] || (e[o] = []);
		for (var s = 0; s < a; s++) e[o][s] = t[o][s] + n[o][s] * r;
	}
	return e;
}
function yi(e, t) {
	for (var n = e.length, r = t.length, i = n > r ? t : e, a = Math.min(n, r), o = i[a - 1] || {
		color: [
			0,
			0,
			0,
			0
		],
		offset: 0
	}, s = a; s < Math.max(n, r); s++) i.push({
		offset: o.offset,
		color: o.color.slice()
	});
}
function bi(e, t, n) {
	var r = e, i = t;
	if (!(!r.push || !i.push)) {
		var a = r.length, o = i.length;
		if (a !== o) {
			if (a > o) r.length = o;
			else for (var s = a; s < o; s++) r.push(n === 1 ? i[s] : pi.call(i[s]));
		}
		for (var c = r[0] && r[0].length, s = 0; s < r.length; s++) if (n === 1) isNaN(r[s]) && (r[s] = i[s]);
		else for (var l = 0; l < c; l++) isNaN(r[s][l]) && (r[s][l] = i[s][l]);
	}
}
function xi(e) {
	if (P(e)) {
		var t = e.length;
		if (P(e[0])) {
			for (var n = [], r = 0; r < t; r++) n.push(pi.call(e[r]));
			return n;
		}
		return pi.call(e);
	}
	return e;
}
function Si(e) {
	return e[0] = Math.floor(e[0]) || 0, e[1] = Math.floor(e[1]) || 0, e[2] = Math.floor(e[2]) || 0, e[3] = e[3] == null ? 1 : e[3], "rgba(" + e.join(",") + ")";
}
function Ci(e) {
	return P(e && e[0]) ? 2 : 1;
}
var wi = 0, Ti = 1, Ei = 2, Di = 3, Oi = 4, ki = 5, Ai = 6;
function ji(e) {
	return e === Oi || e === ki;
}
function Mi(e) {
	return e === Ti || e === Ei;
}
var Ni = [
	0,
	0,
	0,
	0
], Pi = function() {
	function e(e) {
		this.keyframes = [], this.discrete = !1, this._invalid = !1, this._needsSort = !1, this._lastFr = 0, this._lastFrP = 0, this.propName = e;
	}
	return e.prototype.isFinished = function() {
		return this._finished;
	}, e.prototype.setFinished = function() {
		this._finished = !0, this._additiveTrack && this._additiveTrack.setFinished();
	}, e.prototype.needsAnimate = function() {
		return this.keyframes.length >= 1;
	}, e.prototype.getAdditiveTrack = function() {
		return this._additiveTrack;
	}, e.prototype.addKeyframe = function(e, t, n) {
		this._needsSort = !0;
		var r = this.keyframes, i = r.length, a = !1, o = Ai, s = t;
		if (P(t)) {
			var c = Ci(t);
			o = c, (c === 1 && !W(t[0]) || c === 2 && !W(t[0][0])) && (a = !0);
		} else if (W(t) && !le(t)) o = wi;
		else if (U(t)) {
			if (!isNaN(+t)) o = wi;
			else {
				var l = Pr(t);
				l && (s = l, o = Di);
			}
		} else if (ce(t)) {
			var u = k({}, s);
			u.colorStops = I(t.colorStops, function(e) {
				return {
					offset: e.offset,
					color: Pr(e.color)
				};
			}), oi(t) ? o = Oi : si(t) && (o = ki), s = u;
		}
		i === 0 ? this.valType = o : (o !== this.valType || o === Ai) && (a = !0), this.discrete = this.discrete || a;
		var d = {
			time: e,
			value: s,
			rawValue: t,
			percent: 0
		};
		return n && (d.easing = n, d.easingFunc = H(n) ? n : Kn[n] || yr(n)), r.push(d), d;
	}, e.prototype.prepare = function(e, t) {
		var n = this.keyframes;
		this._needsSort && n.sort(function(e, t) {
			return e.time - t.time;
		});
		for (var r = this.valType, i = n.length, a = n[i - 1], o = this.discrete, s = Mi(r), c = ji(r), l = 0; l < i; l++) {
			var u = n[l], d = u.value, f = a.value;
			u.percent = u.time / e, o || (s && l !== i - 1 ? bi(d, f, r) : c && yi(d.colorStops, f.colorStops));
		}
		if (!o && r !== ki && t && this.needsAnimate() && t.needsAnimate() && r === t.valType && !t._finished) {
			this._additiveTrack = t;
			for (var p = n[0].value, l = 0; l < i; l++) r === wi ? n[l].additiveValue = n[l].value - p : r === Di ? n[l].additiveValue = _i([], n[l].value, p, -1) : Mi(r) && (n[l].additiveValue = r === Ti ? _i([], n[l].value, p, -1) : vi([], n[l].value, p, -1));
		}
	}, e.prototype.step = function(e, t) {
		if (!this._finished) {
			this._additiveTrack && this._additiveTrack._finished && (this._additiveTrack = null);
			var n = this._additiveTrack != null, r = n ? "additiveValue" : "value", i = this.valType, a = this.keyframes, o = a.length, s = this.propName, c = i === Di, l, u = this._lastFr, d = Math.min, f, p;
			if (o === 1) f = p = a[0];
			else {
				if (t < 0) l = 0;
				else if (t < this._lastFrP) {
					for (l = d(u + 1, o - 1); l >= 0 && !(a[l].percent <= t); l--);
					l = d(l, o - 2);
				} else {
					for (l = u; l < o && !(a[l].percent > t); l++);
					l = d(l - 1, o - 2);
				}
				p = a[l + 1], f = a[l];
			}
			if (f && p) {
				this._lastFr = l, this._lastFrP = t;
				var m = p.percent - f.percent, h = m === 0 ? 1 : d((t - f.percent) / m, 1);
				p.easingFunc && (h = p.easingFunc(h));
				var g = n ? this._additiveValue : c ? Ni : e[s];
				if ((Mi(i) || c) && !g && (g = this._additiveValue = []), this.discrete) e[s] = h < 1 ? f.rawValue : p.rawValue;
				else if (Mi(i)) i === Ti ? hi(g, f[r], p[r], h) : gi(g, f[r], p[r], h);
				else if (ji(i)) {
					var _ = f[r], v = p[r], y = i === Oi;
					e[s] = {
						type: y ? "linear" : "radial",
						x: mi(_.x, v.x, h),
						y: mi(_.y, v.y, h),
						colorStops: I(_.colorStops, function(e, t) {
							var n = v.colorStops[t];
							return {
								offset: mi(e.offset, n.offset, h),
								color: Si(hi([], e.color, n.color, h))
							};
						}),
						global: v.global
					}, y ? (e[s].x2 = mi(_.x2, v.x2, h), e[s].y2 = mi(_.y2, v.y2, h)) : e[s].r = mi(_.r, v.r, h);
				} else if (c) hi(g, f[r], p[r], h), n || (e[s] = Si(g));
				else {
					var b = mi(f[r], p[r], h);
					n ? this._additiveValue = b : e[s] = b;
				}
				n && this._addToTarget(e);
			}
		}
	}, e.prototype._addToTarget = function(e) {
		var t = this.valType, n = this.propName, r = this._additiveValue;
		t === wi ? e[n] = e[n] + r : t === Di ? (Pr(e[n], Ni), _i(Ni, Ni, r, 1), e[n] = Si(Ni)) : t === Ti ? _i(e[n], e[n], r, 1) : t === Ei && vi(e[n], e[n], r, 1);
	}, e;
}(), Fi = function() {
	function e(e, t, n, r) {
		if (this._tracks = {}, this._trackKeys = [], this._maxTime = 0, this._started = 0, this._clip = null, this._target = e, this._loop = t, t && r) {
			T("Can' use additive animation on looped animation.");
			return;
		}
		this._additiveAnimators = r, this._allowDiscrete = n;
	}
	return e.prototype.getMaxTime = function() {
		return this._maxTime;
	}, e.prototype.getDelay = function() {
		return this._delay;
	}, e.prototype.getLoop = function() {
		return this._loop;
	}, e.prototype.getTarget = function() {
		return this._target;
	}, e.prototype.changeTarget = function(e) {
		this._target = e;
	}, e.prototype.when = function(e, t, n) {
		return this.whenWithKeys(e, t, R(t), n);
	}, e.prototype.whenWithKeys = function(e, t, n, r) {
		for (var i = this._tracks, a = 0; a < n.length; a++) {
			var o = n[a], s = i[o];
			if (!s) {
				s = i[o] = new Pi(o);
				var c = void 0, l = this._getAdditiveTrack(o);
				if (l) {
					var u = l.keyframes, d = u[u.length - 1];
					c = d && d.value, l.valType === Di && c && (c = Si(c));
				} else c = this._target[o];
				if (c == null) continue;
				e > 0 && s.addKeyframe(0, xi(c), r), this._trackKeys.push(o);
			}
			s.addKeyframe(e, xi(t[o]), r);
		}
		return this._maxTime = Math.max(this._maxTime, e), this;
	}, e.prototype.pause = function() {
		this._clip.pause(), this._paused = !0;
	}, e.prototype.resume = function() {
		this._clip.resume(), this._paused = !1;
	}, e.prototype.isPaused = function() {
		return !!this._paused;
	}, e.prototype.duration = function(e) {
		return this._maxTime = e, this._force = !0, this;
	}, e.prototype._doneCallback = function() {
		this._setTracksFinished(), this._clip = null;
		var e = this._doneCbs;
		if (e) for (var t = e.length, n = 0; n < t; n++) e[n].call(this);
	}, e.prototype._abortedCallback = function() {
		this._setTracksFinished();
		var e = this.animation, t = this._abortedCbs;
		if (e && e.removeClip(this._clip), this._clip = null, t) for (var n = 0; n < t.length; n++) t[n].call(this);
	}, e.prototype._setTracksFinished = function() {
		for (var e = this._tracks, t = this._trackKeys, n = 0; n < t.length; n++) e[t[n]].setFinished();
	}, e.prototype._getAdditiveTrack = function(e) {
		var t, n = this._additiveAnimators;
		if (n) for (var r = 0; r < n.length; r++) {
			var i = n[r].getTrack(e);
			i && (t = i);
		}
		return t;
	}, e.prototype.start = function(e) {
		if (!(this._started > 0)) {
			this._started = 1;
			for (var t = this, n = [], r = this._maxTime || 0, i = 0; i < this._trackKeys.length; i++) {
				var a = this._trackKeys[i], o = this._tracks[a], s = this._getAdditiveTrack(a), c = o.keyframes, l = c.length;
				if (o.prepare(r, s), o.needsAnimate()) {
					if (!this._allowDiscrete && o.discrete) {
						var u = c[l - 1];
						u && (t._target[o.propName] = u.rawValue), o.setFinished();
					} else n.push(o);
				}
			}
			if (n.length || this._force) {
				var d = new br({
					life: r,
					loop: this._loop,
					delay: this._delay || 0,
					onframe: function(e) {
						t._started = 2;
						var r = t._additiveAnimators;
						if (r) {
							for (var i = !1, a = 0; a < r.length; a++) if (r[a]._clip) {
								i = !0;
								break;
							}
							i || (t._additiveAnimators = null);
						}
						for (var a = 0; a < n.length; a++) n[a].step(t._target, e);
						var o = t._onframeCbs;
						if (o) for (var a = 0; a < o.length; a++) o[a](t._target, e);
					},
					ondestroy: function() {
						t._doneCallback();
					}
				});
				this._clip = d, this.animation && this.animation.addClip(d), e && d.setEasing(e);
			} else this._doneCallback();
			return this;
		}
	}, e.prototype.stop = function(e) {
		if (this._clip) {
			var t = this._clip;
			e && t.onframe(1), this._abortedCallback();
		}
	}, e.prototype.delay = function(e) {
		return this._delay = e, this;
	}, e.prototype.during = function(e) {
		return e && (this._onframeCbs ||= [], this._onframeCbs.push(e)), this;
	}, e.prototype.done = function(e) {
		return e && (this._doneCbs ||= [], this._doneCbs.push(e)), this;
	}, e.prototype.aborted = function(e) {
		return e && (this._abortedCbs ||= [], this._abortedCbs.push(e)), this;
	}, e.prototype.getClip = function() {
		return this._clip;
	}, e.prototype.getTrack = function(e) {
		return this._tracks[e];
	}, e.prototype.getTracks = function() {
		var e = this;
		return I(this._trackKeys, function(t) {
			return e._tracks[t];
		});
	}, e.prototype.stopTracks = function(e, t) {
		if (!e.length || !this._clip) return !0;
		for (var n = this._tracks, r = this._trackKeys, i = 0; i < e.length; i++) {
			var a = n[e[i]];
			a && !a.isFinished() && (t ? a.step(this._target, 1) : this._started === 1 && a.step(this._target, 0), a.setFinished());
		}
		for (var o = !0, i = 0; i < r.length; i++) if (!n[r[i]].isFinished()) {
			o = !1;
			break;
		}
		return o && this._abortedCallback(), o;
	}, e.prototype.saveTo = function(e, t, n) {
		if (e) {
			t ||= this._trackKeys;
			for (var r = 0; r < t.length; r++) {
				var i = t[r], a = this._tracks[i];
				if (!(!a || a.isFinished())) {
					var o = a.keyframes, s = o[n ? 0 : o.length - 1];
					s && (e[i] = xi(s.rawValue));
				}
			}
		}
	}, e.prototype.__changeFinalValue = function(e, t) {
		t ||= R(e);
		for (var n = 0; n < t.length; n++) {
			var r = t[n], i = this._tracks[r];
			if (i) {
				var a = i.keyframes;
				if (a.length > 1) {
					var o = a.pop();
					i.addKeyframe(o.time, e[r]), i.prepare(this._maxTime, i.getAdditiveTrack());
				}
			}
		}
	}, e;
}(), Ii = function() {
	function e(e) {
		e && (this._$eventProcessor = e);
	}
	return e.prototype.on = function(e, t, n, r) {
		this._$handlers ||= {};
		var i = this._$handlers;
		if (typeof t == "function" && (r = n, n = t, t = null), !n || !e) return this;
		var a = this._$eventProcessor;
		t != null && a && a.normalizeQuery && (t = a.normalizeQuery(t)), i[e] || (i[e] = []);
		for (var o = 0; o < i[e].length; o++) if (i[e][o].h === n) return this;
		var s = {
			h: n,
			query: t,
			ctx: r || this,
			callAtLast: n.zrEventfulCallAtLast
		}, c = i[e].length - 1, l = i[e][c];
		return l && l.callAtLast ? i[e].splice(c, 0, s) : i[e].push(s), this;
	}, e.prototype.isSilent = function(e) {
		var t = this._$handlers;
		return !t || !t[e] || !t[e].length;
	}, e.prototype.off = function(e, t) {
		var n = this._$handlers;
		if (!n) return this;
		if (!e) return this._$handlers = {}, this;
		if (t) {
			if (n[e]) {
				for (var r = [], i = 0, a = n[e].length; i < a; i++) n[e][i].h !== t && r.push(n[e][i]);
				n[e] = r;
			}
			n[e] && n[e].length === 0 && delete n[e];
		} else delete n[e];
		return this;
	}, e.prototype.trigger = function(e) {
		var t = [...arguments].slice(1);
		if (!this._$handlers) return this;
		var n = this._$handlers[e], r = this._$eventProcessor;
		if (n) for (var i = t.length, a = n.length, o = 0; o < a; o++) {
			var s = n[o];
			if (!(r && r.filter && s.query != null && !r.filter(e, s.query))) switch (i) {
				case 0:
					s.h.call(s.ctx);
					break;
				case 1:
					s.h.call(s.ctx, t[0]);
					break;
				case 2:
					s.h.call(s.ctx, t[0], t[1]);
					break;
				default: s.h.apply(s.ctx, t);
			}
		}
		return r && r.afterTrigger && r.afterTrigger(e), this;
	}, e.prototype.triggerWithContext = function(e) {
		var t = [...arguments].slice(1);
		if (!this._$handlers) return this;
		var n = this._$handlers[e], r = this._$eventProcessor;
		if (n) for (var i = t.length, a = t[i - 1], o = n.length, s = 0; s < o; s++) {
			var c = n[s];
			if (!(r && r.filter && c.query != null && !r.filter(e, c.query))) switch (i) {
				case 0:
					c.h.call(a);
					break;
				case 1:
					c.h.call(a, t[0]);
					break;
				case 2:
					c.h.call(a, t[0], t[1]);
					break;
				default: c.h.apply(a, t.slice(1, i - 1));
			}
		}
		return r && r.afterTrigger && r.afterTrigger(e), this;
	}, e;
}(), Li = 1;
J.hasGlobalWindow && (Li = Math.max(window.devicePixelRatio || window.screen && window.screen.deviceXDPI / window.screen.logicalXDPI || 1, 1));
var Ri = Li, zi = .4, Bi = "#333", Vi = "#ccc", Hi = "#eee", Ui = "__zr_normal__", Wi = Wn.concat(["ignore"]), Gi = te(Wn, function(e, t) {
	return e[t] = !0, e;
}, { ignore: !1 }), Ki = {}, qi = new Y(0, 0, 0, 0), Ji = [], Yi = function() {
	function e(e) {
		this.id = w(), this.animators = [], this.currentStates = [], this.states = {}, this._init(e);
	}
	return e.prototype._init = function(e) {
		this.attr(e);
	}, e.prototype.drift = function(e, t, n) {
		switch (this.draggable) {
			case "horizontal":
				t = 0;
				break;
			case "vertical": e = 0;
		}
		var r = this.transform;
		r ||= this.transform = [
			1,
			0,
			0,
			1,
			0,
			0
		], r[4] += e, r[5] += t, this.decomposeTransform(), this.markRedraw();
	}, e.prototype.beforeUpdate = function() {}, e.prototype.afterUpdate = function() {}, e.prototype.update = function() {
		this.updateTransform(), this.__dirty && this.updateInnerText();
	}, e.prototype.updateInnerText = function(e) {
		var t = this._textContent;
		if (t && (!t.ignore || e)) {
			this.textConfig ||= {};
			var n = this.textConfig, r = n.local, i = t.innerTransformable, a = void 0, o = void 0, s = !1;
			i.parent = r ? this : null;
			var c = !1;
			i.copyTransform(t);
			var l = n.position != null, u = n.autoOverflowArea, d = void 0;
			if ((u || l) && (d = qi, n.layoutRect ? d.copy(n.layoutRect) : d.copy(this.getBoundingRect()), r || d.applyTransform(this.transform)), l) {
				this.calculateTextPosition ? this.calculateTextPosition(Ki, n, d) : dn(Ki, n, d), i.x = Ki.x, i.y = Ki.y, a = Ki.align, o = Ki.verticalAlign;
				var f = n.origin;
				if (f && n.rotation != null) {
					var p = void 0, m = void 0;
					f === "center" ? (p = d.width * .5, m = d.height * .5) : (p = un(f[0], d.width), m = un(f[1], d.height)), c = !0, i.originX = -i.x + p + (r ? 0 : d.x), i.originY = -i.y + m + (r ? 0 : d.y);
				}
			}
			n.rotation != null && (i.rotation = n.rotation);
			var h = n.offset;
			h && (i.x += h[0], i.y += h[1], c || (i.originX = -h[0], i.originY = -h[1]));
			var g = this._innerTextDefaultStyle ||= {};
			if (u) {
				var _ = g.overflowRect = g.overflowRect || new Y(0, 0, 0, 0);
				i.getLocalTransform(Ji), ct(Ji, Ji), Y.copy(_, d), _.applyTransform(Ji);
			} else g.overflowRect = null;
			var v = n.inside == null ? typeof n.position == "string" && n.position.indexOf("inside") >= 0 : n.inside, y = void 0, b = void 0, x = void 0;
			v && this.canBeInsideText() ? (y = n.insideFill, b = n.insideStroke, (y == null || y === "auto") && (y = this.getInsideTextFill()), (b == null || b === "auto") && (b = this.getInsideTextStroke(y), x = !0)) : (y = n.outsideFill, b = n.outsideStroke, (y == null || y === "auto") && (y = this.getOutsideFill()), (b == null || b === "auto") && (b = this.getOutsideStroke(y), x = !0)), y ||= "#000", (y !== g.fill || b !== g.stroke || x !== g.autoStroke || a !== g.align || o !== g.verticalAlign) && (s = !0, g.fill = y, g.stroke = b, g.autoStroke = x, g.align = a, g.verticalAlign = o, t.setDefaultTextStyle(g)), t.__dirty |= 1, s && t.dirtyStyle(!0);
		}
	}, e.prototype.canBeInsideText = function() {
		return !0;
	}, e.prototype.getInsideTextFill = function() {
		return "#fff";
	}, e.prototype.getInsideTextStroke = function(e) {
		return "#000";
	}, e.prototype.getOutsideFill = function() {
		return this.__zr && this.__zr.isDarkMode() ? Vi : Bi;
	}, e.prototype.getOutsideStroke = function(e) {
		var t = this.__zr && this.__zr.getBackgroundColor(), n = typeof t == "string" && Pr(t);
		n ||= [
			255,
			255,
			255,
			1
		];
		for (var r = n[3], i = this.__zr.isDarkMode(), a = 0; a < 3; a++) n[a] = n[a] * r + (i ? 0 : 255) * (1 - r);
		return n[3] = 1, Hr(n, "rgba");
	}, e.prototype.traverse = function(e, t) {}, e.prototype.attrKV = function(e, t) {
		e === "textConfig" ? this.setTextConfig(t) : e === "textContent" ? this.setTextContent(t) : e === "clipPath" ? this.setClipPath(t) : e === "extra" ? (this.extra = this.extra || {}, k(this.extra, t)) : this[e] = t;
	}, e.prototype.hide = function() {
		this.ignore = !0, this.markRedraw();
	}, e.prototype.show = function() {
		this.ignore = !1, this.markRedraw();
	}, e.prototype.attr = function(e, t) {
		if (typeof e == "string") this.attrKV(e, t);
		else if (G(e)) for (var n = R(e), r = 0; r < n.length; r++) {
			var i = n[r];
			this.attrKV(i, e[i]);
		}
		return this.markRedraw(), this;
	}, e.prototype.saveCurrentToNormalState = function(e) {
		this._innerSaveToNormal(e);
		for (var t = this._normalState, n = 0; n < this.animators.length; n++) {
			var r = this.animators[n], i = r.__fromStateTransition;
			if (!(r.getLoop() || i && i !== "__zr_normal__")) {
				var a = r.targetName, o = a ? t[a] : t;
				r.saveTo(o);
			}
		}
	}, e.prototype._innerSaveToNormal = function(e) {
		var t = this._normalState;
		t ||= this._normalState = {}, e.textConfig && !t.textConfig && (t.textConfig = this.textConfig), this._savePrimaryToNormal(e, t, Wi);
	}, e.prototype._savePrimaryToNormal = function(e, t, n) {
		for (var r = 0; r < n.length; r++) {
			var i = n[r];
			e[i] != null && !(i in t) && (t[i] = this[i]);
		}
	}, e.prototype.hasState = function() {
		return this.currentStates.length > 0;
	}, e.prototype.getState = function(e) {
		return this.states[e];
	}, e.prototype.ensureState = function(e) {
		var t = this.states;
		return t[e] || (t[e] = {}), t[e];
	}, e.prototype.clearStates = function(e) {
		this.useState(Ui, !1, e);
	}, e.prototype.useState = function(e, t, n, r) {
		var i = e === Ui;
		if (!(!this.hasState() && i)) {
			var a = this.currentStates, o = this.stateTransition;
			if (!(M(a, e) >= 0 && (t || a.length === 1))) {
				var s;
				if (this.stateProxy && !i && (s = this.stateProxy(e)), s ||= this.states && this.states[e], !s && !i) {
					T("State " + e + " not exists.");
					return;
				}
				i || this.saveCurrentToNormalState(s);
				var c = this._textContent, l = ra(this, c, s, r);
				l && !this.__inHover && (this.__inHover = l), this._applyStateObj(e, s, this._normalState, t, aa(this, n, o), o);
				var u = this._textGuide;
				return c && c.useState(e, t, n, !!l), u && u.useState(e, t, n, !!l), i ? (this.currentStates = [], this._normalState = {}) : t ? this.currentStates.push(e) : this.currentStates = [e], this._updateAnimationTargets(), this.markRedraw(), !l && this.__inHover && (this.__inHover = 0, this.__dirty &= -2), s;
			}
		}
	}, e.prototype.useStates = function(e, t, n) {
		if (!e.length) this.clearStates();
		else {
			var r = [], i = this.currentStates, a = e.length, o = a === i.length;
			if (o) {
				for (var s = 0; s < a; s++) if (e[s] !== i[s]) {
					o = !1;
					break;
				}
			}
			if (o) return;
			for (var s = 0; s < a; s++) {
				var c = e[s], l = void 0;
				this.stateProxy && (l = this.stateProxy(c, e)), l ||= this.states[c], l && r.push(l);
			}
			var u = r[a - 1], d = this._textContent, f = ra(this, d, u, n);
			f && !this.__inHover && (this.__inHover = f);
			var p = this._mergeStates(r), m = this.stateTransition;
			this.saveCurrentToNormalState(p), this._applyStateObj(e.join(","), p, this._normalState, !1, aa(this, t, m), m);
			var h = this._textGuide;
			d && d.useStates(e, t, !!f), h && h.useStates(e, t, !!f), this._updateAnimationTargets(), this.currentStates = e.slice(), this.markRedraw(), !f && this.__inHover && (this.__inHover = 0, this.__dirty &= -2);
		}
	}, e.prototype.isSilent = function() {
		for (var e = this; e;) {
			if (e.silent) return !0;
			var t = e.__hostTarget;
			e = t ? e.ignoreHostSilent ? null : t : e.parent;
		}
		return !1;
	}, e.prototype._updateAnimationTargets = function() {
		for (var e = 0; e < this.animators.length; e++) {
			var t = this.animators[e];
			t.targetName && t.changeTarget(this[t.targetName]);
		}
	}, e.prototype.removeState = function(e) {
		var t = M(this.currentStates, e);
		if (t >= 0) {
			var n = this.currentStates.slice();
			n.splice(t, 1), this.useStates(n);
		}
	}, e.prototype.replaceState = function(e, t, n) {
		var r = this.currentStates.slice(), i = M(r, e), a = M(r, t) >= 0;
		i >= 0 ? a ? r.splice(i, 1) : r[i] = t : n && !a && r.push(t), this.useStates(r);
	}, e.prototype.toggleState = function(e, t) {
		t ? this.useState(e, !0) : this.removeState(e);
	}, e.prototype._mergeStates = function(e) {
		for (var t = {}, n, r = 0; r < e.length; r++) {
			var i = e[r];
			k(t, i), i.textConfig && (n ||= {}, k(n, i.textConfig));
		}
		return n && (t.textConfig = n), t;
	}, e.prototype._applyStateObj = function(e, t, n, r, i, a) {
		if (this.__inHover !== 1) {
			var o = !(t && r);
			t && t.textConfig ? (this.textConfig = k({}, r ? this.textConfig : n.textConfig), k(this.textConfig, t.textConfig)) : o && n.textConfig && (this.textConfig = n.textConfig);
			for (var s = {}, c = !1, l = 0; l < Wi.length; l++) {
				var u = Wi[l], d = i && Gi[u];
				t && t[u] != null ? d ? (c = !0, s[u] = t[u]) : this[u] = t[u] : o && n[u] != null && (d ? (c = !0, s[u] = n[u]) : this[u] = n[u]);
			}
			if (!i) for (var l = 0; l < this.animators.length; l++) {
				var f = this.animators[l], p = f.targetName;
				f.getLoop() || f.__changeFinalValue(p ? (t || n)[p] : t || n);
			}
			c && this._transitionState(e, s, a);
		}
	}, e.prototype._attachComponent = function(e) {
		if (!(e.__zr && !e.__hostTarget) && e !== this) {
			var t = this.__zr;
			t && e.addSelfToZr(t), e.__zr = t, e.__hostTarget = this;
		}
	}, e.prototype._detachComponent = function(e) {
		e.__zr && e.removeSelfFromZr(e.__zr), e.__zr = null, e.__hostTarget = null;
	}, e.prototype.getClipPath = function() {
		return this._clipPath;
	}, e.prototype.setClipPath = function(e) {
		this._clipPath && this._clipPath !== e && this.removeClipPath(), this._attachComponent(e), this._clipPath = e, this.markRedraw();
	}, e.prototype.removeClipPath = function() {
		var e = this._clipPath;
		e && (this._detachComponent(e), this._clipPath = null, this.markRedraw());
	}, e.prototype.getTextContent = function() {
		return this._textContent;
	}, e.prototype.setTextContent = function(e) {
		var t = this._textContent;
		t !== e && (t && t !== e && this.removeTextContent(), e.innerTransformable = new Vn(), this._attachComponent(e), this._textContent = e, this.markRedraw());
	}, e.prototype.setTextConfig = function(e) {
		this.textConfig ||= {}, k(this.textConfig, e), this.markRedraw();
	}, e.prototype.removeTextConfig = function() {
		this.textConfig = null, this.markRedraw();
	}, e.prototype.removeTextContent = function() {
		var e = this._textContent;
		e && (e.innerTransformable = null, this._detachComponent(e), this._textContent = null, this._innerTextDefaultStyle = null, this.markRedraw());
	}, e.prototype.getTextGuideLine = function() {
		return this._textGuide;
	}, e.prototype.setTextGuideLine = function(e) {
		this._textGuide && this._textGuide !== e && this.removeTextGuideLine(), this._attachComponent(e), this._textGuide = e, this.markRedraw();
	}, e.prototype.removeTextGuideLine = function() {
		var e = this._textGuide;
		e && (this._detachComponent(e), this._textGuide = null, this.markRedraw());
	}, e.prototype.markRedraw = function() {
		this.__dirty |= 1;
		var e = this.__zr;
		e && (this.__inHover ? e.refreshHover() : e.refresh()), this.__hostTarget && this.__hostTarget.markRedraw();
	}, e.prototype.dirty = function() {
		this.markRedraw();
	}, e.prototype.addSelfToZr = function(e) {
		if (this.__zr !== e) {
			this.__zr = e;
			var t = this.animators;
			if (t) for (var n = 0; n < t.length; n++) e.animation.addAnimator(t[n]);
			this._clipPath && this._clipPath.addSelfToZr(e), this._textContent && this._textContent.addSelfToZr(e), this._textGuide && this._textGuide.addSelfToZr(e);
		}
	}, e.prototype.removeSelfFromZr = function(e) {
		if (this.__zr) {
			this.__zr = null;
			var t = this.animators;
			if (t) for (var n = 0; n < t.length; n++) e.animation.removeAnimator(t[n]);
			this._clipPath && this._clipPath.removeSelfFromZr(e), this._textContent && this._textContent.removeSelfFromZr(e), this._textGuide && this._textGuide.removeSelfFromZr(e);
		}
	}, e.prototype.animate = function(e, t, n) {
		var r = new Fi(e ? this[e] : this, t, n);
		return e && (r.targetName = e), this.addAnimator(r, e), r;
	}, e.prototype.addAnimator = function(e, t) {
		var n = this.__zr, r = this;
		e.during(function() {
			r.updateDuringAnimation(t);
		}).done(function() {
			var t = r.animators, n = M(t, e);
			n >= 0 && t.splice(n, 1);
		}), this.animators.push(e), n && n.animation.addAnimator(e), n && n.wakeUp();
	}, e.prototype.updateDuringAnimation = function(e) {
		this.markRedraw();
	}, e.prototype.stopAnimation = function(e, t) {
		for (var n = this.animators, r = n.length, i = [], a = 0; a < r; a++) {
			var o = n[a];
			!e || e === o.scope ? o.stop(t) : i.push(o);
		}
		return this.animators = i, this;
	}, e.prototype.animateTo = function(e, t, n) {
		Xi(this, e, t, n);
	}, e.prototype.animateFrom = function(e, t, n) {
		Xi(this, e, t, n, !0);
	}, e.prototype._transitionState = function(e, t, n, r) {
		for (var i = Xi(this, t, n, r), a = 0; a < i.length; a++) i[a].__fromStateTransition = e;
	}, e.prototype.getBoundingRect = function() {
		return null;
	}, e.prototype.getPaintRect = function() {
		return null;
	}, e.initDefaultProps = (function() {
		var t = e.prototype;
		t.type = "element", t.name = "", t.ignore = t.silent = t.ignoreHostSilent = t.isGroup = t.draggable = t.dragging = t.ignoreClip = !1, t.__inHover = 0, t.__dirty = 1;
		function n(e, n, r, i) {
			Object.defineProperty(t, e, {
				get: function() {
					if (!this[n]) {
						var e = this[n] = [];
						a(this, e);
					}
					return this[n];
				},
				set: function(e) {
					this[r] = e[0], this[i] = e[1], this[n] = e, a(this, e);
				}
			});
			function a(e, t) {
				Object.defineProperty(t, 0, {
					get: function() {
						return e[r];
					},
					set: function(t) {
						e[r] = t;
					}
				}), Object.defineProperty(t, 1, {
					get: function() {
						return e[i];
					},
					set: function(t) {
						e[i] = t;
					}
				});
			}
		}
		Object.defineProperty && (n("position", "_legacyPos", "x", "y"), n("scale", "_legacyScale", "scaleX", "scaleY"), n("origin", "_legacyOrigin", "originX", "originY"));
	})(), e;
}();
N(Yi, Ii), N(Yi, Vn);
function Xi(e, t, n, r, i) {
	n ||= {};
	var a = [];
	na(e, "", e, t, n, r, a, i);
	var o = a.length, s = !1, c = n.done, l = n.aborted, u = function() {
		s = !0, o--, o <= 0 && (s ? c && c() : l && l());
	}, d = function() {
		o--, o <= 0 && (s ? c && c() : l && l());
	};
	o || c && c(), a.length > 0 && n.during && a[0].during(function(e, t) {
		n.during(t);
	});
	for (var f = 0; f < a.length; f++) {
		var p = a[f];
		u && p.done(u), d && p.aborted(d), n.force && p.duration(n.duration), p.start(n.easing);
	}
	return a;
}
function Zi(e, t, n) {
	for (var r = 0; r < n; r++) e[r] = t[r];
}
function Qi(e) {
	return P(e[0]);
}
function $i(e, t, n) {
	if (P(t[n])) {
		if (P(e[n]) || (e[n] = []), oe(t[n])) {
			var r = t[n].length;
			e[n].length !== r && (e[n] = new t[n].constructor(r), Zi(e[n], t[n], r));
		} else {
			var i = t[n], a = e[n], o = i.length;
			if (Qi(i)) for (var s = i[0].length, c = 0; c < o; c++) a[c] ? Zi(a[c], i[c], s) : a[c] = Array.prototype.slice.call(i[c]);
			else Zi(a, i, o);
			a.length = i.length;
		}
	} else e[n] = t[n];
}
function ea(e, t) {
	return e === t || P(e) && P(t) && ta(e, t);
}
function ta(e, t) {
	var n = e.length;
	if (n !== t.length) return !1;
	for (var r = 0; r < n; r++) if (e[r] !== t[r]) return !1;
	return !0;
}
function na(e, t, n, r, i, a, o, s) {
	for (var c = R(r), l = i.duration, u = i.delay, d = i.additive, f = i.setToFinal, p = !G(a), m = e.animators, h = [], g = 0; g < c.length; g++) {
		var _ = c[g], v = r[_];
		if (v != null && n[_] != null && (p || a[_])) {
			if (G(v) && !P(v) && !ce(v)) {
				if (t) {
					s || (n[_] = v, e.updateDuringAnimation(t));
					continue;
				}
				na(e, _, n[_], v, i, a && a[_], o, s);
			} else h.push(_);
		} else s || (n[_] = v, e.updateDuringAnimation(t), h.push(_));
	}
	var y = h.length;
	if (!d && y) for (var b = 0; b < m.length; b++) {
		var x = m[b];
		if (x.targetName === t && x.stopTracks(h)) {
			var S = M(m, x);
			m.splice(S, 1);
		}
	}
	if (i.force || (h = L(h, function(e) {
		return !ea(r[e], n[e]);
	}), y = h.length), y > 0 || i.force && !o.length) {
		var C = void 0, w = void 0, T = void 0;
		if (s) {
			w = {}, f && (C = {});
			for (var b = 0; b < y; b++) {
				var _ = h[b];
				w[_] = n[_], f ? C[_] = r[_] : n[_] = r[_];
			}
		} else if (f) {
			T = {};
			for (var b = 0; b < y; b++) {
				var _ = h[b];
				T[_] = xi(n[_]), $i(n, r, _);
			}
		}
		var x = new Fi(n, !1, !1, d ? L(m, function(e) {
			return e.targetName === t;
		}) : null);
		x.targetName = t, i.scope && (x.scope = i.scope), f && C && x.whenWithKeys(0, C, h), T && x.whenWithKeys(0, T, h), x.whenWithKeys(l ?? 500, s ? w : r, h).delay(u || 0), e.addAnimator(x, t), o.push(x);
	}
}
function ra(e, t, n, r) {
	return !(n && n.hoverLayer || r) || ia(e) || t && ia(t) ? 0 : 1;
}
function ia(e) {
	return e.type === "text" || e.type === "tspan";
}
function aa(e, t, n) {
	return !t && !e.__inHover && n && n.duration > 0;
}
//#endregion
//#region node_modules/zrender/lib/graphic/Displayable.js
var oa = "__zr_style_" + Math.round(Math.random() * 10), sa = {
	shadowBlur: 0,
	shadowOffsetX: 0,
	shadowOffsetY: 0,
	shadowColor: "#000",
	opacity: 1,
	blend: "source-over"
}, ca = { style: {
	shadowBlur: !0,
	shadowOffsetX: !0,
	shadowOffsetY: !0,
	shadowColor: !0,
	opacity: !0
} };
sa[oa] = !0;
var la = [
	"z",
	"z2",
	"invisible"
], ua = ["invisible"], da = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype._init = function(t) {
		for (var n = R(t), r = 0; r < n.length; r++) {
			var i = n[r];
			i === "style" ? this.useStyle(t[i]) : e.prototype.attrKV.call(this, i, t[i]);
		}
		this.style || this.useStyle({});
	}, t.prototype.beforeBrush = function(e) {}, t.prototype.afterBrush = function() {}, t.prototype.innerBeforeBrush = function() {}, t.prototype.innerAfterBrush = function() {}, t.prototype.shouldBePainted = function(e, t, n, r) {
		var i = this.transform;
		if (this.ignore || this.invisible || this.style.opacity === 0 || this.culling && ma(this, e, t) || i && !i[0] && !i[3]) return !1;
		if (n && this.__clipPaths && this.__clipPaths.length) {
			for (var a = 0; a < this.__clipPaths.length; ++a) if (this.__clipPaths[a].isZeroArea()) return !1;
		}
		if (r && this.parent) for (var o = this.parent; o;) {
			if (o.ignore) return !1;
			o = o.parent;
		}
		return !0;
	}, t.prototype.contain = function(e, t) {
		return this.rectContain(e, t);
	}, t.prototype.traverse = function(e, t) {
		e.call(t, this);
	}, t.prototype.rectContain = function(e, t) {
		var n = this.transformCoordToLocal(e, t);
		return this.getBoundingRect().contain(n[0], n[1]);
	}, t.prototype.getPaintRect = function() {
		var e = this._paintRect;
		if (!this._paintRect || this.__dirty) {
			var t = this.transform, n = this.getBoundingRect(), r = this.style, i = r.shadowBlur || 0, a = r.shadowOffsetX || 0, o = r.shadowOffsetY || 0;
			e = this._paintRect ||= new Y(0, 0, 0, 0), t ? Y.applyTransform(e, n, t) : e.copy(n), (i || a || o) && (e.width += i * 2 + Math.abs(a), e.height += i * 2 + Math.abs(o), e.x = Math.min(e.x, e.x + a - i), e.y = Math.min(e.y, e.y + o - i));
			var s = this.dirtyRectTolerance;
			e.isZero() || (e.x = Math.floor(e.x - s), e.y = Math.floor(e.y - s), e.width = Math.ceil(e.width + 1 + s * 2), e.height = Math.ceil(e.height + 1 + s * 2));
		}
		return e;
	}, t.prototype.setPrevPaintRect = function(e) {
		e ? (this._prevPaintRect = this._prevPaintRect || new Y(0, 0, 0, 0), this._prevPaintRect.copy(e)) : this._prevPaintRect = null;
	}, t.prototype.getPrevPaintRect = function() {
		return this._prevPaintRect;
	}, t.prototype.animateStyle = function(e) {
		return this.animate("style", e);
	}, t.prototype.updateDuringAnimation = function(e) {
		e === "style" ? this.dirtyStyle() : this.markRedraw();
	}, t.prototype.attrKV = function(t, n) {
		t === "style" ? this.style ? this.setStyle(n) : this.useStyle(n) : e.prototype.attrKV.call(this, t, n);
	}, t.prototype.setStyle = function(e, t) {
		return typeof e == "string" ? this.style[e] = t : k(this.style, e), this.dirtyStyle(), this;
	}, t.prototype.dirtyStyle = function(e) {
		e || this.markRedraw(), this.__dirty |= 2, this._rect &&= null;
	}, t.prototype.dirty = function() {
		this.dirtyStyle();
	}, t.prototype.styleChanged = function() {
		return !!(this.__dirty & 2);
	}, t.prototype.styleUpdated = function() {
		this.__dirty &= -3;
	}, t.prototype.createStyle = function(e) {
		return we(sa, e);
	}, t.prototype.useStyle = function(e) {
		e[oa] || (e = this.createStyle(e)), this.style = e, this.dirtyStyle();
	}, t.prototype._useHoverStyle = function(e) {
		this.__hoverStyle = e;
	}, t.prototype.isStyleObject = function(e) {
		return e[oa];
	}, t.prototype._innerSaveToNormal = function(t) {
		e.prototype._innerSaveToNormal.call(this, t);
		var n = this._normalState;
		t.style && !n.style && (n.style = this._mergeStyle(this.createStyle(), this.style)), this._savePrimaryToNormal(t, n, la);
	}, t.prototype._applyStateObj = function(t, n, r, i, a, o) {
		e.prototype._applyStateObj.call(this, t, n, r, i, a, o);
		var s = !(n && i), c = this.__inHover === 1, l;
		if (n && n.style ? a ? i ? l = n.style : (l = this._mergeStyle(this.createStyle(), r.style), this._mergeStyle(l, n.style)) : (l = this._mergeStyle(this.createStyle(), i ? this.style : r.style), this._mergeStyle(l, n.style)) : s && (l = r.style), l) {
			if (a) {
				var u = this.style;
				if (this.style = this.createStyle(s ? {} : u), s) for (var d = R(u), f = 0; f < d.length; f++) {
					var p = d[f];
					p in l && (l[p] = l[p], this.style[p] = u[p]);
				}
				for (var m = R(l), f = 0; f < m.length; f++) {
					var p = m[f];
					this.style[p] = this.style[p];
				}
				this._transitionState(t, { style: l }, o, this.getAnimationStyleProps());
			} else c ? this._useHoverStyle(l) : this.useStyle(l);
		}
		if (!c) for (var h = this.__inHover ? ua : la, f = 0; f < h.length; f++) {
			var p = h[f];
			n && n[p] != null ? this[p] = n[p] : s && r[p] != null && (this[p] = r[p]);
		}
	}, t.prototype._mergeStates = function(t) {
		for (var n = e.prototype._mergeStates.call(this, t), r, i = 0; i < t.length; i++) {
			var a = t[i];
			a.style && (r ||= {}, this._mergeStyle(r, a.style));
		}
		return r && (n.style = r), n;
	}, t.prototype._mergeStyle = function(e, t) {
		return k(e, t), e;
	}, t.prototype.getAnimationStyleProps = function() {
		return ca;
	}, t.initDefaultProps = (function() {
		var e = t.prototype;
		e.type = "displayable", e.invisible = !1, e.z = 0, e.z2 = 0, e.zlevel = 0, e.culling = !1, e.cursor = "pointer", e.rectHover = !1, e.incremental = 0, e._rect = null, e.dirtyRectTolerance = 0, e.__dirty = 3;
	})(), t;
}(Yi), fa = new Y(0, 0, 0, 0), pa = new Y(0, 0, 0, 0);
function ma(e, t, n) {
	return fa.copy(e.getBoundingRect()), e.transform && fa.applyTransform(e.transform), pa.width = t, pa.height = n, !fa.intersect(pa);
}
//#endregion
//#region node_modules/zrender/lib/core/bbox.js
var ha = Math.min, ga = Math.max, _a = Math.sin, va = Math.cos, ya = Math.PI * 2, ba = lt(), xa = lt(), Sa = lt();
function Ca(e, t, n, r, i, a) {
	i[0] = ha(e, n), i[1] = ha(t, r), a[0] = ga(e, n), a[1] = ga(t, r);
}
var wa = [], Ta = [];
function Ea(e, t, n, r, i, a, o, s, c, l) {
	var u = sr, d = ir, f = u(e, n, i, o, wa);
	c[0] = Infinity, c[1] = Infinity, l[0] = -Infinity, l[1] = -Infinity;
	for (var p = 0; p < f; p++) {
		var m = d(e, n, i, o, wa[p]);
		c[0] = ha(m, c[0]), l[0] = ga(m, l[0]);
	}
	f = u(t, r, a, s, Ta);
	for (var p = 0; p < f; p++) {
		var h = d(t, r, a, s, Ta[p]);
		c[1] = ha(h, c[1]), l[1] = ga(h, l[1]);
	}
	c[0] = ha(e, c[0]), l[0] = ga(e, l[0]), c[0] = ha(o, c[0]), l[0] = ga(o, l[0]), c[1] = ha(t, c[1]), l[1] = ga(t, l[1]), c[1] = ha(s, c[1]), l[1] = ga(s, l[1]);
}
function Da(e, t, n, r, i, a, o, s) {
	var c = mr, l = dr, u = ga(ha(c(e, n, i), 1), 0), d = ga(ha(c(t, r, a), 1), 0), f = l(e, n, i, u), p = l(t, r, a, d);
	o[0] = ha(e, i, f), o[1] = ha(t, a, p), s[0] = ga(e, i, f), s[1] = ga(t, a, p);
}
function Oa(e, t, n, r, i, a, o, s, c) {
	var l = wt, u = Tt, d = Math.abs(i - a);
	if (d % ya < 1e-4 && d > 1e-4) {
		s[0] = e - n, s[1] = t - r, c[0] = e + n, c[1] = t + r;
		return;
	}
	if (ba[0] = va(i) * n + e, ba[1] = _a(i) * r + t, xa[0] = va(a) * n + e, xa[1] = _a(a) * r + t, l(s, ba, xa), u(c, ba, xa), i %= ya, i < 0 && (i += ya), a %= ya, a < 0 && (a += ya), i > a && !o ? a += ya : i < a && o && (i += ya), o) {
		var f = a;
		a = i, i = f;
	}
	for (var p = 0; p < a; p += Math.PI / 2) p > i && (Sa[0] = va(p) * n + e, Sa[1] = _a(p) * r + t, l(s, Sa, s), u(c, Sa, c));
}
//#endregion
//#region node_modules/zrender/lib/core/PathProxy.js
var ka = {
	M: 1,
	L: 2,
	C: 3,
	Q: 4,
	A: 5,
	Z: 6,
	R: 7
}, Aa = [], ja = [], Ma = [], Na = [], Pa = [], Fa = [], Ia = Math.min, La = Math.max, Ra = Math.cos, za = Math.sin, Ba = Math.abs, Va = Math.PI, Ha = Va * 2, Ua = typeof Float32Array < "u", Wa = [];
function Ga(e) {
	return Math.round(e / Va * 1e8) / 1e8 % 2 * Va;
}
function Ka(e, t) {
	var n = Ga(e[0]);
	n < 0 && (n += Ha);
	var r = n - e[0], i = e[1];
	i += r, !t && i - n >= Ha ? i = n + Ha : t && n - i >= Ha ? i = n - Ha : !t && n > i ? i = n + (Ha - Ga(n - i)) : t && n < i && (i = n - (Ha - Ga(i - n))), e[0] = n, e[1] = i;
}
var qa = function() {
	function e(e) {
		this.dpr = 1, this._xi = 0, this._yi = 0, this._x0 = 0, this._y0 = 0, this._len = 0, e && (this._saveData = !1), this._saveData && (this.data = []);
	}
	return e.prototype.increaseVersion = function() {
		this._version++;
	}, e.prototype.getVersion = function() {
		return this._version;
	}, e.prototype.setScale = function(e, t, n) {
		n ||= 0, n > 0 && (this._ux = Ba(n / Ri / e) || 0, this._uy = Ba(n / Ri / t) || 0);
	}, e.prototype.setDPR = function(e) {
		this.dpr = e;
	}, e.prototype.setContext = function(e) {
		this._ctx = e;
	}, e.prototype.getContext = function() {
		return this._ctx;
	}, e.prototype.beginPath = function() {
		return this._ctx && this._ctx.beginPath(), this.reset(), this;
	}, e.prototype.reset = function() {
		this._saveData && (this._len = 0), this._pathSegLen && (this._pathSegLen = null, this._pathLen = 0), this._version++;
	}, e.prototype.moveTo = function(e, t) {
		return this._drawPendingPt(), this.addData(ka.M, e, t), this._ctx && this._ctx.moveTo(e, t), this._x0 = e, this._y0 = t, this._xi = e, this._yi = t, this;
	}, e.prototype.lineTo = function(e, t) {
		var n = Ba(e - this._xi), r = Ba(t - this._yi), i = n > this._ux || r > this._uy;
		if (this.addData(ka.L, e, t), this._ctx && i && this._ctx.lineTo(e, t), i) this._xi = e, this._yi = t, this._pendingPtDist = 0;
		else {
			var a = n * n + r * r;
			a > this._pendingPtDist && (this._pendingPtX = e, this._pendingPtY = t, this._pendingPtDist = a);
		}
		return this;
	}, e.prototype.bezierCurveTo = function(e, t, n, r, i, a) {
		return this._drawPendingPt(), this.addData(ka.C, e, t, n, r, i, a), this._ctx && this._ctx.bezierCurveTo(e, t, n, r, i, a), this._xi = i, this._yi = a, this;
	}, e.prototype.quadraticCurveTo = function(e, t, n, r) {
		return this._drawPendingPt(), this.addData(ka.Q, e, t, n, r), this._ctx && this._ctx.quadraticCurveTo(e, t, n, r), this._xi = n, this._yi = r, this;
	}, e.prototype.arc = function(e, t, n, r, i, a) {
		this._drawPendingPt(), Wa[0] = r, Wa[1] = i, Ka(Wa, a), r = Wa[0], i = Wa[1];
		var o = i - r;
		return this.addData(ka.A, e, t, n, n, r, o, 0, +!a), this._ctx && this._ctx.arc(e, t, n, r, i, a), this._xi = Ra(i) * n + e, this._yi = za(i) * n + t, this;
	}, e.prototype.arcTo = function(e, t, n, r, i) {
		return this._drawPendingPt(), this._ctx && this._ctx.arcTo(e, t, n, r, i), this;
	}, e.prototype.rect = function(e, t, n, r) {
		return this._drawPendingPt(), this._ctx && this._ctx.rect(e, t, n, r), this.addData(ka.R, e, t, n, r), this;
	}, e.prototype.closePath = function() {
		this._drawPendingPt(), this.addData(ka.Z);
		var e = this._ctx, t = this._x0, n = this._y0;
		return e && e.closePath(), this._xi = t, this._yi = n, this;
	}, e.prototype.fill = function(e) {
		e && e.fill(), this.toStatic();
	}, e.prototype.stroke = function(e) {
		e && e.stroke(), this.toStatic();
	}, e.prototype.len = function() {
		return this._len;
	}, e.prototype.setData = function(e) {
		if (this._saveData) {
			var t = e.length;
			!(this.data && this.data.length === t) && Ua && (this.data = new Float32Array(t));
			for (var n = 0; n < t; n++) this.data[n] = e[n];
			this._len = t;
		}
	}, e.prototype.appendPath = function(e) {
		if (this._saveData) {
			e instanceof Array || (e = [e]);
			for (var t = e.length, n = 0, r = this._len, i = 0; i < t; i++) n += e[i].len();
			var a = this.data;
			if (Ua && (a instanceof Float32Array || !a) && (this.data = new Float32Array(r + n), r > 0 && a)) for (var o = 0; o < r; o++) this.data[o] = a[o];
			for (var i = 0; i < t; i++) for (var s = e[i].data, o = 0; o < s.length; o++) this.data[r++] = s[o];
			this._len = r;
		}
	}, e.prototype.addData = function(e, t, n, r, i, a, o, s, c) {
		if (this._saveData) {
			var l = this.data;
			this._len + arguments.length > l.length && (this._expandData(), l = this.data);
			for (var u = 0; u < arguments.length; u++) l[this._len++] = arguments[u];
		}
	}, e.prototype._drawPendingPt = function() {
		this._pendingPtDist > 0 && (this._ctx && this._ctx.lineTo(this._pendingPtX, this._pendingPtY), this._pendingPtDist = 0);
	}, e.prototype._expandData = function() {
		if (!(this.data instanceof Array)) {
			for (var e = [], t = 0; t < this._len; t++) e[t] = this.data[t];
			this.data = e;
		}
	}, e.prototype.toStatic = function() {
		if (this._saveData) {
			this._drawPendingPt();
			var e = this.data;
			e instanceof Array && (e.length = this._len, Ua && this._len > 11 && (this.data = new Float32Array(e)));
		}
	}, e.prototype.getBoundingRect = function() {
		Ma[0] = Ma[1] = Pa[0] = Pa[1] = Number.MAX_VALUE, Na[0] = Na[1] = Fa[0] = Fa[1] = -Number.MAX_VALUE;
		var e = this.data, t = 0, n = 0, r = 0, i = 0, a;
		for (a = 0; a < this._len;) {
			var o = e[a++], s = a === 1;
			switch (s && (t = e[a], n = e[a + 1], r = t, i = n), o) {
				case ka.M:
					t = r = e[a++], n = i = e[a++], Pa[0] = r, Pa[1] = i, Fa[0] = r, Fa[1] = i;
					break;
				case ka.L:
					Ca(t, n, e[a], e[a + 1], Pa, Fa), t = e[a++], n = e[a++];
					break;
				case ka.C:
					Ea(t, n, e[a++], e[a++], e[a++], e[a++], e[a], e[a + 1], Pa, Fa), t = e[a++], n = e[a++];
					break;
				case ka.Q:
					Da(t, n, e[a++], e[a++], e[a], e[a + 1], Pa, Fa), t = e[a++], n = e[a++];
					break;
				case ka.A:
					var c = e[a++], l = e[a++], u = e[a++], d = e[a++], f = e[a++], p = e[a++] + f;
					a += 1;
					var m = !e[a++];
					s && (r = Ra(f) * u + c, i = za(f) * d + l), Oa(c, l, u, d, f, p, m, Pa, Fa), t = Ra(p) * u + c, n = za(p) * d + l;
					break;
				case ka.R:
					r = t = e[a++], i = n = e[a++];
					var h = e[a++], g = e[a++];
					Ca(r, i, r + h, i + g, Pa, Fa);
					break;
				case ka.Z: t = r, n = i;
			}
			wt(Ma, Ma, Pa), Tt(Na, Na, Fa);
		}
		return a === 0 && (Ma[0] = Ma[1] = Na[0] = Na[1] = 0), new Y(Ma[0], Ma[1], Na[0] - Ma[0], Na[1] - Ma[1]);
	}, e.prototype._calculateLength = function() {
		var e = this.data, t = this._len, n = this._ux, r = this._uy, i = 0, a = 0, o = 0, s = 0;
		this._pathSegLen ||= [];
		for (var c = this._pathSegLen, l = 0, u = 0, d = 0; d < t;) {
			var f = e[d++], p = d === 1;
			p && (i = e[d], a = e[d + 1], o = i, s = a);
			var m = -1;
			switch (f) {
				case ka.M:
					i = o = e[d++], a = s = e[d++];
					break;
				case ka.L:
					var h = e[d++], g = e[d++], _ = h - i, v = g - a;
					(Ba(_) > n || Ba(v) > r || d === t - 1) && (m = Math.sqrt(_ * _ + v * v), i = h, a = g);
					break;
				case ka.C:
					var y = e[d++], b = e[d++], h = e[d++], g = e[d++], x = e[d++], S = e[d++];
					m = ur(i, a, y, b, h, g, x, S, 10), i = x, a = S;
					break;
				case ka.Q:
					var y = e[d++], b = e[d++], h = e[d++], g = e[d++];
					m = _r(i, a, y, b, h, g, 10), i = h, a = g;
					break;
				case ka.A:
					var C = e[d++], w = e[d++], T = e[d++], E = e[d++], D = e[d++], O = e[d++], k = O + D;
					d += 1, p && (o = Ra(D) * T + C, s = za(D) * E + w), m = La(T, E) * Ia(Ha, Math.abs(O)), i = Ra(k) * T + C, a = za(k) * E + w;
					break;
				case ka.R:
					o = i = e[d++], s = a = e[d++];
					var A = e[d++], j = e[d++];
					m = A * 2 + j * 2;
					break;
				case ka.Z:
					var _ = o - i, v = s - a;
					m = Math.sqrt(_ * _ + v * v), i = o, a = s;
			}
			m >= 0 && (c[u++] = m, l += m);
		}
		return this._pathLen = l, l;
	}, e.prototype.rebuildPath = function(e, t) {
		var n = this.data, r = this._ux, i = this._uy, a = this._len, o, s, c, l, u, d, f = t < 1, p, m, h = 0, g = 0, _, v = 0, y, b;
		if (!(f && (this._pathSegLen || this._calculateLength(), p = this._pathSegLen, m = this._pathLen, _ = t * m, !_))) lo: for (var x = 0; x < a;) {
			var S = n[x++], C = x === 1;
			switch (C && (c = n[x], l = n[x + 1], o = c, s = l), S !== ka.L && v > 0 && (e.lineTo(y, b), v = 0), S) {
				case ka.M:
					o = c = n[x++], s = l = n[x++], e.moveTo(c, l);
					break;
				case ka.L:
					u = n[x++], d = n[x++];
					var w = Ba(u - c), T = Ba(d - l);
					if (w > r || T > i) {
						if (f) {
							var E = p[g++];
							if (h + E > _) {
								var D = (_ - h) / E;
								e.lineTo(c * (1 - D) + u * D, l * (1 - D) + d * D);
								break lo;
							}
							h += E;
						}
						e.lineTo(u, d), c = u, l = d, v = 0;
					} else {
						var O = w * w + T * T;
						O > v && (y = u, b = d, v = O);
					}
					break;
				case ka.C:
					var k = n[x++], A = n[x++], j = n[x++], M = n[x++], ee = n[x++], N = n[x++];
					if (f) {
						var E = p[g++];
						if (h + E > _) {
							var D = (_ - h) / E;
							cr(c, k, j, ee, D, Aa), cr(l, A, M, N, D, ja), e.bezierCurveTo(Aa[1], ja[1], Aa[2], ja[2], Aa[3], ja[3]);
							break lo;
						}
						h += E;
					}
					e.bezierCurveTo(k, A, j, M, ee, N), c = ee, l = N;
					break;
				case ka.Q:
					var k = n[x++], A = n[x++], j = n[x++], M = n[x++];
					if (f) {
						var E = p[g++];
						if (h + E > _) {
							var D = (_ - h) / E;
							hr(c, k, j, D, Aa), hr(l, A, M, D, ja), e.quadraticCurveTo(Aa[1], ja[1], Aa[2], ja[2]);
							break lo;
						}
						h += E;
					}
					e.quadraticCurveTo(k, A, j, M), c = j, l = M;
					break;
				case ka.A:
					var P = n[x++], F = n[x++], I = n[x++], te = n[x++], L = n[x++], ne = n[x++], R = n[x++], re = !n[x++], z = I > te ? I : te, B = Ba(I - te) > .001, V = L + ne, H = !1;
					if (f) {
						var E = p[g++];
						h + E > _ && (V = L + ne * (_ - h) / E, H = !0), h += E;
					}
					if (B && e.ellipse ? e.ellipse(P, F, I, te, R, L, V, re) : e.arc(P, F, z, L, V, re), H) break lo;
					C && (o = Ra(L) * I + P, s = za(L) * te + F), c = Ra(V) * I + P, l = za(V) * te + F;
					break;
				case ka.R:
					o = c = n[x], s = l = n[x + 1], u = n[x++], d = n[x++];
					var U = n[x++], ie = n[x++];
					if (f) {
						var E = p[g++];
						if (h + E > _) {
							var W = _ - h;
							e.moveTo(u, d), e.lineTo(u + Ia(W, U), d), W -= U, W > 0 && e.lineTo(u + U, d + Ia(W, ie)), W -= ie, W > 0 && e.lineTo(u + La(U - W, 0), d + ie), W -= U, W > 0 && e.lineTo(u, d + La(ie - W, 0));
							break lo;
						}
						h += E;
					}
					e.rect(u, d, U, ie);
					break;
				case ka.Z:
					if (f) {
						var E = p[g++];
						if (h + E > _) {
							var D = (_ - h) / E;
							e.lineTo(c * (1 - D) + o * D, l * (1 - D) + s * D);
							break lo;
						}
						h += E;
					}
					e.closePath(), c = o, l = s;
			}
		}
	}, e.prototype.clone = function() {
		var t = new e(), n = this.data;
		return t.data = n.slice ? n.slice() : Array.prototype.slice.call(n), t._len = this._len, t;
	}, e.prototype.canSave = function() {
		return !!this._saveData;
	}, e.CMD = ka, e.initDefaultProps = (function() {
		var t = e.prototype;
		t._saveData = !0, t._ux = 0, t._uy = 0, t._pendingPtDist = 0, t._version = 0;
	})(), e;
}();
//#endregion
//#region node_modules/zrender/lib/contain/line.js
function Ja(e, t, n, r, i, a, o) {
	if (i === 0) return !1;
	var s = i, c = 0, l = e;
	if (o > t + s && o > r + s || o < t - s && o < r - s || a > e + s && a > n + s || a < e - s && a < n - s) return !1;
	if (e !== n) c = (t - r) / (e - n), l = (e * r - n * t) / (e - n);
	else return Math.abs(a - e) <= s / 2;
	var u = c * a - o + l;
	return u * u / (c * c + 1) <= s / 2 * s / 2;
}
//#endregion
//#region node_modules/zrender/lib/contain/cubic.js
function Ya(e, t, n, r, i, a, o, s, c, l, u) {
	if (c === 0) return !1;
	var d = c;
	return u > t + d && u > r + d && u > a + d && u > s + d || u < t - d && u < r - d && u < a - d && u < s - d || l > e + d && l > n + d && l > i + d && l > o + d || l < e - d && l < n - d && l < i - d && l < o - d ? !1 : lr(e, t, n, r, i, a, o, s, l, u, null) <= d / 2;
}
//#endregion
//#region node_modules/zrender/lib/contain/quadratic.js
function Xa(e, t, n, r, i, a, o, s, c) {
	if (o === 0) return !1;
	var l = o;
	return c > t + l && c > r + l && c > a + l || c < t - l && c < r - l && c < a - l || s > e + l && s > n + l && s > i + l || s < e - l && s < n - l && s < i - l ? !1 : gr(e, t, n, r, i, a, s, c, null) <= l / 2;
}
//#endregion
//#region node_modules/zrender/lib/contain/util.js
var Za = Math.PI * 2;
function Qa(e) {
	return e %= Za, e < 0 && (e += Za), e;
}
//#endregion
//#region node_modules/zrender/lib/contain/arc.js
var $a = Math.PI * 2;
function eo(e, t, n, r, i, a, o, s, c) {
	if (o === 0) return !1;
	var l = o;
	s -= e, c -= t;
	var u = Math.sqrt(s * s + c * c);
	if (u - l > n || u + l < n) return !1;
	if (Math.abs(r - i) % $a < 1e-4) return !0;
	if (a) {
		var d = r;
		r = Qa(i), i = Qa(d);
	} else r = Qa(r), i = Qa(i);
	r > i && (i += $a);
	var f = Math.atan2(c, s);
	return f < 0 && (f += $a), f >= r && f <= i || f + $a >= r && f + $a <= i;
}
//#endregion
//#region node_modules/zrender/lib/contain/windingLine.js
function to(e, t, n, r, i, a) {
	if (a > t && a > r || a < t && a < r || r === t) return 0;
	var o = (a - t) / (r - t), s = r < t ? 1 : -1;
	(o === 1 || o === 0) && (s = r < t ? .5 : -.5);
	var c = o * (n - e) + e;
	return c === i ? Infinity : c > i ? s : 0;
}
//#endregion
//#region node_modules/zrender/lib/contain/path.js
var no = qa.CMD, ro = Math.PI * 2, io = 1e-4;
function ao(e, t) {
	return Math.abs(e - t) < io;
}
var oo = [
	-1,
	-1,
	-1
], so = [-1, -1];
function co() {
	var e = so[0];
	so[0] = so[1], so[1] = e;
}
function lo(e, t, n, r, i, a, o, s, c, l) {
	if (l > t && l > r && l > a && l > s || l < t && l < r && l < a && l < s) return 0;
	var u = or(t, r, a, s, l, oo);
	if (u === 0) return 0;
	for (var d = 0, f = -1, p = void 0, m = void 0, h = 0; h < u; h++) {
		var g = oo[h], _ = g === 0 || g === 1 ? .5 : 1;
		ir(e, n, i, o, g) < c || (f < 0 && (f = sr(t, r, a, s, so), so[1] < so[0] && f > 1 && co(), p = ir(t, r, a, s, so[0]), f > 1 && (m = ir(t, r, a, s, so[1]))), f === 2 ? g < so[0] ? d += p < t ? _ : -_ : g < so[1] ? d += m < p ? _ : -_ : d += s < m ? _ : -_ : g < so[0] ? d += p < t ? _ : -_ : d += s < p ? _ : -_);
	}
	return d;
}
function uo(e, t, n, r, i, a, o, s) {
	if (s > t && s > r && s > a || s < t && s < r && s < a) return 0;
	var c = pr(t, r, a, s, oo);
	if (c === 0) return 0;
	var l = mr(t, r, a);
	if (l >= 0 && l <= 1) {
		for (var u = 0, d = dr(t, r, a, l), f = 0; f < c; f++) {
			var p = oo[f] === 0 || oo[f] === 1 ? .5 : 1, m = dr(e, n, i, oo[f]);
			m < o || (oo[f] < l ? u += d < t ? p : -p : u += a < d ? p : -p);
		}
		return u;
	}
	var p = oo[0] === 0 || oo[0] === 1 ? .5 : 1, m = dr(e, n, i, oo[0]);
	return m < o ? 0 : a < t ? p : -p;
}
function fo(e, t, n, r, i, a, o, s) {
	if (s -= t, s > n || s < -n) return 0;
	var c = Math.sqrt(n * n - s * s);
	oo[0] = -c, oo[1] = c;
	var l = Math.abs(r - i);
	if (l < 1e-4) return 0;
	if (l >= ro - 1e-4) {
		r = 0, i = ro;
		var u = a ? 1 : -1;
		return o >= oo[0] + e && o <= oo[1] + e ? u : 0;
	}
	if (r > i) {
		var d = r;
		r = i, i = d;
	}
	r < 0 && (r += ro, i += ro);
	for (var f = 0, p = 0; p < 2; p++) {
		var m = oo[p];
		if (m + e > o) {
			var h = Math.atan2(s, m), u = a ? 1 : -1;
			h < 0 && (h = ro + h), (h >= r && h <= i || h + ro >= r && h + ro <= i) && (h > Math.PI / 2 && h < Math.PI * 1.5 && (u = -u), f += u);
		}
	}
	return f;
}
function po(e, t, n, r, i) {
	for (var a = e.data, o = e.len(), s = 0, c = 0, l = 0, u = 0, d = 0, f, p, m = 0; m < o;) {
		var h = a[m++], g = m === 1;
		switch (h === no.M && m > 1 && (n || (s += to(c, l, u, d, r, i))), g && (c = a[m], l = a[m + 1], u = c, d = l), h) {
			case no.M:
				u = a[m++], d = a[m++], c = u, l = d;
				break;
			case no.L:
				if (n) {
					if (Ja(c, l, a[m], a[m + 1], t, r, i)) return !0;
				} else s += to(c, l, a[m], a[m + 1], r, i) || 0;
				c = a[m++], l = a[m++];
				break;
			case no.C:
				if (n) {
					if (Ya(c, l, a[m++], a[m++], a[m++], a[m++], a[m], a[m + 1], t, r, i)) return !0;
				} else s += lo(c, l, a[m++], a[m++], a[m++], a[m++], a[m], a[m + 1], r, i) || 0;
				c = a[m++], l = a[m++];
				break;
			case no.Q:
				if (n) {
					if (Xa(c, l, a[m++], a[m++], a[m], a[m + 1], t, r, i)) return !0;
				} else s += uo(c, l, a[m++], a[m++], a[m], a[m + 1], r, i) || 0;
				c = a[m++], l = a[m++];
				break;
			case no.A:
				var _ = a[m++], v = a[m++], y = a[m++], b = a[m++], x = a[m++], S = a[m++];
				m += 1;
				var C = !!(1 - a[m++]);
				f = Math.cos(x) * y + _, p = Math.sin(x) * b + v, g ? (u = f, d = p) : s += to(c, l, f, p, r, i);
				var w = (r - _) * b / y + _;
				if (n) {
					if (eo(_, v, b, x, x + S, C, t, w, i)) return !0;
				} else s += fo(_, v, b, x, x + S, C, w, i);
				c = Math.cos(x + S) * y + _, l = Math.sin(x + S) * b + v;
				break;
			case no.R:
				u = c = a[m++], d = l = a[m++];
				var T = a[m++], E = a[m++];
				if (f = u + T, p = d + E, n) {
					if (Ja(u, d, f, d, t, r, i) || Ja(f, d, f, p, t, r, i) || Ja(f, p, u, p, t, r, i) || Ja(u, p, u, d, t, r, i)) return !0;
				} else s += to(f, d, f, p, r, i), s += to(u, p, u, d, r, i);
				break;
			case no.Z:
				if (n) {
					if (Ja(c, l, u, d, t, r, i)) return !0;
				} else s += to(c, l, u, d, r, i);
				c = u, l = d;
		}
	}
	return !n && !ao(l, d) && (s += to(c, l, u, d, r, i) || 0), s !== 0;
}
function mo(e, t, n) {
	return po(e, 0, !1, t, n);
}
function ho(e, t, n, r) {
	return po(e, t, !0, n, r);
}
//#endregion
//#region node_modules/zrender/lib/graphic/Path.js
var go = j({
	fill: "#000",
	stroke: null,
	strokePercent: 1,
	fillOpacity: 1,
	strokeOpacity: 1,
	lineDashOffset: 0,
	lineWidth: 1,
	lineCap: "butt",
	miterLimit: 10,
	strokeNoScale: !1,
	strokeFirst: !1
}, sa), _o = { style: j({
	fill: !0,
	stroke: !0,
	strokePercent: !0,
	fillOpacity: !0,
	strokeOpacity: !0,
	lineDashOffset: !0,
	lineWidth: !0,
	miterLimit: !0
}, ca.style) }, vo = Wn.concat([
	"invisible",
	"culling",
	"z",
	"z2",
	"zlevel",
	"parent"
]), yo = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.update = function() {
		var n = this;
		e.prototype.update.call(this);
		var r = this.style;
		if (r.decal) {
			var i = this._decalEl = this._decalEl || new t();
			i.buildPath === t.prototype.buildPath && (i.buildPath = function(e) {
				n.buildPath(e, n.shape);
			}), i.silent = !0;
			var a = i.style;
			for (var o in r) a[o] !== r[o] && (a[o] = r[o]);
			a.fill = r.fill ? r.decal : null, a.decal = null, a.shadowColor = null, r.strokeFirst && (a.stroke = null);
			for (var s = 0; s < vo.length; ++s) i[vo[s]] = this[vo[s]];
			i.__dirty |= 1;
		} else this._decalEl &&= null;
	}, t.prototype.getDecalElement = function() {
		return this._decalEl;
	}, t.prototype._init = function(t) {
		var n = R(t);
		this.shape = this.getDefaultShape();
		var r = this.getDefaultStyle();
		r && this.useStyle(r);
		for (var i = 0; i < n.length; i++) {
			var a = n[i], o = t[a];
			a === "style" ? this.style ? k(this.style, o) : this.useStyle(o) : a === "shape" ? k(this.shape, o) : e.prototype.attrKV.call(this, a, o);
		}
		this.style || this.useStyle({});
	}, t.prototype.getDefaultStyle = function() {
		return null;
	}, t.prototype.getDefaultShape = function() {
		return {};
	}, t.prototype.canBeInsideText = function() {
		return this.hasFill();
	}, t.prototype.getInsideTextFill = function() {
		var e = this.style.fill;
		if (e !== "none") {
			if (U(e)) {
				var t = Ur(e, 0);
				return t > .5 ? Bi : t > .2 ? Hi : Vi;
			}
			if (e) return Vi;
		}
		return Bi;
	}, t.prototype.getInsideTextStroke = function(e) {
		var t = this.style.fill;
		if (U(t)) {
			var n = this.__zr;
			if (!!(n && n.isDarkMode()) == Ur(e, 0) < .4) return t;
		}
	}, t.prototype.buildPath = function(e, t, n) {}, t.prototype.pathUpdated = function() {
		this.__dirty &= -5;
	}, t.prototype.getUpdatedPathProxy = function(e) {
		return !this.path && this.createPathProxy(), this.path.beginPath(), this.buildPath(this.path, this.shape, e), this.path;
	}, t.prototype.createPathProxy = function() {
		this.path = new qa(!1);
	}, t.prototype.hasStroke = function() {
		var e = this.style, t = e.stroke;
		return !(t == null || t === "none" || !(e.lineWidth > 0));
	}, t.prototype.hasFill = function() {
		var e = this.style.fill;
		return e != null && e !== "none";
	}, t.prototype.getBoundingRect = function() {
		var e = this._rect, t = this.style, n = !e;
		if (n) {
			var r = !1;
			this.path || (r = !0, this.createPathProxy());
			var i = this.path;
			(r || this.__dirty & 4) && (i.beginPath(), this.buildPath(i, this.shape, !1), this.pathUpdated()), e = i.getBoundingRect();
		}
		if (this._rect = e, this.hasStroke() && this.path && this.path.len() > 0) {
			var a = this._rectStroke ||= e.clone();
			if (this.__dirty || n) {
				a.copy(e);
				var o = t.strokeNoScale ? this.getLineScale() : 1, s = t.lineWidth;
				if (!this.hasFill()) {
					var c = this.strokeContainThreshold;
					s = Math.max(s, c ?? 4);
				}
				o > 1e-10 && (a.width += s / o, a.height += s / o, a.x -= s / o / 2, a.y -= s / o / 2);
			}
			return a;
		}
		return e;
	}, t.prototype.contain = function(e, t) {
		var n = this.transformCoordToLocal(e, t), r = this.getBoundingRect(), i = this.style;
		if (e = n[0], t = n[1], r.contain(e, t)) {
			var a = this.path;
			if (this.hasStroke()) {
				var o = i.lineWidth, s = i.strokeNoScale ? this.getLineScale() : 1;
				if (s > 1e-10 && (this.hasFill() || (o = Math.max(o, this.strokeContainThreshold)), ho(a, o / s, e, t))) return !0;
			}
			if (this.hasFill()) return mo(a, e, t);
		}
		return !1;
	}, t.prototype.dirtyShape = function() {
		this.__dirty |= 4, this._rect &&= null, this._decalEl && this._decalEl.dirtyShape(), this.markRedraw();
	}, t.prototype.dirty = function() {
		this.dirtyStyle(), this.dirtyShape();
	}, t.prototype.animateShape = function(e) {
		return this.animate("shape", e);
	}, t.prototype.updateDuringAnimation = function(e) {
		e === "style" ? this.dirtyStyle() : e === "shape" ? this.dirtyShape() : this.markRedraw();
	}, t.prototype.attrKV = function(t, n) {
		t === "shape" ? this.setShape(n) : e.prototype.attrKV.call(this, t, n);
	}, t.prototype.setShape = function(e, t) {
		var n = this.shape;
		return n ||= this.shape = {}, typeof e == "string" ? n[e] = t : k(n, e), this.dirtyShape(), this;
	}, t.prototype.shapeChanged = function() {
		return !!(this.__dirty & 4);
	}, t.prototype.createStyle = function(e) {
		return we(go, e);
	}, t.prototype._innerSaveToNormal = function(t) {
		e.prototype._innerSaveToNormal.call(this, t);
		var n = this._normalState;
		t.shape && !n.shape && (n.shape = k({}, this.shape));
	}, t.prototype._applyStateObj = function(t, n, r, i, a, o) {
		if (e.prototype._applyStateObj.call(this, t, n, r, i, a, o), this.__inHover !== 1) {
			var s = !(n && i), c;
			if (n && n.shape ? a ? i ? c = n.shape : (c = k({}, r.shape), k(c, n.shape)) : (c = k({}, i ? this.shape : r.shape), k(c, n.shape)) : s && (c = r.shape), c) {
				if (a) {
					this.shape = k({}, this.shape);
					for (var l = {}, u = R(c), d = 0; d < u.length; d++) {
						var f = u[d];
						typeof c[f] == "object" ? this.shape[f] = c[f] : l[f] = c[f];
					}
					this._transitionState(t, { shape: l }, o);
				} else this.shape = c, this.dirtyShape();
			}
		}
	}, t.prototype._mergeStates = function(t) {
		for (var n = e.prototype._mergeStates.call(this, t), r, i = 0; i < t.length; i++) {
			var a = t[i];
			a.shape && (r ||= {}, this._mergeStyle(r, a.shape));
		}
		return r && (n.shape = r), n;
	}, t.prototype.getAnimationStyleProps = function() {
		return _o;
	}, t.prototype.isZeroArea = function() {
		return !1;
	}, t.extend = function(e) {
		var n = function(t) {
			r(n, t);
			function n(n) {
				var r = t.call(this, n) || this;
				return e.init && e.init.call(r, n), r;
			}
			return n.prototype.getDefaultStyle = function() {
				return E(e.style);
			}, n.prototype.getDefaultShape = function() {
				return E(e.shape);
			}, n;
		}(t);
		for (var i in e) typeof e[i] == "function" && (n.prototype[i] = e[i]);
		return n;
	}, t.initDefaultProps = (function() {
		var e = t.prototype;
		e.type = "path", e.strokeContainThreshold = 5, e.segmentIgnoreThreshold = 0, e.subPixelOptimize = !1, e.autoBatch = !1, e.__dirty = 7;
	})(), t;
}(da), bo = j({
	strokeFirst: !0,
	font: i,
	x: 0,
	y: 0,
	textAlign: "left",
	textBaseline: "top",
	miterLimit: 2
}, go), xo = function(e) {
	r(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t.prototype.hasStroke = function() {
		return Nn(this.style);
	}, t.prototype.hasFill = function() {
		var e = this.style.fill;
		return e != null && e !== "none";
	}, t.prototype.createStyle = function(e) {
		return we(bo, e);
	}, t.prototype.setBoundingRect = function(e) {
		this._rect = e;
	}, t.prototype.getBoundingRect = function() {
		return this._rect ||= jn(this.style), this._rect;
	}, t.initDefaultProps = (function() {
		var e = t.prototype;
		e.dirtyRectTolerance = 10;
	})(), t;
}(da);
xo.prototype.type = "tspan";
//#endregion
//#region node_modules/zrender/lib/graphic/Image.js
var So = j({
	x: 0,
	y: 0
}, sa), Co = { style: j({
	x: !0,
	y: !0,
	width: !0,
	height: !0,
	sx: !0,
	sy: !0,
	sWidth: !0,
	sHeight: !0
}, ca.style) };
function wo(e) {
	return !!(e && typeof e != "string" && e.width && e.height);
}
var To = function(e) {
	r(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t.prototype.createStyle = function(e) {
		return we(So, e);
	}, t.prototype._getSize = function(e) {
		var t = this.style, n = t[e];
		if (n != null) return n;
		var r = wo(t.image) ? t.image : this.__image;
		if (!r) return 0;
		var i = e === "width" ? "height" : "width", a = t[i];
		return a == null ? r[e] : r[e] / r[i] * a;
	}, t.prototype.getWidth = function() {
		return this._getSize("width");
	}, t.prototype.getHeight = function() {
		return this._getSize("height");
	}, t.prototype.getAnimationStyleProps = function() {
		return Co;
	}, t.prototype.getBoundingRect = function() {
		var e = this.style;
		return this._rect ||= new Y(e.x || 0, e.y || 0, this.getWidth(), this.getHeight()), this._rect;
	}, t;
}(da);
To.prototype.type = "image";
//#endregion
//#region node_modules/zrender/lib/graphic/helper/roundRect.js
function Eo(e, t) {
	var n = t.x, r = t.y, i = t.width, a = t.height, o = t.r, s, c, l, u;
	i < 0 && (n += i, i = -i), a < 0 && (r += a, a = -a), typeof o == "number" ? s = c = l = u = o : o instanceof Array ? o.length === 1 ? s = c = l = u = o[0] : o.length === 2 ? (s = l = o[0], c = u = o[1]) : o.length === 3 ? (s = o[0], c = u = o[1], l = o[2]) : (s = o[0], c = o[1], l = o[2], u = o[3]) : s = c = l = u = 0;
	var d;
	s + c > i && (d = s + c, s *= i / d, c *= i / d), l + u > i && (d = l + u, l *= i / d, u *= i / d), c + l > a && (d = c + l, c *= a / d, l *= a / d), s + u > a && (d = s + u, s *= a / d, u *= a / d), e.moveTo(n + s, r), e.lineTo(n + i - c, r), c !== 0 && e.arc(n + i - c, r + c, c, -Math.PI / 2, 0), e.lineTo(n + i, r + a - l), l !== 0 && e.arc(n + i - l, r + a - l, l, 0, Math.PI / 2), e.lineTo(n + u, r + a), u !== 0 && e.arc(n + u, r + a - u, u, Math.PI / 2, Math.PI), e.lineTo(n, r + s), s !== 0 && e.arc(n + s, r + s, s, Math.PI, Math.PI * 1.5), e.closePath();
}
//#endregion
//#region node_modules/zrender/lib/graphic/helper/subPixelOptimize.js
var Do = Math.round;
function Oo(e, t, n) {
	if (t) {
		var r = t.x1, i = t.x2, a = t.y1, o = t.y2;
		e.x1 = r, e.x2 = i, e.y1 = a, e.y2 = o;
		var s = n && n.lineWidth;
		return s ? (Do(r * 2) === Do(i * 2) && (e.x1 = e.x2 = Ao(r, s, !0)), Do(a * 2) === Do(o * 2) && (e.y1 = e.y2 = Ao(a, s, !0)), e) : e;
	}
}
function ko(e, t, n) {
	if (t) {
		var r = t.x, i = t.y, a = t.width, o = t.height;
		e.x = r, e.y = i, e.width = a, e.height = o;
		var s = n && n.lineWidth;
		return s ? (e.x = Ao(r, s, !0), e.y = Ao(i, s, !0), e.width = Math.max(Ao(r + a, s, !1) - e.x, a === 0 ? 0 : 1), e.height = Math.max(Ao(i + o, s, !1) - e.y, o === 0 ? 0 : 1), e) : e;
	}
}
function Ao(e, t, n) {
	if (!t) return e;
	var r = Do(e * 2);
	return (r + Do(t)) % 2 == 0 ? r / 2 : (r + (n ? 1 : -1)) / 2;
}
//#endregion
//#region node_modules/zrender/lib/graphic/shape/Rect.js
var jo = function() {
	function e() {
		this.x = 0, this.y = 0, this.width = 0, this.height = 0;
	}
	return e;
}(), Mo = {}, No = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.getDefaultShape = function() {
		return new jo();
	}, t.prototype.buildPath = function(e, t) {
		var n, r, i, a;
		if (this.subPixelOptimize) {
			var o = ko(Mo, t, this.style);
			n = o.x, r = o.y, i = o.width, a = o.height, o.r = t.r, t = o;
		} else n = t.x, r = t.y, i = t.width, a = t.height;
		t.r ? Eo(e, t) : e.rect(n, r, i, a);
	}, t.prototype.isZeroArea = function() {
		return !this.shape.width || !this.shape.height;
	}, t;
}(yo);
No.prototype.type = "rect";
//#endregion
//#region node_modules/zrender/lib/graphic/Text.js
var Po = { fill: "#000" }, Fo = 2, Io = {}, Lo = { style: j({
	fill: !0,
	stroke: !0,
	fillOpacity: !0,
	strokeOpacity: !0,
	lineWidth: !0,
	fontSize: !0,
	lineHeight: !0,
	width: !0,
	height: !0,
	textShadowColor: !0,
	textShadowBlur: !0,
	textShadowOffsetX: !0,
	textShadowOffsetY: !0,
	backgroundColor: !0,
	padding: !0,
	borderColor: !0,
	borderWidth: !0,
	borderRadius: !0
}, ca.style) }, Ro = function(e) {
	r(t, e);
	function t(t) {
		var n = e.call(this) || this;
		return n.type = "text", n._children = [], n._defaultStyle = Po, n.attr(t), n;
	}
	return t.prototype.childrenRef = function() {
		return this._children;
	}, t.prototype.update = function() {
		e.prototype.update.call(this), this.styleChanged() && this._updateSubTexts();
		for (var t = 0; t < this._children.length; t++) {
			var n = this._children[t];
			n.zlevel = this.zlevel, n.z = this.z, n.z2 = this.z2, n.culling = this.culling, n.cursor = this.cursor, n.invisible = this.invisible;
		}
	}, t.prototype.updateTransform = function() {
		var t = this.innerTransformable;
		t ? (t.updateTransform(), t.transform && (this.transform = t.transform)) : e.prototype.updateTransform.call(this);
	}, t.prototype.getLocalTransform = function(t) {
		var n = this.innerTransformable;
		return n ? n.getLocalTransform(t) : e.prototype.getLocalTransform.call(this, t);
	}, t.prototype.getComputedTransform = function() {
		return this.__hostTarget && (this.__hostTarget.getComputedTransform(), this.__hostTarget.updateInnerText(!0)), e.prototype.getComputedTransform.call(this);
	}, t.prototype._updateSubTexts = function() {
		this._childCursor = 0, Go(this.style), this.style.rich ? this._updateRichTexts() : this._updatePlainTexts(), this._children.length = this._childCursor, this.styleUpdated();
	}, t.prototype.addSelfToZr = function(t) {
		e.prototype.addSelfToZr.call(this, t);
		for (var n = 0; n < this._children.length; n++) this._children[n].__zr = t;
	}, t.prototype.removeSelfFromZr = function(t) {
		e.prototype.removeSelfFromZr.call(this, t);
		for (var n = 0; n < this._children.length; n++) this._children[n].__zr = null;
	}, t.prototype.getBoundingRect = function() {
		if (this.styleChanged() && this._updateSubTexts(), !this._rect) {
			for (var e = new Y(0, 0, 0, 0), t = this._children, n = [], r = null, i = 0; i < t.length; i++) {
				var a = t[i], o = a.getBoundingRect(), s = a.getLocalTransform(n);
				s ? (e.copy(o), e.applyTransform(s), r ||= e.clone(), r.union(e)) : (r ||= o.clone(), r.union(o));
			}
			this._rect = r || e;
		}
		return this._rect;
	}, t.prototype.setDefaultTextStyle = function(e) {
		this._defaultStyle = e || Po;
	}, t.prototype.setTextContent = function(e) {}, t.prototype._mergeStyle = function(e, t) {
		if (!t) return e;
		var n = t.rich, r = e.rich || n && {};
		return k(e, t), n && r ? (this._mergeRich(r, n), e.rich = r) : r && (e.rich = r), e;
	}, t.prototype._mergeRich = function(e, t) {
		for (var n = R(t), r = 0; r < n.length; r++) {
			var i = n[r];
			e[i] = e[i] || {}, k(e[i], t[i]);
		}
	}, t.prototype.getAnimationStyleProps = function() {
		return Lo;
	}, t.prototype._getOrCreateChild = function(e) {
		var t = this._children[this._childCursor];
		return (!t || !(t instanceof e)) && (t = new e()), this._children[this._childCursor++] = t, t.__zr = this.__zr, t.parent = this, t;
	}, t.prototype._updatePlainTexts = function() {
		var e = this.style, t = e.font || "12px sans-serif", n = e.padding, r = this._defaultStyle, i = e.x || 0, a = e.y || 0, o = e.align || r.align || "left", s = e.verticalAlign || r.verticalAlign || "top";
		Dn(Io, r.overflowRect, i, a, o, s), i = Io.baseX, a = Io.baseY;
		var c = _n(Xo(e), e, Io.outerWidth, Io.outerHeight), l = Zo(e), u = !!e.backgroundColor, d = c.outerHeight, f = c.outerWidth, p = c.lines, m = c.lineHeight;
		this.isTruncated = !!c.isTruncated;
		var h = i, g = cn(a, c.contentHeight, s);
		if (l || n) {
			var _ = sn(i, f, o), v = cn(a, d, s);
			l && this._renderBackground(e, e, _, v, f, d);
		}
		g += m / 2, n && (h = Yo(i, o, n), s === "top" ? g += n[0] : s === "bottom" && (g -= n[2]));
		for (var y = 0, b = !1, x = !1, S = Jo("fill" in e ? e.fill : (x = !0, r.fill)), C = qo("stroke" in e ? e.stroke : !u && (!r.autoStroke || x) ? (y = Fo, b = !0, r.stroke) : null), w = e.textShadowBlur > 0, T = 0; T < p.length; T++) {
			var E = this._getOrCreateChild(xo), D = E.createStyle();
			E.useStyle(D), D.text = p[T], D.x = h, D.y = g, o && (D.textAlign = o), D.textBaseline = "middle", D.opacity = e.opacity, D.strokeFirst = !0, w && (D.shadowBlur = e.textShadowBlur || 0, D.shadowColor = e.textShadowColor || "transparent", D.shadowOffsetX = e.textShadowOffsetX || 0, D.shadowOffsetY = e.textShadowOffsetY || 0), D.stroke = C, D.fill = S, C && (D.lineWidth = e.lineWidth || y, D.lineDash = e.lineDash, D.lineDashOffset = e.lineDashOffset || 0), D.font = t, Uo(D, e), g += m, E.setBoundingRect(Mn(D, c.contentWidth, c.calculatedLineHeight, b ? 0 : null));
		}
	}, t.prototype._updateRichTexts = function() {
		var e = this.style, t = this._defaultStyle, n = e.align || t.align, r = e.verticalAlign || t.verticalAlign, i = e.x || 0, a = e.y || 0;
		Dn(Io, t.overflowRect, i, a, n, r), i = Io.baseX, a = Io.baseY;
		var o = xn(Xo(e), e, Io.outerWidth, Io.outerHeight, n), s = o.width, c = o.outerWidth, l = o.outerHeight, u = e.padding;
		this.isTruncated = !!o.isTruncated;
		var d = sn(i, c, n), f = cn(a, l, r), p = d, m = f;
		u && (p += u[3], m += u[0]);
		var h = p + s;
		Zo(e) && this._renderBackground(e, e, d, f, c, l);
		for (var g = !!e.backgroundColor, _ = 0; _ < o.lines.length; _++) {
			for (var v = o.lines[_], y = v.tokens, b = y.length, x = v.lineHeight, S = v.width, C = 0, w = p, T = h, E = b - 1, D = void 0; C < b && (D = y[C], !D.align || D.align === "left");) this._placeToken(D, e, x, m, w, "left", g), S -= D.width, w += D.width, C++;
			for (; E >= 0 && (D = y[E], D.align === "right");) this._placeToken(D, e, x, m, T, "right", g), S -= D.width, T -= D.width, E--;
			for (w += (s - (w - p) - (h - T) - S) / 2; C <= E;) D = y[C], this._placeToken(D, e, x, m, w + D.width / 2, "center", g), w += D.width, C++;
			m += x;
		}
	}, t.prototype._placeToken = function(e, t, n, r, i, a, o) {
		var s = t.rich[e.styleName] || {};
		s.text = e.text;
		var c = e.verticalAlign, l = r + n / 2;
		c === "top" ? l = r + e.height / 2 : c === "bottom" && (l = r + n - e.height / 2), !e.isLineHolder && Zo(s) && this._renderBackground(s, t, a === "right" ? i - e.width : a === "center" ? i - e.width / 2 : i, l - e.height / 2, e.width, e.height);
		var u = !!s.backgroundColor, d = e.textPadding;
		d && (i = Yo(i, a, d), l -= e.height / 2 - d[0] - e.innerHeight / 2);
		var f = this._getOrCreateChild(xo), p = f.createStyle();
		f.useStyle(p);
		var m = this._defaultStyle, h = !1, g = 0, _ = !1, v = Jo("fill" in s ? s.fill : "fill" in t ? t.fill : (h = !0, m.fill)), y = qo("stroke" in s ? s.stroke : "stroke" in t ? t.stroke : !u && !o && (!m.autoStroke || h) ? (g = Fo, _ = !0, m.stroke) : null), b = s.textShadowBlur > 0 || t.textShadowBlur > 0;
		p.text = e.text, p.x = i, p.y = l, b && (p.shadowBlur = s.textShadowBlur || t.textShadowBlur || 0, p.shadowColor = s.textShadowColor || t.textShadowColor || "transparent", p.shadowOffsetX = s.textShadowOffsetX || t.textShadowOffsetX || 0, p.shadowOffsetY = s.textShadowOffsetY || t.textShadowOffsetY || 0), p.textAlign = a, p.textBaseline = "middle", p.font = e.font || "12px sans-serif", p.opacity = de(s.opacity, t.opacity, 1), Uo(p, s), y && (p.lineWidth = de(s.lineWidth, t.lineWidth, g), p.lineDash = K(s.lineDash, t.lineDash), p.lineDashOffset = t.lineDashOffset || 0, p.stroke = y), v && (p.fill = v), f.setBoundingRect(Mn(p, e.contentWidth, e.contentHeight, _ ? 0 : null));
	}, t.prototype._renderBackground = function(e, t, n, r, i, a) {
		var o = e.backgroundColor, s = e.borderWidth, c = e.borderColor, l = o && o.image, u = o && !l, d = e.borderRadius, f = this, p, m;
		if (u || e.lineHeight || s && c) {
			p = this._getOrCreateChild(No), p.useStyle(p.createStyle()), p.style.fill = null;
			var h = p.shape;
			h.x = n, h.y = r, h.width = i, h.height = a, h.r = d, p.dirtyShape();
		}
		if (u) {
			var g = p.style;
			g.fill = o || null, g.fillOpacity = K(e.fillOpacity, 1);
		} else if (l) {
			m = this._getOrCreateChild(To), m.onload = function() {
				f.dirtyStyle();
			};
			var _ = m.style;
			_.image = o.image, _.x = n, _.y = r, _.width = i, _.height = a;
		}
		if (s && c) {
			var g = p.style;
			g.lineWidth = s, g.stroke = c, g.strokeOpacity = K(e.strokeOpacity, 1), g.lineDash = e.borderDash, g.lineDashOffset = e.borderDashOffset || 0, p.strokeContainThreshold = 0, p.hasFill() && p.hasStroke() && (g.strokeFirst = !0, g.lineWidth *= 2);
		}
		var v = (p || m).style;
		v.shadowBlur = e.shadowBlur || 0, v.shadowColor = e.shadowColor || "transparent", v.shadowOffsetX = e.shadowOffsetX || 0, v.shadowOffsetY = e.shadowOffsetY || 0, v.opacity = de(e.opacity, t.opacity, 1);
	}, t.makeFont = function(e) {
		var t = "";
		return Wo(e) && (t = [
			e.fontStyle,
			e.fontWeight,
			Ho(e.fontSize),
			e.fontFamily || "sans-serif"
		].join(" ")), t && he(t) || e.textFont || e.font;
	}, t;
}(da), zo = {
	left: !0,
	right: 1,
	center: 1
}, Bo = {
	top: 1,
	bottom: 1,
	middle: 1
}, Vo = [
	"fontStyle",
	"fontWeight",
	"fontSize",
	"fontFamily"
];
function Ho(e) {
	return typeof e == "string" && (e.indexOf("px") !== -1 || e.indexOf("rem") !== -1 || e.indexOf("em") !== -1) ? e : isNaN(+e) ? "12px" : e + "px";
}
function Uo(e, t) {
	for (var n = 0; n < Vo.length; n++) {
		var r = Vo[n], i = t[r];
		i != null && (e[r] = i);
	}
}
function Wo(e) {
	return e.fontSize != null || e.fontFamily || e.fontWeight;
}
function Go(e) {
	return Ko(e), F(e.rich, Ko), e;
}
function Ko(e) {
	if (e) {
		e.font = Ro.makeFont(e);
		var t = e.align;
		t === "middle" && (t = "center"), e.align = t == null || zo[t] ? t : "left";
		var n = e.verticalAlign;
		n === "center" && (n = "middle"), e.verticalAlign = n == null || Bo[n] ? n : "top", e.padding &&= pe(e.padding);
	}
}
function qo(e, t) {
	return e == null || t <= 0 || e === "transparent" || e === "none" ? null : e.image || e.colorStops ? "#000" : e;
}
function Jo(e) {
	return e == null || e === "none" ? null : e.image || e.colorStops ? "#000" : e;
}
function Yo(e, t, n) {
	return t === "right" ? e - n[1] : t === "center" ? e + n[3] / 2 - n[1] / 2 : e + n[3];
}
function Xo(e) {
	var t = e.text;
	return t != null && (t += ""), t;
}
function Zo(e) {
	return !!(e.backgroundColor || e.lineHeight || e.borderWidth && e.borderColor);
}
//#endregion
//#region node_modules/echarts/lib/util/number.js
var Qo = 1e-4, $o = 20;
function es(e) {
	return e.replace(/^\s+|\s+$/g, "");
}
var ts = Math.min, ns = Math.max, rs = Math.abs, is = Math.round, as = Math.floor, os = Math.ceil, ss = Math.pow, cs = Math.log, ls = Math.LN10, us = Math.PI, ds = Math.random;
function fs(e, t, n, r) {
	var i = t[0], a = t[1], o = n[0], s = n[1], c = a - i, l = s - o;
	if (c === 0) return l === 0 ? o : (o + s) / 2;
	if (r) {
		if (c > 0) {
			if (e <= i) return o;
			if (e >= a) return s;
		} else if (e >= i) return o;
		else if (e <= a) return s;
	} else {
		if (e === i) return o;
		if (e === a) return s;
	}
	return (e - i) / c * l + o;
}
var ps = ms;
function ms(e, t, n) {
	switch (e) {
		case "center":
		case "middle":
			e = "50%";
			break;
		case "left":
		case "top":
			e = "0%";
			break;
		case "right":
		case "bottom": e = "100%";
	}
	return hs(e, t, n);
}
function hs(e, t, n) {
	return U(e) ? _s(e) ? parseFloat(e) / 100 * t + (n || 0) : parseFloat(e) : e == null ? NaN : +e;
}
function gs(e) {
	return U(e) && _s(e);
}
function _s(e) {
	return !!es(e).match(/%$/);
}
function vs(e, t, n) {
	return isNaN(t) ? n ? "" + e : +e : (t = ts(ns(0, t), $o), e = (+e).toFixed(t), n ? e : +e);
}
function ys(e) {
	return e.sort(function(e, t) {
		return e - t;
	}), e;
}
function bs(e) {
	if (e = +e, isNaN(e)) return 0;
	if (e > 1e-14) {
		for (var t = 1, n = 0; n < 15; n++, t *= 10) if (is(e * t) / t === e) return n;
	}
	return xs(e);
}
function xs(e) {
	var t = e.toString().toLowerCase(), n = t.indexOf("e"), r = n > 0 ? +t.slice(n + 1) : 0, i = n > 0 ? n : t.length, a = t.indexOf(".");
	return ns(0, (a < 0 ? 0 : i - 1 - a) - r);
}
function Ss(e, t, n) {
	var r = rs(e[1] - e[0]);
	if (!isFinite(r) || r === 0) return NaN;
	var i = cs(2 * rs(n || 1) * rs(r)) / ls, a = cs(rs(t)) / ls, o = ns(0, os(-i + a));
	return isFinite(o) || (o = NaN), o;
}
function Cs(e, t) {
	var n = ns(bs(e), bs(t)), r = e + t;
	return n > $o ? r : vs(r, n);
}
var ws = ss(2, 53) - 1;
function Ts(e) {
	var t = us * 2;
	return (e % t + t) % t;
}
function Es(e) {
	return e > -Qo && e < Qo;
}
var Ds = /^(?:(\d{4})(?:[-\/](\d{1,2})(?:[-\/](\d{1,2})(?:[T ](\d{1,2})(?::(\d{1,2})(?::(\d{1,2})(?:[.,](\d+))?)?)?(Z|[\+\-]\d\d:?\d\d)?)?)?)?)?$/;
function Os(e) {
	if (e instanceof Date) return e;
	if (U(e)) {
		var t = Ds.exec(e);
		if (!t) return /* @__PURE__ */ new Date(NaN);
		if (t[8]) {
			var n = +t[4] || 0;
			return t[8].toUpperCase() !== "Z" && (n -= +t[8].slice(0, 3)), new Date(Date.UTC(+t[1], (t[2] || 1) - 1, +t[3] || 1, n, +(t[5] || 0), +t[6] || 0, t[7] ? +t[7].substring(0, 3) : 0));
		}
		return new Date(+t[1], (t[2] || 1) - 1, +t[3] || 1, +t[4] || 0, +(t[5] || 0), +t[6] || 0, t[7] ? +t[7].substring(0, 3) : 0);
	}
	return e == null ? /* @__PURE__ */ new Date(NaN) : new Date(is(e));
}
function ks(e) {
	return ss(10, As(e));
}
function As(e) {
	if (e === 0) return 0;
	var t = as(cs(e) / ls);
	return e / ss(10, t) >= 10 && t++, t;
}
function js(e, t) {
	var n = As(e), r = ss(10, n), i = e / r;
	return e = (t === 2 ? 1 : t ? i < 1.5 ? 1 : i < 2.5 ? 2 : i < 4 ? 3 : i < 7 ? 5 : 10 : i < 1 ? 1 : i < 2 ? 2 : i < 3 ? 3 : i < 5 ? 5 : 10) * r, vs(e, -n);
}
function Ms(e) {
	var t = parseFloat(e);
	return t == e && (t !== 0 || !U(e) || e.indexOf("x") <= 0) ? t : NaN;
}
function Ns(e) {
	return !isNaN(Ms(e));
}
function Ps() {
	return is(ds() * 9);
}
function Fs(e, t) {
	return t === 0 ? e : Fs(t, e % t);
}
function Is(e, t) {
	return e == null ? t : t == null ? e : e * t / Fs(e, t);
}
function Ls(e) {
	return e != null && isFinite(e);
}
//#endregion
//#region node_modules/echarts/lib/util/log.js
var Rs = "[ECharts] ", zs = {}, Bs = typeof console < "u" && console.warn && console.log;
function Vs(e, t, n) {
	if (Bs) {
		if (n) {
			if (zs[t]) return;
			zs[t] = !0;
		}
		console[e](Rs + t);
	}
}
function Hs(e, t) {
	Vs("error", e, t);
}
function Us(e) {
	throw Error(e);
}
//#endregion
//#region node_modules/echarts/lib/util/model.js
function Ws(e, t, n) {
	return (t - e) * n + e;
}
var Gs = "series\0", Ks = "\0_ec_\0";
function qs(e) {
	return e instanceof Array ? e : e == null ? [] : [e];
}
function Js(e, t, n) {
	if (e) {
		e[t] = e[t] || {}, e.emphasis = e.emphasis || {}, e.emphasis[t] = e.emphasis[t] || {};
		for (var r = 0, i = n.length; r < i; r++) {
			var a = n[r];
			!e.emphasis[t].hasOwnProperty(a) && e[t].hasOwnProperty(a) && (e.emphasis[t][a] = e[t][a]);
		}
	}
}
var Ys = /* @__PURE__ */ "fontStyle.fontWeight.fontSize.fontFamily.rich.tag.color.textBorderColor.textBorderWidth.width.height.lineHeight.align.verticalAlign.baseline.shadowColor.shadowBlur.shadowOffsetX.shadowOffsetY.textShadowColor.textShadowBlur.textShadowOffsetX.textShadowOffsetY.backgroundColor.borderColor.borderWidth.borderRadius.padding".split(".");
function Xs(e) {
	return G(e) && !V(e) && !(e instanceof Date) ? e.value : e;
}
function Zs(e) {
	return G(e) && !(e instanceof Array);
}
function Qs(e, t, n) {
	var r = n === "normalMerge", i = n === "replaceMerge", a = n === "replaceAll";
	e ||= [], t = (t || []).slice();
	var o = q();
	F(t, function(e, n) {
		if (!G(e)) {
			t[n] = null;
			return;
		}
	});
	var s = $s(e, o, n);
	return (r || i) && ec(s, e, o, t), r && tc(s, t), r || i ? nc(s, t, i) : a && rc(s, t), ic(s), s;
}
function $s(e, t, n) {
	var r = [];
	if (n === "replaceAll") return r;
	for (var i = 0; i < e.length; i++) {
		var a = e[i];
		a && a.id != null && t.set(a.id, i), r.push({
			existing: n === "replaceMerge" || lc(a) ? null : a,
			newOption: null,
			keyInfo: null,
			brandNew: null
		});
	}
	return r;
}
function ec(e, t, n, r) {
	F(r, function(i, a) {
		if (!(!i || i.id == null)) {
			var o = oc(i.id), s = n.get(o);
			if (s != null) {
				var c = e[s];
				me(!c.newOption, "Duplicated option on id \"" + o + "\"."), c.newOption = i, c.existing = t[s], r[a] = null;
			}
		}
	});
}
function tc(e, t) {
	F(t, function(n, r) {
		if (!(!n || n.name == null)) for (var i = 0; i < e.length; i++) {
			var a = e[i].existing;
			if (!e[i].newOption && a && (a.id == null || n.id == null) && !lc(n) && !lc(a) && ac("name", a, n)) {
				e[i].newOption = n, t[r] = null;
				return;
			}
		}
	});
}
function nc(e, t, n) {
	F(t, function(t) {
		if (t) {
			for (var r, i = 0; (r = e[i]) && (r.newOption || lc(r.existing) || r.existing && t.id != null && !ac("id", t, r.existing));) i++;
			r ? (r.newOption = t, r.brandNew = n) : e.push({
				newOption: t,
				brandNew: n,
				existing: null,
				keyInfo: null
			}), i++;
		}
	});
}
function rc(e, t) {
	F(t, function(t) {
		e.push({
			newOption: t,
			brandNew: !0,
			existing: null,
			keyInfo: null
		});
	});
}
function ic(e) {
	var t = q();
	F(e, function(e) {
		var n = e.existing;
		n && t.set(n.id, e);
	}), F(e, function(e) {
		var n = e.newOption;
		me(!n || n.id == null || !t.get(n.id) || t.get(n.id) === e, "id duplicates: " + (n && n.id)), n && n.id != null && t.set(n.id, e), !e.keyInfo && (e.keyInfo = {});
	}), F(e, function(e, n) {
		var r = e.existing, i = e.newOption, a = e.keyInfo;
		if (G(i)) {
			if (a.name = i.name == null ? r ? r.name : Gs + n : oc(i.name), r) a.id = oc(r.id);
			else if (i.id != null) a.id = oc(i.id);
			else {
				var o = 0;
				do
					a.id = "\0" + a.name + "\0" + o++;
				while (t.get(a.id));
			}
			t.set(a.id, e);
		}
	});
}
function ac(e, t, n) {
	var r = sc(t[e], null), i = sc(n[e], null);
	return r != null && i != null && r === i;
}
function oc(e) {
	return sc(e, "");
}
function sc(e, t) {
	return e == null ? t : U(e) ? e : W(e) || ie(e) ? e + "" : t;
}
function cc(e) {
	var t = e.name;
	return !!(t && t.indexOf(Gs));
}
function lc(e) {
	return e && e.id != null && oc(e.id).indexOf(Ks) === 0;
}
function uc(e, t, n) {
	F(e, function(e) {
		var r = e.newOption;
		G(r) && (e.keyInfo.mainType = t, e.keyInfo.subType = dc(t, r, e.existing, n));
	});
}
function dc(e, t, n, r) {
	return t.type ? t.type : n ? n.subType : r.determineSubType(e, t);
}
function fc(e, t) {
	if (t.dataIndexInside != null) return t.dataIndexInside;
	if (t.dataIndex != null) return V(t.dataIndex) ? I(t.dataIndex, function(t) {
		return e.indexOfRawIndex(t);
	}) : e.indexOfRawIndex(t.dataIndex);
	if (t.name != null) return V(t.name) ? I(t.name, function(t) {
		return e.indexOfName(t);
	}) : e.indexOfName(t.name);
}
function X() {
	var e = "__ec_inner_" + pc++;
	return function(t) {
		return t[e] || (t[e] = {});
	};
}
var pc = Ps();
function mc(e, t, n) {
	var r = hc(t, n), i = r.mainTypeSpecified, a = r.queryOptionMap, o = r.others, s = n ? n.defaultMainType : null;
	return !i && s && a.set(s, {}), a.each(function(t, r) {
		var i = _c(e, r, t, {
			useDefault: s === r,
			enableAll: n && n.enableAll != null ? n.enableAll : !0,
			enableNone: n && n.enableNone != null ? n.enableNone : !0
		});
		o[r + "Models"] = i.models, o[r + "Model"] = i.models[0];
	}), o;
}
function hc(e, t) {
	var n;
	if (U(e)) {
		var r = {};
		r[e + "Index"] = 0, n = r;
	} else n = e;
	var i = q(), a = {}, o = !1;
	return F(n, function(e, n) {
		if (n === "dataIndex" || n === "dataIndexInside") {
			a[n] = e;
			return;
		}
		var r = n.match(/^(\w+)(Index|Id|Name)$/) || [], s = r[1], c = (r[2] || "").toLowerCase();
		if (!(!s || !c || t && t.includeMainTypes && M(t.includeMainTypes, s) < 0)) {
			o ||= !!s;
			var l = i.get(s) || i.set(s, {});
			l[c] = e;
		}
	}), {
		mainTypeSpecified: o,
		queryOptionMap: i,
		others: a
	};
}
var gc = {
	useDefault: !0,
	enableAll: !1,
	enableNone: !1
};
function _c(e, t, n, r) {
	r ||= gc;
	var i = n.index, a = n.id, o = n.name, s = {
		models: null,
		specified: i != null || a != null || o != null
	};
	if (!s.specified) {
		var c = void 0;
		return s.models = r.useDefault && (c = e.getComponent(t)) ? [c] : [], s;
	}
	if (i === "none" || i === !1) {
		if (r.enableNone) return s.models = [], s;
		i = -1;
	}
	return i === "all" && (i = r.enableAll ? a = o = null : -1), s.models = e.queryComponents({
		mainType: t,
		index: i,
		id: a,
		name: o
	}), s;
}
function vc(e, t, n) {
	var r = {};
	r[t + "Id"] = e[t + "Id"], r[t + "Index"] = e[t + "Index"], r[t + "Name"] = e[t + "Name"];
	var i = {
		mainType: t,
		query: r
	};
	return n && (i.subType = n), i;
}
function yc(e, t, n) {
	e.setAttribute ? e.setAttribute(t, n) : e[t] = n;
}
function bc(e, t) {
	return e.getAttribute ? e.getAttribute(t) : e[t];
}
function xc(e) {
	return e === "auto" ? J.domSupported ? "html" : "richText" : e || "html";
}
function Sc(e, t) {
	var n = q(), r = [];
	return F(e, function(e) {
		var i = t(e);
		(n.get(i) || (r.push(i), n.set(i, []))).push(e);
	}), {
		keys: r,
		buckets: n
	};
}
function Cc(e, t, n, r, i) {
	var a = t == null || t === "auto";
	if (r == null) return r;
	if (W(r)) {
		var o = Ws(n || 0, r, i);
		return vs(o, a ? Math.max(bs(n || 0), bs(r)) : t);
	}
	if (U(r)) return i < 1 ? n : r;
	for (var s = [], c = n, l = r, u = Math.max(c ? c.length : 0, l.length), d = 0; d < u; ++d) {
		var f = e.getDimensionInfo(d);
		if (f && f.type === "ordinal") s[d] = (i < 1 && c ? c : l)[d];
		else {
			var p = c && c[d] ? c[d] : 0, m = l[d], o = Ws(p, m, i);
			s[d] = vs(o, a ? Math.max(bs(p), bs(m)) : t);
		}
	}
	return s;
}
(function() {
	function e() {}
	return e.prototype.reset = function(e, t, n, r) {
		return this._list = e, this._step = r ||= 1, this._idx = t, this._end = n ?? (r > 0 ? e.length : 0), this.item = null, this.key = NaN, this;
	}, e.prototype.next = function() {
		return (this._step > 0 ? this._idx < this._end : this._idx >= this._end) && (this.item = this._list[this._idx], this.key = this._idx += this._step, !0);
	}, e;
})();
function wc() {
	return [Infinity, -Infinity];
}
function Tc(e, t) {
	kc(t) && (t < e[0] && (e[0] = t), t > e[1] && (e[1] = t));
}
function Ec(e, t) {
	kc(t) && t < e[0] && (e[0] = t);
}
function Dc(e, t) {
	kc(t) && t > e[1] && (e[1] = t);
}
function Oc(e, t) {
	Ac(t[0], t[1]) && (t[0] < e[0] && (e[0] = t[0]), t[1] > e[1] && (e[1] = t[1]));
}
function kc(e) {
	return e != null && isFinite(e);
}
function Ac(e, t) {
	return kc(e) && kc(t) && e <= t;
}
function jc(e) {
	var t = e[1] - e[0];
	return isFinite(t) && t >= 0;
}
function Mc(e) {
	Ac(e[0], e[1]) && e[0] > e[1] && (e[0] = e[1]);
}
function Nc() {
	var e = "__ec_once_" + Pc++;
	return function(t, n) {
		Te(t, e) || (t[e] = 1, n());
	};
}
var Pc = Ps();
function Fc(e, t, n) {
	var r = q(), i = 0;
	F(e, function(a) {
		var o = t(a), s = r.get(o) || 0;
		n && n(a, s), !s && !n && (e[i++] = a), r.set(o, s + 1);
	}), n || (e.length = i);
}
function Ic(e) {
	return e.value + "";
}
function Lc(e) {
	return e + "";
}
function Rc(e, t) {
	return K(t, !0) ? e.seriesIndex + 2 : 0;
}
function zc(e, t, n) {
	var r = e.getData().count();
	return {
		progressiveRender: n.progressiveEnabled && t.incrementalPrepareRender && r >= n.threshold,
		large: e.get("large") && r >= e.get("largeThreshold"),
		modDataCount: e.get("progressiveChunkMode") === "mod" ? e.getData().count() : null
	};
}
function Bc(e, t) {
	return {
		seriesType: e,
		overallReset: t
	};
}
function Vc(e) {
	return { overallReset: e };
}
//#endregion
//#region node_modules/echarts/lib/util/innerStore.js
var Z = X(), Hc = function(e, t, n, r) {
	if (r) {
		var i = Z(r);
		i.dataIndex = n, i.dataType = t, i.seriesIndex = e, i.ssrType = "chart", r.type === "group" && r.traverse(function(r) {
			var i = Z(r);
			i.seriesIndex = e, i.dataIndex = n, i.dataType = t, i.ssrType = "chart";
		});
	}
}, Uc = "series", Wc = q([
	"tooltip",
	"label",
	"itemName",
	"itemId",
	"itemGroupId",
	"itemChildGroupId",
	"seriesName"
]), Gc = "original", Kc = "arrayRows", qc = "objectRows", Jc = "keyedColumns", Yc = "typedArray", Xc = "unknown", Zc = "column", Qc = "Roam", $c = [
	"getDom",
	"getZr",
	"getWidth",
	"getHeight",
	"getDevicePixelRatio",
	"dispatchAction",
	"isSSR",
	"isDisposed",
	"on",
	"off",
	"getDataURL",
	"getConnectedDataURL",
	"getOption",
	"getId",
	"updateLabelLayout"
], el = function() {
	function e(e) {
		F($c, function(t) {
			this[t] = z(e[t], e);
		}, this);
	}
	return e;
}();
function tl(e, t) {
	return t.mainType === "series" ? e.getViewOfSeriesModel(t) : e.getViewOfComponentModel(t);
}
//#endregion
//#region node_modules/echarts/lib/util/states.js
var nl = 1, rl = {}, il = X(), al = X(), ol = [
	"emphasis",
	"blur",
	"select"
], sl = [
	"normal",
	"emphasis",
	"blur",
	"select"
], cl = "highlight", ll = "downplay", ul = "select", dl = "unselect", fl = "toggleSelect", pl = "selectchanged";
function ml(e) {
	return e != null && e !== "none";
}
function hl(e, t, n) {
	e.onHoverStateChange && (e.hoverState || 0) !== n && e.onHoverStateChange(t), e.hoverState = n;
}
function gl(e) {
	hl(e, "emphasis", 2);
}
function _l(e) {
	e.hoverState === 2 && hl(e, "normal", 0);
}
function vl(e) {
	hl(e, "blur", 1);
}
function yl(e) {
	e.hoverState === 1 && hl(e, "normal", 0);
}
function bl(e) {
	e.selected = !0;
}
function xl(e) {
	e.selected = !1;
}
function Sl(e, t, n) {
	t(e, n);
}
function Cl(e, t, n) {
	Sl(e, t, n), e.isGroup && e.traverse(function(e) {
		Sl(e, t, n);
	});
}
function wl(e, t) {
	switch (t) {
		case "emphasis":
			e.hoverState = 2;
			break;
		case "normal":
			e.hoverState = 0;
			break;
		case "blur":
			e.hoverState = 1;
			break;
		case "select": e.selected = !0;
	}
}
function Tl(e, t, n, r) {
	for (var i = e.style, a = {}, o = 0; o < t.length; o++) {
		var s = t[o];
		a[s] = i[s] ?? (r && r[s]);
	}
	for (var o = 0; o < e.animators.length; o++) {
		var c = e.animators[o];
		c.__fromStateTransition && c.__fromStateTransition.indexOf(n) < 0 && c.targetName === "style" && c.saveTo(a, t);
	}
	return a;
}
function El(e, t, n, r) {
	var i = n && M(n, "select") >= 0, a = !1;
	if (e instanceof yo) {
		var o = il(e), s = i && o.selectFill || o.normalFill, c = i && o.selectStroke || o.normalStroke;
		if (ml(s) || ml(c)) {
			r ||= {};
			var l = r.style || {};
			l.fill === "inherit" ? (a = !0, r = k({}, r), l = k({}, l), l.fill = s) : !ml(l.fill) && ml(s) ? (a = !0, r = k({}, r), l = k({}, l), l.fill = Gr(s)) : !ml(l.stroke) && ml(c) && (a || (r = k({}, r), l = k({}, l)), l.stroke = Gr(c)), r.style = l;
		}
	}
	if (r && r.z2 == null) {
		a || (r = k({}, r));
		var u = e.z2EmphasisLift;
		r.z2 = e.z2 + (u ?? 10);
	}
	return r;
}
function Dl(e, t, n) {
	if (n && n.z2 == null) {
		n = k({}, n);
		var r = e.z2SelectLift;
		n.z2 = e.z2 + (r ?? 9);
	}
	return n;
}
function Ol(e, t, n) {
	var r = M(e.currentStates, t) >= 0, i = e.style.opacity, a = r ? null : Tl(e, ["opacity"], t, { opacity: 1 });
	n ||= {};
	var o = n.style || {};
	return o.opacity ?? (n = k({}, n), o = k({ opacity: r ? i : a.opacity * .1 }, o), n.style = o), n;
}
function kl(e, t) {
	var n = this.states[e];
	if (this.style) {
		if (e === "emphasis") return El(this, e, t, n);
		if (e === "blur") return Ol(this, e, n);
		if (e === "select") return Dl(this, e, n);
	}
	return n;
}
function Al(e) {
	e.stateProxy = kl;
	var t = e.getTextContent(), n = e.getTextGuideLine();
	t && (t.stateProxy = kl), n && (n.stateProxy = kl);
}
function jl(e, t) {
	!zl(e, t) && !e.__highByOuter && Cl(e, gl);
}
function Ml(e, t) {
	!zl(e, t) && !e.__highByOuter && Cl(e, _l);
}
function Nl(e, t) {
	e.__highByOuter |= 1 << (t || 0), Cl(e, gl);
}
function Pl(e, t) {
	!(e.__highByOuter &= ~(1 << (t || 0))) && Cl(e, _l);
}
function Fl(e) {
	Cl(e, vl);
}
function Il(e) {
	Cl(e, yl);
}
function Ll(e) {
	Cl(e, bl);
}
function Rl(e) {
	Cl(e, xl);
}
function zl(e, t) {
	return e.__highDownSilentOnTouch && t.zrByTouch;
}
function Bl(e) {
	var t = e.getModel(), n = [], r = [];
	t.eachComponent(function(t, i) {
		var a = al(i), o = tl(e, i), s = t === "series";
		!s && r.push(o), a.isBlured && (o.group.traverse(function(e) {
			yl(e);
		}), s && n.push(i)), a.isBlured = !1;
	}), F(r, function(e) {
		e && e.toggleBlurSeries && e.toggleBlurSeries(n, !1, t);
	});
}
function Vl(e, t, n, r) {
	var i = r.getModel();
	n ||= "coordinateSystem";
	function a(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = e.getItemGraphicEl(t[n]);
			r && Il(r);
		}
	}
	if (e != null && !(!t || t === "none")) {
		var o = i.getSeriesByIndex(e), s = o.coordinateSystem;
		s && s.master && (s = s.master);
		var c = [];
		i.eachSeries(function(e) {
			var i = o === e, l = e.coordinateSystem;
			if (l && l.master && (l = l.master), !(n === "series" && !i || n === "coordinateSystem" && !(l && s ? l === s : i) || t === "series" && i)) {
				if (r.getViewOfSeriesModel(e).group.traverse(function(e) {
					e.__highByOuter && i && t === "self" || vl(e);
				}), P(t)) a(e.getData(), t);
				else if (G(t)) for (var u = R(t), d = 0; d < u.length; d++) a(e.getData(u[d]), t[u[d]]);
				c.push(e), al(e).isBlured = !0;
			}
		}), i.eachComponent(function(e, t) {
			if (e !== "series") {
				var n = r.getViewOfComponentModel(t);
				n && n.toggleBlurSeries && n.toggleBlurSeries(c, !0, i);
			}
		});
	}
}
function Hl(e, t, n) {
	if (e != null && t != null) {
		var r = n.getModel().getComponent(e, t);
		if (r) {
			al(r).isBlured = !0;
			var i = n.getViewOfComponentModel(r);
			!i || !i.focusBlurEnabled || i.group.traverse(function(e) {
				vl(e);
			});
		}
	}
}
function Ul(e, t, n) {
	var r = e.seriesIndex, i = e.getData(t.dataType);
	if (i) {
		var a = fc(i, t);
		a = (V(a) ? a[0] : a) || 0;
		var o = i.getItemGraphicEl(a);
		if (!o) for (var s = i.count(), c = 0; !o && c < s;) o = i.getItemGraphicEl(c++);
		if (o) {
			var l = Z(o);
			Vl(r, l.focus, l.blurScope, n);
		} else {
			var u = e.get(["emphasis", "focus"]), d = e.get(["emphasis", "blurScope"]);
			u != null && Vl(r, u, d, n);
		}
	}
}
function Wl(e, t, n, r) {
	var i = {
		focusSelf: !1,
		dispatchers: null
	};
	if (e == null || e === "series" || t == null || n == null) return i;
	var a = r.getModel().getComponent(e, t);
	if (!a) return i;
	var o = r.getViewOfComponentModel(a);
	if (!o || !o.findHighDownDispatchers) return i;
	for (var s = o.findHighDownDispatchers(n), c, l = 0; l < s.length; l++) if (Z(s[l]).focus === "self") {
		c = !0;
		break;
	}
	return {
		focusSelf: c,
		dispatchers: s
	};
}
function Gl(e, t, n) {
	var r = Z(e), i = Wl(r.componentMainType, r.componentIndex, r.componentHighDownName, n), a = i.dispatchers, o = i.focusSelf;
	a ? (o && Hl(r.componentMainType, r.componentIndex, n), F(a, function(e) {
		return jl(e, t);
	})) : (Vl(r.seriesIndex, r.focus, r.blurScope, n), r.focus === "self" && Hl(r.componentMainType, r.componentIndex, n), jl(e, t));
}
function Kl(e, t, n) {
	Bl(n);
	var r = Z(e), i = Wl(r.componentMainType, r.componentIndex, r.componentHighDownName, n).dispatchers;
	i ? F(i, function(e) {
		return Ml(e, t);
	}) : Ml(e, t);
}
function ql(e, t, n) {
	if (ou(t)) {
		var r = t.dataType, i = fc(e.getData(r), t);
		V(i) || (i = [i]), e[t.type === "toggleSelect" ? "toggleSelect" : t.type === "select" ? "select" : "unselect"](i, r);
	}
}
function Jl(e) {
	F(e.getAllData(), function(t) {
		var n = t.data, r = t.type;
		n.eachItemGraphicEl(function(t, n) {
			e.isSelected(n, r) ? Ll(t) : Rl(t);
		});
	});
}
function Yl(e) {
	var t = [];
	return e.eachSeries(function(e) {
		F(e.getAllData(), function(n) {
			n.data;
			var r = n.type, i = e.getSelectedDataIndices();
			if (i.length > 0) {
				var a = {
					dataIndex: i,
					seriesIndex: e.seriesIndex
				};
				r != null && (a.dataType = r), t.push(a);
			}
		});
	}), t;
}
function Xl(e, t, n) {
	ru(e, !0), Cl(e, Al), $l(e, t, n);
}
function Zl(e) {
	ru(e, !1);
}
function Ql(e, t, n, r) {
	r ? Zl(e) : Xl(e, t, n);
}
function $l(e, t, n) {
	var r = Z(e);
	t == null ? r.focus &&= null : (r.focus = t, r.blurScope = n);
}
var eu = [
	"emphasis",
	"blur",
	"select"
], tu = {
	itemStyle: "getItemStyle",
	lineStyle: "getLineStyle",
	areaStyle: "getAreaStyle"
};
function nu(e, t, n, r) {
	n ||= "itemStyle";
	for (var i = 0; i < eu.length; i++) {
		var a = eu[i], o = t.getModel([a, n]), s = e.ensureState(a);
		s.style = r ? r(o) : o[tu[n]]();
	}
}
function ru(e, t) {
	var n = t === !1, r = e;
	e.highDownSilentOnTouch && (r.__highDownSilentOnTouch = e.highDownSilentOnTouch), (!n || r.__highDownDispatcher) && (r.__highByOuter = r.__highByOuter || 0, r.__highDownDispatcher = !n);
}
function iu(e) {
	return !!(e && e.__highDownDispatcher);
}
function au(e) {
	var t = rl[e];
	return t == null && nl <= 32 && (t = rl[e] = nl++), t;
}
function ou(e) {
	var t = e.type;
	return t === "select" || t === "unselect" || t === "toggleSelect";
}
function su(e) {
	var t = e.type;
	return t === "highlight" || t === "downplay";
}
function cu(e) {
	var t = il(e);
	t.normalFill = e.style.fill, t.normalStroke = e.style.stroke;
	var n = e.states.select || {};
	t.selectFill = n.style && n.style.fill || null, t.selectStroke = n.style && n.style.stroke || null;
}
//#endregion
//#region node_modules/zrender/lib/tool/transformPath.js
var lu = qa.CMD, uu = [
	[],
	[],
	[]
], du = Math.sqrt, fu = Math.atan2;
function pu(e, t) {
	if (t) {
		var n = e.data, r = e.len(), i, a, o, s, c, l, u = lu.M, d = lu.C, f = lu.L, p = lu.R, m = lu.A, h = lu.Q;
		for (o = 0, s = 0; o < r;) {
			switch (i = n[o++], s = o, a = 0, i) {
				case u:
					a = 1;
					break;
				case f:
					a = 1;
					break;
				case d:
					a = 3;
					break;
				case h:
					a = 2;
					break;
				case m:
					var g = t[4], _ = t[5], v = du(t[0] * t[0] + t[1] * t[1]), y = du(t[2] * t[2] + t[3] * t[3]), b = fu(-t[1] / y, t[0] / v);
					n[o] *= v, n[o++] += g, n[o] *= y, n[o++] += _, n[o++] *= v, n[o++] *= y, n[o++] += b, n[o++] += b, o += 2, s = o;
					break;
				case p: l[0] = n[o++], l[1] = n[o++], Ct(l, l, t), n[s++] = l[0], n[s++] = l[1], l[0] += n[o++], l[1] += n[o++], Ct(l, l, t), n[s++] = l[0], n[s++] = l[1];
			}
			for (c = 0; c < a; c++) {
				var x = uu[c];
				x[0] = n[o++], x[1] = n[o++], Ct(x, x, t), n[s++] = x[0], n[s++] = x[1];
			}
		}
		e.increaseVersion();
	}
}
//#endregion
//#region node_modules/zrender/lib/tool/path.js
var mu = Math.sqrt, hu = Math.sin, gu = Math.cos, _u = Math.PI;
function vu(e) {
	return Math.sqrt(e[0] * e[0] + e[1] * e[1]);
}
function yu(e, t) {
	return (e[0] * t[0] + e[1] * t[1]) / (vu(e) * vu(t));
}
function bu(e, t) {
	return (e[0] * t[1] < e[1] * t[0] ? -1 : 1) * Math.acos(yu(e, t));
}
function xu(e, t, n, r, i, a, o, s, c, l, u) {
	var d = _u / 180 * c, f = gu(d) * (e - n) / 2 + hu(d) * (t - r) / 2, p = -1 * hu(d) * (e - n) / 2 + gu(d) * (t - r) / 2, m = f * f / (o * o) + p * p / (s * s);
	m > 1 && (o *= mu(m), s *= mu(m));
	var h = (i === a ? -1 : 1) * mu((o * o * (s * s) - o * o * (p * p) - s * s * (f * f)) / (o * o * (p * p) + s * s * (f * f))) || 0, g = h * o * p / s, _ = h * -s * f / o, v = (e + n) / 2 + gu(d) * g - hu(d) * _, y = (t + r) / 2 + hu(d) * g + gu(d) * _, b = bu([1, 0], [(f - g) / o, (p - _) / s]), x = [(f - g) / o, (p - _) / s], S = [(-1 * f - g) / o, (-1 * p - _) / s], C = bu(x, S);
	if (yu(x, S) <= -1 && (C = _u), yu(x, S) >= 1 && (C = 0), C < 0) {
		var w = Math.round(C / _u * 1e6) / 1e6;
		C = _u * 2 + w % 2 * _u;
	}
	u.addData(l, v, y, o, s, b, C, d, a);
}
var Su = /([mlvhzcqtsa])([^mlvhzcqtsa]*)/gi, Cu = /-?([0-9]*\.)?[0-9]+([eE]-?[0-9]+)?/g;
function wu(e) {
	var t = new qa();
	if (!e) return t;
	var n = 0, r = 0, i = n, a = r, o, s = qa.CMD, c = e.match(Su);
	if (!c) return t;
	for (var l = 0; l < c.length; l++) {
		for (var u = c[l], d = u.charAt(0), f = void 0, p = u.match(Cu) || [], m = p.length, h = 0; h < m; h++) p[h] = parseFloat(p[h]);
		for (var g = 0; g < m;) {
			var _ = void 0, v = void 0, y = void 0, b = void 0, x = void 0, S = void 0, C = void 0, w = n, T = r, E = void 0, D = void 0;
			switch (d) {
				case "l":
					n += p[g++], r += p[g++], f = s.L, t.addData(f, n, r);
					break;
				case "L":
					n = p[g++], r = p[g++], f = s.L, t.addData(f, n, r);
					break;
				case "m":
					n += p[g++], r += p[g++], f = s.M, t.addData(f, n, r), i = n, a = r, d = "l";
					break;
				case "M":
					n = p[g++], r = p[g++], f = s.M, t.addData(f, n, r), i = n, a = r, d = "L";
					break;
				case "h":
					n += p[g++], f = s.L, t.addData(f, n, r);
					break;
				case "H":
					n = p[g++], f = s.L, t.addData(f, n, r);
					break;
				case "v":
					r += p[g++], f = s.L, t.addData(f, n, r);
					break;
				case "V":
					r = p[g++], f = s.L, t.addData(f, n, r);
					break;
				case "C":
					f = s.C, t.addData(f, p[g++], p[g++], p[g++], p[g++], p[g++], p[g++]), n = p[g - 2], r = p[g - 1];
					break;
				case "c":
					f = s.C, t.addData(f, p[g++] + n, p[g++] + r, p[g++] + n, p[g++] + r, p[g++] + n, p[g++] + r), n += p[g - 2], r += p[g - 1];
					break;
				case "S":
					_ = n, v = r, E = t.len(), D = t.data, o === s.C && (_ += n - D[E - 4], v += r - D[E - 3]), f = s.C, w = p[g++], T = p[g++], n = p[g++], r = p[g++], t.addData(f, _, v, w, T, n, r);
					break;
				case "s":
					_ = n, v = r, E = t.len(), D = t.data, o === s.C && (_ += n - D[E - 4], v += r - D[E - 3]), f = s.C, w = n + p[g++], T = r + p[g++], n += p[g++], r += p[g++], t.addData(f, _, v, w, T, n, r);
					break;
				case "Q":
					w = p[g++], T = p[g++], n = p[g++], r = p[g++], f = s.Q, t.addData(f, w, T, n, r);
					break;
				case "q":
					w = p[g++] + n, T = p[g++] + r, n += p[g++], r += p[g++], f = s.Q, t.addData(f, w, T, n, r);
					break;
				case "T":
					_ = n, v = r, E = t.len(), D = t.data, o === s.Q && (_ += n - D[E - 4], v += r - D[E - 3]), n = p[g++], r = p[g++], f = s.Q, t.addData(f, _, v, n, r);
					break;
				case "t":
					_ = n, v = r, E = t.len(), D = t.data, o === s.Q && (_ += n - D[E - 4], v += r - D[E - 3]), n += p[g++], r += p[g++], f = s.Q, t.addData(f, _, v, n, r);
					break;
				case "A":
					y = p[g++], b = p[g++], x = p[g++], S = p[g++], C = p[g++], w = n, T = r, n = p[g++], r = p[g++], f = s.A, xu(w, T, n, r, S, C, y, b, x, f, t);
					break;
				case "a": y = p[g++], b = p[g++], x = p[g++], S = p[g++], C = p[g++], w = n, T = r, n += p[g++], r += p[g++], f = s.A, xu(w, T, n, r, S, C, y, b, x, f, t);
			}
		}
		(d === "z" || d === "Z") && (f = s.Z, t.addData(f), n = i, r = a), o = f;
	}
	return t.toStatic(), t;
}
var Tu = function(e) {
	r(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t.prototype.applyTransform = function(e) {}, t;
}(yo);
function Eu(e) {
	return e.setData != null;
}
function Du(e, t) {
	var n = wu(e), r = k({}, t);
	return r.buildPath = function(e) {
		var t = Eu(e);
		if (t && e.canSave()) {
			e.appendPath(n);
			var r = e.getContext();
			r && e.rebuildPath(r, 1);
		} else {
			var r = t ? e.getContext() : e;
			r && n.rebuildPath(r, 1);
		}
	}, r.applyTransform = function(e) {
		pu(n, e), this.dirtyShape();
	}, r;
}
function Ou(e, t) {
	return new Tu(Du(e, t));
}
function ku(e, t) {
	var n = Du(e, t);
	return function(e) {
		r(t, e);
		function t(t) {
			var r = e.call(this, t) || this;
			return r.applyTransform = n.applyTransform, r.buildPath = n.buildPath, r;
		}
		return t;
	}(Tu);
}
function Au(e, t) {
	for (var n = [], r = e.length, i = 0; i < r; i++) {
		var a = e[i];
		n.push(a.getUpdatedPathProxy(!0));
	}
	var o = new yo(t);
	return o.createPathProxy(), o.buildPath = function(e) {
		if (Eu(e)) {
			e.appendPath(n);
			var t = e.getContext();
			t && e.rebuildPath(t, 1);
		}
	}, o;
}
//#endregion
//#region node_modules/zrender/lib/graphic/Group.js
var ju = function(e) {
	r(t, e);
	function t(t) {
		var n = e.call(this) || this;
		return n.isGroup = !0, n._children = [], n.attr(t), n;
	}
	return t.prototype.childrenRef = function() {
		return this._children;
	}, t.prototype.children = function() {
		return this._children.slice();
	}, t.prototype.childAt = function(e) {
		return this._children[e];
	}, t.prototype.childOfName = function(e) {
		for (var t = this._children, n = 0; n < t.length; n++) if (t[n].name === e) return t[n];
	}, t.prototype.childCount = function() {
		return this._children.length;
	}, t.prototype.add = function(e) {
		return e && e !== this && e.parent !== this && (this._children.push(e), this._doAdd(e)), this;
	}, t.prototype.addBefore = function(e, t) {
		if (e && e !== this && e.parent !== this && t && t.parent === this) {
			var n = this._children, r = n.indexOf(t);
			r >= 0 && (n.splice(r, 0, e), this._doAdd(e));
		}
		return this;
	}, t.prototype.replace = function(e, t) {
		var n = M(this._children, e);
		return n >= 0 && this.replaceAt(t, n), this;
	}, t.prototype.replaceAt = function(e, t) {
		var n = this._children, r = n[t];
		if (e && e !== this && e.parent !== this && e !== r) {
			n[t] = e, r.parent = null;
			var i = this.__zr;
			i && r.removeSelfFromZr(i), this._doAdd(e);
		}
		return this;
	}, t.prototype._doAdd = function(e) {
		e.parent && e.parent.remove(e), e.parent = this;
		var t = this.__zr;
		t && t !== e.__zr && e.addSelfToZr(t), t && t.refresh();
	}, t.prototype.remove = function(e) {
		var t = this.__zr, n = this._children, r = M(n, e);
		return r < 0 ? this : (n.splice(r, 1), e.parent = null, t && e.removeSelfFromZr(t), t && t.refresh(), this);
	}, t.prototype.removeAll = function() {
		for (var e = this._children, t = this.__zr, n = 0; n < e.length; n++) {
			var r = e[n];
			t && r.removeSelfFromZr(t), r.parent = null;
		}
		return e.length = 0, this;
	}, t.prototype.eachChild = function(e, t) {
		for (var n = this._children, r = 0; r < n.length; r++) {
			var i = n[r];
			e.call(t, i, r);
		}
		return this;
	}, t.prototype.traverse = function(e, t) {
		for (var n = 0; n < this._children.length; n++) {
			var r = this._children[n], i = e.call(t, r);
			r.isGroup && !i && r.traverse(e, t);
		}
		return this;
	}, t.prototype.addSelfToZr = function(t) {
		e.prototype.addSelfToZr.call(this, t);
		for (var n = 0; n < this._children.length; n++) this._children[n].addSelfToZr(t);
	}, t.prototype.removeSelfFromZr = function(t) {
		e.prototype.removeSelfFromZr.call(this, t);
		for (var n = 0; n < this._children.length; n++) this._children[n].removeSelfFromZr(t);
	}, t.prototype.getBoundingRect = function(e) {
		for (var t = new Y(0, 0, 0, 0), n = e || this._children, r = [], i = null, a = 0; a < n.length; a++) {
			var o = n[a];
			if (!(o.ignore || o.invisible)) {
				var s = o.getBoundingRect(), c = o.getLocalTransform(r);
				c ? (Y.applyTransform(t, s, c), i ||= t.clone(), i.union(t)) : (i ||= s.clone(), i.union(s));
			}
		}
		return i || t;
	}, t;
}(Yi);
ju.prototype.type = "group";
//#endregion
//#region node_modules/zrender/lib/graphic/shape/Circle.js
var Mu = function() {
	function e() {
		this.cx = 0, this.cy = 0, this.r = 0;
	}
	return e;
}(), Nu = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.getDefaultShape = function() {
		return new Mu();
	}, t.prototype.buildPath = function(e, t) {
		e.moveTo(t.cx + t.r, t.cy), e.arc(t.cx, t.cy, t.r, 0, Math.PI * 2);
	}, t;
}(yo);
Nu.prototype.type = "circle";
//#endregion
//#region node_modules/zrender/lib/graphic/shape/Ellipse.js
var Pu = function() {
	function e() {
		this.cx = 0, this.cy = 0, this.rx = 0, this.ry = 0;
	}
	return e;
}(), Fu = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.getDefaultShape = function() {
		return new Pu();
	}, t.prototype.buildPath = function(e, t) {
		var n = .5522848, r = t.cx, i = t.cy, a = t.rx, o = t.ry, s = a * n, c = o * n;
		e.moveTo(r - a, i), e.bezierCurveTo(r - a, i - c, r - s, i - o, r, i - o), e.bezierCurveTo(r + s, i - o, r + a, i - c, r + a, i), e.bezierCurveTo(r + a, i + c, r + s, i + o, r, i + o), e.bezierCurveTo(r - s, i + o, r - a, i + c, r - a, i), e.closePath();
	}, t;
}(yo);
Fu.prototype.type = "ellipse";
//#endregion
//#region node_modules/zrender/lib/graphic/helper/roundSector.js
var Iu = Math.PI, Lu = Iu * 2, Ru = Math.sin, zu = Math.cos, Bu = Math.acos, Vu = Math.atan2, Hu = Math.abs, Uu = Math.sqrt, Wu = Math.max, Gu = Math.min, Ku = 1e-4;
function qu(e, t, n, r, i, a, o, s) {
	var c = n - e, l = r - t, u = o - i, d = s - a, f = d * c - u * l;
	if (!(f * f < Ku)) return f = (u * (t - a) - d * (e - i)) / f, [e + f * c, t + f * l];
}
function Ju(e, t, n, r, i, a, o) {
	var s = e - n, c = t - r, l = (o ? a : -a) / Uu(s * s + c * c), u = l * c, d = -l * s, f = e + u, p = t + d, m = n + u, h = r + d, g = (f + m) / 2, _ = (p + h) / 2, v = m - f, y = h - p, b = v * v + y * y, x = i - a, S = f * h - m * p, C = (y < 0 ? -1 : 1) * Uu(Wu(0, x * x * b - S * S)), w = (S * y - v * C) / b, T = (-S * v - y * C) / b, E = (S * y + v * C) / b, D = (-S * v + y * C) / b, O = w - g, k = T - _, A = E - g, j = D - _;
	return O * O + k * k > A * A + j * j && (w = E, T = D), {
		cx: w,
		cy: T,
		x0: -u,
		y0: -d,
		x1: w * (i / x - 1),
		y1: T * (i / x - 1)
	};
}
function Yu(e) {
	var t;
	if (V(e)) {
		var n = e.length;
		if (!n) return e;
		t = n === 1 ? [
			e[0],
			e[0],
			0,
			0
		] : n === 2 ? [
			e[0],
			e[0],
			e[1],
			e[1]
		] : n === 3 ? e.concat(e[2]) : e;
	} else t = [
		e,
		e,
		e,
		e
	];
	return t;
}
function Xu(e, t) {
	var n, r = Wu(t.r, 0), i = Wu(t.r0 || 0, 0), a = r > 0;
	if (!(!a && !(i > 0))) {
		if (a || (r = i, i = 0), i > r) {
			var o = r;
			r = i, i = o;
		}
		var s = t.startAngle, c = t.endAngle;
		if (!(isNaN(s) || isNaN(c))) {
			var l = t.cx, u = t.cy, d = !!t.clockwise, f = Hu(c - s), p = f > Lu && f % Lu;
			if (p > Ku && (f = p), !(r > Ku)) e.moveTo(l, u);
			else if (f > Lu - Ku) e.moveTo(l + r * zu(s), u + r * Ru(s)), e.arc(l, u, r, s, c, !d), i > Ku && (e.moveTo(l + i * zu(c), u + i * Ru(c)), e.arc(l, u, i, c, s, d));
			else {
				var m = void 0, h = void 0, g = void 0, _ = void 0, v = void 0, y = void 0, b = void 0, x = void 0, S = void 0, C = void 0, w = void 0, T = void 0, E = void 0, D = void 0, O = void 0, k = void 0, A = r * zu(s), j = r * Ru(s), M = i * zu(c), ee = i * Ru(c), N = f > Ku;
				if (N) {
					var P = t.cornerRadius;
					P && (n = Yu(P), m = n[0], h = n[1], g = n[2], _ = n[3]);
					var F = Hu(r - i) / 2;
					if (v = Gu(F, g), y = Gu(F, _), b = Gu(F, m), x = Gu(F, h), w = S = Wu(v, y), T = C = Wu(b, x), (S > Ku || C > Ku) && (E = r * zu(c), D = r * Ru(c), O = i * zu(s), k = i * Ru(s), f < Iu)) {
						var I = qu(A, j, O, k, E, D, M, ee);
						if (I) {
							var te = A - I[0], L = j - I[1], ne = E - I[0], R = D - I[1], re = 1 / Ru(Bu((te * ne + L * R) / (Uu(te * te + L * L) * Uu(ne * ne + R * R))) / 2), z = Uu(I[0] * I[0] + I[1] * I[1]);
							w = Gu(S, (r - z) / (re + 1)), T = Gu(C, (i - z) / (re - 1));
						}
					}
				}
				if (!N) e.moveTo(l + A, u + j);
				else if (w > Ku) {
					var B = Gu(g, w), V = Gu(_, w), H = Ju(O, k, A, j, r, B, d), U = Ju(E, D, M, ee, r, V, d);
					e.moveTo(l + H.cx + H.x0, u + H.cy + H.y0), w < S && B === V ? e.arc(l + H.cx, u + H.cy, w, Vu(H.y0, H.x0), Vu(U.y0, U.x0), !d) : (B > 0 && e.arc(l + H.cx, u + H.cy, B, Vu(H.y0, H.x0), Vu(H.y1, H.x1), !d), e.arc(l, u, r, Vu(H.cy + H.y1, H.cx + H.x1), Vu(U.cy + U.y1, U.cx + U.x1), !d), V > 0 && e.arc(l + U.cx, u + U.cy, V, Vu(U.y1, U.x1), Vu(U.y0, U.x0), !d));
				} else e.moveTo(l + A, u + j), e.arc(l, u, r, s, c, !d);
				if (!(i > Ku) || !N) e.lineTo(l + M, u + ee);
				else if (T > Ku) {
					var B = Gu(m, T), V = Gu(h, T), H = Ju(M, ee, E, D, i, -V, d), U = Ju(A, j, O, k, i, -B, d);
					e.lineTo(l + H.cx + H.x0, u + H.cy + H.y0), T < C && B === V ? e.arc(l + H.cx, u + H.cy, T, Vu(H.y0, H.x0), Vu(U.y0, U.x0), !d) : (V > 0 && e.arc(l + H.cx, u + H.cy, V, Vu(H.y0, H.x0), Vu(H.y1, H.x1), !d), e.arc(l, u, i, Vu(H.cy + H.y1, H.cx + H.x1), Vu(U.cy + U.y1, U.cx + U.x1), d), B > 0 && e.arc(l + U.cx, u + U.cy, B, Vu(U.y1, U.x1), Vu(U.y0, U.x0), !d));
				} else e.lineTo(l + M, u + ee), e.arc(l, u, i, c, s, d);
			}
			e.closePath();
		}
	}
}
//#endregion
//#region node_modules/zrender/lib/graphic/shape/Sector.js
var Zu = function() {
	function e() {
		this.cx = 0, this.cy = 0, this.r0 = 0, this.r = 0, this.startAngle = 0, this.endAngle = Math.PI * 2, this.clockwise = !0, this.cornerRadius = 0;
	}
	return e;
}(), Qu = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.getDefaultShape = function() {
		return new Zu();
	}, t.prototype.buildPath = function(e, t) {
		Xu(e, t);
	}, t.prototype.isZeroArea = function() {
		return this.shape.startAngle === this.shape.endAngle || this.shape.r === this.shape.r0;
	}, t;
}(yo);
Qu.prototype.type = "sector";
//#endregion
//#region node_modules/zrender/lib/graphic/shape/Ring.js
var $u = function() {
	function e() {
		this.cx = 0, this.cy = 0, this.r = 0, this.r0 = 0;
	}
	return e;
}(), ed = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.getDefaultShape = function() {
		return new $u();
	}, t.prototype.buildPath = function(e, t) {
		var n = t.cx, r = t.cy, i = Math.PI * 2;
		e.moveTo(n + t.r, r), e.arc(n, r, t.r, 0, i, !1), e.moveTo(n + t.r0, r), e.arc(n, r, t.r0, 0, i, !0);
	}, t;
}(yo);
ed.prototype.type = "ring";
//#endregion
//#region node_modules/zrender/lib/graphic/helper/smoothBezier.js
function td(e, t, n, r) {
	var i = [], a = [], o = [], s = [], c, l, u, d;
	if (r) {
		u = [Infinity, Infinity], d = [-Infinity, -Infinity];
		for (var f = 0, p = e.length; f < p; f++) wt(u, u, e[f]), Tt(d, d, e[f]);
		wt(u, u, r[0]), Tt(d, d, r[1]);
	}
	for (var f = 0, p = e.length; f < p; f++) {
		var m = e[f];
		if (n) c = e[f ? f - 1 : p - 1], l = e[(f + 1) % p];
		else if (f === 0 || f === p - 1) {
			i.push(dt(e[f]));
			continue;
		} else c = e[f - 1], l = e[f + 1];
		mt(a, l, c), _t(a, a, t);
		var h = yt(m, c), g = yt(m, l), _ = h + g;
		_ !== 0 && (h /= _, g /= _), _t(o, a, -h), _t(s, a, g);
		var v = pt([], m, o), y = pt([], m, s);
		r && (Tt(v, v, u), wt(v, v, d), Tt(y, y, u), wt(y, y, d)), i.push(v), i.push(y);
	}
	return n && i.push(i.shift()), i;
}
//#endregion
//#region node_modules/zrender/lib/graphic/helper/poly.js
function nd(e, t, n) {
	var r = t.smooth, i = t.points;
	if (i && i.length >= 2) {
		if (r) {
			var a = td(i, r, n, t.smoothConstraint);
			e.moveTo(i[0][0], i[0][1]);
			for (var o = i.length, s = 0; s < (n ? o : o - 1); s++) {
				var c = a[s * 2], l = a[s * 2 + 1], u = i[(s + 1) % o];
				e.bezierCurveTo(c[0], c[1], l[0], l[1], u[0], u[1]);
			}
		} else {
			e.moveTo(i[0][0], i[0][1]);
			for (var s = 1, d = i.length; s < d; s++) e.lineTo(i[s][0], i[s][1]);
		}
		n && e.closePath();
	}
}
//#endregion
//#region node_modules/zrender/lib/graphic/shape/Polygon.js
var rd = function() {
	function e() {
		this.points = null, this.smooth = 0, this.smoothConstraint = null;
	}
	return e;
}(), id = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.getDefaultShape = function() {
		return new rd();
	}, t.prototype.buildPath = function(e, t) {
		nd(e, t, !0);
	}, t;
}(yo);
id.prototype.type = "polygon";
//#endregion
//#region node_modules/zrender/lib/graphic/shape/Polyline.js
var ad = function() {
	function e() {
		this.points = null, this.percent = 1, this.smooth = 0, this.smoothConstraint = null;
	}
	return e;
}(), od = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.getDefaultStyle = function() {
		return {
			stroke: "#000",
			fill: null
		};
	}, t.prototype.getDefaultShape = function() {
		return new ad();
	}, t.prototype.buildPath = function(e, t) {
		nd(e, t, !1);
	}, t;
}(yo);
od.prototype.type = "polyline";
//#endregion
//#region node_modules/zrender/lib/graphic/shape/Line.js
var sd = {}, cd = function() {
	function e() {
		this.x1 = 0, this.y1 = 0, this.x2 = 0, this.y2 = 0, this.percent = 1;
	}
	return e;
}(), ld = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.getDefaultStyle = function() {
		return {
			stroke: "#000",
			fill: null
		};
	}, t.prototype.getDefaultShape = function() {
		return new cd();
	}, t.prototype.buildPath = function(e, t) {
		var n, r, i, a;
		if (this.subPixelOptimize) {
			var o = Oo(sd, t, this.style);
			n = o.x1, r = o.y1, i = o.x2, a = o.y2;
		} else n = t.x1, r = t.y1, i = t.x2, a = t.y2;
		var s = t.percent;
		s !== 0 && (e.moveTo(n, r), s < 1 && (i = n * (1 - s) + i * s, a = r * (1 - s) + a * s), e.lineTo(i, a));
	}, t.prototype.pointAt = function(e) {
		var t = this.shape;
		return [t.x1 * (1 - e) + t.x2 * e, t.y1 * (1 - e) + t.y2 * e];
	}, t;
}(yo);
ld.prototype.type = "line";
//#endregion
//#region node_modules/zrender/lib/graphic/shape/BezierCurve.js
var ud = [], dd = function() {
	function e() {
		this.x1 = 0, this.y1 = 0, this.x2 = 0, this.y2 = 0, this.cpx1 = 0, this.cpy1 = 0, this.percent = 1;
	}
	return e;
}();
function fd(e, t, n) {
	var r = e.cpx2, i = e.cpy2;
	return r != null || i != null ? [(n ? ar : ir)(e.x1, e.cpx1, e.cpx2, e.x2, t), (n ? ar : ir)(e.y1, e.cpy1, e.cpy2, e.y2, t)] : [(n ? fr : dr)(e.x1, e.cpx1, e.x2, t), (n ? fr : dr)(e.y1, e.cpy1, e.y2, t)];
}
var pd = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.getDefaultStyle = function() {
		return {
			stroke: "#000",
			fill: null
		};
	}, t.prototype.getDefaultShape = function() {
		return new dd();
	}, t.prototype.buildPath = function(e, t) {
		var n = t.x1, r = t.y1, i = t.x2, a = t.y2, o = t.cpx1, s = t.cpy1, c = t.cpx2, l = t.cpy2, u = t.percent;
		u !== 0 && (e.moveTo(n, r), c == null || l == null ? (u < 1 && (hr(n, o, i, u, ud), o = ud[1], i = ud[2], hr(r, s, a, u, ud), s = ud[1], a = ud[2]), e.quadraticCurveTo(o, s, i, a)) : (u < 1 && (cr(n, o, c, i, u, ud), o = ud[1], c = ud[2], i = ud[3], cr(r, s, l, a, u, ud), s = ud[1], l = ud[2], a = ud[3]), e.bezierCurveTo(o, s, c, l, i, a)));
	}, t.prototype.pointAt = function(e) {
		return fd(this.shape, e, !1);
	}, t.prototype.tangentAt = function(e) {
		var t = fd(this.shape, e, !0);
		return vt(t, t);
	}, t;
}(yo);
pd.prototype.type = "bezier-curve";
//#endregion
//#region node_modules/zrender/lib/graphic/shape/Arc.js
var md = function() {
	function e() {
		this.cx = 0, this.cy = 0, this.r = 0, this.startAngle = 0, this.endAngle = Math.PI * 2, this.clockwise = !0;
	}
	return e;
}(), hd = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.getDefaultStyle = function() {
		return {
			stroke: "#000",
			fill: null
		};
	}, t.prototype.getDefaultShape = function() {
		return new md();
	}, t.prototype.buildPath = function(e, t) {
		var n = t.cx, r = t.cy, i = Math.max(t.r, 0), a = t.startAngle, o = t.endAngle, s = t.clockwise, c = Math.cos(a), l = Math.sin(a);
		e.moveTo(c * i + n, l * i + r), e.arc(n, r, i, a, o, !s);
	}, t;
}(yo);
hd.prototype.type = "arc";
//#endregion
//#region node_modules/zrender/lib/graphic/CompoundPath.js
var gd = function(e) {
	r(t, e);
	function t() {
		var t = e !== null && e.apply(this, arguments) || this;
		return t.type = "compound", t;
	}
	return t.prototype._updatePathDirty = function() {
		for (var e = this.shape.paths, t = this.shapeChanged(), n = 0; n < e.length; n++) t ||= e[n].shapeChanged();
		t && this.dirtyShape();
	}, t.prototype.beforeBrush = function() {
		this._updatePathDirty();
		for (var e = this.shape.paths || [], t = this.getGlobalScale(), n = 0; n < e.length; n++) e[n].path || e[n].createPathProxy(), e[n].path.setScale(t[0], t[1], e[n].segmentIgnoreThreshold);
	}, t.prototype.buildPath = function(e, t) {
		for (var n = t.paths || [], r = 0; r < n.length; r++) n[r].buildPath(e, n[r].shape, !0);
	}, t.prototype.afterBrush = function() {
		for (var e = this.shape.paths || [], t = 0; t < e.length; t++) e[t].pathUpdated();
	}, t.prototype.getBoundingRect = function() {
		return this._updatePathDirty.call(this), yo.prototype.getBoundingRect.call(this);
	}, t;
}(yo), _d = function() {
	function e(e) {
		this.colorStops = e || [];
	}
	return e.prototype.addColorStop = function(e, t) {
		this.colorStops.push({
			offset: e,
			color: t
		});
	}, e;
}(), vd = function(e) {
	r(t, e);
	function t(t, n, r, i, a, o) {
		var s = e.call(this, a) || this;
		return s.x = t ?? 0, s.y = n ?? 0, s.x2 = r ?? 1, s.y2 = i ?? 0, s.type = "linear", s.global = o || !1, s;
	}
	return t;
}(_d), yd = function(e) {
	r(t, e);
	function t(t, n, r, i, a) {
		var o = e.call(this, i) || this;
		return o.x = t ?? .5, o.y = n ?? .5, o.r = r ?? .5, o.type = "radial", o.global = a || !1, o;
	}
	return t;
}(_d), bd = Math.min, xd = Math.max, Sd = Math.abs, Cd = [0, 0], wd = [0, 0], Td = Xt(), Ed = Td.minTv, Dd = Td.maxTv, Od = function() {
	function e(e, t) {
		this._corners = [], this._axes = [], this._origin = [0, 0];
		for (var n = 0; n < 4; n++) this._corners[n] = new Et();
		for (var n = 0; n < 2; n++) this._axes[n] = new Et();
		e && this.fromBoundingRect(e, t);
	}
	return e.prototype.fromBoundingRect = function(e, t) {
		var n = this._corners, r = this._axes, i = e.x, a = e.y, o = i + e.width, s = a + e.height;
		if (n[0].set(i, a), n[1].set(o, a), n[2].set(o, s), n[3].set(i, s), t) for (var c = 0; c < 4; c++) n[c].transform(t);
		Et.sub(r[0], n[1], n[0]), Et.sub(r[1], n[3], n[0]), r[0].normalize(), r[1].normalize();
		for (var c = 0; c < 2; c++) this._origin[c] = r[c].dot(n[0]);
	}, e.prototype.intersect = function(e, t, n) {
		var r = !0, i = !t;
		return t && Et.set(t, 0, 0), Td.reset(n, !i), !this._intersectCheckOneSide(this, e, i, 1) && (r = !1, i) || !this._intersectCheckOneSide(e, this, i, -1) && (r = !1, i) || !i && !Td.negativeSize && Et.copy(t, r ? Td.useDir ? Td.dirMinTv : Ed : Dd), r;
	}, e.prototype._intersectCheckOneSide = function(e, t, n, r) {
		for (var i = !0, a = 0; a < 2; a++) {
			var o = e._axes[a];
			if (e._getProjMinMaxOnAxis(a, e._corners, Cd), e._getProjMinMaxOnAxis(a, t._corners, wd), Td.negativeSize || Cd[1] < wd[0] || Cd[0] > wd[1]) {
				if (i = !1, Td.negativeSize || n) return i;
				var s = Sd(wd[0] - Cd[1]), c = Sd(Cd[0] - wd[1]);
				bd(s, c) > Dd.len() && (s < c ? Et.scale(Dd, o, -s * r) : Et.scale(Dd, o, c * r));
			} else if (!n) {
				var s = Sd(wd[0] - Cd[1]), c = Sd(Cd[0] - wd[1]);
				(Td.useDir || bd(s, c) < Ed.len()) && ((s < c || !Td.bidirectional) && (Et.scale(Ed, o, s * r), Td.useDir && Td.calcDirMTV()), (s >= c || !Td.bidirectional) && (Et.scale(Ed, o, -c * r), Td.useDir && Td.calcDirMTV()));
			}
		}
		return i;
	}, e.prototype._getProjMinMaxOnAxis = function(e, t, n) {
		for (var r = this._axes[e], i = this._origin, a = t[0].dot(r) + i[e], o = a, s = a, c = 1; c < t.length; c++) {
			var l = t[c].dot(r) + i[e];
			o = bd(l, o), s = xd(l, s);
		}
		n[0] = o + Td.touchThreshold, n[1] = s - Td.touchThreshold, Td.negativeSize = n[1] < n[0];
	}, e;
}(), kd = [], Ad = function(e) {
	r(t, e);
	function t() {
		var t = e !== null && e.apply(this, arguments) || this;
		return t.notClear = !0, t.incremental = 1, t._displayables = [], t._temporaryDisplayables = [], t._cursor = 0, t;
	}
	return t.prototype.traverse = function(e, t) {
		e.call(t, this);
	}, t.prototype.useStyle = function() {
		this.style = {};
	}, t.prototype._useHoverStyle = function() {
		this.__hoverStyle = null;
	}, t.prototype.getCursor = function() {
		return this._cursor;
	}, t.prototype.innerAfterBrush = function() {
		this._cursor = this._displayables.length;
	}, t.prototype.clearDisplaybles = function() {
		this._displayables = [], this._temporaryDisplayables = [], this._cursor = 0, this.markRedraw(), this.notClear = !1;
	}, t.prototype.clearTemporalDisplayables = function() {
		this._temporaryDisplayables = [];
	}, t.prototype.addDisplayable = function(e, t) {
		t ? this._temporaryDisplayables.push(e) : this._displayables.push(e), this.markRedraw();
	}, t.prototype.addDisplayables = function(e, t) {
		t ||= !1;
		for (var n = 0; n < e.length; n++) this.addDisplayable(e[n], t);
	}, t.prototype.getDisplayables = function() {
		return this._displayables;
	}, t.prototype.getTemporalDisplayables = function() {
		return this._temporaryDisplayables;
	}, t.prototype.eachPendingDisplayable = function(e) {
		for (var t = this._cursor; t < this._displayables.length; t++) e && e(this._displayables[t]);
		for (var t = 0; t < this._temporaryDisplayables.length; t++) e && e(this._temporaryDisplayables[t]);
	}, t.prototype.update = function() {
		this.updateTransform();
		for (var e = this._cursor; e < this._displayables.length; e++) {
			var t = this._displayables[e];
			t.parent = this, t.update(), t.parent = null;
		}
		for (var e = 0; e < this._temporaryDisplayables.length; e++) {
			var t = this._temporaryDisplayables[e];
			t.parent = this, t.update(), t.parent = null;
		}
	}, t.prototype.getBoundingRect = function() {
		if (!this._rect) {
			for (var e = new Y(Infinity, Infinity, -Infinity, -Infinity), t = 0; t < this._displayables.length; t++) {
				var n = this._displayables[t], r = n.getBoundingRect().clone();
				n.needLocalTransform() && r.applyTransform(n.getLocalTransform(kd)), e.union(r);
			}
			this._rect = e;
		}
		return this._rect;
	}, t.prototype.contain = function(e, t) {
		var n = this.transformCoordToLocal(e, t);
		if (this.getBoundingRect().contain(n[0], n[1])) {
			for (var r = 0; r < this._displayables.length; r++) if (this._displayables[r].contain(e, t)) return !0;
		}
		return !1;
	}, t;
}(da), jd = X();
function Md(e, t, n, r, i) {
	var a;
	if (t && t.ecModel) {
		var o = t.ecModel.getUpdatePayload();
		a = o && o.animation;
	}
	var s = t && t.isAnimationEnabled(), c = e === "update";
	if (s) {
		var l = void 0, u = void 0, d = void 0;
		return r ? (l = K(r.duration, 200), u = K(r.easing, "cubicOut"), d = 0) : (l = t.getShallow(c ? "animationDurationUpdate" : "animationDuration"), u = t.getShallow(c ? "animationEasingUpdate" : "animationEasing"), d = t.getShallow(c ? "animationDelayUpdate" : "animationDelay")), a && (a.duration != null && (l = a.duration), a.easing != null && (u = a.easing), a.delay != null && (d = a.delay)), H(d) && (d = d(n, i)), H(l) && (l = l(n)), {
			duration: l || 0,
			delay: d,
			easing: u
		};
	}
	return null;
}
function Nd(e, t, n, r, i, a, o) {
	var s = !1, c;
	H(i) ? (o = a, a = i, i = null) : G(i) && (a = i.cb, o = i.during, s = i.isFrom, c = i.removeOpt, i = i.dataIndex);
	var l = e === "leave";
	l || t.stopAnimation("leave");
	var u = Md(e, r, i, l ? c || {} : null, r && r.getAnimationDelayParams ? r.getAnimationDelayParams(t, i) : null);
	if (u && u.duration > 0) {
		var d = u.duration, f = u.delay, p = u.easing, m = {
			duration: d,
			delay: f || 0,
			easing: p,
			done: a,
			force: !!a || !!o,
			setToFinal: !l,
			scope: e,
			during: o
		};
		s ? t.animateFrom(n, m) : t.animateTo(n, m);
	} else t.stopAnimation(), !s && t.attr(n), o && o(1), a && a();
}
function Pd(e, t, n, r, i, a) {
	Nd("update", e, t, n, r, i, a);
}
function Fd(e, t, n, r, i, a) {
	Nd("enter", e, t, n, r, i, a);
}
function Id(e) {
	if (!e.__zr) return !0;
	for (var t = 0; t < e.animators.length; t++) if (e.animators[t].scope === "leave") return !0;
	return !1;
}
function Ld(e, t, n, r, i, a) {
	Id(e) || Nd("leave", e, t, n, r, i, a);
}
function Rd(e, t, n, r) {
	e.removeTextContent(), e.removeTextGuideLine(), Ld(e, { style: { opacity: 0 } }, t, n, r);
}
function zd(e, t, n) {
	function r() {
		e.parent && e.parent.remove(e);
	}
	e.isGroup ? e.traverse(function(e) {
		e.isGroup || Rd(e, t, n, r);
	}) : Rd(e, t, n, r);
}
function Bd(e) {
	jd(e).oldStyle = e.style;
}
//#endregion
//#region node_modules/echarts/lib/util/graphic.js
var Vd = /* @__PURE__ */ t({
	Arc: () => hd,
	BezierCurve: () => pd,
	BoundingRect: () => Y,
	Circle: () => Nu,
	CompoundPath: () => gd,
	Ellipse: () => Fu,
	Group: () => ju,
	HOVER_LAYER_FOR_INCREMENTAL: () => 2,
	HOVER_LAYER_FROM_THRESHOLD: () => 1,
	HOVER_LAYER_NO: () => 0,
	Image: () => To,
	IncrementalDisplayable: () => Ad,
	Line: () => ld,
	LinearGradient: () => vd,
	OrientedBoundingRect: () => Od,
	Path: () => yo,
	Point: () => Et,
	Polygon: () => id,
	Polyline: () => od,
	RadialGradient: () => yd,
	Rect: () => No,
	Ring: () => ed,
	Sector: () => Qu,
	Text: () => Ro,
	WH: () => Wd,
	XY: () => Ud,
	applyTransform: () => of,
	calcZ2Range: () => kf,
	clipPointsByRect: () => df,
	clipRectByRect: () => ff,
	createIcon: () => pf,
	decomposeTransform: () => Nf,
	ensureCopyRect: () => Ef,
	ensureCopyTransform: () => Df,
	expandOrShrinkRect: () => vf,
	extendPath: () => qd,
	extendShape: () => Gd,
	getCurrentCanvasPainter: () => Ff,
	getShapeClass: () => Yd,
	getTransform: () => af,
	groupTransition: () => uf,
	initProps: () => Fd,
	isBoundingRectAxisAligned: () => wf,
	isElementRemoved: () => Id,
	lineLineIntersect: () => hf,
	linePolygonIntersect: () => mf,
	makeImage: () => Zd,
	makePath: () => Xd,
	mergePath: () => $d,
	payloadDisableAnimation: () => Mf,
	registerShape: () => Jd,
	removeElement: () => Ld,
	removeElementWithFadeOut: () => zd,
	resizePath: () => ef,
	retrieveZInfo: () => Of,
	setTooltipConfig: () => xf,
	subPixelOptimize: () => rf,
	subPixelOptimizeLine: () => tf,
	subPixelOptimizeRect: () => nf,
	transformDirection: () => sf,
	traverseElements: () => Cf,
	traverseUpdateZ: () => Af,
	updateProps: () => Pd
}), Hd = {}, Ud = ["x", "y"], Wd = ["width", "height"];
function Gd(e) {
	return yo.extend(e);
}
var Kd = ku;
function qd(e, t) {
	return Kd(e, t);
}
function Jd(e, t) {
	Hd[e] = t;
}
function Yd(e) {
	if (Hd.hasOwnProperty(e)) return Hd[e];
}
function Xd(e, t, n, r) {
	var i = Ou(e, t);
	return n && (r === "center" && (n = Qd(n, i.getBoundingRect())), ef(i, n)), i;
}
function Zd(e, t, n) {
	var r = new To({
		style: {
			image: e,
			x: t.x,
			y: t.y,
			width: t.width,
			height: t.height
		},
		onload: function(e) {
			if (n === "center") {
				var i = {
					width: e.width,
					height: e.height
				};
				r.setStyle(Qd(t, i));
			}
		}
	});
	return r;
}
function Qd(e, t) {
	var n = t.width / t.height, r = e.height * n, i;
	r <= e.width ? i = e.height : (r = e.width, i = r / n);
	var a = e.x + e.width / 2, o = e.y + e.height / 2;
	return {
		x: a - r / 2,
		y: o - i / 2,
		width: r,
		height: i
	};
}
var $d = Au;
function ef(e, t) {
	if (e.applyTransform) {
		var n = e.getBoundingRect().calculateTransform(t);
		e.applyTransform(n);
	}
}
function tf(e, t) {
	return Oo(e, e, { lineWidth: t }), e;
}
function nf(e, t) {
	return ko(e, e, t), e;
}
var rf = Ao;
function af(e, t) {
	for (var n = nt([]); e && e !== t;) it(n, e.getLocalTransform(), n), e = e.parent;
	return n;
}
function of(e, t, n) {
	return t && !P(t) && (t = Vn.getLocalTransform(t)), n && (t = ct([], t)), Ct([], e, t);
}
function sf(e, t, n) {
	var r = t[4] === 0 || t[5] === 0 || t[0] === 0 ? 1 : rs(2 * t[4] / t[0]), i = t[4] === 0 || t[5] === 0 || t[2] === 0 ? 1 : rs(2 * t[4] / t[2]), a = [e === "left" ? -r : e === "right" ? r : 0, e === "top" ? -i : e === "bottom" ? i : 0];
	return a = of(a, t, n), rs(a[0]) > rs(a[1]) ? a[0] > 0 ? "right" : "left" : a[1] > 0 ? "bottom" : "top";
}
function cf(e) {
	return !e.isGroup;
}
function lf(e) {
	return e.shape != null;
}
function uf(e, t, n) {
	if (!e || !t) return;
	function r(e) {
		var t = {};
		return e.traverse(function(e) {
			cf(e) && e.anid && (t[e.anid] = e);
		}), t;
	}
	function i(e) {
		var t = {
			x: e.x,
			y: e.y,
			rotation: e.rotation
		};
		return lf(e) && (t.shape = E(e.shape)), t;
	}
	var a = r(e);
	t.traverse(function(e) {
		if (cf(e) && e.anid) {
			var t = a[e.anid];
			if (t) {
				var r = i(e);
				e.attr(i(t)), Pd(e, r, n, Z(e).dataIndex);
			}
		}
	});
}
function df(e, t) {
	return I(e, function(e) {
		var n = e[0];
		n = ns(n, t.x), n = ts(n, t.x + t.width);
		var r = e[1];
		return r = ns(r, t.y), r = ts(r, t.y + t.height), [n, r];
	});
}
function ff(e, t) {
	var n = ns(e.x, t.x), r = ts(e.x + e.width, t.x + t.width), i = ns(e.y, t.y), a = ts(e.y + e.height, t.y + t.height);
	if (r >= n && a >= i) return {
		x: n,
		y: i,
		width: r - n,
		height: a - i
	};
}
function pf(e, t, n) {
	var r = k({ rectHover: !0 }, t), i = r.style = { strokeNoScale: !0 };
	if (n ||= {
		x: -1,
		y: -1,
		width: 2,
		height: 2
	}, e) return e.indexOf("image://") === 0 ? (i.image = e.slice(8), j(i, n), new To(r)) : Xd(e.replace("path://", ""), r, n, "center");
}
function mf(e, t, n, r, i) {
	for (var a = 0, o = i[i.length - 1]; a < i.length; a++) {
		var s = i[a];
		if (hf(e, t, n, r, s[0], s[1], o[0], o[1])) return !0;
		o = s;
	}
}
function hf(e, t, n, r, i, a, o, s) {
	var c = n - e, l = r - t, u = o - i, d = s - a, f = gf(u, d, c, l);
	if (_f(f)) return !1;
	var p = e - i, m = t - a, h = gf(p, m, c, l) / f;
	if (h < 0 || h > 1) return !1;
	var g = gf(p, m, u, d) / f;
	return !(g < 0 || g > 1);
}
function gf(e, t, n, r) {
	return e * r - n * t;
}
function _f(e) {
	return e <= 1e-6 && e >= -1e-6;
}
function vf(e, t, n, r, i) {
	return t == null ? e : (W(t) ? yf[0] = yf[1] = yf[2] = yf[3] = t : (yf[0] = t[0], yf[1] = t[1], yf[2] = t[2], yf[3] = t[3]), r && (yf[0] = ns(0, yf[0]), yf[1] = ns(0, yf[1]), yf[2] = ns(0, yf[2]), yf[3] = ns(0, yf[3])), n && (yf[0] = -yf[0], yf[1] = -yf[1], yf[2] = -yf[2], yf[3] = -yf[3]), bf(e, yf, "x", "width", 3, 1, i && i[0] || 0), bf(e, yf, "y", "height", 0, 2, i && i[1] || 0), e);
}
var yf = [
	0,
	0,
	0,
	0
];
function bf(e, t, n, r, i, a, o) {
	var s = t[a] + t[i], c = e[r];
	e[r] += s, o = ns(0, ts(o, c)), e[r] < o ? (e[r] = o, e[n] += t[i] >= 0 ? -t[i] : t[a] >= 0 ? c + t[a] : rs(s) > 1e-8 ? (c - o) * t[i] / s : 0) : e[n] -= t[i];
}
function xf(e) {
	var t = e.itemTooltipOption, n = e.componentModel, r = e.itemName, i = U(t) ? { formatter: t } : t, a = n.mainType, o = n.componentIndex, s = {
		componentType: a,
		name: r,
		$vars: ["name"]
	};
	s[a + "Index"] = o;
	var c = e.formatterParamsExtra;
	c && F(R(c), function(e) {
		Te(s, e) || (s[e] = c[e], s.$vars.push(e));
	});
	var l = Z(e.el);
	l.componentMainType = a, l.componentIndex = o, l.tooltipConfig = {
		name: r,
		option: j({
			content: r,
			encodeHTMLContent: !0,
			formatterParams: s
		}, i)
	};
}
function Sf(e, t) {
	var n;
	e.isGroup && (n = t(e)), n || e.traverse(t);
}
function Cf(e, t) {
	if (e) {
		if (V(e)) for (var n = 0; n < e.length; n++) Sf(e[n], t);
		else Sf(e, t);
	}
}
function wf(e) {
	return !e || rs(e[1]) < Tf && rs(e[2]) < Tf || rs(e[0]) < Tf && rs(e[3]) < Tf;
}
var Tf = 1e-5;
function Ef(e, t) {
	return e ? Y.copy(e, t) : t.clone();
}
function Df(e, t) {
	return t ? rt(e || tt(), t) : void 0;
}
function Of(e) {
	return {
		z: e.get("z") || 0,
		zlevel: e.get("zlevel") || 0
	};
}
function kf(e) {
	var t = -Infinity, n = Infinity;
	Sf(e, function(e) {
		r(e), r(e.getTextContent()), r(e.getTextGuideLine());
	});
	function r(e) {
		if (!(!e || e.isGroup)) {
			var t = e.currentStates;
			if (t.length) for (var n = 0; n < t.length; n++) i(e.states[t[n]]);
			i(e);
		}
	}
	function i(e) {
		if (e) {
			var r = e.z2;
			r > t && (t = r), r < n && (n = r);
		}
	}
	return n > t && (n = t = 0), {
		min: n,
		max: t
	};
}
function Af(e, t, n) {
	jf(e, t, n, -Infinity);
}
function jf(e, t, n, r) {
	if (e.ignoreModelZ) return r;
	var i = e.getTextContent(), a = e.getTextGuideLine();
	if (e.isGroup) for (var o = e.childrenRef(), s = 0; s < o.length; s++) r = ns(jf(o[s], t, n, r), r);
	else e.z = t, e.zlevel = n, r = ns(e.z2 || 0, r);
	if (i && (i.z = t, i.zlevel = n, isFinite(r) && (i.z2 = r + 2)), a) {
		var c = e.textGuideLineConfig;
		a.z = t, a.zlevel = n, isFinite(r) && (a.z2 = r + (c && c.showAbove ? 1 : -1));
	}
	return r;
}
function Mf(e) {
	return e.animation = { duration: 0 }, e;
}
function Nf(e, t) {
	return t ? rt(Pf.transform, t) : nt(Pf.transform), Pf.decomposeTransform(), Gn(e, Pf), e;
}
var Pf = new Vn();
Pf.transform = tt();
function Ff(e) {
	var t = e.getZr().painter;
	return t.getType() === "canvas" ? t : null;
}
Jd("circle", Nu), Jd("ellipse", Fu), Jd("sector", Qu), Jd("ring", ed), Jd("polygon", id), Jd("polyline", od), Jd("rect", No), Jd("line", ld), Jd("bezierCurve", pd), Jd("arc", hd);
//#endregion
//#region node_modules/echarts/lib/label/labelStyle.js
var If = {};
function Lf(e, t) {
	for (var n = 0; n < ol.length; n++) {
		var r = ol[n], i = t[r], a = e.ensureState(r);
		a.style = a.style || {}, a.style.text = i;
	}
	var o = e.currentStates.slice();
	e.clearStates(!0), e.setStyle({ text: t.normal }), e.useStates(o, !0);
}
function Rf(e, t, n) {
	var r = e.labelFetcher, i = e.labelDataIndex, a = e.labelDimIndex, o = t.normal, s;
	r && (s = r.getFormattedLabel(i, "normal", null, a, o && o.get("formatter"), n == null ? null : { interpolatedValue: n })), s ??= H(e.defaultText) ? e.defaultText(i, e, n) : e.defaultText;
	for (var c = { normal: s }, l = 0; l < ol.length; l++) {
		var u = ol[l], d = t[u];
		c[u] = K(r ? r.getFormattedLabel(i, u, null, a, d && d.get("formatter")) : null, s);
	}
	return c;
}
function zf(e, t, n, r) {
	n ||= If;
	for (var i = e instanceof Ro, a = !1, o = 0; o < sl.length; o++) {
		var s = t[sl[o]];
		if (s && s.getShallow("show")) {
			a = !0;
			break;
		}
	}
	var c = i ? e : e.getTextContent();
	if (a) {
		i || (c || (c = new Ro(), e.setTextContent(c)), e.stateProxy && (c.stateProxy = e.stateProxy));
		var l = Rf(n, t), u = t.normal, d = !!u.getShallow("show"), f = Vf(u, r && r.normal, n, !1, !i);
		f.text = l.normal, i || e.setTextConfig(Hf(u, n, !1));
		for (var o = 0; o < ol.length; o++) {
			var p = ol[o], s = t[p];
			if (s) {
				var m = c.ensureState(p), h = !!K(s.getShallow("show"), d);
				if (h !== d && (m.ignore = !h), m.style = Vf(s, r && r[p], n, !0, !i), m.style.text = l[p], !i) {
					var g = e.ensureState(p);
					g.textConfig = Hf(s, n, !0);
				}
			}
		}
		c.silent = !!u.getShallow("silent"), c.style.x != null && (f.x = c.style.x), c.style.y != null && (f.y = c.style.y), c.ignore = !d, c.useStyle(f), c.dirty(), n.enableTextSetter && (Xf(c).setLabelText = function(e) {
			var r = Rf(n, t, e);
			Lf(c, r);
		});
	} else c && (c.ignore = !0);
	e.dirty();
}
function Bf(e, t) {
	t ||= "label";
	for (var n = { normal: e.getModel(t) }, r = 0; r < ol.length; r++) {
		var i = ol[r];
		n[i] = e.getModel([i, t]);
	}
	return n;
}
function Vf(e, t, n, r, i) {
	var a = {};
	return Uf(a, e, n, r, i), t && k(a, t), a;
}
function Hf(e, t, n) {
	t ||= {};
	var r = {}, i, a = e.getShallow("rotate"), o = K(e.getShallow("distance"), n ? null : 5), s = e.getShallow("offset");
	return i = e.getShallow("position") || (n ? null : "inside"), i === "outside" && (i = t.defaultOutsidePosition || "top"), i != null && (r.position = i), s != null && (r.offset = s), a != null && (a *= Math.PI / 180, r.rotation = a), o != null && (r.distance = o), r.outsideFill = e.get("color") === "inherit" ? t.inheritColor || null : "auto", t.autoOverflowArea != null && (r.autoOverflowArea = t.autoOverflowArea), t.layoutRect != null && (r.layoutRect = t.layoutRect), r;
}
function Uf(e, t, n, r, i) {
	n ||= If;
	var a = t.ecModel, o = a && a.option.textStyle, s = Wf(t), c;
	if (s) {
		c = {};
		var l = "richInheritPlainLabel", u = K(t.get(l), a ? a.get(l) : void 0);
		for (var d in s) if (s.hasOwnProperty(d)) {
			var f = t.getModel(["rich", d]);
			Jf(c[d] = {}, f, o, t, u, n, r, i, !1, !0);
		}
	}
	c && (e.rich = c);
	var p = t.get("overflow");
	p && (e.overflow = p);
	var m = t.get("lineOverflow");
	m && (e.lineOverflow = m);
	var h = e, g = t.get("minMargin");
	if (g != null) g = W(g) ? g / 2 : 0, h.margin = [
		g,
		g,
		g,
		g
	], h.__marginType = Qf.minMargin;
	else {
		var _ = t.get("textMargin");
		_ != null && (h.margin = pe(_), h.__marginType = Qf.textMargin);
	}
	Jf(e, t, o, null, null, n, r, i, !0, !1);
}
function Wf(e) {
	for (var t; e && e !== e.ecModel;) {
		var n = (e.option || If).rich;
		if (n) {
			t ||= {};
			for (var r = R(n), i = 0; i < r.length; i++) {
				var a = r[i];
				t[a] = 1;
			}
		}
		e = e.parentModel;
	}
	return t;
}
var Gf = [
	"fontStyle",
	"fontWeight",
	"fontSize",
	"fontFamily",
	"textShadowColor",
	"textShadowBlur",
	"textShadowOffsetX",
	"textShadowOffsetY"
], Kf = [
	"align",
	"lineHeight",
	"width",
	"height",
	"tag",
	"verticalAlign",
	"ellipsis"
], qf = [
	"padding",
	"borderWidth",
	"borderRadius",
	"borderDashOffset",
	"backgroundColor",
	"borderColor",
	"shadowColor",
	"shadowBlur",
	"shadowOffsetX",
	"shadowOffsetY"
];
function Jf(e, t, n, r, i, a, o, s, c, l) {
	n = !o && n || If;
	var u = a && a.inheritColor, d = t.getShallow("color"), f = t.getShallow("textBorderColor"), p = K(t.getShallow("opacity"), n.opacity);
	(d === "inherit" || d === "auto") && (d = u || null), (f === "inherit" || f === "auto") && (f = u || null), s || (d ||= n.color, f ||= n.textBorderColor), d != null && (e.fill = d), f != null && (e.stroke = f);
	var m = K(t.getShallow("textBorderWidth"), n.textBorderWidth);
	m != null && (e.lineWidth = m);
	var h = K(t.getShallow("textBorderType"), n.textBorderType);
	h != null && (e.lineDash = h);
	var g = K(t.getShallow("textBorderDashOffset"), n.textBorderDashOffset);
	g != null && (e.lineDashOffset = g), !o && p == null && !l && (p = a && a.defaultOpacity), p != null && (e.opacity = p), !o && !s && e.fill == null && a.inheritColor && (e.fill = a.inheritColor);
	for (var _ = 0; _ < Gf.length; _++) {
		var v = Gf[_], y = i !== !1 && r ? de(t.getShallow(v), r.getShallow(v), n[v]) : K(t.getShallow(v), n[v]);
		y != null && (e[v] = y);
	}
	for (var _ = 0; _ < Kf.length; _++) {
		var v = Kf[_], y = t.getShallow(v);
		y != null && (e[v] = y);
	}
	if (e.verticalAlign == null) {
		var b = t.getShallow("baseline");
		b != null && (e.verticalAlign = b);
	}
	if (!c || !a.disableBox) {
		for (var _ = 0; _ < qf.length; _++) {
			var v = qf[_], y = t.getShallow(v);
			y != null && (e[v] = y);
		}
		var x = t.getShallow("borderType");
		x != null && (e.borderDash = x), (e.backgroundColor === "auto" || e.backgroundColor === "inherit") && u && (e.backgroundColor = u), (e.borderColor === "auto" || e.borderColor === "inherit") && u && (e.borderColor = u);
	}
}
function Yf(e, t) {
	var n = t && t.getModel("textStyle");
	return he([
		e.fontStyle || n && n.getShallow("fontStyle") || "",
		e.fontWeight || n && n.getShallow("fontWeight") || "",
		(e.fontSize || n && n.getShallow("fontSize") || 12) + "px",
		e.fontFamily || n && n.getShallow("fontFamily") || "sans-serif"
	].join(" "));
}
var Xf = X();
function Zf(e, t, n, r) {
	if (e) {
		var i = Xf(e);
		i.prevValue = i.value, i.value = n;
		var a = t.normal;
		i.valueAnimation = a.get("valueAnimation"), i.valueAnimation && (i.precision = a.get("precision"), i.defaultInterpolatedText = r, i.statesModels = t);
	}
}
var Qf = {
	minMargin: 1,
	textMargin: 2
}, $f = ["textStyle", "color"], ep = [
	"fontStyle",
	"fontWeight",
	"fontSize",
	"fontFamily",
	"padding",
	"lineHeight",
	"rich",
	"width",
	"height",
	"overflow"
], tp = new Ro(), np = function() {
	function e() {}
	return e.prototype.getTextColor = function(e) {
		var t = this.ecModel;
		return this.getShallow("color") || (!e && t ? t.get($f) : null);
	}, e.prototype.getFont = function() {
		return Yf({
			fontStyle: this.getShallow("fontStyle"),
			fontWeight: this.getShallow("fontWeight"),
			fontSize: this.getShallow("fontSize"),
			fontFamily: this.getShallow("fontFamily")
		}, this.ecModel);
	}, e.prototype.getTextRect = function(e) {
		for (var t = {
			text: e,
			verticalAlign: this.getShallow("verticalAlign") || this.getShallow("baseline")
		}, n = 0; n < ep.length; n++) t[ep[n]] = this.getShallow(ep[n]);
		return tp.useStyle(t), tp.update(), tp.getBoundingRect();
	}, e;
}(), rp = [
	["lineWidth", "width"],
	["stroke", "color"],
	["opacity"],
	["shadowBlur"],
	["shadowOffsetX"],
	["shadowOffsetY"],
	["shadowColor"],
	["lineDash", "type"],
	["lineDashOffset", "dashOffset"],
	["lineCap", "cap"],
	["lineJoin", "join"],
	["miterLimit"]
], ip = We(rp), ap = function() {
	function e() {}
	return e.prototype.getLineStyle = function(e) {
		return ip(this, e);
	}, e;
}(), op = [
	["fill", "color"],
	["stroke", "borderColor"],
	["lineWidth", "borderWidth"],
	["opacity"],
	["shadowBlur"],
	["shadowOffsetX"],
	["shadowOffsetY"],
	["shadowColor"],
	["lineDash", "borderType"],
	["lineDashOffset", "borderDashOffset"],
	["lineCap", "borderCap"],
	["lineJoin", "borderJoin"],
	["miterLimit", "borderMiterLimit"]
], sp = We(op), cp = function() {
	function e() {}
	return e.prototype.getItemStyle = function(e, t) {
		return sp(this, e, t);
	}, e;
}(), lp = function() {
	function e(e, t, n) {
		this.parentModel = t, this.ecModel = n, this.option = e;
	}
	return e.prototype.init = function(e, t, n) {}, e.prototype.mergeOption = function(e, t) {
		D(this.option, e, !0);
	}, e.prototype.get = function(e, t) {
		return e == null ? this.option : this._doGet(this.parsePath(e), !t && this.parentModel);
	}, e.prototype.getShallow = function(e, t) {
		var n = this.option, r = n == null ? n : n[e];
		if (r == null && !t) {
			var i = this.parentModel;
			i && (r = i.getShallow(e));
		}
		return r;
	}, e.prototype.getModel = function(t, n) {
		var r = t != null, i = r ? this.parsePath(t) : null, a = r ? this._doGet(i) : this.option;
		return n ||= this.parentModel && this.parentModel.getModel(this.resolveParentPath(i)), new e(a, n, this.ecModel);
	}, e.prototype.isEmpty = function() {
		return this.option == null;
	}, e.prototype.restoreData = function() {}, e.prototype.clone = function() {
		var e = this.constructor;
		return new e(E(this.option));
	}, e.prototype.parsePath = function(e) {
		return typeof e == "string" ? e.split(".") : e;
	}, e.prototype.resolveParentPath = function(e) {
		return e;
	}, e.prototype.isAnimationEnabled = function() {
		if (!J.node && this.option) {
			if (this.option.animation != null) return !!this.option.animation;
			if (this.parentModel) return this.parentModel.isAnimationEnabled();
		}
	}, e.prototype._doGet = function(e, t) {
		var n = this.option;
		if (!e) return n;
		for (var r = 0; r < e.length && !(e[r] && (n = n && typeof n == "object" ? n[e[r]] : null, n == null)); r++);
		return n == null && t && (n = t._doGet(this.resolveParentPath(e), t.parentModel)), n;
	}, e;
}();
Ie(lp), Be(lp), N(lp, ap), N(lp, cp), N(lp, Ke), N(lp, np);
//#endregion
//#region node_modules/echarts/lib/data/DataDiffer.js
function up(e) {
	return e == null ? 0 : e.length || 1;
}
function dp(e) {
	return e;
}
var fp = function() {
	function e(e, t, n, r, i, a) {
		this._old = e, this._new = t, this._oldKeyGetter = n || dp, this._newKeyGetter = r || dp, this.context = i, this._diffModeMultiple = a === "multiple";
	}
	return e.prototype.add = function(e) {
		return this._add = e, this;
	}, e.prototype.update = function(e) {
		return this._update = e, this;
	}, e.prototype.updateManyToOne = function(e) {
		return this._updateManyToOne = e, this;
	}, e.prototype.updateOneToMany = function(e) {
		return this._updateOneToMany = e, this;
	}, e.prototype.updateManyToMany = function(e) {
		return this._updateManyToMany = e, this;
	}, e.prototype.remove = function(e) {
		return this._remove = e, this;
	}, e.prototype.execute = function() {
		this[this._diffModeMultiple ? "_executeMultiple" : "_executeOneToOne"]();
	}, e.prototype._executeOneToOne = function() {
		var e = this._old, t = this._new, n = {}, r = Array(e.length), i = Array(t.length);
		this._initIndexMap(e, null, r, "_oldKeyGetter"), this._initIndexMap(t, n, i, "_newKeyGetter");
		for (var a = 0; a < e.length; a++) {
			var o = r[a], s = n[o], c = up(s);
			if (c > 1) {
				var l = s.shift();
				s.length === 1 && (n[o] = s[0]), this._update && this._update(l, a);
			} else c === 1 ? (n[o] = null, this._update && this._update(s, a)) : this._remove && this._remove(a);
		}
		this._performRestAdd(i, n);
	}, e.prototype._executeMultiple = function() {
		var e = this._old, t = this._new, n = {}, r = {}, i = [], a = [];
		this._initIndexMap(e, n, i, "_oldKeyGetter"), this._initIndexMap(t, r, a, "_newKeyGetter");
		for (var o = 0; o < i.length; o++) {
			var s = i[o], c = n[s], l = r[s], u = up(c), d = up(l);
			if (u > 1 && d === 1) this._updateManyToOne && this._updateManyToOne(l, c), r[s] = null;
			else if (u === 1 && d > 1) this._updateOneToMany && this._updateOneToMany(l, c), r[s] = null;
			else if (u === 1 && d === 1) this._update && this._update(l, c), r[s] = null;
			else if (u > 1 && d > 1) this._updateManyToMany && this._updateManyToMany(l, c), r[s] = null;
			else if (u > 1) for (var f = 0; f < u; f++) this._remove && this._remove(c[f]);
			else this._remove && this._remove(c);
		}
		this._performRestAdd(a, r);
	}, e.prototype._performRestAdd = function(e, t) {
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = t[r], a = up(i);
			if (a > 1) for (var o = 0; o < a; o++) this._add && this._add(i[o]);
			else a === 1 && this._add && this._add(i);
			t[r] = null;
		}
	}, e.prototype._initIndexMap = function(e, t, n, r) {
		for (var i = this._diffModeMultiple, a = 0; a < e.length; a++) {
			var o = "_ec_" + this[r](e[a], a);
			if (i || (n[a] = o), t) {
				var s = t[o], c = up(s);
				c === 0 ? (t[o] = a, i && n.push(o)) : c === 1 ? t[o] = [s, a] : s.push(a);
			}
		}
	}, e;
}(), pp = {
	Must: 1,
	Might: 2,
	Not: 3
}, mp = X();
function hp(e) {
	mp(e).datasetMap = q();
}
function gp(e, t, n) {
	var r = {}, i = _p(t);
	if (!i || !e) return r;
	var a = [], o = [], s = t.ecModel, c = mp(s).datasetMap, l = i.uid + "_" + n.seriesLayoutBy, u, d;
	e = e.slice(), F(e, function(t, n) {
		var i = G(t) ? t : e[n] = { name: t };
		i.type === "ordinal" && u == null && (u = n, d = m(i)), r[i.name] = [];
	});
	var f = c.get(l) || c.set(l, {
		categoryWayDim: d,
		valueWayDim: 0
	});
	F(e, function(e, t) {
		var n = e.name, i = m(e);
		if (u == null) {
			var s = f.valueWayDim;
			p(r[n], s, i), p(o, s, i), f.valueWayDim += i;
		} else if (u === t) p(r[n], 0, i), p(a, 0, i);
		else {
			var s = f.categoryWayDim;
			p(r[n], s, i), p(o, s, i), f.categoryWayDim += i;
		}
	});
	function p(e, t, n) {
		for (var r = 0; r < n; r++) e.push(t + r);
	}
	function m(e) {
		var t = e.dimsDef;
		return t ? t.length : 1;
	}
	return a.length && (r.itemName = a), o.length && (r.seriesName = o), r;
}
function _p(e) {
	if (!e.get("data", !0)) return _c(e.ecModel, "dataset", {
		index: e.get("datasetIndex", !0),
		id: e.get("datasetId", !0)
	}, gc).models[0];
}
function vp(e) {
	return !e.get("transform", !0) && !e.get("fromTransformResult", !0) ? [] : _c(e.ecModel, "dataset", {
		index: e.get("fromDatasetIndex", !0),
		id: e.get("fromDatasetId", !0)
	}, gc).models;
}
function yp(e, t) {
	return bp(e.data, e.sourceFormat, e.seriesLayoutBy, e.dimensionsDefine, e.startIndex, t);
}
function bp(e, t, n, r, i, a) {
	var o, s = 5;
	if (oe(e)) return pp.Not;
	var c, l;
	if (r) {
		var u = r[a];
		G(u) ? (c = u.name, l = u.type) : U(u) && (c = u);
	}
	if (l != null) return l === "ordinal" ? pp.Must : pp.Not;
	if (t === "arrayRows") {
		var d = e;
		if (n === "row") {
			for (var f = d[a], p = 0; p < (f || []).length && p < s; p++) if ((o = b(f[i + p])) != null) return o;
		} else for (var p = 0; p < d.length && p < s; p++) {
			var m = d[i + p];
			if (m && (o = b(m[a])) != null) return o;
		}
	} else if (t === "objectRows") {
		var h = e;
		if (!c) return pp.Not;
		for (var p = 0; p < h.length && p < s; p++) {
			var g = h[p];
			if (g && (o = b(g[c])) != null) return o;
		}
	} else if (t === "keyedColumns") {
		var _ = e;
		if (!c) return pp.Not;
		var f = _[c];
		if (!f || oe(f)) return pp.Not;
		for (var p = 0; p < f.length && p < s; p++) if ((o = b(f[p])) != null) return o;
	} else if (t === "original") for (var v = e, p = 0; p < v.length && p < s; p++) {
		var g = v[p], y = Xs(g);
		if (!V(y)) return pp.Not;
		if ((o = b(y[a])) != null) return o;
	}
	function b(e) {
		var t = U(e);
		if (e != null && isFinite(Number(e)) && e !== "") return t ? pp.Might : pp.Not;
		if (t && e !== "-") return pp.Must;
	}
	return pp.Not;
}
//#endregion
//#region node_modules/echarts/lib/data/Source.js
var xp = function() {
	function e(e) {
		this.data = e.data || (e.sourceFormat === "keyedColumns" ? {} : []), this.sourceFormat = e.sourceFormat || "unknown", this.seriesLayoutBy = e.seriesLayoutBy || "column", this.startIndex = e.startIndex || 0, this.dimensionsDetectedCount = e.dimensionsDetectedCount, this.metaRawOption = e.metaRawOption;
		var t = this.dimensionsDefine = e.dimensionsDefine;
		if (t) for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.type == null && yp(this, n) === pp.Must && (r.type = "ordinal");
		}
	}
	return e;
}();
function Sp(e) {
	return e instanceof xp;
}
function Cp(e, t, n) {
	n ||= Ep(e);
	var r = t.seriesLayoutBy, i = Dp(e, n, r, t.sourceHeader, t.dimensions);
	return new xp({
		data: e,
		sourceFormat: n,
		seriesLayoutBy: r,
		dimensionsDefine: i.dimensionsDefine,
		startIndex: i.startIndex,
		dimensionsDetectedCount: i.dimensionsDetectedCount,
		metaRawOption: E(t)
	});
}
function wp(e) {
	return new xp({
		data: e,
		sourceFormat: oe(e) ? Yc : Gc
	});
}
function Tp(e) {
	return new xp({
		data: e.data,
		sourceFormat: e.sourceFormat,
		seriesLayoutBy: e.seriesLayoutBy,
		dimensionsDefine: E(e.dimensionsDefine),
		startIndex: e.startIndex,
		dimensionsDetectedCount: e.dimensionsDetectedCount
	});
}
function Ep(e) {
	var t = Xc;
	if (oe(e)) t = Yc;
	else if (V(e)) {
		e.length === 0 && (t = Kc);
		for (var n = 0, r = e.length; n < r; n++) {
			var i = e[n];
			if (i != null) {
				if (V(i) || oe(i)) {
					t = Kc;
					break;
				}
				if (G(i)) {
					t = qc;
					break;
				}
			}
		}
	} else if (G(e)) {
		for (var a in e) if (Te(e, a) && P(e[a])) {
			t = Jc;
			break;
		}
	}
	return t;
}
function Dp(e, t, n, r, i) {
	var a, o;
	if (!e) return {
		dimensionsDefine: kp(i),
		startIndex: o,
		dimensionsDetectedCount: a
	};
	if (t === "arrayRows") {
		var s = e;
		r === "auto" || r == null ? Ap(function(e) {
			e != null && e !== "-" && (U(e) ? o ??= 1 : o = 0);
		}, n, s, 10) : o = W(r) ? r : +!!r, !i && o === 1 && (i = [], Ap(function(e, t) {
			i[t] = e == null ? "" : e + "";
		}, n, s, Infinity)), a = i ? i.length : n === "row" ? s.length : s[0] ? s[0].length : null;
	} else if (t === "objectRows") i ||= Op(e);
	else if (t === "keyedColumns") i || (i = [], F(e, function(e, t) {
		i.push(t);
	}));
	else if (t === "original") {
		var c = Xs(e[0]);
		a = V(c) && c.length || 1;
	}
	return {
		startIndex: o,
		dimensionsDefine: kp(i),
		dimensionsDetectedCount: a
	};
}
function Op(e) {
	for (var t = 0, n; t < e.length && !(n = e[t++]););
	if (n) return R(n);
}
function kp(e) {
	if (e) {
		var t = q();
		return I(e, function(e, n) {
			e = G(e) ? e : { name: e };
			var r = {
				name: e.name,
				displayName: e.displayName,
				type: e.type
			};
			if (r.name == null) return r;
			r.name += "", r.displayName ??= r.name;
			var i = t.get(r.name);
			return i ? r.name += "-" + i.count++ : t.set(r.name, { count: 1 }), r;
		});
	}
}
function Ap(e, t, n, r) {
	if (t === "row") for (var i = 0; i < n.length && i < r; i++) e(n[i] ? n[i][0] : null, i);
	else for (var a = n[0] || [], i = 0; i < a.length && i < r; i++) e(a[i], i);
}
function jp(e) {
	var t = e.sourceFormat;
	return t === "objectRows" || t === "keyedColumns";
}
//#endregion
//#region node_modules/echarts/lib/data/helper/dataProvider.js
var Mp, Np, Pp, Fp, Ip, Lp, Rp = function() {
	function e(e, t) {
		var n = Sp(e) ? e : wp(e);
		this._source = n;
		var r = this._data = n.data, i = n.sourceFormat;
		n.seriesLayoutBy, i === "typedArray" && (this._offset = 0, this._dimSize = t, this._data = r), Lp(this, r, n);
	}
	return e.prototype.getSource = function() {
		return this._source;
	}, e.prototype.count = function() {
		return 0;
	}, e.prototype.getItem = function(e, t) {}, e.prototype.appendData = function(e) {}, e.prototype.clean = function() {}, e.protoInitialize = function() {
		var t = e.prototype;
		t.pure = !1, t.persistent = !0;
	}(), e.internalField = function() {
		var e;
		Lp = function(e, i, a) {
			var o = a.sourceFormat, s = a.seriesLayoutBy, c = a.startIndex, l = a.dimensionsDefine, u = Ip[Yp(o, s)];
			k(e, u), o === "typedArray" ? (e.getItem = t, e.count = r, e.fillStorage = n) : (e.getItem = z(Hp(o, s), null, i, c, l), e.count = z(Gp(o, s), null, i, c, l));
		};
		var t = function(e, t) {
			e -= this._offset, t ||= [];
			for (var n = this._data, r = this._dimSize, i = r * e, a = 0; a < r; a++) t[a] = n[i + a];
			return t;
		}, n = function(e, t, n, r) {
			for (var i = this._data, a = this._dimSize, o = 0; o < a; o++) {
				for (var s = r[o], c = s[0] == null ? Infinity : s[0], l = s[1] == null ? -Infinity : s[1], u = t - e, d = n[o], f = 0; f < u; f++) {
					var p = i[f * a + o];
					d[e + f] = p, p < c && (c = p), p > l && (l = p);
				}
				s[0] = c, s[1] = l;
			}
		}, r = function() {
			return this._data ? this._data.length / this._dimSize : 0;
		};
		Ip = (e = {}, e[Kc + "_" + Zc] = {
			pure: !0,
			appendData: i
		}, e[Kc + "_row"] = {
			pure: !0,
			appendData: function() {
				throw Error("Do not support appendData when set seriesLayoutBy: \"row\".");
			}
		}, e[qc] = {
			pure: !0,
			appendData: i
		}, e[Jc] = {
			pure: !0,
			appendData: function(e) {
				var t = this._data;
				F(e, function(e, n) {
					for (var r = t[n] || (t[n] = []), i = 0; i < (e || []).length; i++) r.push(e[i]);
				});
			}
		}, e[Gc] = { appendData: i }, e[Yc] = {
			persistent: !1,
			pure: !0,
			appendData: function(e) {
				this._data = e;
			},
			clean: function() {
				this._offset += this.count(), this._data = null;
			}
		}, e);
		function i(e) {
			for (var t = 0; t < e.length; t++) this._data.push(e[t]);
		}
	}(), e;
}(), zp = function(e) {
	V(e) || Hs("series.data or dataset.source must be an array.");
};
Mp = {}, Mp[Kc + "_" + Zc] = zp, Mp[Kc + "_row"] = zp, Mp[qc] = zp, Mp[Jc] = function(e, t) {
	for (var n = 0; n < t.length; n++) t[n].name ?? Hs("dimension name must not be null/undefined.");
}, Mp[Gc] = zp;
var Bp = function(e, t, n, r) {
	return e[r];
}, Vp = (Np = {}, Np[Kc + "_" + Zc] = function(e, t, n, r) {
	return e[r + t];
}, Np[Kc + "_row"] = function(e, t, n, r, i) {
	r += t;
	for (var a = i || [], o = e, s = 0; s < o.length; s++) {
		var c = o[s];
		a[s] = c ? c[r] : null;
	}
	return a;
}, Np[qc] = Bp, Np[Jc] = function(e, t, n, r, i) {
	for (var a = i || [], o = 0; o < n.length; o++) {
		var s = n[o].name, c = s == null ? null : e[s];
		a[o] = c ? c[r] : null;
	}
	return a;
}, Np[Gc] = Bp, Np);
function Hp(e, t) {
	return Vp[Yp(e, t)];
}
var Up = function(e, t, n) {
	return e.length;
}, Wp = (Pp = {}, Pp[Kc + "_" + Zc] = function(e, t, n) {
	return Math.max(0, e.length - t);
}, Pp[Kc + "_row"] = function(e, t, n) {
	var r = e[0];
	return r ? Math.max(0, r.length - t) : 0;
}, Pp[qc] = Up, Pp[Jc] = function(e, t, n) {
	var r = n[0].name, i = r == null ? null : e[r];
	return i ? i.length : 0;
}, Pp[Gc] = Up, Pp);
function Gp(e, t) {
	return Wp[Yp(e, t)];
}
var Kp = function(e, t, n) {
	return e[t];
}, qp = (Fp = {}, Fp[Kc] = Kp, Fp[qc] = function(e, t, n) {
	return e[n];
}, Fp[Jc] = Kp, Fp[Gc] = function(e, t, n) {
	var r = Xs(e);
	return r instanceof Array ? r[t] : r;
}, Fp[Yc] = Kp, Fp);
function Jp(e) {
	return qp[e];
}
function Yp(e, t) {
	return e === "arrayRows" ? e + "_" + t : e;
}
function Xp(e, t, n) {
	if (e) {
		var r = e.getRawDataItem(t);
		if (r != null) {
			var i = e.getStore(), a = i.getSource().sourceFormat;
			if (n != null) {
				var o = e.getDimensionIndex(n), s = i.getDimensionProperty(o);
				return Jp(a)(r, o, s);
			}
			var c = r;
			return a === "original" && (c = Xs(r)), c;
		}
	}
}
//#endregion
//#region node_modules/echarts/lib/data/helper/dimensionHelper.js
var Zp = function() {
	function e(e, t) {
		this._encode = e, this._schema = t;
	}
	return e.prototype.get = function() {
		return {
			fullDimensions: this._getFullDimensionNames(),
			encode: this._encode
		};
	}, e.prototype._getFullDimensionNames = function() {
		return this._cachedDimNames ||= this._schema ? this._schema.makeOutputDimensionNames() : [], this._cachedDimNames;
	}, e;
}();
function Qp(e, t) {
	var n = {}, r = n.encode = {}, i = q(), a = [], o = [], s = {};
	F(e.dimensions, function(t) {
		var n = e.getDimensionInfo(t), c = n.coordDim;
		if (c) {
			var l = n.coordDimIndex;
			$p(r, c)[l] = t, n.isExtraCoord || (i.set(c, 1), tm(n.type) && (a[0] = t), $p(s, c)[l] = e.getDimensionIndex(n.name)), n.defaultTooltip && o.push(t);
		}
		Wc.each(function(e, t) {
			var i = $p(r, t), a = n.otherDims[t];
			a != null && a !== !1 && (i[a] = n.name);
		});
	});
	var c = [], l = {};
	i.each(function(e, t) {
		var n = r[t];
		l[t] = n[0], c = c.concat(n);
	}), n.dataDimsOnCoord = c, n.dataDimIndicesOnCoord = I(c, function(t) {
		return e.getDimensionInfo(t).storeDimIndex;
	}), n.encodeFirstDimNotExtra = l;
	var u = r.label;
	u && u.length && (a = u.slice());
	var d = r.tooltip;
	return d && d.length ? o = d.slice() : o.length || (o = a.slice()), r.defaultedLabel = a, r.defaultedTooltip = o, n.userOutput = new Zp(s, t), n;
}
function $p(e, t) {
	return e.hasOwnProperty(t) || (e[t] = []), e[t];
}
function em(e) {
	return e === "category" ? "ordinal" : e === "time" ? "time" : "float";
}
function tm(e) {
	return e !== "ordinal" && e !== "time";
}
//#endregion
//#region node_modules/echarts/lib/data/SeriesDimensionDefine.js
var nm = function() {
	function e(e) {
		this.otherDims = {}, e != null && k(this, e);
	}
	return e;
}();
//#endregion
//#region node_modules/echarts/lib/data/helper/dataValueHelper.js
function rm(e, t) {
	var n = t && t.type;
	return n === "ordinal" ? e : (n === "time" && !W(e) && e != null && e !== "-" && (e = +Os(e)), e == null || e === "" ? NaN : Number(e));
}
q({
	number: function(e) {
		return parseFloat(e);
	},
	time: function(e) {
		return +Os(e);
	},
	trim: function(e) {
		return U(e) ? he(e) : e;
	}
});
var im = {
	lt: function(e, t) {
		return e < t;
	},
	lte: function(e, t) {
		return e <= t;
	},
	gt: function(e, t) {
		return e > t;
	},
	gte: function(e, t) {
		return e >= t;
	}
};
(function() {
	function e(e, t) {
		W(t) || Us(""), this._opFn = im[e], this._rvalFloat = Ms(t);
	}
	return e.prototype.evaluate = function(e) {
		return W(e) ? this._opFn(e, this._rvalFloat) : this._opFn(Ms(e), this._rvalFloat);
	}, e;
})();
var am = function() {
	function e(e, t) {
		var n = e === "desc";
		this._resultLT = n ? 1 : -1, t ??= n ? "min" : "max", this._incomparable = t === "min" ? -Infinity : Infinity;
	}
	return e.prototype.evaluate = function(e, t) {
		var n = W(e) ? e : Ms(e), r = W(t) ? t : Ms(t), i = isNaN(n), a = isNaN(r);
		if (i && (n = this._incomparable), a && (r = this._incomparable), i && a) {
			var o = U(e), s = U(t);
			o && (n = s ? e : 0), s && (r = o ? t : 0);
		}
		return n < r ? this._resultLT : n > r ? -this._resultLT : 0;
	}, e;
}();
(function() {
	function e(e, t) {
		this._rval = t, this._isEQ = e, this._rvalTypeof = typeof t, this._rvalFloat = Ms(t);
	}
	return e.prototype.evaluate = function(e) {
		var t = e === this._rval;
		if (!t) {
			var n = typeof e;
			n !== this._rvalTypeof && (n === "number" || this._rvalTypeof === "number") && (t = Ms(e) === this._rvalFloat);
		}
		return this._isEQ ? t : !t;
	}, e;
})();
function om(e) {
	var t = "", n = -Infinity, r = -Infinity, i = Infinity, a = Infinity;
	return e && (e.g != null && (t += "G" + e.g, n = e.g), e.ge != null && (t += "GE" + e.ge, r = e.ge), e.l != null && (t += "L" + e.l, i = e.l), e.le != null && (t += "LE" + e.le, a = e.le)), {
		key: t,
		g: n,
		ge: r,
		l: i,
		le: a
	};
}
function sm(e, t) {
	return t > e.g && t >= e.ge && t < e.l && t <= e.le;
}
//#endregion
//#region node_modules/echarts/lib/data/DataStore.js
var cm = typeof Uint32Array > "u" ? Array : Uint32Array, lm = typeof Uint16Array > "u" ? Array : Uint16Array, um = typeof Int32Array > "u" ? Array : Int32Array, dm = typeof Float64Array > "u" ? Array : Float64Array, fm = {
	float: dm,
	int: um,
	ordinal: Array,
	number: Array,
	time: dm
}, pm;
function mm(e) {
	return e > 65535 ? cm : lm;
}
function hm(e) {
	var t = e.constructor;
	return t === Array ? e.slice() : new t(e);
}
function gm(e, t, n, r, i) {
	var a = fm[n || "float"];
	if (i) {
		var o = e[t], s = o && o.length;
		if (s !== r) {
			for (var c = new a(r), l = 0; l < s; l++) c[l] = o[l];
			e[t] = c;
		}
	} else e[t] = new a(r);
}
var _m = function() {
	function e() {
		this._chunks = [], this._rawExtent = [], this._extent = [], this._count = 0, this._rawCount = 0, this._calcDimNameToIdx = q();
	}
	return e.prototype.initData = function(e, t, n) {
		this._provider = e, this._chunks = [], this._indices = null, this.getRawIndex = this._getRawIdxIdentity;
		var r = e.getSource(), i = this.defaultDimValueGetter = pm[r.sourceFormat];
		this._dimValueGetter = n || i, this._rawExtent = [], jp(r), this._dimensions = I(t, function(e) {
			return {
				type: e.type,
				property: e.property
			};
		}), this._initDataFromProvider(0, e.count());
	}, e.prototype.getProvider = function() {
		return this._provider;
	}, e.prototype.getSource = function() {
		return this._provider.getSource();
	}, e.prototype.ensureCalculationDimension = function(e, t) {
		var n = this._calcDimNameToIdx, r = this._dimensions, i = n.get(e);
		if (i != null) {
			if (r[i].type === t) return i;
		} else i = r.length;
		return r[i] = { type: t }, n.set(e, i), this._chunks[i] = new fm[t || "float"](this._rawCount), this._rawExtent[i] = wc(), i;
	}, e.prototype.collectOrdinalMeta = function(e, t) {
		var n = this._chunks[e], r = this._dimensions[e], i = this._rawExtent, a = r.ordinalOffset || 0, o = n.length;
		a === 0 && (i[e] = wc());
		for (var s = i[e], c = a; c < o; c++) {
			var l = n[c] = t.parseAndCollect(n[c]);
			isNaN(l) || (s[0] = Math.min(l, s[0]), s[1] = Math.max(l, s[1]));
		}
		r.ordinalMeta = t, r.ordinalOffset = o, r.type = "ordinal";
	}, e.prototype.getOrdinalMeta = function(e) {
		return this._dimensions[e].ordinalMeta;
	}, e.prototype.getDimensionProperty = function(e) {
		var t = this._dimensions[e];
		return t && t.property;
	}, e.prototype.appendData = function(e) {
		var t = this._provider, n = this.count();
		t.appendData(e);
		var r = t.count();
		return t.persistent || (r += n), n < r && this._initDataFromProvider(n, r, !0), [n, r];
	}, e.prototype.appendValues = function(e, t) {
		for (var n = this._chunks, r = this._dimensions, i = r.length, a = this._rawExtent, o = this.count(), s = o + Math.max(e.length, t || 0), c = 0; c < i; c++) {
			var l = r[c];
			gm(n, c, l.type, s, !0);
		}
		for (var u = [], d = o; d < s; d++) for (var f = d - o, p = 0; p < i; p++) {
			var l = r[p], m = pm.arrayRows.call(this, e[f] || u, l.property, f, p);
			n[p][d] = m;
			var h = a[p];
			m < h[0] && (h[0] = m), m > h[1] && (h[1] = m);
		}
		return this._rawCount = this._count = s, {
			start: o,
			end: s
		};
	}, e.prototype._initDataFromProvider = function(e, t, n) {
		for (var r = this._provider, i = this._chunks, a = this._dimensions, o = a.length, s = this._rawExtent, c = I(a, function(e) {
			return e.property;
		}), l = 0; l < o; l++) {
			var u = a[l];
			s[l] || (s[l] = wc()), gm(i, l, u.type, t, n);
		}
		if (r.fillStorage) r.fillStorage(e, t, i, s);
		else for (var d = [], f = e; f < t; f++) {
			d = r.getItem(f, d);
			for (var p = 0; p < o; p++) {
				var m = i[p], h = this._dimValueGetter(d, c[p], f, p);
				m[f] = h;
				var g = s[p];
				h < g[0] && (g[0] = h), h > g[1] && (g[1] = h);
			}
		}
		!r.persistent && r.clean && r.clean(), this._rawCount = this._count = t, this._extent = [];
	}, e.prototype.count = function() {
		return this._count;
	}, e.prototype.get = function(e, t) {
		if (!(t >= 0 && t < this._count)) return NaN;
		var n = this._chunks[e];
		return n ? n[this.getRawIndex(t)] : NaN;
	}, e.prototype.getValues = function(e, t) {
		var n = [], r = [];
		if (t == null) {
			t = e, e = [];
			for (var i = 0; i < this._dimensions.length; i++) r.push(i);
		} else r = e;
		for (var i = 0, a = r.length; i < a; i++) n.push(this.get(r[i], t));
		return n;
	}, e.prototype.getByRawIndex = function(e, t) {
		if (!(t >= 0 && t < this._rawCount)) return NaN;
		var n = this._chunks[e];
		return n ? n[t] : NaN;
	}, e.prototype.getSum = function(e) {
		var t = this._chunks[e], n = 0;
		if (t) for (var r = 0, i = this.count(); r < i; r++) {
			var a = this.get(e, r);
			isNaN(a) || (n += a);
		}
		return n;
	}, e.prototype.getMedian = function(e) {
		var t = [];
		this.each([e], function(e) {
			isNaN(e) || t.push(e);
		}), ys(t);
		var n = this.count();
		return n === 0 ? 0 : n % 2 == 1 ? t[(n - 1) / 2] : (t[n / 2] + t[n / 2 - 1]) / 2;
	}, e.prototype.indexOfRawIndex = function(e) {
		if (e >= this._rawCount || e < 0) return -1;
		if (!this._indices) return e;
		var t = this._indices, n = t[e];
		if (n != null && n < this._count && n === e) return e;
		for (var r = 0, i = this._count - 1; r <= i;) {
			var a = (r + i) / 2 | 0;
			if (t[a] < e) r = a + 1;
			else if (t[a] > e) i = a - 1;
			else return a;
		}
		return -1;
	}, e.prototype.getIndices = function() {
		var e, t = this._indices;
		if (t) {
			var n = t.constructor, r = this._count;
			if (n === Array) {
				e = new n(r);
				for (var i = 0; i < r; i++) e[i] = t[i];
			} else e = new n(t.buffer, 0, r);
		} else {
			var n = mm(this._rawCount);
			e = new n(this.count());
			for (var i = 0; i < e.length; i++) e[i] = i;
		}
		return e;
	}, e.prototype.filter = function(e, t) {
		if (!this._count) return this;
		for (var n = this.clone(), r = n.count(), i = new (mm(n._rawCount))(r), a = [], o = e.length, s = 0, c = e[0], l = n._chunks, u = 0; u < r; u++) {
			var d = void 0, f = n.getRawIndex(u);
			if (o === 0) d = t(u);
			else if (o === 1) {
				var p = l[c][f];
				d = t(p, u);
			} else {
				for (var m = 0; m < o; m++) a[m] = l[e[m]][f];
				a[m] = u, d = t.apply(null, a);
			}
			d && (i[s++] = f);
		}
		return s < r && (n._indices = i), n._count = s, n._extent = [], n._updateGetRawIdx(), n;
	}, e.prototype.selectRange = function(e) {
		var t = this.clone(), n = t._count;
		if (!n) return this;
		var r = R(e), i = r.length;
		if (!i) return this;
		var a = t.count(), o = new (mm(t._rawCount))(a), s = 0, c = r[0], l = e[c][0], u = e[c][1], d = t._chunks, f = !1;
		if (!t._indices) {
			var p = 0;
			if (i === 1) {
				for (var m = d[r[0]], h = 0; h < n; h++) {
					var g = m[h];
					(g >= l && g <= u || isNaN(g)) && (o[s++] = p), p++;
				}
				f = !0;
			} else if (i === 2) {
				for (var m = d[r[0]], _ = d[r[1]], v = e[r[1]][0], y = e[r[1]][1], h = 0; h < n; h++) {
					var g = m[h], b = _[h];
					(g >= l && g <= u || isNaN(g)) && (b >= v && b <= y || isNaN(b)) && (o[s++] = p), p++;
				}
				f = !0;
			}
		}
		if (!f) {
			if (i === 1) for (var h = 0; h < a; h++) {
				var x = t.getRawIndex(h), g = d[r[0]][x];
				(g >= l && g <= u || isNaN(g)) && (o[s++] = x);
			}
			else for (var h = 0; h < a; h++) {
				for (var S = !0, x = t.getRawIndex(h), C = 0; C < i; C++) {
					var w = r[C], g = d[w][x];
					(g < e[w][0] || g > e[w][1]) && (S = !1);
				}
				S && (o[s++] = t.getRawIndex(h));
			}
		}
		return s < a && (t._indices = o), t._count = s, t._extent = [], t._updateGetRawIdx(), t;
	}, e.prototype.map = function(e, t) {
		var n = this.clone(e);
		return this._updateDims(n, e, t), n;
	}, e.prototype.modify = function(e, t) {
		this._updateDims(this, e, t);
	}, e.prototype._updateDims = function(e, t, n) {
		for (var r = e._chunks, i = [], a = t.length, o = e.count(), s = [], c = e._rawExtent, l = 0; l < t.length; l++) c[t[l]] = wc();
		for (var u = 0; u < o; u++) {
			for (var d = e.getRawIndex(u), f = 0; f < a; f++) s[f] = r[t[f]][d];
			s[a] = u;
			var p = n && n.apply(null, s);
			if (p != null) {
				typeof p != "object" && (i[0] = p, p = i);
				for (var l = 0; l < p.length; l++) {
					var m = t[l], h = p[l], g = c[m], _ = r[m];
					_ && (_[d] = h), h < g[0] && (g[0] = h), h > g[1] && (g[1] = h);
				}
			}
		}
	}, e.prototype.lttbDownSample = function(e, t) {
		var n = this.clone([e], !0), r = n._chunks[e], i = this.count(), a = 0, o = Math.floor(1 / t), s = this.getRawIndex(0), c, l, u, d = new (mm(this._rawCount))(Math.min((Math.ceil(i / o) + 2) * 2, i));
		d[a++] = s;
		for (var f = 1; f < i - 1; f += o) {
			for (var p = Math.min(f + o, i - 1), m = Math.min(f + o * 2, i), h = (m + p) / 2, g = 0, _ = p; _ < m; _++) {
				var v = this.getRawIndex(_), y = r[v];
				isNaN(y) || (g += y);
			}
			g /= m - p;
			var b = f, x = Math.min(f + o, i), S = f - 1, C = r[s];
			c = -1, u = b;
			for (var w = -1, T = 0, _ = b; _ < x; _++) {
				var v = this.getRawIndex(_), y = r[v];
				if (isNaN(y)) {
					T++, w < 0 && (w = v);
					continue;
				}
				l = Math.abs((S - h) * (y - C) - (S - _) * (g - C)), l > c && (c = l, u = v);
			}
			T > 0 && T < x - b && (d[a++] = Math.min(w, u), u = Math.max(w, u)), d[a++] = u, s = u;
		}
		return d[a++] = this.getRawIndex(i - 1), n._count = a, n._indices = d, n.getRawIndex = this._getRawIdx, n;
	}, e.prototype.minmaxDownSample = function(e, t) {
		for (var n = this.clone([e], !0), r = n._chunks, i = Math.floor(1 / t), a = r[e], o = this.count(), s = new (mm(this._rawCount))(Math.ceil(o / i) * 2), c = 0, l = 0; l < o; l += i) {
			var u = l, d = a[this.getRawIndex(u)], f = l, p = a[this.getRawIndex(f)], m = i;
			l + i > o && (m = o - l);
			for (var h = 0; h < m; h++) {
				var g = a[this.getRawIndex(l + h)];
				g < d && (d = g, u = l + h), g > p && (p = g, f = l + h);
			}
			var _ = this.getRawIndex(u), v = this.getRawIndex(f);
			u < f ? (s[c++] = _, s[c++] = v) : (s[c++] = v, s[c++] = _);
		}
		return n._count = c, n._indices = s, n._updateGetRawIdx(), n;
	}, e.prototype.downSample = function(e, t, n, r) {
		for (var i = this.clone([e], !0), a = i._chunks, o = [], s = Math.floor(1 / t), c = a[e], l = this.count(), u = i._rawExtent[e] = wc(), d = new (mm(this._rawCount))(Math.ceil(l / s)), f = 0, p = 0; p < l; p += s) {
			s > l - p && (s = l - p, o.length = s);
			for (var m = 0; m < s; m++) {
				var h = this.getRawIndex(p + m);
				o[m] = c[h];
			}
			var g = n(o), _ = this.getRawIndex(Math.min(p + r(o, g) || 0, l - 1));
			c[_] = g, g < u[0] && (u[0] = g), g > u[1] && (u[1] = g), d[f++] = _;
		}
		return i._count = f, i._indices = d, i._updateGetRawIdx(), i;
	}, e.prototype.each = function(e, t) {
		if (this._count) for (var n = e.length, r = this._chunks, i = 0, a = this.count(); i < a; i++) {
			var o = this.getRawIndex(i);
			switch (n) {
				case 0:
					t(i);
					break;
				case 1:
					t(r[e[0]][o], i);
					break;
				case 2:
					t(r[e[0]][o], r[e[1]][o], i);
					break;
				default:
					for (var s = 0, c = []; s < n; s++) c[s] = r[e[s]][o];
					c[s] = i, t.apply(null, c);
			}
		}
	}, e.prototype.getDataExtent = function(e, t) {
		var n = this._chunks[e], r = wc();
		if (!n) return r;
		var i = this.count();
		if (!this._indices && !t) return this._rawExtent[e].slice();
		var a = this._extent, o = a[e] || (a[e] = {}), s = om(t), c = s.key, l = o[c];
		if (l) return l.slice();
		for (var u = r[0], d = r[1], f = 0; f < i; f++) {
			var p = n[this.getRawIndex(f)];
			(!t || sm(s, p)) && (p < u && (u = p), p > d && (d = p));
		}
		return o[c] = [u, d];
	}, e.prototype.getRawDataItem = function(e) {
		var t = this.getRawIndex(e);
		if (this._provider.persistent) return this._provider.getItem(t);
		for (var n = [], r = this._chunks, i = 0; i < r.length; i++) n.push(r[i][t]);
		return n;
	}, e.prototype.clone = function(t, n) {
		var r = new e(), i = this._chunks, a = t && te(t, function(e, t) {
			return e[t] = !0, e;
		}, {});
		if (a) for (var o = 0; o < i.length; o++) r._chunks[o] = a[o] ? hm(i[o]) : i[o];
		else r._chunks = i;
		return this._copyCommonProps(r), n || (r._indices = this._cloneIndices()), r._updateGetRawIdx(), r;
	}, e.prototype._copyCommonProps = function(e) {
		e._count = this._count, e._rawCount = this._rawCount, e._provider = this._provider, e._dimensions = this._dimensions, e._extent = E(this._extent), e._rawExtent = E(this._rawExtent);
	}, e.prototype._cloneIndices = function() {
		if (this._indices) {
			var e = this._indices.constructor, t = void 0;
			if (e === Array) {
				var n = this._indices.length;
				t = new e(n);
				for (var r = 0; r < n; r++) t[r] = this._indices[r];
			} else t = new e(this._indices);
			return t;
		}
		return null;
	}, e.prototype._getRawIdxIdentity = function(e) {
		return e;
	}, e.prototype._getRawIdx = function(e) {
		return e < this._count && e >= 0 ? this._indices[e] : -1;
	}, e.prototype._updateGetRawIdx = function() {
		this.getRawIndex = this._indices ? this._getRawIdx : this._getRawIdxIdentity;
	}, e.internalField = function() {
		function e(e, t, n, r) {
			return rm(e[r], this._dimensions[r]);
		}
		pm = {
			arrayRows: e,
			objectRows: function(e, t, n, r) {
				return rm(e[t], this._dimensions[r]);
			},
			keyedColumns: e,
			original: function(e, t, n, r) {
				var i = e && (e.value == null ? e : e.value);
				return rm(i instanceof Array ? i[r] : i, this._dimensions[r]);
			},
			typedArray: function(e, t, n, r) {
				return e[r];
			}
		};
	}(), e;
}(), vm = X(), ym = {
	float: "f",
	int: "i",
	ordinal: "o",
	number: "n",
	time: "t"
}, bm = function() {
	function e(e) {
		this.dimensions = e.dimensions, this._dimOmitted = e.dimensionOmitted, this.source = e.source, this._fullDimCount = e.fullDimensionCount, this._updateDimOmitted(e.dimensionOmitted);
	}
	return e.prototype.isDimensionOmitted = function() {
		return this._dimOmitted;
	}, e.prototype._updateDimOmitted = function(e) {
		this._dimOmitted = e, e && (this._dimNameMap ||= Cm(this.source));
	}, e.prototype.getSourceDimensionIndex = function(e) {
		return K(this._dimNameMap.get(e), -1);
	}, e.prototype.getSourceDimension = function(e) {
		var t = this.source.dimensionsDefine;
		if (t) return t[e];
	}, e.prototype.makeStoreSchema = function() {
		for (var e = this._fullDimCount, t = jp(this.source), n = !wm(e), r = "", i = [], a = 0, o = 0; a < e; a++) {
			var s = void 0, c = void 0, l = void 0, u = this.dimensions[o];
			if (u && u.storeDimIndex === a) s = t ? u.name : null, c = u.type, l = u.ordinalMeta, o++;
			else {
				var d = this.getSourceDimension(a);
				d && (s = t ? d.name : null, c = d.type);
			}
			i.push({
				property: s,
				type: c,
				ordinalMeta: l
			}), t && s != null && (!u || !u.isCalculationCoord) && (r += n ? s.replace(/\`/g, "`1").replace(/\$/g, "`2") : s), r += "$", r += ym[c] || "f", l && (r += l.uid), r += "$";
		}
		var f = this.source;
		return {
			dimensions: i,
			hash: [
				f.seriesLayoutBy,
				f.startIndex,
				r
			].join("$$")
		};
	}, e.prototype.makeOutputDimensionNames = function() {
		for (var e = [], t = 0, n = 0; t < this._fullDimCount; t++) {
			var r = void 0, i = this.dimensions[n];
			if (i && i.storeDimIndex === t) i.isCalculationCoord || (r = i.name), n++;
			else {
				var a = this.getSourceDimension(t);
				a && (r = a.name);
			}
			e.push(r);
		}
		return e;
	}, e.prototype.appendCalculationDimension = function(e) {
		this.dimensions.push(e), e.isCalculationCoord = !0, this._fullDimCount++, this._updateDimOmitted(!0);
	}, e;
}();
function xm(e) {
	return e instanceof bm;
}
function Sm(e) {
	for (var t = q(), n = 0; n < (e || []).length; n++) {
		var r = e[n], i = G(r) ? r.name : r;
		i != null && t.get(i) == null && t.set(i, n);
	}
	return t;
}
function Cm(e) {
	var t = vm(e);
	return t.dimNameMap ||= Sm(e.dimensionsDefine);
}
function wm(e) {
	return e > 30;
}
//#endregion
//#region node_modules/echarts/lib/data/SeriesData.js
var Tm = G, Em = I, Dm = typeof Int32Array > "u" ? Array : Int32Array, Om = "e\0\0", km = -1, Am = [
	"hasItemOption",
	"_nameList",
	"_idList",
	"_invertedIndicesMap",
	"_dimSummary",
	"userOutput",
	"_rawData",
	"_dimValueGetter",
	"_nameDimIdx",
	"_idDimIdx",
	"_nameRepeatCount"
], jm = ["_approximateExtent"], Mm, Nm, Pm, Fm, Im, Lm, Rm, zm = function() {
	function e(e, t) {
		this.type = "list", this._dimOmitted = !1, this._nameList = [], this._idList = [], this._visual = {}, this._layout = {}, this._itemVisuals = [], this._itemLayouts = [], this._graphicEls = [], this._approximateExtent = {}, this._calculationInfo = {}, this.hasItemOption = !1, this.TRANSFERABLE_METHODS = [
			"cloneShallow",
			"downSample",
			"minmaxDownSample",
			"lttbDownSample",
			"map"
		], this.CHANGABLE_METHODS = ["filterSelf", "selectRange"], this.DOWNSAMPLE_METHODS = [
			"downSample",
			"minmaxDownSample",
			"lttbDownSample"
		];
		var n, r = !1;
		xm(e) ? (n = e.dimensions, this._dimOmitted = e.isDimensionOmitted(), this._schema = e) : (r = !0, n = e), n ||= ["x", "y"];
		for (var i = {}, a = [], o = {}, s = !1, c = {}, l = 0; l < n.length; l++) {
			var u = n[l], d = U(u) ? new nm({ name: u }) : u instanceof nm ? u : new nm(u), f = d.name;
			d.type = d.type || "float", d.coordDim || (d.coordDim = f, d.coordDimIndex = 0);
			var p = d.otherDims = d.otherDims || {};
			a.push(f), i[f] = d, c[f] != null && (s = !0), d.createInvertedIndices && (o[f] = []), r && (d.storeDimIndex = l), p.itemName === 0 && (this._nameDimIdx = d.storeDimIndex), p.itemId === 0 && (this._idDimIdx = d.storeDimIndex);
		}
		if (this.dimensions = a, this._dimInfos = i, this._initGetDimensionInfo(s), this.hostModel = t, this._invertedIndicesMap = o, this._dimOmitted) {
			var m = this._dimIdxToName = q();
			F(a, function(e) {
				m.set(i[e].storeDimIndex, e);
			});
		}
	}
	return e.prototype.getDimension = function(e) {
		var t = this._recognizeDimIndex(e);
		if (t == null) return e;
		if (t = e, !this._dimOmitted) return this.dimensions[t];
		var n = this._dimIdxToName.get(t);
		if (n != null) return n;
		var r = this._schema.getSourceDimension(t);
		if (r) return r.name;
	}, e.prototype.getDimensionIndex = function(e) {
		var t = this._recognizeDimIndex(e);
		if (t != null) return t;
		if (e == null) return -1;
		var n = this._getDimInfo(e);
		return n ? n.storeDimIndex : this._dimOmitted ? this._schema.getSourceDimensionIndex(e) : -1;
	}, e.prototype._recognizeDimIndex = function(e) {
		if (W(e) || e != null && !isNaN(e) && !this._getDimInfo(e) && (!this._dimOmitted || this._schema.getSourceDimensionIndex(e) < 0)) return +e;
	}, e.prototype._getStoreDimIndex = function(e) {
		return this.getDimensionIndex(e);
	}, e.prototype.getDimensionInfo = function(e) {
		return this._getDimInfo(this.getDimension(e));
	}, e.prototype._initGetDimensionInfo = function(e) {
		var t = this._dimInfos;
		this._getDimInfo = e ? function(e) {
			return t.hasOwnProperty(e) ? t[e] : void 0;
		} : function(e) {
			return t[e];
		};
	}, e.prototype.getDimensionsOnCoord = function() {
		return this._dimSummary.dataDimsOnCoord.slice();
	}, e.prototype.mapDimension = function(e, t) {
		var n = this._dimSummary;
		if (t == null) return n.encodeFirstDimNotExtra[e];
		var r = n.encode[e];
		return r ? r[t] : null;
	}, e.prototype.mapDimensionsAll = function(e) {
		return (this._dimSummary.encode[e] || []).slice();
	}, e.prototype.getStore = function() {
		return this._store;
	}, e.prototype.initData = function(e, t, n) {
		var r = this, i;
		if (e instanceof _m && (i = e), !i) {
			var a = this.dimensions, o = Sp(e) || P(e) ? new Rp(e, a.length) : e;
			i = new _m();
			var s = Em(a, function(e) {
				return {
					type: r._dimInfos[e].type,
					property: e
				};
			});
			i.initData(o, s, n);
		}
		this._store = i, this._nameList = (t || []).slice(), this._idList = [], this._nameRepeatCount = {}, this._doInit(0, i.count()), this._dimSummary = Qp(this, this._schema), this.userOutput = this._dimSummary.userOutput;
	}, e.prototype.appendData = function(e) {
		var t = this._store.appendData(e);
		this._doInit(t[0], t[1]);
	}, e.prototype.appendValues = function(e, t) {
		var n = this._store.appendValues(e, t && t.length), r = n.start, i = n.end, a = this._shouldMakeIdFromName();
		if (this._updateOrdinalMeta(), t) for (var o = r; o < i; o++) {
			var s = o - r;
			this._nameList[o] = t[s], a && Rm(this, o);
		}
	}, e.prototype._updateOrdinalMeta = function() {
		for (var e = this._store, t = this.dimensions, n = 0; n < t.length; n++) {
			var r = this._dimInfos[t[n]];
			r.ordinalMeta && e.collectOrdinalMeta(r.storeDimIndex, r.ordinalMeta);
		}
	}, e.prototype._shouldMakeIdFromName = function() {
		var e = this._store.getProvider();
		return this._idDimIdx == null && e.getSource().sourceFormat !== "typedArray" && !e.fillStorage;
	}, e.prototype._doInit = function(e, t) {
		if (!(e >= t)) {
			var n = this._store.getProvider();
			this._updateOrdinalMeta();
			var r = this._nameList, i = this._idList;
			if (n.getSource().sourceFormat === "original" && !n.pure) for (var a = [], o = e; o < t; o++) {
				var s = n.getItem(o, a);
				if (!this.hasItemOption && Zs(s) && (this.hasItemOption = !0), s) {
					var c = s.name;
					r[o] == null && c != null && (r[o] = sc(c, null));
					var l = s.id;
					i[o] == null && l != null && (i[o] = sc(l, null));
				}
			}
			if (this._shouldMakeIdFromName()) for (var o = e; o < t; o++) Rm(this, o);
			Mm(this);
		}
	}, e.prototype.getApproximateExtent = function(e, t) {
		return this._approximateExtent[e] || this._store.getDataExtent(this._getStoreDimIndex(e), t);
	}, e.prototype.setApproximateExtent = function(e, t) {
		t = this.getDimension(t), this._approximateExtent[t] = e.slice();
	}, e.prototype.getCalculationInfo = function(e) {
		return this._calculationInfo[e];
	}, e.prototype.setCalculationInfo = function(e, t) {
		Tm(e) ? k(this._calculationInfo, e) : this._calculationInfo[e] = t;
	}, e.prototype.getName = function(e) {
		var t = this.getRawIndex(e), n = this._nameList[t];
		return n == null && this._nameDimIdx != null && (n = Pm(this, this._nameDimIdx, t)), n ??= "", n;
	}, e.prototype._getCategory = function(e, t) {
		var n = this._store.get(e, t), r = this._store.getOrdinalMeta(e);
		return r ? r.categories[n] : n;
	}, e.prototype.getId = function(e) {
		return Nm(this, this.getRawIndex(e));
	}, e.prototype.count = function() {
		return this._store.count();
	}, e.prototype.get = function(e, t) {
		var n = this._store, r = this._dimInfos[e];
		if (r) return n.get(r.storeDimIndex, t);
	}, e.prototype.getByRawIndex = function(e, t) {
		var n = this._store, r = this._dimInfos[e];
		if (r) return n.getByRawIndex(r.storeDimIndex, t);
	}, e.prototype.getIndices = function() {
		return this._store.getIndices();
	}, e.prototype.getDataExtent = function(e) {
		return this._store.getDataExtent(this._getStoreDimIndex(e), null);
	}, e.prototype.getSum = function(e) {
		return this._store.getSum(this._getStoreDimIndex(e));
	}, e.prototype.getMedian = function(e) {
		return this._store.getMedian(this._getStoreDimIndex(e));
	}, e.prototype.getValues = function(e, t) {
		var n = this, r = this._store;
		return V(e) ? r.getValues(Em(e, function(e) {
			return n._getStoreDimIndex(e);
		}), t) : r.getValues(e);
	}, e.prototype.hasValue = function(e) {
		for (var t = this._dimSummary.dataDimIndicesOnCoord, n = 0, r = t.length; n < r; n++) if (isNaN(this._store.get(t[n], e))) return !1;
		return !0;
	}, e.prototype.indexOfName = function(e) {
		for (var t = 0, n = this._store.count(); t < n; t++) if (this.getName(t) === e) return t;
		return -1;
	}, e.prototype.getRawIndex = function(e) {
		return this._store.getRawIndex(e);
	}, e.prototype.indexOfRawIndex = function(e) {
		return this._store.indexOfRawIndex(e);
	}, e.prototype.rawIndexOf = function(e, t) {
		var n = e && this._invertedIndicesMap[e], r = n && n[t];
		return r == null || isNaN(r) ? km : r;
	}, e.prototype.each = function(e, t, n) {
		H(e) && (n = t, t = e, e = []);
		var r = n || this, i = Em(Fm(e), this._getStoreDimIndex, this);
		this._store.each(i, r ? z(t, r) : t);
	}, e.prototype.filterSelf = function(e, t, n) {
		H(e) && (n = t, t = e, e = []);
		var r = n || this, i = Em(Fm(e), this._getStoreDimIndex, this);
		return this._store = this._store.filter(i, r ? z(t, r) : t), this;
	}, e.prototype.selectRange = function(e) {
		var t = this, n = {}, r = R(e), i = [];
		return F(r, function(r) {
			var a = t._getStoreDimIndex(r);
			n[a] = e[r], i.push(a);
		}), this._store = this._store.selectRange(n), this;
	}, e.prototype.mapArray = function(e, t, n) {
		H(e) && (n = t, t = e, e = []), n ||= this;
		var r = [];
		return this.each(e, function() {
			r.push(t && t.apply(this, arguments));
		}, n), r;
	}, e.prototype.map = function(e, t, n, r) {
		var i = n || r || this, a = Em(Fm(e), this._getStoreDimIndex, this), o = Lm(this);
		return o._store = this._store.map(a, i ? z(t, i) : t), o;
	}, e.prototype.modify = function(e, t, n, r) {
		var i = n || r || this, a = Em(Fm(e), this._getStoreDimIndex, this);
		this._store.modify(a, i ? z(t, i) : t);
	}, e.prototype.downSample = function(e, t, n, r) {
		var i = Lm(this);
		return i._store = this._store.downSample(this._getStoreDimIndex(e), t, n, r), i;
	}, e.prototype.minmaxDownSample = function(e, t) {
		var n = Lm(this);
		return n._store = this._store.minmaxDownSample(this._getStoreDimIndex(e), t), n;
	}, e.prototype.lttbDownSample = function(e, t) {
		var n = Lm(this);
		return n._store = this._store.lttbDownSample(this._getStoreDimIndex(e), t), n;
	}, e.prototype.getRawDataItem = function(e) {
		return this._store.getRawDataItem(e);
	}, e.prototype.getItemModel = function(e) {
		var t = this.hostModel;
		return new lp(this.getRawDataItem(e), t, t && t.ecModel);
	}, e.prototype.diff = function(e) {
		var t = this;
		return new fp(e ? e.getStore().getIndices() : [], this.getStore().getIndices(), function(t) {
			return Nm(e, t);
		}, function(e) {
			return Nm(t, e);
		});
	}, e.prototype.getVisual = function(e) {
		var t = this._visual;
		return t && t[e];
	}, e.prototype.setVisual = function(e, t) {
		this._visual = this._visual || {}, Tm(e) ? k(this._visual, e) : this._visual[e] = t;
	}, e.prototype.getItemVisual = function(e, t) {
		var n = this._itemVisuals[e];
		return (n && n[t]) ?? this.getVisual(t);
	}, e.prototype.hasItemVisual = function() {
		return this._itemVisuals.length > 0;
	}, e.prototype.ensureUniqueItemVisual = function(e, t) {
		var n = this._itemVisuals, r = n[e];
		r ||= n[e] = {};
		var i = r[t];
		return i ?? (i = this.getVisual(t), V(i) ? i = i.slice() : Tm(i) && (i = k({}, i)), r[t] = i), i;
	}, e.prototype.setItemVisual = function(e, t, n) {
		var r = this._itemVisuals[e] || {};
		this._itemVisuals[e] = r, Tm(t) ? k(r, t) : r[t] = n;
	}, e.prototype.clearAllVisual = function() {
		this._visual = {}, this._itemVisuals = [];
	}, e.prototype.setLayout = function(e, t) {
		Tm(e) ? k(this._layout, e) : this._layout[e] = t;
	}, e.prototype.getLayout = function(e) {
		return this._layout[e];
	}, e.prototype.getItemLayout = function(e) {
		return this._itemLayouts[e];
	}, e.prototype.setItemLayout = function(e, t, n) {
		this._itemLayouts[e] = n ? k(this._itemLayouts[e] || {}, t) : t;
	}, e.prototype.clearItemLayouts = function() {
		this._itemLayouts.length = 0;
	}, e.prototype.setItemGraphicEl = function(e, t) {
		Hc(this.hostModel && this.hostModel.seriesIndex, this.dataType, e, t), this._graphicEls[e] = t;
	}, e.prototype.getItemGraphicEl = function(e) {
		return this._graphicEls[e];
	}, e.prototype.eachItemGraphicEl = function(e, t) {
		F(this._graphicEls, function(n, r) {
			n && e && e.call(t, n, r);
		});
	}, e.prototype.cloneShallow = function(t) {
		return t ||= new e(this._schema ? this._schema : Em(this.dimensions, this._getDimInfo, this), this.hostModel), Im(t, this), t._store = this._store, t;
	}, e.prototype.wrapMethod = function(e, t) {
		var n = this[e];
		H(n) && (this.__wrappedMethods = this.__wrappedMethods || [], this.__wrappedMethods.push(e), this[e] = function() {
			var e = n.apply(this, arguments);
			return t.apply(this, [e].concat(fe(arguments)));
		});
	}, e.internalField = function() {
		Mm = function(e) {
			var t = e._invertedIndicesMap;
			F(t, function(n, r) {
				var i = e._dimInfos[r], a = i.ordinalMeta, o = e._store;
				if (a) {
					n = t[r] = new Dm(a.categories.length);
					for (var s = 0; s < n.length; s++) n[s] = km;
					for (var s = 0; s < o.count(); s++) n[o.get(i.storeDimIndex, s)] = s;
				}
			});
		}, Pm = function(e, t, n) {
			return sc(e._getCategory(t, n), null);
		}, Nm = function(e, t) {
			var n = e._idList[t];
			return n == null && e._idDimIdx != null && (n = Pm(e, e._idDimIdx, t)), n ??= Om + t, n;
		}, Fm = function(e) {
			return V(e) || (e = e == null ? [] : [e]), e;
		}, Lm = function(t) {
			var n = new e(t._schema ? t._schema : Em(t.dimensions, t._getDimInfo, t), t.hostModel);
			return Im(n, t), n;
		}, Im = function(e, t) {
			F(Am.concat(t.__wrappedMethods || []), function(n) {
				t.hasOwnProperty(n) && (e[n] = t[n]);
			}), e.__wrappedMethods = t.__wrappedMethods, F(jm, function(n) {
				e[n] = E(t[n]);
			}), e._calculationInfo = k({}, t._calculationInfo);
		}, Rm = function(e, t) {
			var n = e._nameList, r = e._idList, i = e._nameDimIdx, a = e._idDimIdx, o = n[t], s = r[t];
			if (o == null && i != null && (n[t] = o = Pm(e, i, t)), s == null && a != null && (r[t] = s = Pm(e, a, t)), s == null && o != null) {
				var c = e._nameRepeatCount, l = c[o] = (c[o] || 0) + 1;
				s = o, l > 1 && (s += "__ec__" + l), r[t] = s;
			}
		};
	}(), e;
}();
//#endregion
//#region node_modules/echarts/lib/data/helper/createDimensions.js
function Bm(e, t) {
	Sp(e) || (e = wp(e)), t ||= {};
	var n = t.coordDimensions || [], r = t.dimensionsDefine || e.dimensionsDefine || [], i = q(), a = [], o = Vm(e, n, r, t.dimensionsCount), s = t.canOmitUnusedDimensions && wm(o), c = r === e.dimensionsDefine, l = c ? Cm(e) : Sm(r), u = t.encodeDefine;
	!u && t.encodeDefaulter && (u = t.encodeDefaulter(e, o));
	for (var d = q(u), f = new um(o), p = 0; p < f.length; p++) f[p] = -1;
	function m(e) {
		var t = f[e];
		if (t < 0) {
			var n = r[e], i = G(n) ? n : { name: n }, o = new nm(), s = i.name;
			return s != null && l.get(s) != null && (o.name = o.displayName = s), i.type != null && (o.type = i.type), i.displayName != null && (o.displayName = i.displayName), f[e] = a.length, o.storeDimIndex = e, a.push(o), o;
		}
		return a[t];
	}
	if (!s) for (var p = 0; p < o; p++) m(p);
	d.each(function(e, t) {
		var n = qs(e).slice();
		if (n.length === 1 && !U(n[0]) && n[0] < 0) {
			d.set(t, !1);
			return;
		}
		var r = d.set(t, []);
		F(n, function(e, n) {
			var i = U(e) ? l.get(e) : e;
			i != null && i < o && (r[n] = i, g(m(i), t, n));
		});
	});
	var h = 0;
	F(n, function(e) {
		var t, n, r, i;
		if (U(e)) t = e, i = {};
		else {
			i = e, t = i.name;
			var a = i.ordinalMeta;
			i.ordinalMeta = null, i = k({}, i), i.ordinalMeta = a, n = i.dimsDef, r = i.otherDims, i.name = i.coordDim = i.coordDimIndex = i.dimsDef = i.otherDims = null;
		}
		var s = d.get(t);
		if (s !== !1) {
			if (s = qs(s), !s.length) for (var l = 0; l < (n && n.length || 1); l++) {
				for (; h < o && m(h).coordDim != null;) h++;
				h < o && s.push(h++);
			}
			F(s, function(e, a) {
				var o = m(e);
				if (c && i.type != null && (o.type = i.type), g(j(o, i), t, a), o.name == null && n) {
					var s = n[a];
					!G(s) && (s = { name: s }), o.name = o.displayName = s.name, o.defaultTooltip = s.defaultTooltip;
				}
				r && j(o.otherDims, r);
			});
		}
	});
	function g(e, t, n) {
		Wc.get(t) == null ? (e.coordDim = t, e.coordDimIndex = n, i.set(t, !0)) : e.otherDims[t] = n;
	}
	var _ = t.generateCoord, v = t.generateCoordCount, y = v != null;
	v = _ ? v || 1 : 0;
	var b = _ || "value";
	function x(e) {
		e.name ??= e.coordDim;
	}
	if (s) F(a, function(e) {
		x(e);
	}), a.sort(function(e, t) {
		return e.storeDimIndex - t.storeDimIndex;
	});
	else for (var S = 0; S < o; S++) {
		var C = m(S);
		C.coordDim ?? (C.coordDim = Hm(b, i, y), C.coordDimIndex = 0, (!_ || v <= 0) && (C.isExtraCoord = !0), v--), x(C), C.type == null && (yp(e, S) === pp.Must || C.isExtraCoord && (C.otherDims.itemName != null || C.otherDims.seriesName != null)) && (C.type = "ordinal");
	}
	return Fc(a, function(e) {
		return e.name;
	}, function(e, t) {
		t > 0 && (e.name += t - 1);
	}), new bm({
		source: e,
		dimensions: a,
		fullDimensionCount: o,
		dimensionOmitted: s
	});
}
function Vm(e, t, n, r) {
	var i = Math.max(e.dimensionsDetectedCount || 1, t.length, n.length, r || 0);
	return F(t, function(e) {
		var t;
		G(e) && (t = e.dimsDef) && (i = Math.max(i, t.length));
	}), i;
}
function Hm(e, t, n) {
	if (n || t.hasKey(e)) {
		for (var r = 0; t.hasKey(e + r);) r++;
		e += r;
	}
	return t.set(e, !0), e;
}
//#endregion
//#region node_modules/echarts/lib/core/CoordinateSystem.js
var Um = {}, Wm = {}, Gm = function() {
	function e() {
		this._normalMasterList = [], this._nonSeriesBoxMasterList = [];
	}
	return e.prototype.create = function(e, t) {
		this._nonSeriesBoxMasterList = n(Um, !0), this._normalMasterList = n(Wm, !1);
		function n(n, r) {
			var i = [];
			return F(n, function(n, r) {
				var a = n.create(e, t);
				i = i.concat(a || []);
			}), i;
		}
	}, e.prototype.update = function(e, t) {
		F(this._normalMasterList, function(n) {
			n.update && n.update(e, t);
		});
	}, e.prototype.getCoordinateSystems = function() {
		return this._normalMasterList.concat(this._nonSeriesBoxMasterList);
	}, e.register = function(e, t) {
		if (e === "matrix" || e === "calendar") {
			Um[e] = t;
			return;
		}
		Wm[e] = t;
	}, e.get = function(e) {
		return Wm[e] || Um[e];
	}, e;
}();
function Km(e) {
	return !!Um[e];
}
var qm = q();
function Jm(e) {
	var t = e.getShallow("coord", !0), n = 1;
	if (t == null) {
		var r = qm.get(e.type);
		r && r.getCoord2 && (n = 2, t = r.getCoord2(e));
	}
	return {
		coord: t,
		from: n
	};
}
function Ym(e, t) {
	var n = e.getShallow("coordinateSystem"), r = e.getShallow("coordinateSystemUsage", !0), i = 0;
	if (n) {
		var a = e.mainType === "series";
		r ??= a ? "data" : "box", r === "data" ? (i = 1, a || (i = 0)) : r === "box" && (i = 2, !a && !Km(n) && (i = 0));
	}
	return {
		coordSysType: n,
		kind: i
	};
}
function Xm(e) {
	var t = e.targetModel, n = e.coordSysType, r = e.coordSysProvider, i = e.isDefaultDataCoordSys;
	e.allowNotFound;
	var a = Ym(t, !0), o = a.kind, s = a.coordSysType;
	if (i && o !== 1 && (o = 1, s = n), o === 0 || s !== n) return 0;
	var c = r(n, t);
	return c ? (o === 1 ? t.coordinateSystem = c : t.boxCoordinateSystem = c, o) : 0;
}
//#endregion
//#region node_modules/echarts/lib/model/referHelper.js
var Zm = function() {
	function e(e) {
		this.coordSysDims = [], this.axisMap = q(), this.categoryAxisMap = q(), this.coordSysName = e;
	}
	return e;
}();
function Qm(e) {
	var t = e.get("coordinateSystem"), n = new Zm(t), r = $m[t];
	if (r) return r(e, n, n.axisMap, n.categoryAxisMap), n;
}
var $m = {
	cartesian2d: function(e, t, n, r) {
		var i = e.getReferringComponents("xAxis", gc).models[0], a = e.getReferringComponents("yAxis", gc).models[0];
		t.coordSysDims = ["x", "y"], n.set("x", i), n.set("y", a), eh(i) && (r.set("x", i), t.firstCategoryDimIndex = 0), eh(a) && (r.set("y", a), t.firstCategoryDimIndex ??= 1);
	},
	singleAxis: function(e, t, n, r) {
		var i = e.getReferringComponents("singleAxis", gc).models[0];
		t.coordSysDims = ["single"], n.set("single", i), eh(i) && (r.set("single", i), t.firstCategoryDimIndex = 0);
	},
	polar: function(e, t, n, r) {
		var i = e.getReferringComponents("polar", gc).models[0], a = i.findAxisModel("radiusAxis"), o = i.findAxisModel("angleAxis");
		t.coordSysDims = ["radius", "angle"], n.set("radius", a), n.set("angle", o), eh(a) && (r.set("radius", a), t.firstCategoryDimIndex = 0), eh(o) && (r.set("angle", o), t.firstCategoryDimIndex ??= 1);
	},
	geo: function(e, t, n, r) {
		t.coordSysDims = ["lng", "lat"];
	},
	parallel: function(e, t, n, r) {
		var i = e.ecModel, a = i.getComponent("parallel", e.get("parallelIndex")), o = t.coordSysDims = a.dimensions.slice();
		F(a.parallelAxisIndex, function(e, a) {
			var s = i.getComponent("parallelAxis", e), c = o[a];
			n.set(c, s), eh(s) && (r.set(c, s), t.firstCategoryDimIndex ??= a);
		});
	},
	matrix: function(e, t, n, r) {
		var i = e.getReferringComponents("matrix", gc).models[0];
		t.coordSysDims = ["x", "y"];
		var a = i.getDimensionModel("x"), o = i.getDimensionModel("y");
		n.set("x", a), n.set("y", o), r.set("x", a), r.set("y", o);
	}
};
function eh(e) {
	return e.get("type") === "category";
}
//#endregion
//#region node_modules/echarts/lib/data/helper/dataStackHelper.js
function th(e, t, n) {
	n ||= {};
	var r = n.byIndex, i = n.stackedCoordDimension, a, o, s;
	nh(t) ? a = t : (o = t.schema, a = o.dimensions, s = t.store);
	var c = !!(e && e.get("stack")), l, u, d, f, p = !0;
	function m(e) {
		return e.type !== "ordinal" && e.type !== "time";
	}
	if (F(a, function(e, t) {
		U(e) && (a[t] = e = { name: e }), m(e) || (p = !1);
	}), F(a, function(e, t) {
		c && !e.isExtraCoord && (!r && !l && e.ordinalMeta && (l = e), !u && m(e) && (!p || e.coordDim !== "x" && e.coordDim !== "angle") && (!i || i === e.coordDim) && (u = e));
	}), u && !r && !l && (r = !0), u) {
		d = "__\0ecstackresult_" + e.id, f = "__\0ecstackedover_" + e.id, l && (l.createInvertedIndices = !0);
		var h = u.coordDim, g = u.type, _ = 0;
		F(a, function(e) {
			e.coordDim === h && _++;
		});
		var v = {
			name: d,
			coordDim: h,
			coordDimIndex: _,
			type: g,
			isExtraCoord: !0,
			isCalculationCoord: !0,
			storeDimIndex: a.length
		}, y = {
			name: f,
			coordDim: f,
			coordDimIndex: _ + 1,
			type: g,
			isExtraCoord: !0,
			isCalculationCoord: !0,
			storeDimIndex: a.length + 1
		};
		o ? (s && (v.storeDimIndex = s.ensureCalculationDimension(f, g), y.storeDimIndex = s.ensureCalculationDimension(d, g)), o.appendCalculationDimension(v), o.appendCalculationDimension(y)) : (a.push(v), a.push(y));
	}
	return {
		stackedDimension: u && u.name,
		stackedByDimension: l && l.name,
		isStackedByIndex: r,
		stackedOverDimension: f,
		stackResultDimension: d
	};
}
function nh(e) {
	return !xm(e.schema);
}
function rh(e, t) {
	return !!t && t === e.getCalculationInfo("stackedDimension");
}
function ih(e, t) {
	return rh(e, t) ? e.getCalculationInfo("stackResultDimension") : t;
}
//#endregion
//#region node_modules/echarts/lib/chart/helper/createSeriesData.js
function ah(e, t) {
	var n = e.get("coordinateSystem"), r = Gm.get(n), i;
	return t && t.coordSysDims && (i = I(t.coordSysDims, function(e) {
		var n = { name: e }, r = t.axisMap.get(e);
		return r && (n.type = em(r.get("type"))), n;
	})), i ||= r && (r.getDimensionsInfo ? r.getDimensionsInfo() : r.dimensions.slice()) || ["x", "y"], i;
}
function oh(e, t, n) {
	var r, i;
	return n && F(e, function(e, a) {
		var o = e.coordDim, s = n.categoryAxisMap.get(o);
		s && (r ??= a, e.ordinalMeta = s.getOrdinalMeta(), t && (e.createInvertedIndices = !0)), e.otherDims.itemName != null && (i = !0);
	}), !i && r != null && (e[r].otherDims.itemName = 0), r;
}
function sh(e, t, n) {
	n ||= {};
	var r = t.getSourceManager(), i, a = !1;
	e ? (a = !0, i = wp(e)) : (i = r.getSource(), a = i.sourceFormat === Gc);
	var o = Qm(t), s = ah(t, o), c = n.useEncodeDefaulter, l = H(c) ? c : c ? B(gp, s, t) : null, u = {
		coordDimensions: s,
		generateCoord: n.generateCoord,
		encodeDefine: t.getEncode(),
		encodeDefaulter: l,
		canOmitUnusedDimensions: !a
	}, d = Bm(i, u), f = oh(d.dimensions, n.createInvertedIndices, o), p = a ? null : r.getSharedDataStore(d), m = th(t, {
		schema: d,
		store: p
	}), h = new zm(d, t);
	h.setCalculationInfo(m);
	var g = f != null && ch(i) ? function(e, t, n, r) {
		return r === f ? n : this.defaultDimValueGetter(e, t, n, r);
	} : null;
	return h.hasItemOption = !1, h.initData(a ? i : p, null, g), h;
}
function ch(e) {
	if (e.sourceFormat === "original") return !V(Xs(lh(e.data || [])));
}
function lh(e) {
	for (var t = 0; t < e.length && e[t] == null;) t++;
	return e[t];
}
//#endregion
//#region node_modules/echarts/lib/util/component.js
var uh = Math.round(Math.random() * 10);
function dh(e) {
	return [e || "", uh++].join("_");
}
function fh(e) {
	var t = {};
	e.registerSubTypeDefaulter = function(e, n) {
		var r = Ne(e);
		t[r.main] = n;
	}, e.determineSubType = function(n, r) {
		var i = r.type;
		if (!i) {
			var a = Ne(n).main;
			e.hasSubTypes(n) && t[a] && (i = t[a](r));
		}
		return i;
	};
}
function ph(e, t) {
	e.topologicalTravel = function(e, t, r, i) {
		if (!e.length) return;
		var a = n(t), o = a.graph, s = a.noEntryList, c = {};
		for (F(e, function(e) {
			c[e] = !0;
		}); s.length;) {
			var l = s.pop(), u = o[l], d = !!c[l];
			d && (r.call(i, l, u.originalDeps.slice()), delete c[l]), F(u.successor, d ? p : f);
		}
		F(c, function() {
			throw Error("");
		});
		function f(e) {
			o[e].entryCount--, o[e].entryCount === 0 && s.push(e);
		}
		function p(e) {
			c[e] = !0, f(e);
		}
	};
	function n(e) {
		var n = {}, a = [];
		return F(e, function(o) {
			var s = r(n, o), c = i(s.originalDeps = t(o), e);
			s.entryCount = c.length, s.entryCount === 0 && a.push(o), F(c, function(e) {
				M(s.predecessor, e) < 0 && s.predecessor.push(e);
				var t = r(n, e);
				M(t.successor, e) < 0 && t.successor.push(o);
			});
		}), {
			graph: n,
			noEntryList: a
		};
	}
	function r(e, t) {
		return e[t] || (e[t] = {
			predecessor: [],
			successor: []
		}), e[t];
	}
	function i(e, t) {
		var n = [];
		return F(e, function(e) {
			M(t, e) >= 0 && n.push(e);
		}), n;
	}
}
function mh(e, t) {
	return D(D({}, e, !0), t, !0);
}
//#endregion
//#region node_modules/zrender/lib/core/fourPointsTransform.js
var hh = Math.log(2);
function gh(e, t, n, r, i, a) {
	var o = r + "-" + i, s = e.length;
	if (a.hasOwnProperty(o)) return a[o];
	if (t === 1) {
		var c = Math.round(Math.log((1 << s) - 1 & ~i) / hh);
		return e[n][c];
	}
	for (var l = r | 1 << n, u = n + 1; r & 1 << u;) u++;
	for (var d = 0, f = 0, p = 0; f < s; f++) {
		var m = 1 << f;
		m & i || (d += (p % 2 ? -1 : 1) * e[n][f] * gh(e, t - 1, u, l, i | m, a), p++);
	}
	return a[o] = d, d;
}
function _h(e, t) {
	var n = [
		[
			e[0],
			e[1],
			1,
			0,
			0,
			0,
			-t[0] * e[0],
			-t[0] * e[1]
		],
		[
			0,
			0,
			0,
			e[0],
			e[1],
			1,
			-t[1] * e[0],
			-t[1] * e[1]
		],
		[
			e[2],
			e[3],
			1,
			0,
			0,
			0,
			-t[2] * e[2],
			-t[2] * e[3]
		],
		[
			0,
			0,
			0,
			e[2],
			e[3],
			1,
			-t[3] * e[2],
			-t[3] * e[3]
		],
		[
			e[4],
			e[5],
			1,
			0,
			0,
			0,
			-t[4] * e[4],
			-t[4] * e[5]
		],
		[
			0,
			0,
			0,
			e[4],
			e[5],
			1,
			-t[5] * e[4],
			-t[5] * e[5]
		],
		[
			e[6],
			e[7],
			1,
			0,
			0,
			0,
			-t[6] * e[6],
			-t[6] * e[7]
		],
		[
			0,
			0,
			0,
			e[6],
			e[7],
			1,
			-t[7] * e[6],
			-t[7] * e[7]
		]
	], r = {}, i = gh(n, 8, 0, 0, 0, r);
	if (i !== 0) {
		for (var a = [], o = 0; o < 8; o++) for (var s = 0; s < 8; s++) a[s] ?? (a[s] = 0), a[s] += ((o + s) % 2 ? -1 : 1) * gh(n, 7, +(o === 0), 1 << o, 1 << s, r) / i * t[o];
		return function(e, t, n) {
			var r = t * a[6] + n * a[7] + 1;
			e[0] = (t * a[0] + n * a[1] + a[2]) / r, e[1] = (t * a[3] + n * a[4] + a[5]) / r;
		};
	}
}
//#endregion
//#region node_modules/zrender/lib/core/dom.js
var vh = "___zrEVENTSAVED", yh = [];
function bh(e, t, n, r, i) {
	return Sh(yh, t, r, i, !0) && Sh(e, n, yh[0], yh[1]);
}
function xh(e, t) {
	e && n(e), t && n(t);
	function n(e) {
		var t = e[vh];
		t && (t.clearMarkers && t.clearMarkers(), delete e[vh]);
	}
}
function Sh(e, t, n, r, i) {
	if (t.getBoundingClientRect && J.domSupported && !Th(t)) {
		var a = t[vh] || (t[vh] = {}), o = wh(Ch(t, a), a, i);
		if (o) return o(e, n, r), !0;
	}
	return !1;
}
function Ch(e, t) {
	var n = t.markers;
	if (n) return n;
	n = t.markers = [];
	for (var r = ["left", "right"], i = ["top", "bottom"], a = 0; a < 4; a++) {
		var o = document.createElement("div"), s = o.style, c = a % 2, l = (a >> 1) % 2;
		s.cssText = [
			"position: absolute",
			"visibility: hidden",
			"padding: 0",
			"margin: 0",
			"border-width: 0",
			"user-select: none",
			"width:0",
			"height:0",
			r[c] + ":0",
			i[l] + ":0",
			r[1 - c] + ":auto",
			i[1 - l] + ":auto",
			""
		].join("!important;"), e.appendChild(o), n.push(o);
	}
	return t.clearMarkers = function() {
		F(n, function(e) {
			e.parentNode && e.parentNode.removeChild(e);
		});
	}, n;
}
function wh(e, t, n) {
	for (var r = n ? "invTrans" : "trans", i = t[r], a = t.srcCoords, o = [], s = [], c = !0, l = 0; l < 4; l++) {
		var u = e[l].getBoundingClientRect(), d = 2 * l, f = u.left, p = u.top;
		o.push(f, p), c = c && a && f === a[d] && p === a[d + 1], s.push(e[l].offsetLeft, e[l].offsetTop);
	}
	return c && i ? i : (t.srcCoords = o, t[r] = n ? _h(s, o) : _h(o, s));
}
function Th(e) {
	return e.nodeName.toUpperCase() === "CANVAS";
}
var Eh = /([&<>"'])/g, Dh = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
function Oh(e) {
	return e == null ? "" : (e + "").replace(Eh, function(e, t) {
		return Dh[t];
	});
}
//#endregion
//#region node_modules/echarts/lib/i18n/langEN.js
var kh = {
	time: {
		month: [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December"
		],
		monthAbbr: [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec"
		],
		dayOfWeek: [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday"
		],
		dayOfWeekAbbr: [
			"Sun",
			"Mon",
			"Tue",
			"Wed",
			"Thu",
			"Fri",
			"Sat"
		]
	},
	legend: { selector: {
		all: "All",
		inverse: "Inv"
	} },
	toolbox: {
		brush: { title: {
			rect: "Box Select",
			polygon: "Lasso Select",
			lineX: "Horizontally Select",
			lineY: "Vertically Select",
			keep: "Keep Selections",
			clear: "Clear Selections"
		} },
		dataView: {
			title: "Data View",
			lang: [
				"Data View",
				"Close",
				"Refresh"
			]
		},
		dataZoom: { title: {
			zoom: "Zoom",
			back: "Zoom Reset"
		} },
		magicType: { title: {
			line: "Switch to Line Chart",
			bar: "Switch to Bar Chart",
			stack: "Stack",
			tiled: "Tile"
		} },
		restore: { title: "Restore" },
		saveAsImage: {
			title: "Save as Image",
			lang: ["Right Click to Save Image"]
		}
	},
	series: { typeNames: {
		pie: "Pie chart",
		bar: "Bar chart",
		line: "Line chart",
		scatter: "Scatter plot",
		effectScatter: "Ripple scatter plot",
		radar: "Radar chart",
		tree: "Tree",
		treemap: "Treemap",
		boxplot: "Boxplot",
		candlestick: "Candlestick",
		k: "K line chart",
		heatmap: "Heat map",
		map: "Map",
		parallel: "Parallel coordinate map",
		lines: "Line graph",
		graph: "Relationship graph",
		sankey: "Sankey diagram",
		funnel: "Funnel chart",
		gauge: "Gauge",
		pictorialBar: "Pictorial bar",
		themeRiver: "Theme River Map",
		sunburst: "Sunburst",
		custom: "Custom chart",
		chart: "Chart"
	} },
	aria: {
		general: {
			withTitle: "This is a chart about \"{title}\"",
			withoutTitle: "This is a chart"
		},
		series: {
			single: {
				prefix: "",
				withName: " with type {seriesType} named {seriesName}.",
				withoutName: " with type {seriesType}."
			},
			multiple: {
				prefix: ". It consists of {seriesCount} series count.",
				withName: " The {seriesId} series is a {seriesType} representing {seriesName}.",
				withoutName: " The {seriesId} series is a {seriesType}.",
				separator: {
					middle: "",
					end: ""
				}
			}
		},
		data: {
			allData: "The data is as follows: ",
			partialData: "The first {displayCnt} items are: ",
			withName: "the data for {name} is {value}",
			withoutName: "{value}",
			separator: {
				middle: ", ",
				end: ". "
			}
		}
	}
}, Ah = {
	time: {
		month: [
			"一月",
			"二月",
			"三月",
			"四月",
			"五月",
			"六月",
			"七月",
			"八月",
			"九月",
			"十月",
			"十一月",
			"十二月"
		],
		monthAbbr: [
			"1月",
			"2月",
			"3月",
			"4月",
			"5月",
			"6月",
			"7月",
			"8月",
			"9月",
			"10月",
			"11月",
			"12月"
		],
		dayOfWeek: [
			"星期日",
			"星期一",
			"星期二",
			"星期三",
			"星期四",
			"星期五",
			"星期六"
		],
		dayOfWeekAbbr: [
			"日",
			"一",
			"二",
			"三",
			"四",
			"五",
			"六"
		]
	},
	legend: { selector: {
		all: "全选",
		inverse: "反选"
	} },
	toolbox: {
		brush: { title: {
			rect: "矩形选择",
			polygon: "圈选",
			lineX: "横向选择",
			lineY: "纵向选择",
			keep: "保持选择",
			clear: "清除选择"
		} },
		dataView: {
			title: "数据视图",
			lang: [
				"数据视图",
				"关闭",
				"刷新"
			]
		},
		dataZoom: { title: {
			zoom: "区域缩放",
			back: "区域缩放还原"
		} },
		magicType: { title: {
			line: "切换为折线图",
			bar: "切换为柱状图",
			stack: "切换为堆叠",
			tiled: "切换为平铺"
		} },
		restore: { title: "还原" },
		saveAsImage: {
			title: "保存为图片",
			lang: ["右键另存为图片"]
		}
	},
	series: { typeNames: {
		pie: "饼图",
		bar: "柱状图",
		line: "折线图",
		scatter: "散点图",
		effectScatter: "涟漪散点图",
		radar: "雷达图",
		tree: "树图",
		treemap: "矩形树图",
		boxplot: "箱型图",
		candlestick: "K线图",
		k: "K线图",
		heatmap: "热力图",
		map: "地图",
		parallel: "平行坐标图",
		lines: "线图",
		graph: "关系图",
		sankey: "桑基图",
		funnel: "漏斗图",
		gauge: "仪表盘图",
		pictorialBar: "象形柱图",
		themeRiver: "主题河流图",
		sunburst: "旭日图",
		custom: "自定义图表",
		chart: "图表"
	} },
	aria: {
		general: {
			withTitle: "这是一个关于“{title}”的图表。",
			withoutTitle: "这是一个图表，"
		},
		series: {
			single: {
				prefix: "",
				withName: "图表类型是{seriesType}，表示{seriesName}。",
				withoutName: "图表类型是{seriesType}。"
			},
			multiple: {
				prefix: "它由{seriesCount}个图表系列组成。",
				withName: "第{seriesId}个系列是一个表示{seriesName}的{seriesType}，",
				withoutName: "第{seriesId}个系列是一个{seriesType}，",
				separator: {
					middle: "；",
					end: "。"
				}
			}
		},
		data: {
			allData: "其数据是——",
			partialData: "其中，前{displayCnt}项是——",
			withName: "{name}的数据是{value}",
			withoutName: "{value}",
			separator: {
				middle: "，",
				end: ""
			}
		}
	}
}, jh = "ZH", Mh = "EN", Nh = Mh, Ph = {}, Fh = {}, Ih = J.domSupported ? function() {
	return (document.documentElement.lang || navigator.language || navigator.browserLanguage || Nh).toUpperCase().indexOf(jh) > -1 ? jh : Nh;
}() : Nh;
function Lh(e, t) {
	e = e.toUpperCase(), Fh[e] = new lp(t), Ph[e] = t;
}
function Rh(e) {
	if (U(e)) {
		var t = Ph[e.toUpperCase()] || {};
		return e === jh || e === Mh ? E(t) : D(E(t), E(Ph[Nh]), !1);
	}
	return D(E(e), E(Ph[Nh]), !1);
}
function zh(e) {
	return Fh[e];
}
function Bh() {
	return Fh[Nh];
}
Lh(Mh, kh), Lh(jh, Ah);
//#endregion
//#region node_modules/echarts/lib/scale/break.js
var Vh = null;
function Hh() {
	return Vh;
}
function Uh(e, t) {
	var n = Hh(), r = t.breakOption, i = t.breakParsed;
	return !i && n && (i = n.parseAxisBreakOption(r, e)), i;
}
function Wh(e) {
	var t = e.brk;
	return t ? t.breaks : [];
}
function Gh(e) {
	var t = e.brk;
	return t ? t.hasBreaks() : !1;
}
//#endregion
//#region node_modules/echarts/lib/util/time.js
var Kh = 1e3, qh = Kh * 60, Jh = qh * 60, Yh = Jh * 24, Xh = Yh * 365, Zh = {
	year: /({yyyy}|{yy})/,
	month: /({MMMM}|{MMM}|{MM}|{M})/,
	day: /({dd}|{d})/,
	hour: /({HH}|{H}|{hh}|{h})/,
	minute: /({mm}|{m})/,
	second: /({ss}|{s})/,
	millisecond: /({SSS}|{S})/
}, Qh = {
	year: "{yyyy}",
	month: "{MMM}",
	day: "{d}",
	hour: "{HH}:{mm}",
	minute: "{HH}:{mm}",
	second: "{HH}:{mm}:{ss}",
	millisecond: "{HH}:{mm}:{ss} {SSS}"
}, $h = "{yyyy}-{MM}-{dd} {HH}:{mm}:{ss} {SSS}", eg = "{yyyy}-{MM}-{dd}", tg = {
	year: "{yyyy}",
	month: "{yyyy}-{MM}",
	day: eg,
	hour: eg + " " + Qh.hour,
	minute: eg + " " + Qh.minute,
	second: eg + " " + Qh.second,
	millisecond: $h
}, ng = [
	"year",
	"month",
	"day",
	"hour",
	"minute",
	"second",
	"millisecond"
], rg = [
	"year",
	"half-year",
	"quarter",
	"month",
	"week",
	"half-week",
	"day",
	"half-day",
	"quarter-day",
	"hour",
	"minute",
	"second",
	"millisecond"
];
function ig(e) {
	return !U(e) && !H(e) ? ag(e) : e;
}
function ag(e) {
	e ||= {};
	var t = {}, n = !0;
	return F(ng, function(t) {
		n &&= e[t] == null;
	}), F(ng, function(r, i) {
		var a = e[r];
		t[r] = {};
		for (var o = null, s = i; s >= 0; s--) {
			var c = ng[s], l = G(a) && !V(a) ? a[c] : a, u = void 0;
			V(l) ? (u = l.slice(), o = u[0] || "") : U(l) ? (o = l, u = [o]) : (o == null ? o = Qh[r] : Zh[c].test(o) || (o = t[c][c][0] + " " + o), u = [o], n && (u[1] = "{primary|" + o + "}")), t[r][c] = u;
		}
	}), t;
}
function og(e, t) {
	return e += "", "0000".substr(0, t - e.length) + e;
}
function sg(e) {
	switch (e) {
		case "half-year":
		case "quarter": return "month";
		case "week":
		case "half-week": return "day";
		case "half-day":
		case "quarter-day": return "hour";
		default: return e;
	}
}
function cg(e) {
	return e === sg(e);
}
function lg(e) {
	switch (e) {
		case "year":
		case "month": return "day";
		case "millisecond": return "millisecond";
		default: return "second";
	}
}
function ug(e, t, n, r) {
	var i = Os(e), a = i[mg(n)](), o = i[hg(n)]() + 1, s = Math.floor((o - 1) / 3) + 1, c = i[gg(n)](), l = i["get" + (n ? "UTC" : "") + "Day"](), u = i[_g(n)](), d = (u - 1) % 12 + 1, f = i[vg(n)](), p = i[yg(n)](), m = i[bg(n)](), h = u >= 12 ? "pm" : "am", g = h.toUpperCase(), _ = (r instanceof lp ? r : zh(r || Ih) || Bh()).getModel("time"), v = _.get("month"), y = _.get("monthAbbr"), b = _.get("dayOfWeek"), x = _.get("dayOfWeekAbbr");
	return (t || "").replace(/{a}/g, h + "").replace(/{A}/g, g + "").replace(/{yyyy}/g, a + "").replace(/{yy}/g, og(a % 100 + "", 2)).replace(/{Q}/g, s + "").replace(/{MMMM}/g, v[o - 1]).replace(/{MMM}/g, y[o - 1]).replace(/{MM}/g, og(o, 2)).replace(/{M}/g, o + "").replace(/{dd}/g, og(c, 2)).replace(/{d}/g, c + "").replace(/{eeee}/g, b[l]).replace(/{ee}/g, x[l]).replace(/{e}/g, l + "").replace(/{HH}/g, og(u, 2)).replace(/{H}/g, u + "").replace(/{hh}/g, og(d + "", 2)).replace(/{h}/g, d + "").replace(/{mm}/g, og(f, 2)).replace(/{m}/g, f + "").replace(/{ss}/g, og(p, 2)).replace(/{s}/g, p + "").replace(/{SSS}/g, og(m, 3)).replace(/{S}/g, m + "");
}
function dg(e, t, n, r, i) {
	var a = null;
	if (U(n)) a = n;
	else if (H(n)) {
		var o = {
			time: e.time,
			level: e.time ? e.time.level : 0
		}, s = Hh();
		s && s.makeAxisLabelFormatterParamBreak(o, e.break), a = n(e.value, t, o);
	} else {
		var c = e.time;
		if (c) {
			var l = n[c.lowerTimeUnit][c.upperTimeUnit];
			a = l[Math.min(c.level, l.length - 1)] || "";
		} else {
			var u = fg(e.value, i);
			a = n[u][u][0];
		}
	}
	return ug(new Date(e.value), a, i, r);
}
function fg(e, t) {
	var n = Os(e), r = n[hg(t)]() + 1, i = n[gg(t)](), a = n[_g(t)](), o = n[vg(t)](), s = n[yg(t)](), c = n[bg(t)]() === 0, l = c && s === 0, u = l && o === 0, d = u && a === 0, f = d && i === 1;
	return f && r === 1 ? "year" : f ? "month" : d ? "day" : u ? "hour" : l ? "minute" : c ? "second" : "millisecond";
}
function pg(e, t, n) {
	switch (t) {
		case "year": e[Sg(n)](0);
		case "month": e[Cg(n)](1);
		case "day": e[wg(n)](0);
		case "hour": e[Tg(n)](0);
		case "minute": e[Eg(n)](0);
		case "second": e[Dg(n)](0);
	}
	return e;
}
function mg(e) {
	return e ? "getUTCFullYear" : "getFullYear";
}
function hg(e) {
	return e ? "getUTCMonth" : "getMonth";
}
function gg(e) {
	return e ? "getUTCDate" : "getDate";
}
function _g(e) {
	return e ? "getUTCHours" : "getHours";
}
function vg(e) {
	return e ? "getUTCMinutes" : "getMinutes";
}
function yg(e) {
	return e ? "getUTCSeconds" : "getSeconds";
}
function bg(e) {
	return e ? "getUTCMilliseconds" : "getMilliseconds";
}
function xg(e) {
	return e ? "setUTCFullYear" : "setFullYear";
}
function Sg(e) {
	return e ? "setUTCMonth" : "setMonth";
}
function Cg(e) {
	return e ? "setUTCDate" : "setDate";
}
function wg(e) {
	return e ? "setUTCHours" : "setHours";
}
function Tg(e) {
	return e ? "setUTCMinutes" : "setMinutes";
}
function Eg(e) {
	return e ? "setUTCSeconds" : "setSeconds";
}
function Dg(e) {
	return e ? "setUTCMilliseconds" : "setMilliseconds";
}
//#endregion
//#region node_modules/echarts/lib/util/format.js
function Og(e) {
	if (!Ns(e)) return U(e) ? e : "-";
	var t = (e + "").split(".");
	return t[0].replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, "$1,") + (t.length > 1 ? "." + t[1] : "");
}
function kg(e, t) {
	return e = (e || "").toLowerCase().replace(/-(.)/g, function(e, t) {
		return t.toUpperCase();
	}), t && e && (e = e.charAt(0).toUpperCase() + e.slice(1)), e;
}
var Ag = pe;
function jg(e, t, n) {
	var r = "{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}";
	function i(e) {
		return e && he(e) ? e : "-";
	}
	function a(e) {
		return Ls(e);
	}
	var o = t === "time", s = e instanceof Date;
	if (o || s) {
		var c = o ? Os(e) : e;
		if (!isNaN(+c)) return ug(c, r, n);
		if (s) return "-";
	}
	if (t === "ordinal") return ie(e) ? i(e) : W(e) && a(e) ? e + "" : "-";
	var l = Ms(e);
	return a(l) ? Og(l) : ie(e) ? i(e) : typeof e == "boolean" ? e + "" : "-";
}
var Mg = [
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g"
], Ng = function(e, t) {
	return "{" + e + (t ?? "") + "}";
};
function Pg(e, t, n) {
	V(t) || (t = [t]);
	var r = t.length;
	if (!r) return "";
	for (var i = t[0].$vars || [], a = 0; a < i.length; a++) {
		var o = Mg[a];
		e = e.replace(Ng(o), Ng(o, 0));
	}
	for (var s = 0; s < r; s++) for (var c = 0; c < i.length; c++) {
		var l = t[s][i[c]];
		e = e.replace(Ng(Mg[c], s), n ? Oh(l) : l);
	}
	return e;
}
function Fg(e, t) {
	var n = U(e) ? {
		color: e,
		extraCssText: t
	} : e || {}, r = n.color, i = n.type;
	t = n.extraCssText;
	var a = n.renderMode || "html";
	return r ? a === "html" ? i === "subItem" ? "<span style=\"display:inline-block;vertical-align:middle;margin-right:8px;margin-left:3px;border-radius:4px;width:4px;height:4px;background-color:" + Oh(r) + ";" + (t || "") + "\"></span>" : "<span style=\"display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:" + Oh(r) + ";" + (t || "") + "\"></span>" : {
		renderMode: a,
		content: "{" + (n.markerId || "markerX") + "|}  ",
		style: i === "subItem" ? {
			width: 4,
			height: 4,
			borderRadius: 2,
			backgroundColor: r
		} : {
			width: 10,
			height: 10,
			borderRadius: 5,
			backgroundColor: r
		}
	} : "";
}
function Ig(e, t) {
	return t ||= "transparent", U(e) ? e : G(e) && e.colorStops && (e.colorStops[0] || {}).color || t;
}
//#endregion
//#region node_modules/echarts/lib/util/layout.js
var Lg = F, Rg = [
	"left",
	"right",
	"top",
	"bottom",
	"width",
	"height"
], zg = [[
	"width",
	"left",
	"right"
], [
	"height",
	"top",
	"bottom"
]];
function Bg(e, t, n, r, i) {
	var a = 0, o = 0;
	r ??= Infinity, i ??= Infinity;
	var s = 0;
	t.eachChild(function(c, l) {
		var u = c.getBoundingRect(), d = t.childAt(l + 1), f = d && d.getBoundingRect(), p, m;
		if (e === "horizontal") {
			var h = u.width + (f ? -f.x + u.x : 0);
			p = a + h, p > r || c.newline ? (a = 0, p = h, o += s + n, s = u.height) : s = Math.max(s, u.height);
		} else {
			var g = u.height + (f ? -f.y + u.y : 0);
			m = o + g, m > i || c.newline ? (a += s + n, o = 0, m = g, s = u.width) : s = Math.max(s, u.width);
		}
		c.newline || (c.x = a, c.y = o, c.markRedraw(), e === "horizontal" ? a = p + n : o = m + n);
	});
}
var Vg = Bg;
B(Bg, "vertical"), B(Bg, "horizontal");
function Hg(e, t) {
	return {
		left: e.getShallow("left", t),
		top: e.getShallow("top", t),
		right: e.getShallow("right", t),
		bottom: e.getShallow("bottom", t),
		width: e.getShallow("width", t),
		height: e.getShallow("height", t)
	};
}
function Ug(e, t, n) {
	n = Ag(n || 0);
	var r = t.width, i = t.height, a = ps(e.left, r), o = ps(e.top, i), s = ps(e.right, r), c = ps(e.bottom, i), l = ps(e.width, r), u = ps(e.height, i), d = n[2] + n[0], f = n[1] + n[3], p = e.aspect;
	switch (isNaN(l) && (l = r - s - f - a), isNaN(u) && (u = i - c - d - o), p != null && (isNaN(l) && isNaN(u) && (p > r / i ? l = r * .8 : u = i * .8), isNaN(l) && (l = p * u), isNaN(u) && (u = l / p)), isNaN(a) && (a = r - s - l - f), isNaN(o) && (o = i - c - u - d), e.left || e.right) {
		case "center":
			a = r / 2 - l / 2 - n[3];
			break;
		case "right": a = r - l - f;
	}
	switch (e.top || e.bottom) {
		case "middle":
		case "center":
			o = i / 2 - u / 2 - n[0];
			break;
		case "bottom": o = i - u - d;
	}
	a ||= 0, o ||= 0, isNaN(l) && (l = r - f - a - (s || 0)), isNaN(u) && (u = i - d - o - (c || 0));
	var m = new Y((t.x || 0) + a + n[3], (t.y || 0) + o + n[0], l, u);
	return m.margin = n, m;
}
var Wg = {
	rect: 1,
	point: 2
};
function Gg(e, t, n) {
	var r, i, a, o = e.boxCoordinateSystem, s;
	if (o) {
		var c = Jm(e), l = c.coord, u = c.from;
		if (o.dataToLayout) {
			a = Wg.rect, s = u;
			var d = o.dataToLayout(l);
			r = d.contentRect || d.rect;
		} else n && n.enableLayoutOnlyByCenter && o.dataToPoint && (a = Wg.point, s = u, i = o.dataToPoint(l));
	}
	return a ??= Wg.rect, a === Wg.rect && (r ||= {
		x: 0,
		y: 0,
		width: t.getWidth(),
		height: t.getHeight()
	}, i = [r.x + r.width / 2, r.y + r.height / 2]), {
		type: a,
		refContainer: r,
		refPoint: i,
		boxCoordFrom: s
	};
}
function Kg(e) {
	var t = e.layoutMode || e.constructor.layoutMode;
	return G(t) ? t : t ? { type: t } : null;
}
function qg(e, t, n) {
	var r = n && n.ignoreSize;
	!V(r) && (r = [r, r]);
	var i = o(zg[0], 0), a = o(zg[1], 1);
	c(zg[0], e, i), c(zg[1], e, a);
	function o(n, i) {
		var a = {}, o = 0, c = {}, l = 0, u = 2;
		if (Lg(n, function(t) {
			c[t] = e[t];
		}), Lg(n, function(e) {
			Te(t, e) && (a[e] = c[e] = t[e]), s(a, e) && o++, s(c, e) && l++;
		}), r[i]) return s(t, n[1]) ? c[n[2]] = null : s(t, n[2]) && (c[n[1]] = null), c;
		if (l === u || !o) return c;
		if (o >= u) return a;
		for (var d = 0; d < n.length; d++) {
			var f = n[d];
			if (!Te(a, f) && Te(e, f)) {
				a[f] = e[f];
				break;
			}
		}
		return a;
	}
	function s(e, t) {
		return e[t] != null && e[t] !== "auto";
	}
	function c(e, t, n) {
		Lg(e, function(e) {
			t[e] = n[e];
		});
	}
}
function Jg(e) {
	return Yg({}, e);
}
function Yg(e, t) {
	return t && e && Lg(Rg, function(n) {
		Te(t, n) && (e[n] = t[n]);
	}), e;
}
//#endregion
//#region node_modules/echarts/lib/model/Component.js
var Xg = X(), Zg = function(e) {
	r(t, e);
	function t(t, n, r) {
		var i = e.call(this, t, n, r) || this;
		return i.uid = dh("ec_cpt_model"), i;
	}
	return t.prototype.init = function(e, t, n) {
		this.mergeDefaultAndTheme(e, n);
	}, t.prototype.mergeDefaultAndTheme = function(e, t) {
		var n = Kg(this), r = n ? Jg(e) : {};
		D(e, t.getTheme().get(this.mainType)), D(e, this.getDefaultOption()), n && qg(e, r, n);
	}, t.prototype.mergeOption = function(e, t) {
		D(this.option, e, !0);
		var n = Kg(this);
		n && qg(this.option, e, n);
	}, t.prototype.optionUpdated = function(e, t) {}, t.prototype.getDefaultOption = function() {
		var e = this.constructor;
		if (!Fe(e)) return e.defaultOption;
		var t = Xg(this);
		if (!t.defaultOption) {
			for (var n = [], r = e; r;) {
				var i = r.prototype.defaultOption;
				i && n.push(i), r = r.superClass;
			}
			for (var a = {}, o = n.length - 1; o >= 0; o--) a = D(a, n[o], !0);
			t.defaultOption = a;
		}
		return t.defaultOption;
	}, t.prototype.getReferringComponents = function(e, t) {
		var n = e + "Index", r = e + "Id";
		return _c(this.ecModel, e, {
			index: this.get(n, !0),
			id: this.get(r, !0)
		}, t);
	}, t.prototype.getBoxLayoutParams = function() {
		return Hg(this, !1);
	}, t.prototype.getZLevelKey = function() {
		return "";
	}, t.prototype.setZLevel = function(e) {
		this.option.zlevel = e;
	}, t.protoInitialize = function() {
		var e = t.prototype;
		e.type = "component", e.id = "", e.name = "", e.mainType = "", e.subType = "", e.componentIndex = 0;
	}(), t;
}(lp);
Re(Zg, lp), Ue(Zg), fh(Zg), ph(Zg, Qg);
function Qg(e) {
	var t = [];
	return F(Zg.getClassesByMainType(e), function(e) {
		t = t.concat(e.dependencies || e.prototype.dependencies || []);
	}), t = I(t, function(e) {
		return Ne(e).main;
	}), e !== "dataset" && M(t, "dataset") <= 0 && t.unshift("dataset"), t;
}
//#endregion
//#region node_modules/echarts/lib/model/mixin/palette.js
var $g = X();
X();
var e_ = function() {
	function e() {}
	return e.prototype.getColorFromPalette = function(e, t, n) {
		var r = qs(this.get("color", !0)), i = this.get("colorLayer", !0);
		return n_(this, $g, r, i, e, t, n);
	}, e.prototype.clearColorPalette = function() {
		r_(this, $g);
	}, e;
}();
function t_(e, t) {
	for (var n = e.length, r = 0; r < n; r++) if (e[r].length > t) return e[r];
	return e[n - 1];
}
function n_(e, t, n, r, i, a, o) {
	a ||= e;
	var s = t(a), c = s.paletteIdx || 0, l = s.paletteNameMap = s.paletteNameMap || {};
	if (l.hasOwnProperty(i)) return l[i];
	var u = o == null || !r ? n : t_(r, o);
	if (u ||= n, !(!u || !u.length)) {
		var d = u[c];
		return i && (l[i] = d), s.paletteIdx = (c + 1) % u.length, d;
	}
}
function r_(e, t) {
	t(e).paletteIdx = 0, t(e).paletteNameMap = {};
}
//#endregion
//#region node_modules/echarts/lib/model/mixin/dataFormat.js
var i_ = /\{@(.+?)\}/g, a_ = function() {
	function e() {}
	return e.prototype.getDataParams = function(e, t) {
		var n = this.getData(t), r = this.getRawValue(e, t), i = n.getRawIndex(e), a = n.getName(e), o = n.getRawDataItem(e), s = n.getItemVisual(e, "style"), c = s && s[n.getItemVisual(e, "drawType") || "fill"], l = s && s.stroke, u = this.mainType, d = u === "series", f = n.userOutput && n.userOutput.get();
		return {
			componentType: u,
			componentSubType: this.subType,
			componentIndex: this.componentIndex,
			seriesType: d ? this.subType : null,
			seriesIndex: this.seriesIndex,
			seriesId: d ? this.id : null,
			seriesName: d ? this.name : null,
			name: a,
			dataIndex: i,
			data: o,
			dataType: t,
			value: r,
			color: c,
			borderColor: l,
			dimensionNames: f ? f.fullDimensions : null,
			encode: f ? f.encode : null,
			$vars: [
				"seriesName",
				"name",
				"value"
			]
		};
	}, e.prototype.getFormattedLabel = function(e, t, n, r, i, a) {
		t ||= "normal";
		var o = this.getData(n), s = this.getDataParams(e, n);
		if (a && (s.value = a.interpolatedValue), r != null && V(s.value) && (s.value = s.value[r]), i ||= o.getItemModel(e).get(t === "normal" ? ["label", "formatter"] : [
			t,
			"label",
			"formatter"
		]), H(i)) return s.status = t, s.dimensionIndex = r, i(s);
		if (U(i)) return Pg(i, s).replace(i_, function(t, n) {
			var r = n.length, i = n;
			i.charAt(0) === "[" && i.charAt(r - 1) === "]" && (i = +i.slice(1, r - 1));
			var s = Xp(o, e, i);
			if (a && V(a.interpolatedValue)) {
				var c = o.getDimensionIndex(i);
				c >= 0 && (s = a.interpolatedValue[c]);
			}
			return s == null ? "" : s + "";
		});
	}, e.prototype.getRawValue = function(e, t) {
		return Xp(this.getData(t), e);
	}, e.prototype.formatTooltip = function(e, t, n) {}, e;
}();
function o_(e) {
	var t, n;
	return G(e) ? e.type && (n = e) : t = e, {
		text: t,
		frag: n
	};
}
//#endregion
//#region node_modules/echarts/lib/core/task.js
function s_(e) {
	return new c_(e);
}
var c_ = function() {
	function e(e) {
		e ||= {}, this._reset = e.reset, this._plan = e.plan, this._count = e.count, this._onDirty = e.onDirty, this._dirty = !0;
	}
	return e.prototype.perform = function(e) {
		var t = this._upstream, n = e && e.skip;
		if (this._dirty && t) {
			var r = this.context;
			r.data = r.outputData = t.context.outputData;
		}
		this.__pipeline && (this.__pipeline.currentTask = this);
		var i;
		this._plan && !n && (i = this._plan(this.context));
		var a = l(this._modBy), o = this._modDataCount || 0, s = l(e && e.modBy), c = e && e.modDataCount || 0;
		(a !== s || o !== c) && (i = "reset");
		function l(e) {
			return !(e >= 1) && (e = 1), e;
		}
		var u;
		(this._dirty || i === "reset") && (this._dirty = !1, u = this._doReset(n)), this._modBy = s, this._modDataCount = c;
		var d = e && e.step;
		if (this._dueEnd = t ? t._outputDueEnd : this._count ? this._count(this.context) : Infinity, this._progress) {
			var f = this._dueIndex, p = Math.min(d == null ? Infinity : this._dueIndex + d, this._dueEnd);
			if (!n && (u || f < p)) {
				var m = this._progress;
				if (V(m)) for (var h = 0; h < m.length; h++) this._doProgress(m[h], f, p, s, c);
				else this._doProgress(m, f, p, s, c);
			}
			this._dueIndex = p;
			var g = this._settedOutputEnd == null ? p : this._settedOutputEnd;
			this._outputDueEnd = g;
		} else this._dueIndex = this._outputDueEnd = this._settedOutputEnd == null ? this._dueEnd : this._settedOutputEnd;
		return this.unfinished();
	}, e.prototype.dirty = function() {
		this._dirty = !0, this._onDirty && this._onDirty(this.context);
	}, e.prototype._doProgress = function(e, t, n, r, i) {
		l_.reset(t, n, r, i), this._callingProgress = e, this._callingProgress({
			start: t,
			end: n,
			count: n - t,
			next: l_.next
		}, this.context);
	}, e.prototype._doReset = function(e) {
		this._dueIndex = this._outputDueEnd = this._dueEnd = 0, this._settedOutputEnd = null;
		var t, n;
		!e && this._reset && (t = this._reset(this.context), t && t.progress && (n = t.forceFirstProgress, t = t.progress), V(t) && !t.length && (t = null)), this._progress = t, this._modBy = this._modDataCount = null;
		var r = this._downstream;
		return r && r.dirty(), n;
	}, e.prototype.unfinished = function() {
		return this._progress && this._dueIndex < this._dueEnd;
	}, e.prototype.pipe = function(e) {
		(this._downstream !== e || this._dirty) && (this._downstream = e, e._upstream = this, e.dirty());
	}, e.prototype.dispose = function() {
		this._disposed ||= (this._upstream && (this._upstream._downstream = null), this._downstream && (this._downstream._upstream = null), this._dirty = !1, !0);
	}, e.prototype.getUpstream = function() {
		return this._upstream;
	}, e.prototype.getDownstream = function() {
		return this._downstream;
	}, e.prototype.setOutputEnd = function(e) {
		this._outputDueEnd = this._settedOutputEnd = e;
	}, e;
}(), l_ = function() {
	var e, t, n, r, i, a = { reset: function(c, l, u, d) {
		t = c, e = l, n = u, r = d, i = Math.ceil(r / n), a.next = n > 1 && r > 0 ? s : o;
	} };
	return a;
	function o() {
		return t < e ? t++ : null;
	}
	function s() {
		var a = t % i * n + Math.ceil(t / i), o = t >= e ? null : a < r ? a : t;
		return t++, o;
	}
}(), u_ = function() {
	function e() {}
	return e.prototype.getRawData = function() {
		throw Error("not supported");
	}, e.prototype.getRawDataItem = function(e) {
		throw Error("not supported");
	}, e.prototype.cloneRawData = function() {}, e.prototype.getDimensionInfo = function(e) {}, e.prototype.cloneAllDimensionInfo = function() {}, e.prototype.count = function() {}, e.prototype.retrieveValue = function(e, t) {}, e.prototype.retrieveValueFromItem = function(e, t) {}, e.prototype.convertValue = function(e, t) {
		return rm(e, t);
	}, e;
}();
function d_(e, t) {
	var n = new u_(), r = e.data, i = n.sourceFormat = e.sourceFormat, a = e.startIndex;
	e.seriesLayoutBy !== "column" && Us("");
	var o = [], s = {}, c = e.dimensionsDefine;
	if (c) F(c, function(e, t) {
		var n = e.name, r = {
			index: t,
			name: n,
			displayName: e.displayName
		};
		o.push(r), n != null && (Te(s, n) && Us(""), s[n] = r);
	});
	else for (var l = 0; l < e.dimensionsDetectedCount; l++) o.push({ index: l });
	var u = Hp(i, Zc);
	t.__isBuiltIn && (n.getRawDataItem = function(e) {
		return u(r, a, o, e);
	}, n.getRawData = z(f_, null, e)), n.cloneRawData = z(p_, null, e), n.count = z(Gp(i, Zc), null, r, a, o);
	var d = Jp(i);
	n.retrieveValue = function(e, t) {
		return f(u(r, a, o, e), t);
	};
	var f = n.retrieveValueFromItem = function(e, t) {
		if (e != null) {
			var n = o[t];
			if (n) return d(e, t, n.name);
		}
	};
	return n.getDimensionInfo = z(m_, null, o, s), n.cloneAllDimensionInfo = z(h_, null, o), n;
}
function f_(e) {
	var t = e.sourceFormat;
	return b_(t) || Us(""), e.data;
}
function p_(e) {
	var t = e.sourceFormat, n = e.data;
	if (b_(t) || Us(""), t === "arrayRows") {
		for (var r = [], i = 0, a = n.length; i < a; i++) r.push(n[i].slice());
		return r;
	}
	if (t === "objectRows") {
		for (var r = [], i = 0, a = n.length; i < a; i++) r.push(k({}, n[i]));
		return r;
	}
}
function m_(e, t, n) {
	if (n != null) {
		if (W(n) || !isNaN(n) && !Te(t, n)) return e[n];
		if (Te(t, n)) return t[n];
	}
}
function h_(e) {
	return E(e);
}
var g_ = q();
function __(e) {
	e = E(e);
	var t = e.type, n = "";
	t || Us(n);
	var r = t.split(":");
	r.length !== 2 && Us(n);
	var i = !1;
	r[0] === "echarts" && (t = r[1], i = !0), e.__isBuiltIn = i, g_.set(t, e);
}
function v_(e, t, n) {
	var r = qs(e), i = r.length;
	i || Us("");
	for (var a = 0, o = i; a < o; a++) {
		var s = r[a];
		t = y_(s, t, n, i === 1 ? null : a), a !== o - 1 && (t.length = Math.max(t.length, 1));
	}
	return t;
}
function y_(e, t, n, r) {
	var i = "";
	t.length || Us(i), G(e) || Us(i);
	var a = e.type, o = g_.get(a);
	o || Us(i);
	var s = I(t, function(e) {
		return d_(e, o);
	});
	return I(qs(o.transform({
		upstream: s[0],
		upstreamList: s,
		config: E(e.config)
	})), function(e, n) {
		var r = "";
		G(e) || Us(r), e.data || Us(r), b_(Ep(e.data)) || Us(r);
		var i, a = t[0];
		if (a && n === 0 && !e.dimensions) {
			var o = a.startIndex;
			o && (e.data = a.data.slice(0, o).concat(e.data)), i = {
				seriesLayoutBy: Zc,
				sourceHeader: o,
				dimensions: a.metaRawOption.dimensions
			};
		} else i = {
			seriesLayoutBy: Zc,
			sourceHeader: 0,
			dimensions: e.dimensions
		};
		return Cp(e.data, i, null);
	});
}
function b_(e) {
	return e === "arrayRows" || e === "objectRows";
}
//#endregion
//#region node_modules/echarts/lib/data/helper/sourceManager.js
var x_ = function() {
	function e(e) {
		this._sourceList = [], this._storeList = [], this._upstreamSignList = [], this._versionSignBase = 0, this._dirty = !0, this._sourceHost = e;
	}
	return e.prototype.dirty = function() {
		this._setLocalSource([], []), this._storeList = [], this._dirty = !0;
	}, e.prototype._setLocalSource = function(e, t) {
		this._sourceList = e, this._upstreamSignList = t, this._versionSignBase++, this._versionSignBase > 9e10 && (this._versionSignBase = 0);
	}, e.prototype._getVersionSign = function() {
		return this._sourceHost.uid + "_" + this._versionSignBase;
	}, e.prototype.prepareSource = function() {
		this._isDirty() && (this._createSource(), this._dirty = !1);
	}, e.prototype._createSource = function() {
		this._setLocalSource([], []);
		var e = this._sourceHost, t = this._getUpstreamSourceManagers(), n = !!t.length, r, i;
		if (S_(e)) {
			var a = e, o = void 0, s = void 0, c = void 0;
			if (n) {
				var l = t[0];
				l.prepareSource(), c = l.getSource(), o = c.data, s = c.sourceFormat, i = [l._getVersionSign()];
			} else o = a.get("data", !0), s = oe(o) ? Yc : Gc, i = [];
			var u = this._getSourceMetaRawOption() || {}, d = c && c.metaRawOption || {}, f = K(u.seriesLayoutBy, d.seriesLayoutBy) || null, p = K(u.sourceHeader, d.sourceHeader), m = K(u.dimensions, d.dimensions);
			r = f !== d.seriesLayoutBy || !!p != !!d.sourceHeader || m ? [Cp(o, {
				seriesLayoutBy: f,
				sourceHeader: p,
				dimensions: m
			}, s)] : [];
		} else {
			var h = e;
			if (n) {
				var g = this._applyTransform(t);
				r = g.sourceList, i = g.upstreamSignList;
			} else r = [Cp(h.get("source", !0), this._getSourceMetaRawOption(), null)], i = [];
		}
		this._setLocalSource(r, i);
	}, e.prototype._applyTransform = function(e) {
		var t = this._sourceHost, n = t.get("transform", !0), r = t.get("fromTransformResult", !0);
		r != null && e.length !== 1 && C_("");
		var i, a = [], o = [];
		return F(e, function(e) {
			e.prepareSource();
			var t = e.getSource(r || 0);
			r != null && !t && C_(""), a.push(t), o.push(e._getVersionSign());
		}), n ? i = v_(n, a, { datasetIndex: t.componentIndex }) : r != null && (i = [Tp(a[0])]), {
			sourceList: i,
			upstreamSignList: o
		};
	}, e.prototype._isDirty = function() {
		if (this._dirty) return !0;
		for (var e = this._getUpstreamSourceManagers(), t = 0; t < e.length; t++) {
			var n = e[t];
			if (n._isDirty() || this._upstreamSignList[t] !== n._getVersionSign()) return !0;
		}
	}, e.prototype.getSource = function(e) {
		e ||= 0;
		var t = this._sourceList[e];
		if (!t) {
			var n = this._getUpstreamSourceManagers();
			return n[0] && n[0].getSource(e);
		}
		return t;
	}, e.prototype.getSharedDataStore = function(e) {
		var t = e.makeStoreSchema();
		return this._innerGetDataStore(t.dimensions, e.source, t.hash);
	}, e.prototype._innerGetDataStore = function(e, t, n) {
		var r = 0, i = this._storeList, a = i[r];
		a ||= i[r] = {};
		var o = a[n];
		if (!o) {
			var s = this._getUpstreamSourceManagers()[0];
			S_(this._sourceHost) && s ? o = s._innerGetDataStore(e, t, n) : (o = new _m(), o.initData(new Rp(t, e.length), e)), a[n] = o;
		}
		return o;
	}, e.prototype._getUpstreamSourceManagers = function() {
		var e = this._sourceHost;
		if (S_(e)) {
			var t = _p(e);
			return t ? [t.getSourceManager()] : [];
		}
		return I(vp(e), function(e) {
			return e.getSourceManager();
		});
	}, e.prototype._getSourceMetaRawOption = function() {
		var e = this._sourceHost, t, n, r;
		if (S_(e)) t = e.get("seriesLayoutBy", !0), n = e.get("sourceHeader", !0), r = e.get("dimensions", !0);
		else if (!this._getUpstreamSourceManagers().length) {
			var i = e;
			t = i.get("seriesLayoutBy", !0), n = i.get("sourceHeader", !0), r = i.get("dimensions", !0);
		}
		return {
			seriesLayoutBy: t,
			sourceHeader: n,
			dimensions: r
		};
	}, e;
}();
function S_(e) {
	return e.mainType === "series";
}
function C_(e) {
	throw Error(e);
}
//#endregion
//#region node_modules/echarts/lib/visual/tokens.js
var Q = {
	color: {},
	darkColor: {},
	size: {}
}, w_ = Q.color = {
	theme: [
		"#5070dd",
		"#b6d634",
		"#505372",
		"#ff994d",
		"#0ca8df",
		"#ffd10a",
		"#fb628b",
		"#785db0",
		"#3fbe95"
	],
	neutral00: "#fff",
	neutral05: "#f4f7fd",
	neutral10: "#e8ebf0",
	neutral15: "#dbdee4",
	neutral20: "#cfd2d7",
	neutral25: "#c3c5cb",
	neutral30: "#b7b9be",
	neutral35: "#aaacb2",
	neutral40: "#9ea0a5",
	neutral45: "#929399",
	neutral50: "#86878c",
	neutral55: "#797b7f",
	neutral60: "#6d6e73",
	neutral65: "#616266",
	neutral70: "#54555a",
	neutral75: "#48494d",
	neutral80: "#3c3c41",
	neutral85: "#303034",
	neutral90: "#232328",
	neutral95: "#17171b",
	neutral99: "#000",
	accent05: "#eff1f9",
	accent10: "#e0e4f2",
	accent15: "#d0d6ec",
	accent20: "#c0c9e6",
	accent25: "#b1bbdf",
	accent30: "#a1aed9",
	accent35: "#91a0d3",
	accent40: "#8292cc",
	accent45: "#7285c6",
	accent50: "#6578ba",
	accent55: "#5c6da9",
	accent60: "#536298",
	accent65: "#4a5787",
	accent70: "#404c76",
	accent75: "#374165",
	accent80: "#2e3654",
	accent85: "#252b43",
	accent90: "#1b2032",
	accent95: "#121521",
	transparent: "rgba(0,0,0,0)",
	highlight: "rgba(255,231,130,0.8)"
};
for (var T_ in k(w_, {
	primary: w_.neutral80,
	secondary: w_.neutral70,
	tertiary: w_.neutral60,
	quaternary: w_.neutral50,
	disabled: w_.neutral20,
	border: w_.neutral30,
	borderTint: w_.neutral20,
	borderShade: w_.neutral40,
	background: w_.neutral05,
	backgroundTint: "rgba(234,237,245,0.5)",
	backgroundTransparent: "rgba(255,255,255,0)",
	backgroundShade: w_.neutral10,
	shadow: "rgba(0,0,0,0.2)",
	shadowTint: "rgba(129,130,136,0.2)",
	axisLine: w_.neutral70,
	axisLineTint: w_.neutral40,
	axisTick: w_.neutral70,
	axisTickMinor: w_.neutral60,
	axisLabel: w_.neutral70,
	axisSplitLine: w_.neutral15,
	axisMinorSplitLine: w_.neutral05
}), w_) if (w_.hasOwnProperty(T_)) {
	var E_ = w_[T_];
	T_ === "theme" ? Q.darkColor.theme = w_.theme.slice() : T_ === "highlight" ? Q.darkColor.highlight = "rgba(255,231,130,0.4)" : T_.indexOf("accent") === 0 ? Q.darkColor[T_] = Br(E_, null, function(e) {
		return e * .5;
	}, function(e) {
		return Math.min(1, 1.3 - e);
	}) : Q.darkColor[T_] = Br(E_, null, function(e) {
		return e * .9;
	}, function(e) {
		return 1 - e ** 1.5;
	});
}
Q.size = {
	xxs: 2,
	xs: 5,
	s: 10,
	m: 15,
	l: 20,
	xl: 30,
	xxl: 40,
	xxxl: 50
};
//#endregion
//#region node_modules/echarts/lib/component/tooltip/tooltipMarkup.js
var D_ = "line-height:1";
function O_(e) {
	var t = e.lineHeight;
	return t == null ? D_ : "line-height:" + Oh(t + "") + "px";
}
function k_(e, t) {
	var n = e.color || Q.color.tertiary, r = e.fontSize || 12, i = e.fontWeight || "400", a = e.color || Q.color.secondary, o = e.fontSize || 14, s = e.fontWeight || "900";
	return t === "html" ? {
		nameStyle: "font-size:" + Oh(r + "") + "px;color:" + Oh(n) + ";font-weight:" + Oh(i + ""),
		valueStyle: "font-size:" + Oh(o + "") + "px;color:" + Oh(a) + ";font-weight:" + Oh(s + "")
	} : {
		nameStyle: {
			fontSize: r,
			fill: n,
			fontWeight: i
		},
		valueStyle: {
			fontSize: o,
			fill: a,
			fontWeight: s
		}
	};
}
var A_ = [
	0,
	10,
	20,
	30
], j_ = [
	"",
	"\n",
	"\n\n",
	"\n\n\n"
];
function M_(e, t) {
	return t.type = e, t;
}
function N_(e) {
	return e.type === "section";
}
function P_(e) {
	return N_(e) ? I_ : L_;
}
function F_(e) {
	if (N_(e)) {
		var t = 0, n = e.blocks.length, r = n > 1 || n > 0 && !e.noHeader;
		return F(e.blocks, function(e) {
			var n = F_(e);
			n >= t && (t = n + +(r && (!n || N_(e) && !e.noHeader)));
		}), t;
	}
	return 0;
}
function I_(e, t, n, r) {
	var i = t.noHeader, a = z_(F_(t)), o = [], s = t.blocks || [];
	me(!s || V(s)), s ||= [];
	var c = e.orderMode;
	if (t.sortBlocks && c) {
		s = s.slice();
		var l = {
			valueAsc: "asc",
			valueDesc: "desc"
		};
		if (Te(l, c)) {
			var u = new am(l[c], null);
			s.sort(function(e, t) {
				return u.evaluate(e.sortParam, t.sortParam);
			});
		} else c === "seriesDesc" && s.reverse();
	}
	F(s, function(n, i) {
		var s = t.valueFormatter, c = P_(n)(s ? k(k({}, e), { valueFormatter: s }) : e, n, i > 0 ? a.html : 0, r);
		c != null && o.push(c);
	});
	var d = e.renderMode === "richText" ? o.join(a.richText) : B_(r, o.join(""), i ? n : a.html);
	if (i) return d;
	var f = jg(t.header, "ordinal", e.useUTC), p = k_(r, e.renderMode).nameStyle, m = O_(r);
	return e.renderMode === "richText" ? U_(e, f, p) + a.richText + d : B_(r, "<div style=\"" + p + ";" + m + ";\">" + Oh(f) + "</div>" + d, n);
}
function L_(e, t, n, r) {
	var i = e.renderMode, a = t.noName, o = t.noValue, s = !t.markerType, c = t.name, l = e.useUTC, u = t.valueFormatter || e.valueFormatter || function(e) {
		return e = V(e) ? e : [e], I(e, function(e, t) {
			return jg(e, V(p) ? p[t] : p, l);
		});
	};
	if (!(a && o)) {
		var d = s ? "" : e.markupStyleCreator.makeTooltipMarker(t.markerType, t.markerColor || Q.color.secondary, i), f = a ? "" : jg(c, "ordinal", l), p = t.valueType, m = o ? [] : u(t.value, t.rawDataIndex), h = !s || !a, g = !s && a, _ = k_(r, i), v = _.nameStyle, y = _.valueStyle;
		return i === "richText" ? (s ? "" : d) + (a ? "" : U_(e, f, v)) + (o ? "" : W_(e, m, h, g, y)) : B_(r, (s ? "" : d) + (a ? "" : V_(f, !s, v)) + (o ? "" : H_(m, h, g, y)), n);
	}
}
function R_(e, t, n, r, i, a) {
	if (e) return P_(e)({
		useUTC: i,
		renderMode: n,
		orderMode: r,
		markupStyleCreator: t,
		valueFormatter: e.valueFormatter
	}, e, 0, a);
}
function z_(e) {
	return {
		html: A_[e],
		richText: j_[e]
	};
}
function B_(e, t, n) {
	var r = "<div style=\"clear:both\"></div>", i = "margin: " + n + "px 0 0", a = O_(e);
	return "<div style=\"" + i + ";" + a + ";\">" + t + r + "</div>";
}
function V_(e, t, n) {
	var r = t ? "margin-left:2px" : "";
	return "<span style=\"" + n + ";" + r + "\">" + Oh(e) + "</span>";
}
function H_(e, t, n, r) {
	var i = t ? "float:right;margin-left:" + (n ? "10px" : "20px") : "";
	return e = V(e) ? e : [e], "<span style=\"" + i + ";" + r + "\">" + I(e, function(e) {
		return Oh(e);
	}).join("&nbsp;&nbsp;") + "</span>";
}
function U_(e, t, n) {
	return e.markupStyleCreator.wrapRichTextStyle(t, n);
}
function W_(e, t, n, r, i) {
	var a = [i], o = r ? 10 : 20;
	return n && a.push({
		padding: [
			0,
			0,
			0,
			o
		],
		align: "right"
	}), e.markupStyleCreator.wrapRichTextStyle(V(t) ? t.join("  ") : t, a);
}
function G_(e, t) {
	var n = e.getData().getItemVisual(t, "style")[e.visualDrawType];
	return Ig(n);
}
function K_(e, t) {
	return e.get("padding") ?? (t === "richText" ? [8, 10] : 10);
}
var q_ = function() {
	function e() {
		this.richTextStyles = {}, this._nextStyleNameId = Ps();
	}
	return e.prototype._generateStyleName = function() {
		return "__EC_aUTo_" + this._nextStyleNameId++;
	}, e.prototype.makeTooltipMarker = function(e, t, n) {
		var r = n === "richText" ? this._generateStyleName() : null, i = Fg({
			color: t,
			type: e,
			renderMode: n,
			markerId: r
		});
		return U(i) ? i : (this.richTextStyles[r] = i.style, i.content);
	}, e.prototype.wrapRichTextStyle = function(e, t) {
		var n = {};
		V(t) ? F(t, function(e) {
			return k(n, e);
		}) : k(n, t);
		var r = this._generateStyleName();
		return this.richTextStyles[r] = n, "{" + r + "|" + e + "}";
	}, e;
}();
//#endregion
//#region node_modules/echarts/lib/component/tooltip/seriesFormatTooltip.js
function J_(e) {
	var t = e.series, n = e.dataIndex, r = e.multipleSeries, i = t.getData(), a = i.mapDimensionsAll("defaultedTooltip"), o = a.length, s = t.getRawValue(n), c = V(s), l = G_(t, n), u, d, f, p;
	if (o > 1 || c && !o) {
		var m = Y_(s, t, n, a, l);
		u = m.inlineValues, d = m.inlineValueTypes, f = m.blocks, p = m.inlineValues[0];
	} else if (o) {
		var h = i.getDimensionInfo(a[0]);
		p = u = Xp(i, n, a[0]), d = h.type;
	} else p = u = c ? s[0] : s;
	var g = cc(t), _ = g && t.name || "", v = i.getName(n), y = r ? _ : v;
	return M_("section", {
		header: _,
		noHeader: r || !g,
		sortParam: p,
		blocks: [M_("nameValue", {
			markerType: "item",
			markerColor: l,
			name: y,
			noName: !he(y),
			value: u,
			valueType: d,
			rawDataIndex: i.getRawIndex(n)
		})].concat(f || [])
	});
}
function Y_(e, t, n, r, i) {
	var a = t.getData(), o = te(e, function(e, t, n) {
		var r = a.getDimensionInfo(n);
		return e ||= r && r.tooltip !== !1 && r.displayName != null;
	}, !1), s = [], c = [], l = [];
	r.length ? F(r, function(e) {
		u(Xp(a, n, e), e);
	}) : F(e, u);
	function u(e, t) {
		var n = a.getDimensionInfo(t);
		!n || n.otherDims.tooltip === !1 || (o ? l.push(M_("nameValue", {
			markerType: "subItem",
			markerColor: i,
			name: n.displayName,
			value: e,
			valueType: n.type
		})) : (s.push(e), c.push(n.type)));
	}
	return {
		inlineValues: s,
		inlineValueTypes: c,
		blocks: l
	};
}
//#endregion
//#region node_modules/echarts/lib/model/Series.js
var X_ = X();
function Z_(e, t) {
	return e.getName(t) || e.getId(t);
}
var Q_ = function(e) {
	r(t, e);
	function t() {
		var t = e !== null && e.apply(this, arguments) || this;
		return t._selectedDataIndicesMap = {}, t;
	}
	return t.prototype.init = function(e, t, n) {
		this.seriesIndex = this.componentIndex, this.dataTask = s_({
			count: tv,
			reset: nv
		}), this.dataTask.context = { model: this }, this.mergeDefaultAndTheme(e, n), (X_(this).sourceManager = new x_(this)).prepareSource();
		var r = this.getInitialData(e, n);
		iv(r, this), this.dataTask.context.data = r, X_(this).dataBeforeProcessed = r, $_(this), this._initSelectedMapFromData(r);
	}, t.prototype.mergeDefaultAndTheme = function(e, t) {
		var n = Kg(this), r = n ? Jg(e) : {}, i = this.subType;
		Zg.hasClass(i) && (i += "Series"), D(e, t.getTheme().get(this.subType)), D(e, this.getDefaultOption()), Js(e, "label", ["show"]), this.fillDataTextStyle(e.data), n && qg(e, r, n);
	}, t.prototype.mergeOption = function(e, t) {
		e = D(this.option, e, !0), this.fillDataTextStyle(e.data);
		var n = Kg(this);
		n && qg(this.option, e, n);
		var r = X_(this).sourceManager;
		r.dirty(), r.prepareSource();
		var i = this.getInitialData(e, t);
		iv(i, this), this.dataTask.dirty(), this.dataTask.context.data = i, X_(this).dataBeforeProcessed = i, $_(this), this._initSelectedMapFromData(i);
	}, t.prototype.fillDataTextStyle = function(e) {
		if (e && !oe(e)) for (var t = ["show"], n = 0; n < e.length; n++) e[n] && e[n].label && Js(e[n], "label", t);
	}, t.prototype.getInitialData = function(e, t) {}, t.prototype.appendData = function(e) {
		this.getRawData().appendData(e.data);
	}, t.prototype.getData = function(e) {
		var t = ov(this);
		if (t) {
			var n = t.context.data;
			return e == null || !n.getLinkedData ? n : n.getLinkedData(e);
		}
		return X_(this).data;
	}, t.prototype.getAllData = function() {
		var e = this.getData();
		return e && e.getLinkedDataAll ? e.getLinkedDataAll() : [{ data: e }];
	}, t.prototype.setData = function(e) {
		var t = ov(this);
		if (t) {
			var n = t.context;
			n.outputData = e, t !== this.dataTask && (n.data = e);
		}
		X_(this).data = e;
	}, t.prototype.getEncode = function() {
		var e = this.get("encode", !0);
		if (e) return q(e);
	}, t.prototype.getSourceManager = function() {
		return X_(this).sourceManager;
	}, t.prototype.getSource = function() {
		return this.getSourceManager().getSource();
	}, t.prototype.getRawData = function() {
		return X_(this).dataBeforeProcessed;
	}, t.prototype.getColorBy = function() {
		return this.get("colorBy") || "series";
	}, t.prototype.isColorBySeries = function() {
		return this.getColorBy() === "series";
	}, t.prototype.getBaseAxis = function() {
		var e = this.coordinateSystem;
		return e && e.getBaseAxis && e.getBaseAxis();
	}, t.prototype.indicesOfNearest = function(e, t, n, r) {
		var i = this.getData(), a = this.coordinateSystem, o = a && a.getAxis(e);
		if (!a || !o) return [];
		var s = o.dataToCoord(n);
		r ??= Infinity;
		for (var c = [], l = Infinity, u = -1, d = 0, f = i.getDimensionIndex(t), p = i.getStore(), m = 0, h = p.count(); m < h; m++) {
			var g = p.get(f, m), _ = s - o.dataToCoord(g), v = Math.abs(_);
			v <= r && ((v < l || v === l && _ >= 0 && u < 0) && (l = v, u = _, d = 0), _ === u && (c[d++] = m));
		}
		return c.length = d, c;
	}, t.prototype.formatTooltip = function(e, t, n) {
		return J_({
			series: this,
			dataIndex: e,
			multipleSeries: t
		});
	}, t.prototype.isAnimationEnabled = function() {
		var e = this.ecModel;
		if (J.node && !(e && e.ssr)) return !1;
		var t = this.getShallow("animation");
		return t && this.getData().count() > this.getShallow("animationThreshold") && (t = !1), !!t;
	}, t.prototype.restoreData = function() {
		this.dataTask.dirty();
	}, t.prototype.getColorFromPalette = function(e, t, n) {
		var r = this.ecModel, i = e_.prototype.getColorFromPalette.call(this, e, t, n);
		return i ||= r.getColorFromPalette(e, t, n), i;
	}, t.prototype.coordDimToDataDim = function(e) {
		return this.getRawData().mapDimensionsAll(e);
	}, t.prototype.getProgressive = function() {
		return this.get("progressive");
	}, t.prototype.getProgressiveThreshold = function() {
		return this.get("progressiveThreshold");
	}, t.prototype.select = function(e, t) {
		this._innerSelect(this.getData(t), e);
	}, t.prototype.unselect = function(e, t) {
		var n = this.option.selectedMap;
		if (n) {
			var r = this.option.selectedMode, i = this.getData(t);
			if (r === "series" || n === "all") {
				this.option.selectedMap = {}, this._selectedDataIndicesMap = {};
				return;
			}
			for (var a = 0; a < e.length; a++) {
				var o = e[a], s = Z_(i, o);
				n[s] = !1, this._selectedDataIndicesMap[s] = -1;
			}
		}
	}, t.prototype.toggleSelect = function(e, t) {
		for (var n = [], r = 0; r < e.length; r++) n[0] = e[r], this.isSelected(e[r], t) ? this.unselect(n, t) : this.select(n, t);
	}, t.prototype.getSelectedDataIndices = function() {
		if (this.option.selectedMap === "all") return [].slice.call(this.getData().getIndices());
		for (var e = this._selectedDataIndicesMap, t = R(e), n = [], r = 0; r < t.length; r++) {
			var i = e[t[r]];
			i >= 0 && n.push(i);
		}
		return n;
	}, t.prototype.isSelected = function(e, t) {
		var n = this.option.selectedMap;
		if (!n) return !1;
		var r = this.getData(t);
		return (n === "all" || n[Z_(r, e)]) && !r.getItemModel(e).get(["select", "disabled"]);
	}, t.prototype.isUniversalTransitionEnabled = function() {
		if (this.__universalTransitionEnabled) return !0;
		var e = this.option.universalTransition;
		return e ? e === !0 || e && e.enabled : !1;
	}, t.prototype._innerSelect = function(e, t) {
		var n, r, i = this.option, a = i.selectedMode, o = t.length;
		if (!(!a || !o)) {
			if (a === "series") i.selectedMap = "all";
			else if (a === "multiple") {
				G(i.selectedMap) || (i.selectedMap = {});
				for (var s = i.selectedMap, c = 0; c < o; c++) {
					var l = t[c], u = Z_(e, l);
					s[u] = !0, this._selectedDataIndicesMap[u] = e.getRawIndex(l);
				}
			} else if (a === "single" || a === !0) {
				var d = t[o - 1], u = Z_(e, d);
				i.selectedMap = (n = {}, n[u] = !0, n), this._selectedDataIndicesMap = (r = {}, r[u] = e.getRawIndex(d), r);
			}
		}
	}, t.prototype._initSelectedMapFromData = function(e) {
		if (!this.option.selectedMap) {
			var t = [];
			e.hasItemOption && e.each(function(n) {
				var r = e.getRawDataItem(n);
				r && r.selected && t.push(n);
			}), t.length > 0 && this._innerSelect(e, t);
		}
	}, t.registerClass = function(e) {
		return Zg.registerClass(e);
	}, t.protoInitialize = function() {
		var e = t.prototype;
		e.type = "series.__base__", e.seriesIndex = 0, e.ignoreStyleOnData = !1, e.hasSymbolVisual = !1, e.defaultSymbol = "circle", e.visualStyleAccessPath = "itemStyle", e.visualDrawType = "fill";
	}(), t;
}(Zg);
N(Q_, a_), N(Q_, e_), Re(Q_, Zg);
function $_(e) {
	var t = e.name;
	cc(e) || (e.name = ev(e) || t);
}
function ev(e) {
	var t = e.getRawData(), n = t.mapDimensionsAll("seriesName"), r = [];
	return F(n, function(e) {
		var n = t.getDimensionInfo(e);
		n.displayName && r.push(n.displayName);
	}), r.join(" ");
}
function tv(e) {
	return e.model.getRawData().count();
}
function nv(e) {
	var t = e.model;
	return t.setData(t.getRawData().cloneShallow()), rv;
}
function rv(e, t) {
	t.outputData && e.end > t.outputData.count() && t.model.getRawData().cloneShallow(t.outputData);
}
function iv(e, t) {
	F(Ce(e.CHANGABLE_METHODS, e.DOWNSAMPLE_METHODS), function(n) {
		e.wrapMethod(n, B(av, t));
	});
}
function av(e, t) {
	var n = ov(e);
	return n && n.setOutputEnd((t || this).count()), t;
}
function ov(e) {
	var t = (e.ecModel || {}).scheduler, n = t && t.getPipeline(e.uid);
	if (n) {
		var r = n.currentTask;
		if (r) {
			var i = r.agentStubMap;
			i && (r = i.get(e.uid));
		}
		return r;
	}
}
//#endregion
//#region node_modules/echarts/lib/util/symbol.js
var sv = yo.extend({
	type: "triangle",
	shape: {
		cx: 0,
		cy: 0,
		width: 0,
		height: 0
	},
	buildPath: function(e, t) {
		var n = t.cx, r = t.cy, i = t.width / 2, a = t.height / 2;
		e.moveTo(n, r - a), e.lineTo(n + i, r + a), e.lineTo(n - i, r + a), e.closePath();
	}
}), cv = {
	line: ld,
	rect: No,
	roundRect: No,
	square: No,
	circle: Nu,
	diamond: yo.extend({
		type: "diamond",
		shape: {
			cx: 0,
			cy: 0,
			width: 0,
			height: 0
		},
		buildPath: function(e, t) {
			var n = t.cx, r = t.cy, i = t.width / 2, a = t.height / 2;
			e.moveTo(n, r - a), e.lineTo(n + i, r), e.lineTo(n, r + a), e.lineTo(n - i, r), e.closePath();
		}
	}),
	pin: yo.extend({
		type: "pin",
		shape: {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		},
		buildPath: function(e, t) {
			var n = t.x, r = t.y, i = t.width / 5 * 3, a = Math.max(i, t.height), o = i / 2, s = o * o / (a - o), c = r - a + o + s, l = Math.asin(s / o), u = Math.cos(l) * o, d = Math.sin(l), f = Math.cos(l), p = o * .6, m = o * .7;
			e.moveTo(n - u, c + s), e.arc(n, c, o, Math.PI - l, Math.PI * 2 + l), e.bezierCurveTo(n + u - d * p, c + s + f * p, n, r - m, n, r), e.bezierCurveTo(n, r - m, n - u + d * p, c + s + f * p, n - u, c + s), e.closePath();
		}
	}),
	arrow: yo.extend({
		type: "arrow",
		shape: {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		},
		buildPath: function(e, t) {
			var n = t.height, r = t.width, i = t.x, a = t.y, o = r / 3 * 2;
			e.moveTo(i, a), e.lineTo(i + o, a + n), e.lineTo(i, a + n / 4 * 3), e.lineTo(i - o, a + n), e.lineTo(i, a), e.closePath();
		}
	}),
	triangle: sv
}, lv = {
	line: function(e, t, n, r, i) {
		i.x1 = e, i.y1 = t + r / 2, i.x2 = e + n, i.y2 = t + r / 2;
	},
	rect: function(e, t, n, r, i) {
		i.x = e, i.y = t, i.width = n, i.height = r;
	},
	roundRect: function(e, t, n, r, i) {
		i.x = e, i.y = t, i.width = n, i.height = r, i.r = Math.min(n, r) / 4;
	},
	square: function(e, t, n, r, i) {
		var a = Math.min(n, r);
		i.x = e, i.y = t, i.width = a, i.height = a;
	},
	circle: function(e, t, n, r, i) {
		i.cx = e + n / 2, i.cy = t + r / 2, i.r = Math.min(n, r) / 2;
	},
	diamond: function(e, t, n, r, i) {
		i.cx = e + n / 2, i.cy = t + r / 2, i.width = n, i.height = r;
	},
	pin: function(e, t, n, r, i) {
		i.x = e + n / 2, i.y = t + r / 2, i.width = n, i.height = r;
	},
	arrow: function(e, t, n, r, i) {
		i.x = e + n / 2, i.y = t + r / 2, i.width = n, i.height = r;
	},
	triangle: function(e, t, n, r, i) {
		i.cx = e + n / 2, i.cy = t + r / 2, i.width = n, i.height = r;
	}
}, uv = {};
F(cv, function(e, t) {
	uv[t] = new e();
});
var dv = yo.extend({
	type: "symbol",
	shape: {
		symbolType: "",
		x: 0,
		y: 0,
		width: 0,
		height: 0
	},
	calculateTextPosition: function(e, t, n) {
		var r = dn(e, t, n), i = this.shape;
		return i && i.symbolType === "pin" && t.position === "inside" && (r.y = n.y + n.height * .4), r;
	},
	buildPath: function(e, t, n) {
		var r = t.symbolType;
		if (r !== "none") {
			var i = uv[r];
			i ||= (r = "rect", uv[r]), lv[r](t.x, t.y, t.width, t.height, i.shape), i.buildPath(e, i.shape, n);
		}
	}
});
function fv(e, t) {
	if (this.type !== "image") {
		var n = this.style;
		this.__isEmptyBrush ? (n.stroke = e, n.fill = t || Q.color.neutral00, n.lineWidth = 2) : this.shape.symbolType === "line" ? n.stroke = e : n.fill = e, this.markRedraw();
	}
}
function pv(e, t, n, r, i, a, o) {
	var s = e.indexOf("empty") === 0;
	s && (e = e.substr(5, 1).toLowerCase() + e.substr(6));
	var c = e.indexOf("image://") === 0 ? Zd(e.slice(8), new Y(t, n, r, i), o ? "center" : "cover") : e.indexOf("path://") === 0 ? Xd(e.slice(7), {}, new Y(t, n, r, i), o ? "center" : "cover") : new dv({ shape: {
		symbolType: e,
		x: t,
		y: n,
		width: r,
		height: i
	} });
	return c.__isEmptyBrush = s, c.setColor = fv, a && c.setColor(a), c;
}
function mv(e) {
	return V(e) || (e = [+e, +e]), [e[0] || 0, e[1] || 0];
}
function hv(e, t) {
	if (e != null) return V(e) || (e = [e, e]), [ps(e[0], t[0]) || 0, ps(K(e[1], e[0]), t[1]) || 0];
}
//#endregion
//#region node_modules/echarts/lib/chart/line/LineSeries.js
var gv = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n.hasSymbolVisual = !0, n;
	}
	return t.prototype.getInitialData = function(e) {
		return sh(null, this, { useEncodeDefaulter: !0 });
	}, t.prototype.getLegendIcon = function(e) {
		var t = new ju(), n = pv("line", 0, e.itemHeight / 2, e.itemWidth, 0, e.lineStyle.stroke, !1);
		t.add(n), n.setStyle(e.lineStyle);
		var r = this.getData().getVisual("symbol"), i = this.getData().getVisual("symbolRotate"), a = r === "none" ? "circle" : r, o = e.itemHeight * .8, s = pv(a, (e.itemWidth - o) / 2, (e.itemHeight - o) / 2, o, o, e.itemStyle.fill);
		return t.add(s), s.setStyle(e.itemStyle), s.rotation = (e.iconRotate === "inherit" ? i : e.iconRotate || 0) * Math.PI / 180, s.setOrigin([e.itemWidth / 2, e.itemHeight / 2]), a.indexOf("empty") > -1 && (s.style.stroke = s.style.fill, s.style.fill = Q.color.neutral00, s.style.lineWidth = 2), t;
	}, t.type = "series.line", t.dependencies = ["grid", "polar"], t.defaultOption = {
		z: 3,
		coordinateSystem: "cartesian2d",
		legendHoverLink: !0,
		clip: !0,
		label: { position: "top" },
		endLabel: {
			show: !1,
			valueAnimation: !0,
			distance: 8
		},
		lineStyle: {
			width: 2,
			type: "solid"
		},
		emphasis: { scale: !0 },
		step: !1,
		smooth: !1,
		smoothMonotone: null,
		symbol: "emptyCircle",
		symbolSize: 6,
		symbolRotate: null,
		showSymbol: !0,
		showAllSymbol: "auto",
		connectNulls: !1,
		sampling: "none",
		animationEasing: "linear",
		progressive: 0,
		hoverLayerThreshold: Infinity,
		universalTransition: { divideShape: "clone" },
		triggerLineEvent: !1,
		triggerEvent: !1
	}, t;
}(Q_);
//#endregion
//#region node_modules/echarts/lib/chart/helper/labelHelper.js
function _v(e, t) {
	var n = e.mapDimensionsAll("defaultedLabel"), r = n.length;
	if (r === 1) {
		var i = Xp(e, t, n[0]);
		return i == null ? null : i + "";
	}
	if (r) {
		for (var a = [], o = 0; o < n.length; o++) a.push(Xp(e, t, n[o]));
		return a.join(" ");
	}
}
function vv(e, t) {
	var n = e.mapDimensionsAll("defaultedLabel");
	if (!V(t)) return t + "";
	for (var r = [], i = 0; i < n.length; i++) {
		var a = e.getDimensionIndex(n[i]);
		a >= 0 && r.push(t[a]);
	}
	return r.join(" ");
}
//#endregion
//#region node_modules/echarts/lib/chart/helper/Symbol.js
var yv = function(e) {
	r(t, e);
	function t(t, n, r, i) {
		var a = e.call(this) || this;
		return a.updateData(t, n, r, i), a;
	}
	return t.prototype._createSymbol = function(e, t, n, r, i, a) {
		this.removeAll();
		var o = pv(e, -1, -1, 2, 2, null, a);
		o.attr({
			z2: K(i, 100),
			culling: !0,
			scaleX: r[0] / 2,
			scaleY: r[1] / 2
		}), o.drift = bv, this._symbolType = e, this.add(o);
	}, t.prototype.stopSymbolAnimation = function(e) {
		this.childAt(0).stopAnimation(null, e);
	}, t.prototype.getSymbolType = function() {
		return this._symbolType;
	}, t.prototype.getSymbolPath = function() {
		return this.childAt(0);
	}, t.prototype.highlight = function() {
		Nl(this.childAt(0));
	}, t.prototype.downplay = function() {
		Pl(this.childAt(0));
	}, t.prototype.setZ = function(e, t) {
		var n = this.childAt(0);
		n.zlevel = e, n.z = t;
	}, t.prototype.setDraggable = function(e, t) {
		var n = this.childAt(0);
		n.draggable = e, n.cursor = !t && e ? "move" : n.cursor;
	}, t.prototype.updateData = function(e, n, r, i) {
		this.silent = !1;
		var a = e.getItemVisual(n, "symbol") || "circle", o = e.hostModel, s = t.getSymbolSize(e, n), c = t.getSymbolZ2(e, n), l = a !== this._symbolType, u = i && i.disableAnimation;
		if (l) {
			var d = e.getItemVisual(n, "symbolKeepAspect");
			this._createSymbol(a, e, n, s, c, d);
		} else {
			var f = this.childAt(0);
			f.silent = !1;
			var p = {
				scaleX: s[0] / 2,
				scaleY: s[1] / 2
			};
			u ? f.attr(p) : Pd(f, p, o, n), Bd(f);
		}
		if (this._updateCommon(e, n, s, r, i), l) {
			var f = this.childAt(0);
			if (!u) {
				var p = {
					scaleX: this._sizeX,
					scaleY: this._sizeY,
					style: { opacity: f.style.opacity }
				};
				f.scaleX = f.scaleY = 0, f.style.opacity = 0, Fd(f, p, o, n);
			}
		}
		u && this.childAt(0).stopAnimation("leave");
	}, t.prototype._updateCommon = function(e, t, n, r, i) {
		var a = this.childAt(0), o = e.hostModel, s, c, l, u, d, f, p, m, h;
		if (r && (s = r.emphasisItemStyle, c = r.blurItemStyle, l = r.selectItemStyle, u = r.focus, d = r.blurScope, p = r.labelStatesModels, m = r.hoverScale, h = r.cursorStyle, f = r.emphasisDisabled), !r || e.hasItemOption) {
			var g = r && r.itemModel ? r.itemModel : e.getItemModel(t), _ = g.getModel("emphasis");
			s = _.getModel("itemStyle").getItemStyle(), l = g.getModel(["select", "itemStyle"]).getItemStyle(), c = g.getModel(["blur", "itemStyle"]).getItemStyle(), u = _.get("focus"), d = _.get("blurScope"), f = _.get("disabled"), p = Bf(g), m = _.getShallow("scale"), h = g.getShallow("cursor");
		}
		var v = e.getItemVisual(t, "symbolRotate");
		a.attr("rotation", (v || 0) * Math.PI / 180 || 0);
		var y = hv(e.getItemVisual(t, "symbolOffset"), n);
		y && (a.x = y[0], a.y = y[1]), h && a.attr("cursor", h);
		var b = e.getItemVisual(t, "style"), x = b.fill;
		if (a instanceof To) {
			var S = a.style;
			a.useStyle(k({
				image: S.image,
				x: S.x,
				y: S.y,
				width: S.width,
				height: S.height
			}, b));
		} else a.__isEmptyBrush ? a.useStyle(k({}, b)) : a.useStyle(b), a.style.decal = null, a.setColor(x, i && i.symbolInnerColor), a.style.strokeNoScale = !0;
		var C = e.getItemVisual(t, "liftZ"), w = this._z2;
		C == null ? w != null && (a.z2 = w, this._z2 = null) : w ?? (this._z2 = a.z2, a.z2 += C);
		var T = i && i.useNameLabel;
		zf(a, p, {
			labelFetcher: o,
			labelDataIndex: t,
			defaultText: E,
			inheritColor: x,
			defaultOpacity: b.opacity
		});
		function E(t) {
			return T ? e.getName(t) : _v(e, t);
		}
		this._sizeX = n[0] / 2, this._sizeY = n[1] / 2;
		var D = a.ensureState("emphasis");
		D.style = s, a.ensureState("select").style = l, a.ensureState("blur").style = c;
		var O = m == null || m === !0 ? Math.max(1.1, 3 / this._sizeY) : isFinite(m) && m > 0 ? +m : 1;
		D.scaleX = this._sizeX * O, D.scaleY = this._sizeY * O, this.setSymbolScale(1), Ql(this, u, d, f);
	}, t.prototype.setSymbolScale = function(e) {
		this.scaleX = this.scaleY = e;
	}, t.prototype.fadeOut = function(e, t, n) {
		var r = this.childAt(0), i = Z(this).dataIndex, a = n && n.animation;
		if (this.silent = r.silent = !0, n && n.fadeLabel) {
			var o = r.getTextContent();
			o && Ld(o, { style: { opacity: 0 } }, t, {
				dataIndex: i,
				removeOpt: a,
				cb: function() {
					r.removeTextContent();
				}
			});
		} else r.removeTextContent();
		Ld(r, {
			style: { opacity: 0 },
			scaleX: 0,
			scaleY: 0
		}, t, {
			dataIndex: i,
			cb: e,
			removeOpt: a
		});
	}, t.getSymbolSize = function(e, t) {
		return mv(e.getItemVisual(t, "symbolSize"));
	}, t.getSymbolZ2 = function(e, t) {
		return e.getItemVisual(t, "z2");
	}, t;
}(ju);
function bv(e, t) {
	this.parent.drift(e, t);
}
//#endregion
//#region node_modules/echarts/lib/chart/helper/SymbolDraw.js
function xv(e, t, n, r) {
	return t && !isNaN(t[0]) && !isNaN(t[1]) && !(r && r.isIgnore && r.isIgnore(n)) && !(r && r.clipShape && !r.clipShape.contain(t[0], t[1])) && e.getItemVisual(n, "symbol") !== "none";
}
function Sv(e) {
	return e != null && !G(e) && (e = { isIgnore: e }), e || {};
}
function Cv(e) {
	var t = e.hostModel, n = t.getModel("emphasis");
	return {
		emphasisItemStyle: n.getModel("itemStyle").getItemStyle(),
		blurItemStyle: t.getModel(["blur", "itemStyle"]).getItemStyle(),
		selectItemStyle: t.getModel(["select", "itemStyle"]).getItemStyle(),
		focus: n.get("focus"),
		blurScope: n.get("blurScope"),
		emphasisDisabled: n.get("disabled"),
		hoverScale: n.get("scale"),
		labelStatesModels: Bf(t),
		cursorStyle: t.get("cursor")
	};
}
function wv(e, t, n, r, i, a, o) {
	var s = new e(t, n, r, i);
	return s.setPosition(a), t.setItemGraphicEl(n, s), o.add(s), s;
}
var Tv = function() {
	function e(e) {
		this.group = new ju(), this._SymbolCtor = e || yv;
	}
	return e.prototype.updateData = function(e, t) {
		this._progressiveEls = null, t = Sv(t);
		var n = this.group, r = e.hostModel, i = this._data, a = this._SymbolCtor, o = t.disableAnimation, s = this._seriesScope = Cv(e), c = { disableAnimation: o }, l = t.getSymbolPoint || function(t) {
			return e.getItemLayout(t);
		};
		i || n.removeAll(), e.diff(i).add(function(r) {
			var i = l(r);
			xv(e, i, r, t) && wv(a, e, r, s, c, i, n);
		}).update(function(u, d) {
			var f = i.getItemGraphicEl(d), p = l(u);
			if (!xv(e, p, u, t)) {
				n.remove(f);
				return;
			}
			var m = e.getItemVisual(u, "symbol") || "circle", h = f && f.getSymbolType && f.getSymbolType();
			if (!f || h && h !== m) n.remove(f), f = new a(e, u, s, c), f.setPosition(p);
			else {
				f.updateData(e, u, s, c);
				var g = {
					x: p[0],
					y: p[1]
				};
				o ? f.attr(g) : Pd(f, g, r);
			}
			n.add(f), e.setItemGraphicEl(u, f);
		}).remove(function(e) {
			var t = i.getItemGraphicEl(e);
			t && t.fadeOut(function() {
				n.remove(t);
			}, r);
		}).execute(), this._getSymbolPoint = l, this._data = e;
	}, e.prototype.updateLayout = function(e) {
		var t = this._data;
		if (t) for (var n = this, r = t.getStore(), i = 0, a = r.count(); i < a; i++) {
			var o = t.getItemGraphicEl(i), s = n._getSymbolPoint(i);
			xv(t, s, i, e) ? (o ||= wv(n._SymbolCtor, t, i, n._seriesScope, { disableAnimation: !0 }, s, n.group), o.stopAnimation(), o.setPosition(s), o.markRedraw()) : o && (n.group.remove(o), t.setItemGraphicEl(i, null));
		}
	}, e.prototype.incrementalPrepareUpdate = function(e) {
		this._seriesScope = Cv(e), this._data = null, this.group.removeAll();
	}, e.prototype.incrementalUpdate = function(e, t, n, r) {
		this._progressiveEls = [], r = Sv(r);
		function i(e) {
			e.isGroup || (e.incremental = n, e.ensureState("emphasis").hoverLayer = 2);
		}
		for (var a = e.start; a < e.end; a++) {
			var o = t.getItemLayout(a);
			if (xv(t, o, a, r)) {
				var s = new this._SymbolCtor(t, a, this._seriesScope);
				s.traverse(i), s.setPosition(o), this.group.add(s), t.setItemGraphicEl(a, s), this._progressiveEls.push(s);
			}
		}
	}, e.prototype.eachRendered = function(e) {
		Cf(this._progressiveEls || this.group, e);
	}, e.prototype.remove = function(e) {
		var t = this.group, n = this._data;
		n && e ? n.eachItemGraphicEl(function(e) {
			e.fadeOut(function() {
				t.remove(e);
			}, n.hostModel);
		}) : t.removeAll();
	}, e;
}();
//#endregion
//#region node_modules/echarts/lib/chart/line/helper.js
function Ev(e, t, n) {
	var r = e.getBaseAxis(), i = e.getOtherAxis(r), a = Dv(i, n), o = r.dim, s = i.dim, c = t.mapDimension(s), l = t.mapDimension(o), u = +(s === "x" || s === "radius"), d = I(e.dimensions, function(e) {
		return t.mapDimension(e);
	}), f = !1, p = t.getCalculationInfo("stackResultDimension");
	return rh(t, d[0]) && (f = !0, d[0] = p), rh(t, d[1]) && (f = !0, d[1] = p), {
		dataDimsForPoint: d,
		valueStart: a,
		valueAxisDim: s,
		baseAxisDim: o,
		stacked: !!f,
		valueDim: c,
		baseDim: l,
		baseDataOffset: u,
		stackedOverDimension: t.getCalculationInfo("stackedOverDimension")
	};
}
function Dv(e, t) {
	var n = 0, r = e.scale.getExtent();
	return t === "start" ? n = r[0] : t === "end" ? n = r[1] : W(t) && !isNaN(t) ? n = t : r[0] > 0 ? n = r[0] : r[1] < 0 && (n = r[1]), n;
}
function Ov(e, t, n, r) {
	var i = NaN;
	e.stacked && (i = n.get(n.getCalculationInfo("stackedOverDimension"), r)), isNaN(i) && (i = e.valueStart);
	var a = e.baseDataOffset, o = [];
	return o[a] = n.get(e.baseDim, r), o[1 - a] = i, t.dataToPoint(o);
}
function kv(e, t) {
	return !isFinite(e) || !isFinite(t);
}
//#endregion
//#region node_modules/echarts/lib/util/vendor.js
var Av = typeof Float32Array < "u" ? Float32Array : void 0, jv = typeof Float64Array < "u" ? Float64Array : void 0;
function Mv(e) {
	return Nv({ ctor: Av }, e).arr;
}
function Nv(e, t) {
	var n = e.arr, r = e.ctor;
	if (t > ws && (t = ws), !n || e.typed && n.length < t) {
		var i = void 0;
		if (r) try {
			i = new r(t), e.typed = !0, n && i.set(n);
		} catch {}
		if (!i && (i = [], e.typed = !1, n)) for (var a = 0, o = n.length; a < o; a++) i[a] = n[a];
		e.arr = i;
	}
	return e;
}
//#endregion
//#region node_modules/echarts/lib/chart/line/lineAnimationDiff.js
function Pv(e, t) {
	var n = [];
	return t.diff(e).add(function(e) {
		n.push({
			cmd: "+",
			idx: e
		});
	}).update(function(e, t) {
		n.push({
			cmd: "=",
			idx: t,
			idx1: e
		});
	}).remove(function(e) {
		n.push({
			cmd: "-",
			idx: e
		});
	}).execute(), n;
}
function Fv(e, t, n, r, i, a, o, s) {
	for (var c = Pv(e, t), l = [], u = [], d = [], f = [], p = [], m = [], h = [], g = Ev(i, t, o), _ = e.getLayout("points") || [], v = t.getLayout("points") || [], y = 0; y < c.length; y++) {
		var b = c[y], x = !0, S = void 0, C = void 0;
		switch (b.cmd) {
			case "=":
				S = b.idx * 2, C = b.idx1 * 2;
				var w = _[S], T = _[S + 1], E = v[C], D = v[C + 1];
				(isNaN(w) || isNaN(T)) && (w = E, T = D), l.push(w, T), u.push(E, D), d.push(n[S], n[S + 1]), f.push(r[C], r[C + 1]), h.push(t.getRawIndex(b.idx1));
				break;
			case "+":
				var O = b.idx, k = g.dataDimsForPoint, A = i.dataToPoint([t.get(k[0], O), t.get(k[1], O)]);
				C = O * 2, l.push(A[0], A[1]), u.push(v[C], v[C + 1]);
				var j = Ov(g, i, t, O);
				d.push(j[0], j[1]), f.push(r[C], r[C + 1]), h.push(t.getRawIndex(O));
				break;
			case "-": x = !1;
		}
		x && (p.push(b), m.push(m.length));
	}
	m.sort(function(e, t) {
		return h[e] - h[t];
	});
	for (var M = l.length, ee = Mv(M), N = Mv(M), P = Mv(M), F = Mv(M), I = [], y = 0; y < m.length; y++) {
		var te = m[y], L = y * 2, ne = te * 2;
		ee[L] = l[ne], ee[L + 1] = l[ne + 1], N[L] = u[ne], N[L + 1] = u[ne + 1], P[L] = d[ne], P[L + 1] = d[ne + 1], F[L] = f[ne], F[L + 1] = f[ne + 1], I[y] = p[te];
	}
	return {
		current: ee,
		next: N,
		stackedOnCurrent: P,
		stackedOnNext: F,
		status: I
	};
}
//#endregion
//#region node_modules/echarts/lib/chart/line/poly.js
var Iv = Math.min, Lv = Math.max;
function Rv(e, t, n, r, i, a, o, s, c) {
	for (var l, u, d, f, p, m, h = n, g = 0; g < r; g++) {
		var _ = t[h * 2], v = t[h * 2 + 1];
		if (h >= i || h < 0) break;
		if (kv(_, v)) {
			if (c) {
				h += a;
				continue;
			}
			break;
		}
		if (h === n) e[a > 0 ? "moveTo" : "lineTo"](_, v), d = _, f = v;
		else {
			var y = _ - l, b = v - u;
			if (y * y + b * b < .5) {
				h += a;
				continue;
			}
			if (o > 0) {
				for (var x = h + a, S = t[x * 2], C = t[x * 2 + 1]; S === _ && C === v && g < r;) g++, x += a, h += a, S = t[x * 2], C = t[x * 2 + 1], _ = t[h * 2], v = t[h * 2 + 1], y = _ - l, b = v - u;
				var w = g + 1;
				if (c) for (; kv(S, C) && w < r;) w++, x += a, S = t[x * 2], C = t[x * 2 + 1];
				var T = .5, E = 0, D = 0, O = void 0, k = void 0;
				if (w >= r || kv(S, C)) p = _, m = v;
				else {
					E = S - l, D = C - u;
					var A = _ - l, j = S - _, M = v - u, ee = C - v, N = void 0, P = void 0;
					if (s === "x") {
						N = Math.abs(A), P = Math.abs(j);
						var F = E > 0 ? 1 : -1;
						p = _ - F * N * o, m = v, O = _ + F * P * o, k = v;
					} else if (s === "y") {
						N = Math.abs(M), P = Math.abs(ee);
						var I = D > 0 ? 1 : -1;
						p = _, m = v - I * N * o, O = _, k = v + I * P * o;
					} else N = Math.sqrt(A * A + M * M), P = Math.sqrt(j * j + ee * ee), T = P / (P + N), p = _ - E * o * (1 - T), m = v - D * o * (1 - T), O = _ + E * o * T, k = v + D * o * T, O = Iv(O, Lv(S, _)), k = Iv(k, Lv(C, v)), O = Lv(O, Iv(S, _)), k = Lv(k, Iv(C, v)), E = O - _, D = k - v, p = _ - E * N / P, m = v - D * N / P, p = Iv(p, Lv(l, _)), m = Iv(m, Lv(u, v)), p = Lv(p, Iv(l, _)), m = Lv(m, Iv(u, v)), E = _ - p, D = v - m, O = _ + E * P / N, k = v + D * P / N;
				}
				e.bezierCurveTo(d, f, p, m, _, v), d = O, f = k;
			} else e.lineTo(_, v);
		}
		l = _, u = v, h += a;
	}
	return g;
}
var zv = function() {
	function e() {
		this.smooth = 0, this.smoothConstraint = !0;
	}
	return e;
}(), Bv = function(e) {
	r(t, e);
	function t(t) {
		var n = e.call(this, t) || this;
		return n.type = "ec-polyline", n;
	}
	return t.prototype.getDefaultStyle = function() {
		return {
			stroke: Q.color.neutral99,
			fill: null
		};
	}, t.prototype.getDefaultShape = function() {
		return new zv();
	}, t.prototype.buildPath = function(e, t) {
		var n = t.points, r = 0, i = n.length / 2;
		if (t.connectNulls) {
			for (; i > 0 && kv(n[i * 2 - 2], n[i * 2 - 1]); i--);
			for (; r < i && kv(n[r * 2], n[r * 2 + 1]); r++);
		}
		for (; r < i;) r += Rv(e, n, r, i, i, 1, t.smooth, t.smoothMonotone, t.connectNulls) + 1;
	}, t.prototype.getPointOn = function(e, t) {
		this.path || (this.createPathProxy(), this.buildPath(this.path, this.shape));
		for (var n = this.path.data, r = qa.CMD, i, a, o = t === "x", s = [], c = 0; c < n.length;) {
			var l = n[c++], u = void 0, d = void 0, f = void 0, p = void 0, m = void 0, h = void 0, g = void 0;
			switch (l) {
				case r.M:
					i = n[c++], a = n[c++];
					break;
				case r.L:
					if (u = n[c++], d = n[c++], g = o ? (e - i) / (u - i) : (e - a) / (d - a), g <= 1 && g >= 0) {
						var _ = o ? (d - a) * g + a : (u - i) * g + i;
						return o ? [e, _] : [_, e];
					}
					i = u, a = d;
					break;
				case r.C:
					u = n[c++], d = n[c++], f = n[c++], p = n[c++], m = n[c++], h = n[c++];
					var v = o ? or(i, u, f, m, e, s) : or(a, d, p, h, e, s);
					if (v > 0) for (var y = 0; y < v; y++) {
						var b = s[y];
						if (b <= 1 && b >= 0) {
							var _ = o ? ir(a, d, p, h, b) : ir(i, u, f, m, b);
							return o ? [e, _] : [_, e];
						}
					}
					i = m, a = h;
			}
		}
	}, t;
}(yo), Vv = function(e) {
	r(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t;
}(zv), Hv = function(e) {
	r(t, e);
	function t(t) {
		var n = e.call(this, t) || this;
		return n.type = "ec-polygon", n;
	}
	return t.prototype.getDefaultShape = function() {
		return new Vv();
	}, t.prototype.buildPath = function(e, t) {
		var n = t.points, r = t.stackedOnPoints, i = 0, a = n.length / 2, o = t.smoothMonotone;
		if (t.connectNulls) {
			for (; a > 0 && kv(n[a * 2 - 2], n[a * 2 - 1]); a--);
			for (; i < a && kv(n[i * 2], n[i * 2 + 1]); i++);
		}
		for (; i < a;) {
			var s = Rv(e, n, i, a, a, 1, t.smooth, o, t.connectNulls);
			Rv(e, r, i + s - 1, s, a, -1, t.stackedOnSmooth, o, t.connectNulls), i += s + 1, e.closePath();
		}
	}, t;
}(yo);
//#endregion
//#region node_modules/echarts/lib/chart/helper/createRenderPlanner.js
function Uv() {
	var e = X();
	return function(t) {
		var n = e(t), r = t.pipelineContext, i = !!n.large, a = !!n.progressiveRender, o = n.large = !!(r && r.large), s = n.progressiveRender = !!(r && r.progressiveRender);
		return (i !== o || a !== s) && "reset";
	};
}
//#endregion
//#region node_modules/echarts/lib/view/Chart.js
var Wv = X(), Gv = Uv(), Kv = function() {
	function e() {
		this.group = new ju(), this.uid = dh("viewChart"), this.renderTask = s_({
			plan: Yv,
			reset: Xv
		}), this.renderTask.context = { view: this };
	}
	return e.prototype.init = function(e, t) {}, e.prototype.render = function(e, t, n, r) {}, e.prototype.highlight = function(e, t, n, r) {
		var i = e.getData(r && r.dataType);
		i && Jv(i, r, "emphasis");
	}, e.prototype.downplay = function(e, t, n, r) {
		var i = e.getData(r && r.dataType);
		i && Jv(i, r, "normal");
	}, e.prototype.remove = function(e, t) {
		this.group.removeAll();
	}, e.prototype.dispose = function(e, t) {}, e.prototype.updateView = function(e, t, n, r) {
		this.render(e, t, n, r);
	}, e.prototype.updateVisual = function(e, t, n, r) {
		this.render(e, t, n, r);
	}, e.prototype.eachRendered = function(e) {
		Cf(this.group, e);
	}, e.markUpdateMethod = function(e, t) {
		Wv(e).updateMethod = t;
	}, e.protoInitialize = function() {
		var t = e.prototype;
		t.type = "chart";
	}(), e;
}();
function qv(e, t, n) {
	e && iu(e) && (t === "emphasis" ? Nl : Pl)(e, n);
}
function Jv(e, t, n) {
	var r = fc(e, t), i = t && t.highlightKey != null ? au(t.highlightKey) : null;
	r == null ? e.eachItemGraphicEl(function(e) {
		qv(e, n, i);
	}) : F(qs(r), function(t) {
		qv(e.getItemGraphicEl(t), n, i);
	});
}
Ie(Kv, ["dispose"]), Ue(Kv);
function Yv(e) {
	return Gv(e.model);
}
function Xv(e) {
	var t = e.model, n = e.ecModel, r = e.api, i = e.payload, a = t.pipelineContext.progressiveRender, o = e.view, s = i && Wv(i).updateMethod, c = a ? "incrementalPrepareRender" : s && o[s] ? s : "render";
	return c !== "render" && o[c](t, n, r, i), Zv[c];
}
var Zv = {
	incrementalPrepareRender: { progress: function(e, t) {
		t.view.incrementalRender(e, t.model, t.ecModel, t.api, t.payload);
	} },
	render: {
		forceFirstProgress: !0,
		progress: function(e, t) {
			t.view.render(t.model, t.ecModel, t.api, t.payload);
		}
	}
};
//#endregion
//#region node_modules/echarts/lib/chart/helper/createClipPathFromCoordSys.js
function Qv(e, t, n, r, i) {
	var a = e.getArea(), o = a.x, s = a.y, c = a.width, l = a.height, u = n.get(["lineStyle", "width"]) || 0;
	o -= u / 2, s -= u / 2, c += u, l += u, c = Math.ceil(c), o !== Math.floor(o) && (o = Math.floor(o), c++);
	var d = new No({ shape: {
		x: o,
		y: s,
		width: c,
		height: l
	} });
	if (t) {
		var f = e.getBaseAxis(), p = f.isHorizontal(), m = f.inverse;
		p ? (m && (d.shape.x += c), d.shape.width = 0) : (m || (d.shape.y += l), d.shape.height = 0);
		var h = H(i) ? function(e) {
			i(e, d);
		} : null;
		Fd(d, { shape: {
			width: c,
			height: l,
			x: o,
			y: s
		} }, n, null, r, h);
	}
	return d;
}
function $v(e, t, n) {
	var r = e.getArea(), i = vs(r.r0, 1), a = vs(r.r, 1), o = new Qu({ shape: {
		cx: vs(e.cx, 1),
		cy: vs(e.cy, 1),
		r0: i,
		r: a,
		startAngle: r.startAngle,
		endAngle: r.endAngle,
		clockwise: r.clockwise
	} });
	return t && (e.getBaseAxis().dim === "angle" ? o.shape.endAngle = r.startAngle : o.shape.r = i, Fd(o, { shape: {
		endAngle: r.endAngle,
		r: a
	} }, n)), o;
}
function ey(e, t, n, r, i) {
	return e ? e.type === "polar" ? $v(e, t, n) : e.type === "cartesian2d" ? Qv(e, t, n, r, i) : null : null;
}
//#endregion
//#region node_modules/echarts/lib/coord/CoordinateSystem.js
function ty(e, t) {
	return e.type === t;
}
//#endregion
//#region node_modules/echarts/lib/scale/Scale.js
var ny = function() {
	function e() {}
	return e.prototype.isBlank = function() {
		return this._isBlank;
	}, e.prototype.setBlank = function(e) {
		this._isBlank = e;
	}, e;
}();
Ue(ny);
//#endregion
//#region node_modules/echarts/lib/data/OrdinalMeta.js
var ry = 0, iy = function() {
	function e(e) {
		this.categories = e.categories || [], this._needCollect = e.needCollect, this._deduplication = e.deduplication, this.uid = ++ry, this._onCollect = e.onCollect;
	}
	return e.createByAxisModel = function(t) {
		var n = t.option, r = n.data, i = r && I(r, ay);
		return new e({
			categories: i,
			needCollect: !i,
			deduplication: n.dedplication !== !1
		});
	}, e.prototype.getOrdinal = function(e) {
		return this._getOrCreateMap().get(e);
	}, e.prototype.parseAndCollect = function(e) {
		var t, n = this._needCollect;
		if (!U(e) && !n) return e;
		if (n && !this._deduplication) return t = this.categories.length, this.categories[t] = e, this._onCollect && this._onCollect(e, t), t;
		var r = this._getOrCreateMap();
		return t = r.get(e), t ?? (n ? (t = this.categories.length, this.categories[t] = e, r.set(e, t), this._onCollect && this._onCollect(e, t)) : t = NaN), t;
	}, e.prototype._getOrCreateMap = function() {
		return this._map ||= q(this.categories);
	}, e;
}();
function ay(e) {
	return G(e) && e.value != null ? e.value : e + "";
}
var oy = R({
	needTransform: 1,
	normalize: 1,
	scale: 1,
	transformIn: 1,
	transformOut: 1,
	contain: 1,
	getExtent: 1,
	getExtentUnsafe: 1,
	setExtent: 1,
	setExtent2: 1,
	getFilter: 1,
	sanitize: 1,
	getDefaultStartValue: 1,
	freeze: 1
});
function sy(e, t, n) {
	var r;
	e ||= {};
	var i = Hh();
	if (i) {
		var a = i.createBreakScaleMapper(t, n);
		a.hasBreaks() && (F(oy, function(t) {
			a[t] && (e[t] = z(a[t], a));
		}), r = a);
	}
	return r ?? my(e, n), {
		brk: r,
		mapper: e
	};
}
function cy(e, t) {
	F(oy, function(n) {
		e[n] = t[n];
	});
}
function ly(e, t) {
	e.freeze = Ee;
}
function uy(e) {
	return e.getExtentUnsafe(0, 2);
}
function dy(e, t) {
	return e.getExtentUnsafe(1, t) || e.getExtentUnsafe(0, t);
}
function fy(e) {
	var t = dy(e, 3);
	return t[1] - t[0];
}
function py(e) {
	var t = e.getExtentUnsafe(0, 3);
	return t[1] - t[0];
}
function my(e, t) {
	var n = e || {}, r = [];
	return n._extents = r, r[0] = t ? t.slice() : wc(), k(n, hy), n;
}
var hy = {
	needTransform: function() {
		return !1;
	},
	normalize: function(e) {
		var t = this._extents[1] || this._extents[0];
		return t[1] === t[0] ? .5 : (e - t[0]) / (t[1] - t[0]);
	},
	scale: function(e) {
		var t = this._extents[1] || this._extents[0];
		return e * (t[1] - t[0]) + t[0];
	},
	transformIn: function(e) {
		return e;
	},
	transformOut: function(e) {
		return e;
	},
	contain: function(e) {
		var t = dy(this, null);
		return e >= t[0] && e <= t[1];
	},
	getExtent: function() {
		return this._extents[0].slice();
	},
	getExtentUnsafe: function(e) {
		return this._extents[e];
	},
	setExtent: function(e, t) {
		gy(this._extents, 0, e, t);
	},
	setExtent2: function(e, t, n) {
		var r = this._extents;
		r[e] || (r[e] = r[0].slice()), gy(r, e, t, n);
	},
	freeze: function() {}
};
function gy(e, t, n, r) {
	Ac(n, r) && (e[t][0] = n, e[t][1] = r);
}
//#endregion
//#region node_modules/echarts/lib/scale/helper.js
function _y(e) {
	return vy(e) || by(e);
}
function vy(e) {
	return e.type === "interval";
}
function yy(e) {
	return e.type === "time";
}
function by(e) {
	return e.type === "log";
}
function xy(e) {
	return e.type === "ordinal";
}
function Sy(e) {
	var t = As(e), n = ss(10, t), r = is(e / n);
	return r ? r === 2 ? r = 3 : r === 3 ? r = 5 : r *= 2 : r = 1, vs(r * n, -t);
}
function Cy(e) {
	return bs(e) + 2;
}
function wy(e, t) {
	return cs(e) / cs(t);
}
function Ty(e, t, n) {
	var r = n && n.lookup;
	if (r) {
		for (var i = 0; i < r.from.length; i++) if (e === r.from[i]) return r.to[i];
	}
	return ss(t, e);
}
function Ey(e, t, n) {
	var r = e.slice();
	if (r[0] === r[1]) {
		var i = n && n.ctnShp;
		if (r[0] !== 0) {
			var a = rs(r[0]);
			t[1] || (r[1] += a / 2), r[0] -= a / 2;
		} else i && (r[0] = -1), r[1] = 1;
	}
	return (!kc(r[0]) || !kc(r[1])) && (r[0] = 0, r[1] = 1), r[1] < r[0] && r.reverse(), r;
}
function Dy(e, t) {
	return [e[0] !== t[0], e[1] !== t[1]];
}
function Oy(e, t) {
	return e ||= t, is(ns(e, 1));
}
function ky(e, t, n) {
	var r = uy(e), i = r[0], a = e.count(), o = Math.max((t || 0) + 1, 1);
	i !== 0 && o > 1 && a / o > 2 && (i = Math.round(Math.ceil(i / o) * o)), i !== r[0] && c(r[0], !0, !0);
	for (var s = i; s <= r[1]; s += o) c(s, !1, s === r[0] || s === r[1]);
	s - o !== r[1] && c(r[1], !0, !0);
	function c(e, t, r) {
		n({
			value: e,
			offInterval: t
		}, r);
	}
}
//#endregion
//#region node_modules/echarts/lib/scale/Ordinal.js
var Ay = function(e) {
	r(t, e);
	function t(n) {
		var r = e.call(this) || this;
		r.type = "ordinal", r.parse = t.parse, cy(r, t.decoratedMethods);
		var i = n.ordinalMeta;
		i ||= new iy({}), V(i) && (i = new iy({ categories: I(i, function(e) {
			return G(e) ? e.value : e;
		}) })), r._ordinalMeta = i;
		var a = sy(null, null, n.extent || [0, i.categories.length - 1]);
		return r._mapper = a.mapper, ly(r, a.mapper), r;
	}
	return t.parse = function(e) {
		return e == null ? e = NaN : U(e) ? (e = this._ordinalMeta.getOrdinal(e), e ??= NaN) : e = is(e), e;
	}, t.prototype.getTicks = function() {
		var e = [];
		return ky(this, 0, function(t) {
			e.push(t);
		}), e;
	}, t.prototype.getMinorTicks = function(e) {}, t.prototype.setSortInfo = function(e) {
		if (e == null) {
			this._ordinalNumbersByTick = this._ticksByOrdinalNumber = null;
			return;
		}
		for (var t = e.ordinalNumbers, n = this._ordinalNumbersByTick = [], r = this._ticksByOrdinalNumber = [], i = 0, a = this._ordinalMeta.categories.length, o = ts(a, t.length); i < o; ++i) {
			var s = n[i] = t[i];
			r[s] = i;
		}
		for (var c = 0; i < a; ++i) {
			for (; r[c] != null;) c++;
			n[i] = c, r[c] = i;
		}
	}, t.prototype._getTickNumber = function(e) {
		var t = this._ticksByOrdinalNumber;
		return t && e >= 0 && e < t.length ? t[e] : e;
	}, t.prototype.getRawOrdinalNumber = function(e) {
		var t = this._ordinalNumbersByTick;
		return t && e >= 0 && e < t.length ? t[e] : e;
	}, t.prototype.getLabel = function(e) {
		if (!this.isBlank()) {
			var t = this.getRawOrdinalNumber(e.value), n = this._ordinalMeta.categories[t];
			return n == null ? "" : n + "";
		}
	}, t.prototype.count = function() {
		var e = uy(this._mapper);
		return e[1] - e[0] + 1;
	}, t.prototype.getOrdinalMeta = function() {
		return this._ordinalMeta;
	}, t.type = "ordinal", t.decoratedMethods = {
		needTransform: function() {
			return this._mapper.needTransform();
		},
		contain: function(e) {
			return this._mapper.contain(this._getTickNumber(e)) && e >= 0 && e < this._ordinalMeta.categories.length;
		},
		normalize: function(e) {
			return this._mapper.normalize(this._getTickNumber(e));
		},
		scale: function(e) {
			return this.getRawOrdinalNumber(is(this._mapper.scale(e)));
		},
		transformIn: function(e, t) {
			return this._mapper.transformIn(this._getTickNumber(e), t);
		},
		transformOut: function(e, t) {
			return this.getRawOrdinalNumber(this._mapper.transformOut(e, t));
		},
		getExtent: function() {
			return this._mapper.getExtent();
		},
		getExtentUnsafe: function(e, t) {
			return this._mapper.getExtentUnsafe(e, t);
		},
		setExtent: function(e, t) {
			return this._mapper.setExtent(e, t);
		},
		setExtent2: function(e, t, n) {
			return this._mapper.setExtent2(e, t, n);
		}
	}, t;
}(ny);
ny.registerClass(Ay);
//#endregion
//#region node_modules/echarts/lib/scale/minorTicks.js
function jy(e, t, n, r) {
	for (var i = e.getTicks({ expandToNicedExtent: !0 }), a = [], o = e.getExtent(), s = 1; s < i.length; s++) {
		var c = i[s], l = i[s - 1];
		if (!(l.break || c.break)) {
			for (var u = 0, d = [], f = (c.value - l.value) / t, p = Cy(f); u < t - 1;) {
				var m = vs(l.value + (u + 1) * f, p);
				m > o[0] && m < o[1] && d.push(m), u++;
			}
			var h = Hh();
			h && h.pruneTicksByBreak("auto", d, n, function(e) {
				return e;
			}, r, o), a.push(d);
		}
	}
	return a;
}
//#endregion
//#region node_modules/echarts/lib/scale/Interval.js
var My = function(e) {
	r(t, e);
	function t(n) {
		var r = e.call(this) || this;
		return r.type = "interval", r.parse = t.parse, n ||= {}, r.brk = sy(r, Uh(r, n), null).brk, r._cfg = {
			interval: 0,
			intervalPrecision: 2,
			intervalCount: void 0,
			niceExtent: void 0
		}, r;
	}
	return t.parse = function(e) {
		return e == null || e === "" ? NaN : Number(e);
	}, t.prototype.getConfig = function() {
		return E(this._cfg);
	}, t.prototype.setConfig = function(e) {
		var t = uy(this);
		this._cfg = e = E(e), e.niceExtent ?? (e.niceExtent = t.slice()), e.intervalPrecision ?? (e.intervalPrecision = Cy(e.interval));
	}, t.prototype.getTicks = function(e) {
		e ||= {};
		var t = this._cfg, n = t.interval, r = uy(this), i = t.niceExtent, a = t.intervalPrecision, o = Hh(), s = this.brk, c = o && s, l = [];
		if (!n) return l;
		if (e.breakTicks === "only_break" && c) return o.addBreaksToTicks(l, s.breaks, r), l;
		var u = 3e3;
		r[0] < i[0] && l.push({ value: e.expandToNicedExtent ? vs(i[0] - n, a) : r[0] });
		for (var d = function(e, t) {
			return is((t - e) / n);
		}, f = t.intervalCount, p = i[0], m = 0;; m++) {
			if (f == null) {
				if (p > i[1] || !isFinite(p) || !isFinite(i[1])) break;
			} else {
				if (m > f) break;
				p = ts(p, i[1]), m === f && (p = i[1]);
			}
			if (l.push({ value: p }), p = vs(p + n, a), s) {
				var h = s.calcNiceTickMultiple(p, d);
				h >= 0 && (p = vs(p + h * n, a));
			}
			if (l.length > 0 && p === l[l.length - 1].value) break;
			if (l.length > u) return [];
		}
		var g = l.length ? l[l.length - 1].value : i[1];
		return r[1] > g && l.push({ value: e.expandToNicedExtent ? vs(g + n, a) : r[1] }), c && o.pruneTicksByBreak(e.pruneByBreak, l, s.breaks, function(e) {
			return e.value;
		}, t.interval, r), c && e.breakTicks !== "none" && o.addBreaksToTicks(l, s.breaks, r), l;
	}, t.prototype.getMinorTicks = function(e) {
		return jy(this, e, Wh(this), this._cfg.interval);
	}, t.prototype.getLabel = function(e, t) {
		if (e == null) return "";
		var n = t && t.precision;
		return n == null ? n = bs(e.value) || 0 : n === "auto" && (n = this._cfg.intervalPrecision), Og(vs(e.value, n, !0));
	}, t.type = "interval", t;
}(ny);
ny.registerClass(My);
//#endregion
//#region node_modules/echarts/lib/scale/Time.js
var Ny = function(e, t, n, r) {
	for (; n < r;) {
		var i = n + r >>> 1;
		e[i][1] < t ? n = i + 1 : r = i;
	}
	return n;
}, Py = function(e) {
	r(t, e);
	function t(n) {
		var r = e.call(this) || this;
		return r.type = "time", r.parse = t.parse, r._locale = n.locale, r._useUTC = n.useUTC, r._interval = 0, r.brk = sy(r, Uh(r, n), null).brk, r;
	}
	return t.prototype.getLabel = function(e) {
		return ug(e.value, tg[lg(sg(this._minLevelUnit))] || tg.second, this._useUTC, this._locale);
	}, t.prototype.getFormattedLabel = function(e, t, n) {
		return dg(e, t, n, this._locale, this._useUTC);
	}, t.prototype.getTicks = function(e) {
		e ||= {};
		var t = this._interval, n = uy(this), r = Hh(), i = this.brk, a = r && i, o = [];
		if (!t) return o;
		var s = this._useUTC;
		if (a && e.breakTicks === "only_break") return Hh().addBreaksToTicks(o, i.breaks, n), o;
		o = Wy(this._minLevelUnit, this._approxInterval, s, n, py(this), i);
		var c = ng.length - 1, l = 0;
		return F(o, function(e) {
			e.time && (c = Math.min(c, M(ng, e.time.upperTimeUnit)), l = Math.max(l, e.time.level));
		}), a && Hh().pruneTicksByBreak(e.pruneByBreak, o, i.breaks, function(e) {
			return e.value;
		}, this._approxInterval, n), a && e.breakTicks !== "none" && Hh().addBreaksToTicks(o, i.breaks, n, function(e) {
			for (var t = Math.max(M(ng, fg(e.vmin, s)), M(ng, fg(e.vmax, s))), n = 0, r = 0; r < ng.length; r++) if (!Iy(ng[r], e.vmin, e.vmax, s)) {
				n = r;
				break;
			}
			var i = Math.min(n, c);
			return {
				level: l,
				lowerTimeUnit: ng[Math.max(i, t)],
				upperTimeUnit: ng[i]
			};
		}), o;
	}, t.prototype.getMinorTicks = function(e) {
		return jy(this, e, Wh(this), this._interval);
	}, t.prototype.setTimeInterval = function(e) {
		this._interval = e.interval, this._approxInterval = e.approxInterval, this._minLevelUnit = e.minLevelUnit;
	}, t.parse = function(e) {
		return W(e) ? Math.round(e) : +Os(e);
	}, t.type = "time", t;
}(ny), Fy = [
	["second", Kh],
	["minute", qh],
	["hour", Jh],
	["quarter-day", Jh * 6],
	["half-day", Jh * 12],
	["day", Yh * 1.2],
	["half-week", Yh * 3.5],
	["week", Yh * 7],
	["month", Yh * 31],
	["quarter", Yh * 95],
	["half-year", Xh / 2],
	["year", Xh]
];
function Iy(e, t, n, r) {
	return pg(new Date(t), e, r).getTime() === pg(new Date(n), e, r).getTime();
}
function Ly(e, t) {
	return e /= Yh, e > 16 ? 16 : e > 7.5 ? 7 : e > 3.5 ? 4 : e > 1.5 ? 2 : 1;
}
function Ry(e) {
	var t = 30 * Yh;
	return e /= t, e > 6 ? 6 : e > 3 ? 3 : e > 2 ? 2 : 1;
}
function zy(e) {
	return e /= Jh, e > 12 ? 12 : e > 6 ? 6 : e > 3.5 ? 4 : e > 2 ? 2 : 1;
}
function By(e, t) {
	return e /= t ? qh : Kh, e > 30 ? 30 : e > 20 ? 20 : e > 15 ? 15 : e > 10 ? 10 : e > 5 ? 5 : e > 2 ? 2 : 1;
}
function Vy(e) {
	return ns(js(e, !0), 1);
}
function Hy(e, t, n) {
	var r = Math.max(0, M(ng, t) - 1);
	return pg(new Date(e), ng[r], n).getTime();
}
function Uy(e, t) {
	var n = /* @__PURE__ */ new Date(0);
	n[e](1);
	var r = n.getTime();
	n[e](1 + t);
	var i = n.getTime() - r;
	return function(e, t) {
		return Math.max(0, Math.round((t - e) / i));
	};
}
function Wy(e, t, n, r, i, a) {
	var o = rg, s = 0;
	function c(e, t, n, i, o, c, l) {
		for (var u = Uy(o, e), d = t, f = new Date(d); d < n && d <= r[1] && (l.push({ value: d }), !(s++ > 3e3));) if (f[o](f[i]() + e), d = f.getTime(), a) {
			var p = a.calcNiceTickMultiple(d, u);
			p > 0 && (f[o](f[i]() + p * e), d = f.getTime());
		}
		l.push({
			value: d,
			notAdd: d > r[1]
		});
	}
	function l(e, i, a) {
		var o = [], s = !i.length;
		if (!Iy(sg(e), r[0], r[1], n)) {
			s && (i = [{ value: Hy(r[0], e, n) }, { value: r[1] }]);
			for (var l = 0; l < i.length - 1; l++) {
				var u = i[l].value, d = i[l + 1].value;
				if (u !== d) {
					var f = void 0, p = void 0, m = void 0, h = !1;
					switch (e) {
						case "year":
							f = Math.max(1, Math.round(t / Yh / 365)), p = mg(n), m = xg(n);
							break;
						case "half-year":
						case "quarter":
						case "month":
							f = Ry(t), p = hg(n), m = Sg(n);
							break;
						case "week":
						case "half-week":
						case "day":
							f = Ly(t, 31), p = gg(n), m = Cg(n), h = !0;
							break;
						case "half-day":
						case "quarter-day":
						case "hour":
							f = zy(t), p = _g(n), m = wg(n);
							break;
						case "minute":
							f = By(t, !0), p = vg(n), m = Tg(n);
							break;
						case "second":
							f = By(t, !1), p = yg(n), m = Eg(n);
							break;
						case "millisecond": f = Vy(t), p = bg(n), m = Dg(n);
					}
					d >= r[0] && u <= r[1] && c(f, u, d, p, m, h, o), e === "year" && a.length > 1 && l === 0 && a.unshift({ value: a[0].value - f });
				}
			}
			for (var l = 0; l < o.length; l++) a.push(o[l]);
		}
	}
	for (var u = [], d = [], f = 0, p = 0, m = 0; m < o.length; ++m) {
		var h = sg(o[m]);
		if (cg(o[m]) && (l(o[m], u[u.length - 1] || [], d), h !== (o[m + 1] ? sg(o[m + 1]) : null))) {
			if (d.length) {
				p = f, d.sort(function(e, t) {
					return e.value - t.value;
				});
				for (var g = [], _ = 0; _ < d.length; ++_) {
					var v = d[_].value;
					(_ === 0 || d[_ - 1].value !== v) && (g.push(d[_]), v >= r[0] && v <= r[1] && f++);
				}
				var y = i / t;
				if (f > y * 1.5 && p > y / 1.5 || (u.push(g), f > y || e === o[m])) break;
			}
			d = [];
		}
	}
	for (var b = L(I(u, function(e) {
		return L(e, function(e) {
			return e.value >= r[0] && e.value <= r[1] && !e.notAdd;
		});
	}), function(e) {
		return e.length > 0;
	}), x = b.length - 1, S = [], m = 0; m < b.length; ++m) for (var C = b[m], w = 0; w < C.length; ++w) {
		var T = fg(C[w].value, n);
		S.push({
			value: C[w].value,
			time: {
				level: x - m,
				upperTimeUnit: T,
				lowerTimeUnit: T
			}
		});
	}
	Fc(S, Ic, null), S.sort(function(e, t) {
		return e.value - t.value;
	});
	var E = S[0], D = S[S.length - 1], O = fg(r[0], n), k = fg(r[1], n);
	return (!E || E.value > r[0]) && S.unshift({
		value: r[0],
		time: {
			level: 0,
			upperTimeUnit: O,
			lowerTimeUnit: O
		},
		notNice: !0
	}), (!D || D.value < r[1]) && S.push({
		value: r[1],
		time: {
			level: 0,
			upperTimeUnit: k,
			lowerTimeUnit: k
		},
		notNice: !0
	}), S;
}
var Gy = function(e, t) {
	var n = e.getExtent();
	if (n[0] === n[1] && (n[0] -= Yh, n[1] += Yh), n[1] === -Infinity && n[0] === Infinity) {
		var r = /* @__PURE__ */ new Date();
		n[1] = +new Date(r.getFullYear(), r.getMonth(), r.getDate()), n[0] = n[1] - Yh;
	}
	e.setExtent(n[0], n[1]);
	var i = Oy(t.splitNumber, 10), a = py(e) / i, o = t.minInterval, s = t.maxInterval;
	o != null && a < o && (a = o), s != null && a > s && (a = s);
	var c = Fy.length, l = Math.min(Ny(Fy, a, 0, c), c - 1), u = Fy[l][1], d = Fy[Math.max(l - 1, 0)][0];
	e.setTimeInterval({
		approxInterval: a,
		interval: u,
		minLevelUnit: d
	});
};
ny.registerClass(Py);
//#endregion
//#region node_modules/echarts/lib/scale/Log.js
var Ky = 0, qy = 1, Jy = 2, Yy = function(e) {
	r(t, e);
	function t(n) {
		var r = e.call(this) || this;
		r.type = "log", r.parse = My.parse, r.base = n.logBase || 10;
		var i = [], a = [], o = r._lookup = {
			from: i,
			to: a
		};
		i[Ky] = i[qy] = a[Ky] = a[qy] = NaN, cy(r, t.mapperMethods);
		var s = Hh(), c = n.breakOption, l = { lookup: o };
		return s && s.parseAxisBreakOptionInwardTransform(c, r, { noNegative: !0 }, Jy, l), r.powStub = new My({ breakParsed: l.original }), r.intervalStub = new My({ breakParsed: l.transformed }), ly(r, r.intervalStub), r;
	}
	return t.prototype.getTicks = function(e) {
		var t = this.base, n = this.powStub, r = Hh(), i = this.intervalStub, a = { lookup: {
			from: i.getExtent(),
			to: n.getExtent()
		} };
		return I(i.getTicks(e || {}), function(e) {
			var i = e.value, o = Ty(i, t, a), s;
			if (r) {
				var c = r.getTicksBreakOutwardTransform(this, e, Wh(n), this._lookup);
				c && (s = c.vBreak, o = c.tickVal);
			}
			return {
				value: o,
				break: s
			};
		}, this);
	}, t.prototype.getMinorTicks = function(e) {
		return jy(this, e, Wh(this.powStub), this.intervalStub.getConfig().interval);
	}, t.prototype.getLabel = function(e, t) {
		return this.intervalStub.getLabel(e, t);
	}, t.type = "log", t.mapperMethods = {
		needTransform: function() {
			return !0;
		},
		normalize: function(e) {
			return this.intervalStub.normalize(wy(e, this.base));
		},
		scale: function(e) {
			return Ty(this.intervalStub.scale(e), this.base, null);
		},
		transformIn: function(e, t) {
			return e = wy(e, this.base), t && t.depth === 2 ? e : this.intervalStub.transformIn(e, t);
		},
		transformOut: function(e, t) {
			var n = t ? t.depth : null;
			return Xy.depth = n, Zy.lookup = this._lookup, Ty(n === 2 ? e : this.intervalStub.transformOut(e, Xy), this.base, Zy);
		},
		contain: function(e) {
			return this.powStub.contain(e);
		},
		setExtent: function(e, t) {
			this.setExtent2(0, e, t);
		},
		setExtent2: function(e, t, n) {
			if (!(!Ac(t, n) || t <= 0 || n <= 0)) {
				var r = Qy, i = Qy;
				if (e === 0) {
					var a = this._lookup;
					r = a.to, i = a.from;
				}
				this.powStub.setExtent2(e, r[Ky] = t, r[qy] = n);
				var o = this.base;
				this.intervalStub.setExtent2(e, i[Ky] = wy(t, o), i[qy] = wy(n, o));
			}
		},
		getFilter: function() {
			return { g: 0 };
		},
		sanitize: function(e, t) {
			return Ac(t[0], t[1]) && Ls(e) && e <= 0 && (e = t[0]), e;
		},
		getDefaultStartValue: function() {
			return 1;
		},
		getExtent: function() {
			return this.powStub.getExtent();
		},
		getExtentUnsafe: function(e, t) {
			return t === null ? this.powStub.getExtentUnsafe(e, null) : this.intervalStub.getExtentUnsafe(e, t);
		}
	}, t;
}(ny);
ny.registerClass(Yy);
var Xy = {}, Zy = {}, Qy = [], $y = {
	value: 1,
	category: 1,
	time: 1,
	log: 1
}, eb = X();
function tb(e) {
	var t = e.get("type");
	return (t == null || !Te($y, t) && !ny.getClass(t)) && (t = "value"), t;
}
function nb(e, t, n) {
	var r = Hh(), i;
	switch (r && (i = pb(e, t, n)), t) {
		case "category": return new Ay({
			ordinalMeta: e.getOrdinalMeta ? e.getOrdinalMeta() : e.getCategories(),
			extent: wc()
		});
		case "time": return new Py({
			locale: e.ecModel.getLocaleModel(),
			useUTC: e.ecModel.get("useUTC"),
			breakOption: i
		});
		case "log": return new Yy({
			logBase: e.get("logBase"),
			breakOption: i
		});
		case "value": return new My({ breakOption: i });
		default: return new ((ny.getClass(t)) || My)({});
	}
}
function rb(e, t, n) {
	var r = n ? dy(e, null) : e.getExtentUnsafe(0, null), i = r[0], a = r[1];
	return Ac(i, a) ? i === t || a === t ? 2 : i < t && a > t ? 1 : 3 : 3;
}
function ib(e) {
	eb(e).noOnMyZero = !0;
}
function ab(e) {
	return eb(e).noOnMyZero;
}
function ob(e) {
	var t = e.getLabelModel().get("formatter");
	if (e.type === "time") {
		var n = ig(t);
		return function(t, r) {
			return e.scale.getFormattedLabel(t, r, n);
		};
	}
	if (U(t)) return function(n) {
		var r = e.scale.getLabel(n);
		return t.replace("{value}", r ?? "");
	};
	if (H(t)) {
		if (e.type === "category") return function(n, r) {
			return t(sb(e, n), n.value - e.scale.getExtent()[0], null);
		};
		var r = Hh();
		return function(n, i) {
			var a = null;
			return r && (a = r.makeAxisLabelFormatterParamBreak(a, n.break)), t(sb(e, n), i, a);
		};
	}
	return function(t) {
		return e.scale.getLabel(t);
	};
}
function sb(e, t) {
	var n = e.scale;
	return xy(n) ? n.getLabel(t) : t.value;
}
function cb(e) {
	return e.get("interval") ?? "auto";
}
function lb(e) {
	return e.type === "category" && cb(e.getLabelModel()) === 0;
}
function ub(e, t) {
	var n = {};
	return F(e.mapDimensionsAll(t), function(t) {
		n[ih(e, t)] = !0;
	}), R(n);
}
function db(e) {
	return e === "middle" || e === "center";
}
function fb(e) {
	return e.getShallow("show");
}
function pb(e, t, n) {
	var r = e.get("breaks", !0);
	if (r != null) return !Hh() || !n || !mb(t) ? void 0 : r;
}
function mb(e) {
	return e !== "category";
}
function hb(e, t, n, r, i, a) {
	var o = by(e), s = o ? e.intervalStub : e;
	if (s.setExtent(r[0], r[1]), o) {
		var c = e.powStub, l = { depth: 2 }, u = e.transformOut(r[0], l), d = e.transformOut(r[1], l), f = Dy(n, r);
		t[0] && !f[0] && (u = i[0]), t[1] && !f[1] && (d = i[1]), c.setExtent(u, d);
	}
	s.setConfig(a);
}
function gb(e, t) {
	return xy(e) ? e.getRawOrdinalNumber(t.value) : t.value;
}
function _b(e, t) {
	return xy(e) && !!t.get("boundaryGap");
}
//#endregion
//#region node_modules/echarts/lib/chart/line/LineView.js
function vb(e, t) {
	if (e.length === t.length) {
		for (var n = 0; n < e.length; n++) if (e[n] !== t[n]) return;
		return !0;
	}
}
function yb(e) {
	for (var t = wc(), n = wc(), r = 0; r < e.length;) {
		var i = e[r++], a = e[r++];
		kv(i, a) || (Tc(t, i), Tc(n, a));
	}
	return [t, n];
}
function bb(e, t) {
	var n = yb(e), r = n[0], i = n[1], a = yb(t), o = a[0], s = a[1];
	return Math.max(Math.abs(r[0] - o[0]), Math.abs(i[0] - s[0]), Math.abs(r[1] - o[1]), Math.abs(i[1] - s[1]));
}
function xb(e) {
	return W(e) ? e : e ? .5 : 0;
}
function Sb(e, t, n) {
	if (n.valueDim == null) return [];
	for (var r = t.count(), i = Mv(r * 2), a = 0; a < r; a++) {
		var o = Ov(n, e, t, a);
		i[a * 2] = o[0], i[a * 2 + 1] = o[1];
	}
	return i;
}
function Cb(e, t, n, r, i) {
	var a = n.getBaseAxis(), o = a.dim === "x" || a.dim === "radius" ? 0 : 1, s = [], c = 0, l = [], u = [], d = [], f = [];
	if (i) {
		for (c = 0; c < e.length; c += 2) {
			var p = t || e;
			kv(p[c], p[c + 1]) || f.push(e[c], e[c + 1]);
		}
		e = f;
	}
	for (c = 0; c < e.length - 2; c += 2) switch (d[0] = e[c + 2], d[1] = e[c + 3], u[0] = e[c], u[1] = e[c + 1], s.push(u[0], u[1]), r) {
		case "end":
			l[o] = d[o], l[1 - o] = u[1 - o], s.push(l[0], l[1]);
			break;
		case "middle":
			var m = (u[o] + d[o]) / 2, h = [];
			l[o] = h[o] = m, l[1 - o] = u[1 - o], h[1 - o] = d[1 - o], s.push(l[0], l[1]), s.push(h[0], h[1]);
			break;
		default: l[o] = u[o], l[1 - o] = d[1 - o], s.push(l[0], l[1]);
	}
	return s.push(e[c++], e[c++]), s;
}
function wb(e, t) {
	var n = [], r = e.length, i, a;
	function o(e, t, n) {
		var r = e.coord;
		return {
			coord: n,
			color: zr((n - r) / (t.coord - r), [e.color, t.color])
		};
	}
	for (var s = 0; s < r; s++) {
		var c = e[s], l = c.coord;
		if (l < 0) i = c;
		else if (l > t) {
			a ? n.push(o(a, c, t)) : i && n.push(o(i, c, 0), o(i, c, t));
			break;
		} else i &&= (n.push(o(i, c, 0)), null), n.push(c), a = c;
	}
	return n;
}
function Tb(e, t, n) {
	var r = e.getVisual("visualMeta");
	if (!(!r || !r.length || !e.count()) && t.type === "cartesian2d") {
		for (var i, a, o = r.length - 1; o >= 0; o--) {
			var s = e.getDimensionInfo(r[o].dimension);
			if (i = s && s.coordDim, i === "x" || i === "y") {
				a = r[o];
				break;
			}
		}
		if (a) {
			var c = t.getAxis(i), l = I(a.stops, function(e) {
				return {
					coord: c.toGlobalCoord(c.dataToCoord(e.value)),
					color: e.color
				};
			}), u = l.length, d = a.outerColors.slice();
			u && l[0].coord > l[u - 1].coord && (l.reverse(), d.reverse());
			var f = wb(l, i === "x" ? n.getWidth() : n.getHeight()), p = f.length;
			if (!p && u) return l[0].coord < 0 ? d[1] ? d[1] : l[u - 1].color : d[0] ? d[0] : l[0].color;
			var m = 10, h = f[0].coord - m, g = f[p - 1].coord + m, _ = g - h;
			if (_ < .001) return "transparent";
			F(f, function(e) {
				e.offset = (e.coord - h) / _;
			}), f.push({
				offset: p ? f[p - 1].offset : .5,
				color: d[1] || "transparent"
			}), f.unshift({
				offset: p ? f[0].offset : .5,
				color: d[0] || "transparent"
			});
			var v = new vd(0, 0, 0, 0, f, !0);
			return v[i] = h, v[i + "2"] = g, v;
		}
	}
}
function Eb(e, t, n) {
	var r = e.get("showAllSymbol"), i = r === "auto";
	if (!(r && !i)) {
		var a = n.getAxesByScale("ordinal")[0];
		if (a && !(i && Db(a, t))) {
			var o = t.mapDimension(a.dim), s = {};
			return F(a.getViewLabels(), function(e) {
				e.tick.offInterval || (s[gb(a.scale, e.tick)] = 1);
			}), function(e) {
				return !s.hasOwnProperty(t.get(o, e));
			};
		}
	}
}
function Db(e, t) {
	var n = e.getExtent(), r = Math.abs(n[1] - n[0]) / e.scale.count();
	isNaN(r) && (r = 0);
	for (var i = t.count(), a = Math.max(1, Math.round(i / 5)), o = 0; o < i; o += a) if (yv.getSymbolSize(t, o)[+!!e.isHorizontal()] * 1.5 > r) return !1;
	return !0;
}
function Ob(e) {
	for (var t = e.length / 2; t > 0 && kv(e[t * 2 - 2], e[t * 2 - 1]); t--);
	return t - 1;
}
function kb(e, t) {
	return [e[t * 2], e[t * 2 + 1]];
}
function Ab(e, t, n) {
	for (var r = e.length / 2, i = n === "x" ? 0 : 1, a, o, s = 0, c = -1, l = 0; l < r; l++) if (o = e[l * 2 + i], !kv(o, e[l * 2 + 1 - i])) {
		if (l === 0) {
			a = o;
			continue;
		}
		if (a <= t && o >= t || a >= t && o <= t) {
			c = l;
			break;
		}
		s = l, a = o;
	}
	return {
		range: [s, c],
		t: (t - a) / (o - a)
	};
}
function jb(e) {
	if (e.get(["endLabel", "show"])) return !0;
	for (var t = 0; t < ol.length; t++) if (e.get([
		ol[t],
		"endLabel",
		"show"
	])) return !0;
	return !1;
}
function Mb(e, t, n, r) {
	if (ty(t, "cartesian2d")) {
		var i = r.getModel("endLabel"), a = i.get("valueAnimation"), o = r.getData(), s = { lastFrameIndex: 0 }, c = jb(r) ? function(n, r) {
			e._endLabelOnDuring(n, r, o, s, a, i, t);
		} : null, l = t.getBaseAxis().isHorizontal(), u = Qv(t, n, r, function() {
			var t = e._endLabel;
			t && n && s.originalX != null && t.attr({
				x: s.originalX,
				y: s.originalY
			});
		}, c);
		if (!r.get("clip", !0)) {
			var d = u.shape, f = Math.max(d.width, d.height);
			l ? (d.y -= f, d.height += f * 2) : (d.x -= f, d.width += f * 2);
		}
		return c && c(1, u), u;
	}
	return $v(t, n, r);
}
function Nb(e, t) {
	var n = t.getBaseAxis(), r = n.isHorizontal(), i = n.inverse, a = r ? i ? "right" : "left" : "center", o = r ? "middle" : i ? "top" : "bottom";
	return { normal: {
		align: e.get("align") || a,
		verticalAlign: e.get("verticalAlign") || o
	} };
}
var Pb = function(e) {
	r(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t.prototype.init = function() {
		var e = new ju(), t = new Tv();
		this.group.add(t.group), this._symbolDraw = t, this._lineGroup = e, this._changePolyState = z(this._changePolyState, this);
	}, t.prototype.render = function(e, t, n) {
		var r = e.coordinateSystem, i = this.group, a = e.getData(), o = e.getModel("lineStyle"), s = e.getModel("areaStyle"), c = a.getLayout("points") || [], l = r.type === "polar", u = this._coordSys, d = this._symbolDraw, f = this._polyline, p = this._polygon, m = this._lineGroup, h = !t.ssr && e.get("animation"), g = !s.isEmpty(), _ = s.get("origin"), v = Ev(r, a, _), y = g && Sb(r, a, v), b = e.get("showSymbol"), x = e.get("connectNulls"), S = b && !l && Eb(e, a, r), C = this._data;
		C && C.eachItemGraphicEl(function(e, t) {
			e.__temp && (i.remove(e), C.setItemGraphicEl(t, null));
		}), b || d.remove(), i.add(m);
		var w = !l && e.get("step"), T;
		r && r.getArea && e.get("clip", !0) && (T = r.getArea(), T.width == null ? T.r0 && (T.r0 -= .5, T.r += .5) : (T.x -= .1, T.y -= .1, T.width += .2, T.height += .2)), this._clipShapeForSymbol = T;
		var E = Tb(a, r, n) || a.getVisual("style")[a.getVisual("drawType")];
		if (!(f && u.type === r.type && w === this._step)) b && d.updateData(a, {
			isIgnore: S,
			clipShape: T,
			disableAnimation: !0,
			getSymbolPoint: function(e) {
				return [c[e * 2], c[e * 2 + 1]];
			}
		}), h && this._initSymbolLabelAnimation(a, r, T), w && (y &&= Cb(y, c, r, w, x), c = Cb(c, null, r, w, x)), f = this._newPolyline(c), g ? p = this._newPolygon(c, y) : p &&= (m.remove(p), this._polygon = null), l || this._initOrUpdateEndLabel(e, r, Ig(E)), m.setClipPath(Mb(this, r, !0, e));
		else {
			g && !p ? p = this._newPolygon(c, y) : p && !g && (m.remove(p), p = this._polygon = null), l || this._initOrUpdateEndLabel(e, r, Ig(E));
			var D = m.getClipPath();
			D ? Fd(D, { shape: Mb(this, r, !1, e).shape }, e) : m.setClipPath(Mb(this, r, !0, e)), b && d.updateData(a, {
				isIgnore: S,
				clipShape: T,
				disableAnimation: !0,
				getSymbolPoint: function(e) {
					return [c[e * 2], c[e * 2 + 1]];
				}
			}), (!vb(this._stackedOnPoints, y) || !vb(this._points, c)) && (h ? this._doUpdateAnimation(a, y, r, n, w, _, x) : (w && (y &&= Cb(y, c, r, w, x), c = Cb(c, null, r, w, x)), f.setShape({ points: c }), p && p.setShape({
				points: c,
				stackedOnPoints: y
			})));
		}
		var O = e.getModel("emphasis"), k = O.get("focus"), A = O.get("blurScope"), M = O.get("disabled");
		if (f.useStyle(j(o.getLineStyle(), {
			fill: "none",
			stroke: E,
			lineJoin: "bevel"
		})), nu(f, e, "lineStyle"), f.style.lineWidth > 0 && e.get([
			"emphasis",
			"lineStyle",
			"width"
		]) === "bolder") {
			var ee = f.getState("emphasis").style;
			ee.lineWidth = +f.style.lineWidth + 1;
		}
		Z(f).seriesIndex = e.seriesIndex, Ql(f, k, A, M);
		var N = xb(e.get("smooth")), P = e.get("smoothMonotone");
		if (f.setShape({
			smooth: N,
			smoothMonotone: P,
			connectNulls: x
		}), p) {
			var F = a.getCalculationInfo("stackedOnSeries"), I = 0;
			p.useStyle(j(s.getAreaStyle(), {
				fill: E,
				opacity: .7,
				lineJoin: "bevel",
				decal: a.getVisual("style").decal
			})), F && (I = xb(F.get("smooth"))), p.setShape({
				smooth: N,
				stackedOnSmooth: I,
				smoothMonotone: P,
				connectNulls: x
			}), nu(p, e, "areaStyle"), Z(p).seriesIndex = e.seriesIndex, Ql(p, k, A, M);
		}
		var te = this._changePolyState;
		a.eachItemGraphicEl(function(e) {
			e && (e.onHoverStateChange = te);
		}), this._polyline.onHoverStateChange = te, this._data = a, this._coordSys = r, this._stackedOnPoints = y, this._points = c, this._step = w, this._valueOrigin = _;
		var L = e.get("triggerEvent"), ne = e.get("triggerLineEvent"), R = ne === !0 || L === !0 || L === "line", re = ne === !0 || L === !0 || L === "area";
		this.packEventData(e, f, R), p && this.packEventData(e, p, re);
	}, t.prototype.packEventData = function(e, t, n) {
		Z(t).eventData = n ? {
			componentType: "series",
			componentSubType: "line",
			componentIndex: e.componentIndex,
			seriesIndex: e.seriesIndex,
			seriesName: e.name,
			seriesType: "line",
			selfType: t === this._polygon ? "area" : "line"
		} : null;
	}, t.prototype.highlight = function(e, t, n, r) {
		var i = e.getData(), a = fc(i, r);
		if (this._changePolyState("emphasis"), !(a instanceof Array) && a != null && a >= 0) {
			var o = i.getLayout("points"), s = i.getItemGraphicEl(a);
			if (!s) {
				var c = o[a * 2], l = o[a * 2 + 1];
				if (kv(c, l) || this._clipShapeForSymbol && !this._clipShapeForSymbol.contain(c, l)) return;
				var u = e.get("zlevel") || 0, d = e.get("z") || 0;
				s = new yv(i, a), s.x = c, s.y = l, s.setZ(u, d);
				var f = s.getSymbolPath().getTextContent();
				f && (f.zlevel = u, f.z = d, f.z2 = this._polyline.z2 + 1), s.__temp = !0, i.setItemGraphicEl(a, s), s.stopSymbolAnimation(!0), this.group.add(s);
			}
			s.highlight();
		} else Kv.prototype.highlight.call(this, e, t, n, r);
	}, t.prototype.downplay = function(e, t, n, r) {
		var i = e.getData(), a = fc(i, r);
		if (this._changePolyState("normal"), a != null && a >= 0) {
			var o = i.getItemGraphicEl(a);
			o && (o.__temp ? (i.setItemGraphicEl(a, null), this.group.remove(o)) : o.downplay());
		} else Kv.prototype.downplay.call(this, e, t, n, r);
	}, t.prototype._changePolyState = function(e) {
		var t = this._polygon;
		wl(this._polyline, e), t && wl(t, e);
	}, t.prototype._newPolyline = function(e) {
		var t = this._polyline;
		return t && this._lineGroup.remove(t), t = new Bv({
			shape: { points: e },
			segmentIgnoreThreshold: 2,
			z2: 10
		}), this._lineGroup.add(t), this._polyline = t, t;
	}, t.prototype._newPolygon = function(e, t) {
		var n = this._polygon;
		return n && this._lineGroup.remove(n), n = new Hv({
			shape: {
				points: e,
				stackedOnPoints: t
			},
			segmentIgnoreThreshold: 2
		}), this._lineGroup.add(n), this._polygon = n, n;
	}, t.prototype._initSymbolLabelAnimation = function(e, t, n) {
		var r, i, a = t.getBaseAxis(), o = a.inverse;
		t.type === "cartesian2d" ? (r = a.isHorizontal(), i = !1) : t.type === "polar" && (r = a.dim === "angle", i = !0);
		var s = e.hostModel, c = s.get("animationDuration");
		H(c) && (c = c(null));
		var l = s.get("animationDelay") || 0, u = H(l) ? l(null) : l;
		e.eachItemGraphicEl(function(e, a) {
			var s = e;
			if (s) {
				var d = [e.x, e.y], f = void 0, p = void 0, m = void 0;
				if (n) {
					if (i) {
						var h = n, g = t.pointToCoord(d);
						r ? (f = h.startAngle, p = h.endAngle, m = -g[1] / 180 * Math.PI) : (f = h.r0, p = h.r, m = g[0]);
					} else {
						var _ = n;
						r ? (f = _.x, p = _.x + _.width, m = e.x) : (f = _.y + _.height, p = _.y, m = e.y);
					}
				}
				var v = p === f ? 0 : (m - f) / (p - f);
				o && (v = 1 - v);
				var y = H(l) ? l(a) : c * v + u, b = s.getSymbolPath(), x = b.getTextContent();
				s.attr({
					scaleX: 0,
					scaleY: 0
				}), s.animateTo({
					scaleX: 1,
					scaleY: 1
				}, {
					duration: 200,
					setToFinal: !0,
					delay: y
				}), x && x.animateFrom({ style: { opacity: 0 } }, {
					duration: 300,
					delay: y
				}), b.disableLabelAnimation = !0;
			}
		});
	}, t.prototype._initOrUpdateEndLabel = function(e, t, n) {
		var r = e.getModel("endLabel");
		if (jb(e)) {
			var i = e.getData(), a = this._polyline, o = i.getLayout("points");
			if (!o) {
				a.removeTextContent(), this._endLabel = null;
				return;
			}
			var s = this._endLabel;
			s || (s = this._endLabel = new Ro({ z2: 200 }), s.ignoreClip = !0, a.setTextContent(this._endLabel), a.disableLabelAnimation = !0);
			var c = Ob(o);
			c >= 0 && (zf(a, Bf(e, "endLabel"), {
				inheritColor: n,
				labelFetcher: e,
				labelDataIndex: c,
				defaultText: function(e, t, n) {
					return n == null ? _v(i, e) : vv(i, n);
				},
				enableTextSetter: !0
			}, Nb(r, t)), a.textConfig.position = null);
		} else this._endLabel &&= (this._polyline.removeTextContent(), null);
	}, t.prototype._endLabelOnDuring = function(e, t, n, r, i, a, o) {
		var s = this._endLabel, c = this._polyline;
		if (s) {
			e < 1 && r.originalX == null && (r.originalX = s.x, r.originalY = s.y);
			var l = n.getLayout("points"), u = n.hostModel, d = u.get("connectNulls"), f = a.get("precision"), p = a.get("distance") || 0, m = o.getBaseAxis(), h = m.isHorizontal(), g = m.inverse, _ = t.shape, v = g ? h ? _.x : _.y + _.height : h ? _.x + _.width : _.y, y = (h ? p : 0) * (g ? -1 : 1), b = (h ? 0 : -p) * (g ? -1 : 1), x = h ? "x" : "y", S = Ab(l, v, x), C = S.range, w = C[1] - C[0], T = void 0;
			if (w >= 1) {
				if (w > 1 && !d) {
					var E = kb(l, C[0]);
					s.attr({
						x: E[0] + y,
						y: E[1] + b
					}), i && (T = u.getRawValue(C[0]));
				} else {
					var E = c.getPointOn(v, x);
					E && s.attr({
						x: E[0] + y,
						y: E[1] + b
					});
					var D = u.getRawValue(C[0]), O = u.getRawValue(C[1]);
					i && (T = Cc(n, f, D, O, S.t));
				}
				r.lastFrameIndex = C[0];
			} else {
				var k = e === 1 || r.lastFrameIndex > 0 ? C[0] : 0, E = kb(l, k);
				i && (T = u.getRawValue(k)), s.attr({
					x: E[0] + y,
					y: E[1] + b
				});
			}
			if (i) {
				var A = Xf(s);
				typeof A.setLabelText == "function" && A.setLabelText(T);
			}
		}
	}, t.prototype._doUpdateAnimation = function(e, t, n, r, i, a, o) {
		var s = this._polyline, c = this._polygon, l = e.hostModel, u = Fv(this._data, e, this._stackedOnPoints, t, this._coordSys, n, this._valueOrigin, a), d = u.current, f = u.stackedOnCurrent, p = u.next, m = u.stackedOnNext;
		if (i && (f = Cb(u.stackedOnCurrent, u.current, n, i, o), d = Cb(u.current, null, n, i, o), m = Cb(u.stackedOnNext, u.next, n, i, o), p = Cb(u.next, null, n, i, o)), bb(d, p) > 3e3 || c && bb(f, m) > 3e3) {
			s.stopAnimation(), s.setShape({ points: p }), c && (c.stopAnimation(), c.setShape({
				points: p,
				stackedOnPoints: m
			}));
			return;
		}
		s.shape.__points = u.current, s.shape.points = d;
		var h = { shape: { points: p } };
		u.current !== d && (h.shape.__points = u.next), s.stopAnimation(), Pd(s, h, l), c && (c.setShape({
			points: d,
			stackedOnPoints: f
		}), c.stopAnimation(), Pd(c, { shape: { stackedOnPoints: m } }, l), s.shape.points !== c.shape.points && (c.shape.points = s.shape.points));
		for (var g = [], _ = u.status, v = 0; v < _.length; v++) if (_[v].cmd === "=") {
			var y = e.getItemGraphicEl(_[v].idx1);
			y && g.push({
				el: y,
				ptIdx: v
			});
		}
		s.animators && s.animators.length && s.animators[0].during(function() {
			c && c.dirtyShape();
			for (var e = s.shape.__points, t = 0; t < g.length; t++) {
				var n = g[t].el, r = g[t].ptIdx * 2;
				n.x = e[r], n.y = e[r + 1], n.markRedraw();
			}
		});
	}, t.prototype.remove = function(e) {
		var t = this.group, n = this._data;
		this._lineGroup.removeAll(), this._symbolDraw.remove(!0), n && n.eachItemGraphicEl(function(e, r) {
			e.__temp && (t.remove(e), n.setItemGraphicEl(r, null));
		}), this._polyline = this._polygon = this._coordSys = this._points = this._stackedOnPoints = this._endLabel = this._data = null;
	}, t.type = "line", t;
}(Kv);
//#endregion
//#region node_modules/echarts/lib/layout/points.js
function Fb(e, t) {
	return {
		seriesType: e,
		plan: Uv(),
		reset: function(e) {
			var n = e.getData(), r = e.coordinateSystem, i = e.pipelineContext, a = t || i.large;
			if (r) {
				var o = I(r.dimensions, function(e) {
					return n.mapDimension(e);
				}).slice(0, 2), s = o.length, c = n.getCalculationInfo("stackResultDimension");
				rh(n, o[0]) && (o[0] = c), rh(n, o[1]) && (o[1] = c);
				var l = n.getStore(), u = n.getDimensionIndex(o[0]), d = n.getDimensionIndex(o[1]);
				return s && { progress: function(e, t) {
					for (var n = e.end - e.start, i = a && Mv(n * s), o = [], c = [], f = e.start, p = 0; f < e.end; f++) {
						var m = void 0;
						if (s === 1) {
							var h = l.get(u, f);
							m = r.dataToPoint(h, null, c);
						} else o[0] = l.get(u, f), o[1] = l.get(d, f), m = r.dataToPoint(o, null, c);
						a ? (i[p++] = m[0], i[p++] = m[1]) : t.setItemLayout(f, m.slice());
					}
					a && (t.setLayout("points", i), t.setLayout("pointsRange", {
						start: e.start,
						end: e.end
					}));
				} };
			}
		}
	};
}
//#endregion
//#region node_modules/echarts/lib/processor/dataSample.js
var Ib = {
	average: function(e) {
		for (var t = 0, n = 0, r = 0; r < e.length; r++) isNaN(e[r]) || (t += e[r], n++);
		return n === 0 ? NaN : t / n;
	},
	sum: function(e) {
		for (var t = 0, n = 0; n < e.length; n++) t += e[n] || 0;
		return t;
	},
	max: function(e) {
		for (var t = -Infinity, n = 0; n < e.length; n++) e[n] > t && (t = e[n]);
		return isFinite(t) ? t : NaN;
	},
	min: function(e) {
		for (var t = Infinity, n = 0; n < e.length; n++) e[n] < t && (t = e[n]);
		return isFinite(t) ? t : NaN;
	},
	nearest: function(e) {
		return e[0];
	}
}, Lb = function(e) {
	return Math.round(e.length / 2);
};
function Rb(e) {
	return {
		seriesType: e,
		reset: function(e, t, n) {
			var r = e.getData(), i = e.get("sampling"), a = e.coordinateSystem, o = r.count();
			if (o > 10 && a.type === "cartesian2d" && i) {
				var s = a.getBaseAxis(), c = a.getOtherAxis(s), l = s.getExtent(), u = n.getDevicePixelRatio(), d = Math.abs(l[1] - l[0]) * (u || 1), f = Math.round(o / d);
				if (isFinite(f) && f > 1) {
					i === "lttb" ? e.setData(r.lttbDownSample(r.mapDimension(c.dim), 1 / f)) : i === "minmax" && e.setData(r.minmaxDownSample(r.mapDimension(c.dim), 1 / f));
					var p = void 0;
					U(i) ? p = Ib[i] : H(i) && (p = i), p && e.setData(r.downSample(r.mapDimension(c.dim), 1 / f, p, Lb));
				}
			}
		}
	};
}
//#endregion
//#region node_modules/echarts/lib/chart/line/install.js
function zb(e) {
	e.registerChartView(Pb), e.registerSeriesModel(gv), e.registerLayout(Fb("line", !0)), e.registerVisual({
		seriesType: "line",
		reset: function(e) {
			var t = e.getData(), n = e.getModel("lineStyle").getLineStyle();
			n && !n.stroke && (n.stroke = t.getVisual("style").fill), t.setVisual("legendLineStyle", n);
		}
	}), e.registerProcessor(e.PRIORITY.PROCESSOR.STATISTIC, Rb("line"));
}
//#endregion
//#region node_modules/echarts/lib/coord/axisTickLabelBuilder.js
var Bb = X(), Vb = X(), Hb = {
	estimate: 1,
	determine: 2
};
function Ub(e) {
	return {
		out: { noPxChangeTryDetermine: [] },
		kind: e
	};
}
function Wb(e, t) {
	var n = e.getLabelModel().get("customValues");
	if (n) {
		var r = e.scale;
		return { labels: I(Kb(n, r), function(t, n) {
			return {
				formattedLabel: ob(e)(t, n),
				rawLabel: r.getLabel(t),
				tick: t
			};
		}) };
	}
	return e.type === "category" ? qb(e, t) : Xb(e);
}
function Gb(e, t, n) {
	var r = e.scale, i = e.getTickModel().get("customValues");
	return i ? { ticks: Kb(i, r) } : e.type === "category" ? Yb(e, t) : { ticks: r.getTicks(n) };
}
function Kb(e, t) {
	var n = t.getExtent(), r = [];
	return F(e, function(e) {
		e = t.parse(e), e >= n[0] && e <= n[1] && r.push(e);
	}), Fc(r, Lc, null), ys(r), I(r, function(e) {
		return { value: e };
	});
}
function qb(e, t) {
	var n = e.getLabelModel(), r = Jb(e, n, t);
	return !n.get("show") || e.scale.isBlank() ? { labels: [] } : r;
}
function Jb(e, t, n) {
	var r = Qb(e), i = cb(t), a = n.kind === Hb.estimate;
	if (!a) {
		var o = ex(r, i);
		if (o) return o;
	}
	var s, c;
	H(i) ? s = sx(e, i, !1) : (c = i === "auto" ? nx(e, n) : i, s = sx(e, c, !1));
	var l = {
		labels: s,
		labelCategoryInterval: c
	};
	return a ? n.out.noPxChangeTryDetermine.push(function() {
		return tx(r, i, l), !0;
	}) : tx(r, i, l), l;
}
function Yb(e, t) {
	var n = Zb(e), r = cb(t), i = ex(n, r);
	if (i) return i;
	var a, o;
	if ((!t.get("show") || e.scale.isBlank()) && (a = []), H(r)) a = sx(e, r, !0);
	else if (r === "auto") {
		var s = Jb(e, e.getLabelModel(), Ub(Hb.determine));
		o = s.labelCategoryInterval, a = I(s.labels, function(e) {
			return e.tick;
		});
	} else o = r, a = sx(e, o, !0);
	return tx(n, r, {
		ticks: a,
		tickCategoryInterval: o
	});
}
function Xb(e) {
	var t = e.scale.getTicks(), n = ob(e);
	return { labels: I(t, function(t, r) {
		return {
			formattedLabel: n(t, r),
			rawLabel: e.scale.getLabel(t),
			tick: t
		};
	}) };
}
var Zb = $b("axisTick"), Qb = $b("axisLabel");
function $b(e) {
	return function(t) {
		return Vb(t)[e] || (Vb(t)[e] = { list: [] });
	};
}
function ex(e, t) {
	for (var n = 0; n < e.list.length; n++) if (e.list[n].key === t) return e.list[n].value;
}
function tx(e, t, n) {
	return e.list.push({
		key: t,
		value: n
	}), n;
}
function nx(e, t) {
	if (t.kind === Hb.estimate) {
		var n = e.calculateCategoryInterval(t);
		return t.out.noPxChangeTryDetermine.push(function() {
			return Vb(e).autoInterval = n, !0;
		}), n;
	}
	return Vb(e).autoInterval ?? (Vb(e).autoInterval = e.calculateCategoryInterval(t));
}
function rx(e, t) {
	var n = t.kind, r = ox(e), i = ob(e), a = (r.axisRotate - r.labelRotate) / 180 * Math.PI, o = e.scale, s = o.getExtent(), c = o.count();
	if (s[1] - s[0] < 1) return 0;
	var l = 1, u = 40;
	c > u && (l = Math.max(1, Math.floor(c / u)));
	for (var d = s[0], f = e.dataToCoord(d + 1) - e.dataToCoord(d), p = Math.abs(f * Math.cos(a)), m = Math.abs(f * Math.sin(a)), h = 0, g = 0; d <= s[1]; d += l) {
		var _ = 0, v = 0, y = on(i({ value: d }), r.font, "center", "top");
		_ = y.width * 1.3, v = y.height * 1.3, h = Math.max(h, _, 7), g = Math.max(g, v, 7);
	}
	var b = h / p, x = g / m;
	isNaN(b) && (b = Infinity), isNaN(x) && (x = Infinity);
	var S = Math.max(0, Math.floor(Math.min(b, x)));
	return n === Hb.estimate ? (t.out.noPxChangeTryDetermine.push(z(ix, null, e, S, c)), S) : ax(e, S, c) ?? S;
}
function ix(e, t, n) {
	return ax(e, t, n) == null;
}
function ax(e, t, n) {
	var r = Bb(e.model), i = e.getExtent(), a = r.lastAutoInterval, o = r.lastTickCount;
	if (a != null && o != null && Math.abs(a - t) <= 1 && Math.abs(o - n) <= 1 && a > t && r.axisExtent0 === i[0] && r.axisExtent1 === i[1]) return a;
	r.lastTickCount = n, r.lastAutoInterval = t, r.axisExtent0 = i[0], r.axisExtent1 = i[1];
}
function ox(e) {
	var t = e.getLabelModel();
	return {
		axisRotate: e.getRotate ? e.getRotate() : e.isHorizontal && !e.isHorizontal() ? 90 : 0,
		labelRotate: t.get("rotate") || 0,
		font: t.getFont()
	};
}
function sx(e, t, n) {
	var r = ob(e), i = e.scale, a = [], o = H(t);
	return ky(i, o ? 0 : t, function(e, s) {
		var c = i.getLabel(e);
		if (o) {
			var l = !!t(e.value, c);
			if (e.offInterval = !l, !l && !s) return;
		}
		a.push(n ? e : {
			formattedLabel: r(e),
			rawLabel: c,
			tick: e
		});
	}), a;
}
//#endregion
//#region node_modules/echarts/lib/util/cycleCache.js
var cx = X();
function lx(e) {
	cx(e).prepare = {};
}
function ux(e) {
	cx(e).fullUpdate = {};
}
function dx(e) {
	return cx(e).prepare;
}
function fx(e) {
	return cx(e).fullUpdate;
}
//#endregion
//#region node_modules/echarts/lib/coord/axisStatistics.js
var px = Nc(), mx = X(), hx = X();
function gx(e, t) {
	var n = e.model, r = mx(fx(n.ecModel)).keyed, i = r && r.get(t);
	return i && i.get(n.uid);
}
function _x(e, t) {
	return bx(gx(e, t));
}
function vx(e, t) {
	var n = [];
	return yx(e.model.ecModel, function(e) {
		for (var r = 0; r < t.length; r++) t[r] && e.serByIdx[t[r].seriesIndex] && n.push(bx(e));
	}), n;
}
function yx(e, t) {
	var n = mx(fx(e)).keyed;
	n && n.each(function(e, n) {
		e.each(function(e, r) {
			t(e, n, r);
		});
	});
}
function bx(e) {
	return { liPosMinGap: e ? e.liPosMinGap : void 0 };
}
function xx(e, t) {
	var n = e.model.ecModel, r = mx(fx(n)).axSer;
	r && Cx(n, r.get(e.model.uid), t);
}
function Sx(e, t, n) {
	var r = gx(e, t);
	r && Cx(e.model.ecModel, r.sers, n);
}
function Cx(e, t, n) {
	if (t) for (var r = 0; r < t.length; r++) {
		var i = t[r];
		e.isSeriesFiltered(i) || n(i);
	}
}
function Tx(e, t, n) {
	var r = mx(fx(e)).keyed, i = r && r.get(t);
	i && i.each(function(e) {
		n(e.axis);
	});
}
function Ex(e, t) {
	var n = e.model, r = mx(fx(n.ecModel)).keys;
	r && F(r.get(n.uid), function(e) {
		t(e);
	});
}
function Dx(e) {
	var t = hx(dx(e)), n = t.keyed ||= q();
	yx(e, function(t, r, i) {
		var a = n.get(r) || n.set(r, q()), o = a.get(i) || a.set(i, {});
		t.metrics.liPosMinGap && kx.liPosMinGap(e, t, o);
	});
}
function Ox(e, t) {
	kx[e] = t;
}
var kx = {};
function Ax(e, t, n) {
	if (e) {
		var r = t.ecModel, i = mx(fx(r)), a = e.model.uid, o = i.axSer ||= q();
		(o.get(a) || o.set(a, [])).push(t);
		var s = t.subType, c = t.getBaseAxis() === e, l = Nx.get(jx(s, c, n)) || Nx.get(jx(s, c, null));
		if (l) {
			var u = i.keyed ||= q(), d = i.keys ||= q(), f = l.key, p = u.get(f) || u.set(f, q()), m = p.get(a);
			m || (m = p.set(a, {
				axis: e,
				sers: [],
				serByIdx: []
			}), m.metrics = l.getMetrics(e), (d.get(a) || d.set(a, [])).push(f)), m.sers.push(t), m.serByIdx[t.seriesIndex] = t;
		}
	}
}
function jx(e, t, n) {
	return e + "|&" + K(t, !0) + "|&" + (n || "");
}
function Mx(e, t) {
	var n = jx(t.seriesType, t.baseAxis, t.coordSysType);
	Nx.set(n, t), px(e, function() {
		e.registerProcessor(e.PRIORITY.PROCESSOR.AXIS_STATISTICS, { overallReset: Dx });
	});
}
var Nx = q(), Px = .8;
function Fx(e, t) {
	t ||= {};
	var n = {
		w: NaN,
		w2: NaN
	}, r = e.scale, i = t.fromStat, a = t.min, o = fy(r);
	Ls(o) || (o = NaN);
	var s = e.getExtent(), c = rs(s[1] - s[0]);
	return xy(r) ? Ix(n, e, o, c) : i && Lx(n, e, o, c, i), a != null && (n.w = Ls(n.w) ? ns(a, n.w) : a), n;
}
function Ix(e, t, n, r) {
	var i = t.onBand, a = n + +!!i;
	a === 0 && (a = 1), e.w = r / a, !i && n && r && (e.w2 = e.w * n / r);
}
function Lx(e, t, n, r, i) {
	var a = !1, o = -Infinity;
	F(i.key ? [_x(t, i.key)] : vx(t, i.sers || []), function(e) {
		var t = e.liPosMinGap;
		t != null && (t > 0 ? (t > o && (o = t), a = !1) : t === -2 && (a = !0));
	}), Ls(n) && n > 0 && Ls(o) ? (e.w = r / n * o, e.w2 = o) : a && (e.w = r * Px, e.w2 = e.w * n / r);
}
//#endregion
//#region node_modules/echarts/lib/coord/Axis.js
var Rx = [0, 1], zx = function() {
	function e(e, t, n) {
		this.onBand = !1, this.inverse = !1, this.dim = e, this.scale = t, this._extent = n || [0, 0];
	}
	return e.prototype.contain = function(e) {
		var t = this._extent, n = Math.min(t[0], t[1]), r = Math.max(t[0], t[1]);
		return e >= n && e <= r;
	}, e.prototype.containData = function(e) {
		return this.scale.contain(this.scale.parse(e));
	}, e.prototype.getExtent = function() {
		return this._extent.slice();
	}, e.prototype.setExtent = function(e, t) {
		var n = this._extent;
		n[0] = e, n[1] = t;
	}, e.prototype.dataToCoord = function(e, t) {
		var n = this.scale;
		return e = n.normalize(n.parse(e)), fs(e, Rx, Bx(this), t);
	}, e.prototype.coordToData = function(e, t) {
		var n = fs(e, Bx(this), Rx, t);
		return this.scale.scale(n);
	}, e.prototype.pointToData = function(e, t) {}, e.prototype.getTicksCoords = function(e) {
		e ||= {};
		var t = e.tickModel || this.getTickModel(), n = I(Gb(this, t, {
			breakTicks: e.breakTicks,
			pruneByBreak: e.pruneByBreak
		}).ticks, function(e) {
			return {
				coord: this.dataToCoord(gb(this.scale, e)),
				tick: e
			};
		}, this), r = t.get("alignWithLabel"), i = Vx(this, n, r);
		return I(n, function(e) {
			return {
				coord: e.coord,
				tickValue: e.tick.value,
				onBand: i
			};
		});
	}, e.prototype.getMinorTicksCoords = function() {
		if (xy(this.scale)) return [];
		var e = this.model.getModel("minorTick").get("splitNumber");
		return e > 0 && e < 100 || (e = 5), I(this.scale.getMinorTicks(e), function(e) {
			return I(e, function(e) {
				return {
					coord: this.dataToCoord(e),
					tickValue: e
				};
			}, this);
		}, this);
	}, e.prototype.getViewLabels = function(e) {
		return e ||= Ub(Hb.determine), Wb(this, e).labels;
	}, e.prototype.getLabelModel = function() {
		return this.model.getModel("axisLabel");
	}, e.prototype.getTickModel = function() {
		return this.model.getModel("axisTick");
	}, e.prototype.getBandWidth = function() {
		return Fx(this, { min: 1 }).w;
	}, e.prototype.calculateCategoryInterval = function(e) {
		return e ||= Ub(Hb.determine), rx(this, e);
	}, e;
}();
function Bx(e) {
	var t = e.getExtent();
	if (e.onBand) {
		var n = (t[1] - t[0]) / e.scale.count() / 2;
		t[0] += n, t[1] -= n;
	}
	return t;
}
function Vx(e, t, n) {
	var r = t.length;
	if (!e.onBand || n || !r) return !1;
	var i = Fx(e).w;
	if (!i) return !1;
	F(t, function(e) {
		e.coord -= i / 2;
	});
	var a = e.scale.getExtent(), o = t[r - 1];
	return o.tick.offInterval && t.pop(), t.push({
		coord: o.coord + i,
		tick: { value: a[1] + 1 }
	}), !0;
}
//#endregion
//#region node_modules/echarts/lib/coord/cartesian/Axis2D.js
var Hx = function(e) {
	r(t, e);
	function t(t, n, r, i, a) {
		var o = e.call(this, t, n, r) || this;
		return o.index = 0, o.type = i || "value", o.position = a || "bottom", o;
	}
	return t.prototype.isHorizontal = function() {
		var e = this.position;
		return e === "top" || e === "bottom";
	}, t.prototype.getGlobalExtent = function(e) {
		var t = this.getExtent();
		return t[0] = this.toGlobalCoord(t[0]), t[1] = this.toGlobalCoord(t[1]), e && t[0] > t[1] && t.reverse(), t;
	}, t.prototype.pointToData = function(e, t) {
		return this.coordToData(this.toLocalCoord(e[this.dim === "x" ? 0 : 1]), t);
	}, t.prototype.setCategorySortInfo = function(e) {
		if (this.type !== "category") return !1;
		this.model.option.categorySortInfo = e, this.scale.setSortInfo(e);
	}, t;
}(zx), Ux = [
	"label",
	"labelLine",
	"layoutOption",
	"priority",
	"defaultAttr",
	"marginForce",
	"minMarginForce",
	"marginDefault",
	"suggestIgnore"
], Wx = 1, Gx = 2, Kx = Wx | Gx;
function qx(e, t, n) {
	n ||= Kx, t ? e.dirty |= n : e.dirty &= ~n;
}
function Jx(e, t) {
	return t ||= Kx, e.dirty == null || !!(e.dirty & t);
}
function Yx(e) {
	if (e) return Jx(e) && Xx(e, e.label, e), e;
}
function Xx(e, t, n) {
	var r = t.getComputedTransform();
	e.transform = Df(e.transform, r);
	var i = e.localRect = Ef(e.localRect, t.getBoundingRect()), a = t.style, o = a.margin, s = n && n.marginForce, c = n && n.minMarginForce, l = n && n.marginDefault, u = a.__marginType;
	u == null && l && (o = l, u = Qf.textMargin);
	for (var d = 0; d < 4; d++) Zx[d] = u === Qf.minMargin && c && c[d] != null ? c[d] : s && s[d] != null ? s[d] : o ? o[d] : 0;
	u === Qf.textMargin && vf(i, Zx, !1, !1);
	var f = e.rect = Ef(e.rect, i);
	return r && f.applyTransform(r), u === Qf.minMargin && vf(f, Zx, !1, !1), e.axisAligned = wf(r), (e.label = e.label || {}).ignore = t.ignore, qx(e, !1), qx(e, !0, Gx), e;
}
var Zx = [
	0,
	0,
	0,
	0
];
function Qx(e, t, n) {
	return e.transform = Df(e.transform, n), e.localRect = Ef(e.localRect, t), e.rect = Ef(e.rect, t), n && e.rect.applyTransform(n), e.axisAligned = wf(n), e.obb = void 0, (e.label = e.label || {}).ignore = !1, e;
}
function $x(e, t) {
	if (e) {
		e.label.x += t.x, e.label.y += t.y, e.label.markRedraw();
		var n = e.transform;
		n && (n[4] += t.x, n[5] += t.y);
		var r = e.rect;
		r && (r.x += t.x, r.y += t.y);
		var i = e.obb;
		i && i.fromBoundingRect(e.localRect, n);
	}
}
function eS(e, t) {
	for (var n = 0; n < Ux.length; n++) {
		var r = Ux[n];
		e[r] ?? (e[r] = t[r]);
	}
	return Yx(e);
}
function tS(e) {
	var t = e.obb;
	return (!t || Jx(e, Gx)) && (e.obb = t ||= new Od(), t.fromBoundingRect(e.localRect, e.transform), qx(e, !1, Gx)), t;
}
function nS(e) {
	var t = [];
	e.sort(function(e, t) {
		return !!t.suggestIgnore - +!!e.suggestIgnore || t.priority - e.priority;
	});
	function n(e) {
		if (!e.ignore) {
			var t = e.ensureState("emphasis");
			t.ignore ??= !1;
		}
		e.ignore = !0;
	}
	for (var r = 0; r < e.length; r++) {
		var i = Yx(e[r]);
		if (!i.label.ignore) {
			for (var a = i.label, o = i.labelLine, s = !1, c = 0; c < t.length; c++) if (rS(i, t[c], null, { touchThreshold: .05 })) {
				s = !0;
				break;
			}
			s ? (n(a), o && n(o)) : t.push(i);
		}
	}
}
function rS(e, t, n, r) {
	return !e || !t || e.label && e.label.ignore || t.label && t.label.ignore || !e.rect.intersect(t.rect, n, r) ? !1 : e.axisAligned && t.axisAligned ? !0 : tS(e).intersect(tS(t), n, r);
}
//#endregion
//#region node_modules/echarts/lib/component/axis/axisBreakHelper.js
var iS = null;
function aS() {
	return iS;
}
//#endregion
//#region node_modules/echarts/lib/component/axis/axisAction.js
var oS = "expandAxisBreak", sS = Math.PI, cS = [
	[
		1,
		2,
		1,
		2
	],
	[
		5,
		3,
		5,
		3
	],
	[
		8,
		3,
		8,
		3
	]
], lS = [
	[
		0,
		1,
		0,
		1
	],
	[
		0,
		3,
		0,
		3
	],
	[
		0,
		3,
		0,
		3
	]
], uS = X(), dS = X(), fS = function() {
	function e(e) {
		this.recordMap = {}, this.resolveAxisNameOverlap = e;
	}
	return e.prototype.ensureRecord = function(e) {
		var t = e.axis.dim, n = e.componentIndex, r = this.recordMap, i = r[t] || (r[t] = []);
		return i[n] || (i[n] = { ready: {} });
	}, e;
}();
function pS(e, t, n, r) {
	var i = n.axis, a = t.ensureRecord(n), o = [], s, c = LS(e.axisName) && db(e.nameLocation);
	F(r, function(e) {
		var t = Yx(e);
		if (!(!t || t.label.ignore)) {
			o.push(t);
			var n = a.transGroup;
			c && (n.transform ? ct(mS, n.transform) : nt(mS), t.transform && it(mS, mS, t.transform), Y.copy(hS, t.localRect), hS.applyTransform(mS), s ? s.union(hS) : Y.copy(s = new Y(0, 0, 0, 0), hS));
		}
	});
	var l = Math.abs(a.dirVec.x) > .1 ? "x" : "y", u = a.transGroup[l];
	if (o.sort(function(e, t) {
		return Math.abs(e.label[l] - u) - Math.abs(t.label[l] - u);
	}), c && s) {
		var d = i.getExtent(), f = Math.min(d[0], d[1]), p = Math.max(d[0], d[1]) - f;
		s.union(new Y(f, 0, p, 1));
	}
	a.stOccupiedRect = s, a.labelInfoList = o;
}
var mS = tt(), hS = new Y(0, 0, 0, 0), gS = function(e, t, n, r, i, a) {
	if (db(e.nameLocation)) {
		var o = a.stOccupiedRect;
		o && _S(Qx({}, o, a.transGroup.transform), r, i);
	} else vS(a.labelInfoList, a.dirVec, r, i);
};
function _S(e, t, n) {
	var r = new Et();
	rS(e, t, r, {
		direction: Math.atan2(n.y, n.x),
		bidirectional: !1,
		touchThreshold: .05
	}) && $x(t, r);
}
function vS(e, t, n, r) {
	for (var i = Et.dot(r, t) >= 0, a = 0, o = e.length; a < o; a++) {
		var s = e[i ? a : o - 1 - a];
		s.label.ignore || _S(s, n, r);
	}
}
var yS = function() {
	function e(e, t, n, r) {
		this.group = new ju(), this._axisModel = e, this._api = t, this._local = {}, this._shared = r || new fS(gS), this._resetCfgDetermined(n);
	}
	return e.prototype.updateCfg = function(e) {
		var t = this._cfg.raw;
		t.position = e.position, t.labelOffset = e.labelOffset, this._resetCfgDetermined(t);
	}, e.prototype.__getRawCfg = function() {
		return this._cfg.raw;
	}, e.prototype._resetCfgDetermined = function(e) {
		var t = this._axisModel, n = t.getDefaultOption ? t.getDefaultOption() : {}, r = K(e.axisName, t.get("name")), i = t.get("nameMoveOverlap");
		(i == null || i === "auto") && (i = K(e.defaultNameMoveOverlap, !0));
		var a = {
			raw: e,
			position: e.position,
			rotation: e.rotation,
			nameDirection: K(e.nameDirection, 1),
			tickDirection: K(e.tickDirection, 1),
			labelDirection: K(e.labelDirection, 1),
			labelOffset: K(e.labelOffset, 0),
			silent: K(e.silent, !0),
			axisName: r,
			nameLocation: de(t.get("nameLocation"), n.nameLocation, "end"),
			shouldNameMoveOverlap: LS(r) && i,
			optionHideOverlap: t.get(["axisLabel", "hideOverlap"]),
			showMinorTicks: t.get(["minorTick", "show"])
		};
		this._cfg = a;
		var o = new ju({
			x: a.position[0],
			y: a.position[1],
			rotation: a.rotation
		});
		o.updateTransform(), this._transformGroup = o;
		var s = this._shared.ensureRecord(t);
		s.transGroup = this._transformGroup, s.dirVec = new Et(Math.cos(-a.rotation), Math.sin(-a.rotation));
	}, e.prototype.build = function(e, t) {
		var n = this;
		return e ||= {
			axisLine: !0,
			axisTickLabelEstimate: !1,
			axisTickLabelDetermine: !0,
			axisName: !0
		}, F(bS, function(r) {
			e[r] && xS[r](n._cfg, n._local, n._shared, n._axisModel, n.group, n._transformGroup, n._api, t || {});
		}), this;
	}, e.innerTextLayout = function(e, t, n) {
		var r = Ts(t - e), i, a;
		return Es(r) ? (a = n > 0 ? "top" : "bottom", i = "center") : Es(r - sS) ? (a = n > 0 ? "bottom" : "top", i = "center") : (a = "middle", i = r > 0 && r < sS ? n > 0 ? "right" : "left" : n > 0 ? "left" : "right"), {
			rotation: r,
			textAlign: i,
			textVerticalAlign: a
		};
	}, e.makeAxisEventDataBase = function(e) {
		var t = {
			componentType: e.mainType,
			componentIndex: e.componentIndex
		};
		return t[e.mainType + "Index"] = e.componentIndex, t;
	}, e.isLabelSilent = function(e) {
		var t = e.get("tooltip");
		return e.get("silent") || !(e.get("triggerEvent") || t && t.show);
	}, e;
}(), bS = [
	"axisLine",
	"axisTickLabelEstimate",
	"axisTickLabelDetermine",
	"axisName"
], xS = {
	axisLine: function(e, t, n, r, i, a, o) {
		var s = r.get(["axisLine", "show"]);
		if (s === "auto" && (s = !0, e.raw.axisLineAutoShow != null && (s = !!e.raw.axisLineAutoShow)), s) {
			var c = r.axis.getExtent(), l = a.transform, u = [c[0], 0], d = [c[1], 0], f = u[0] > d[0];
			l && (Ct(u, u, l), Ct(d, d, l));
			var p = k({ lineCap: "round" }, r.getModel(["axisLine", "lineStyle"]).getLineStyle()), m = {
				strokeContainThreshold: e.raw.strokeContainThreshold || 5,
				silent: !0,
				z2: 1,
				style: p
			};
			if (r.get(["axisLine", "breakLine"]) && Gh(r.axis.scale)) aS().buildAxisBreakLine(r, i, a, m);
			else {
				var h = new ld(k({ shape: {
					x1: u[0],
					y1: u[1],
					x2: d[0],
					y2: d[1]
				} }, m));
				tf(h.shape, h.style.lineWidth), h.anid = "line", i.add(h);
			}
			var g = r.get(["axisLine", "symbol"]);
			if (g != null) {
				var _ = r.get(["axisLine", "symbolSize"]);
				U(g) && (g = [g, g]), (U(_) || W(_)) && (_ = [_, _]);
				var v = hv(r.get(["axisLine", "symbolOffset"]) || 0, _), y = _[0], b = _[1];
				F([{
					rotate: e.rotation + Math.PI / 2,
					offset: v[0],
					r: 0
				}, {
					rotate: e.rotation - Math.PI / 2,
					offset: v[1],
					r: Math.sqrt((u[0] - d[0]) * (u[0] - d[0]) + (u[1] - d[1]) * (u[1] - d[1]))
				}], function(t, n) {
					if (g[n] !== "none" && g[n] != null) {
						var r = pv(g[n], -y / 2, -b / 2, y, b, p.stroke, !0), a = t.r + t.offset, o = f ? d : u;
						r.attr({
							rotation: t.rotate,
							x: o[0] + a * Math.cos(e.rotation),
							y: o[1] - a * Math.sin(e.rotation),
							silent: !0,
							z2: 11
						}), i.add(r);
					}
				});
			}
		}
	},
	axisTickLabelEstimate: function(e, t, n, r, i, a, o, s) {
		AS(t, i, s) && SS(e, t, n, r, i, a, o, Hb.estimate);
	},
	axisTickLabelDetermine: function(e, t, n, r, i, a, o, s) {
		AS(t, i, s) && SS(e, t, n, r, i, a, o, Hb.determine);
		var c = OS(e, i, a, r);
		TS(e, t.labelLayoutList, c), kS(e, i, a, r, e.tickDirection);
	},
	axisName: function(e, t, n, r, i, a, o, s) {
		var c = n.ensureRecord(r);
		t.nameEl &&= (i.remove(t.nameEl), c.nameLayout = c.nameLocation = null);
		var l = e.axisName;
		if (LS(l)) {
			var u = e.nameLocation, d = e.nameDirection, f = r.getModel("nameTextStyle"), p = r.get("nameGap") || 0, m = r.axis.getExtent(), h = r.axis.inverse ? -1 : 1, g = new Et(0, 0), _ = new Et(0, 0);
			u === "start" ? (g.x = m[0] - h * p, _.x = -h) : u === "end" ? (g.x = m[1] + h * p, _.x = h) : (g.x = (m[0] + m[1]) / 2, g.y = e.labelOffset + d * p, _.y = d);
			var v = tt();
			_.transform(ot(v, v, e.rotation));
			var y = r.get("nameRotate");
			y != null && (y = y * sS / 180);
			var b, x;
			db(u) ? b = yS.innerTextLayout(e.rotation, y ?? e.rotation, d) : (b = CS(e.rotation, u, y || 0, m), x = e.raw.axisNameAvailableWidth, x != null && (x = Math.abs(x / Math.sin(b.rotation)), !isFinite(x) && (x = null)));
			var S = f.getFont(), C = r.get("nameTruncate", !0) || {}, w = C.ellipsis, T = ue(e.raw.nameTruncateMaxWidth, C.maxWidth, x), E = s.nameMarginLevel || 0, D = new Ro({
				x: g.x,
				y: g.y,
				rotation: b.rotation,
				silent: yS.isLabelSilent(r),
				style: Vf(f, {
					text: l,
					font: S,
					overflow: "truncate",
					width: T,
					ellipsis: w,
					fill: f.getTextColor() || r.get([
						"axisLine",
						"lineStyle",
						"color"
					]),
					align: f.get("align") || b.textAlign,
					verticalAlign: f.get("verticalAlign") || b.textVerticalAlign
				}),
				z2: 1
			});
			if (xf({
				el: D,
				componentModel: r,
				itemName: l
			}), D.__fullText = l, D.anid = "name", r.get("triggerEvent")) {
				var O = yS.makeAxisEventDataBase(r);
				O.targetType = "axisName", O.name = l, Z(D).eventData = O;
			}
			a.add(D), D.updateTransform(), t.nameEl = D;
			var k = c.nameLayout = Yx({
				label: D,
				priority: D.z2,
				defaultAttr: { ignore: D.ignore },
				marginDefault: db(u) ? cS[E] : lS[E]
			});
			if (c.nameLocation = u, i.add(D), D.decomposeTransform(), e.shouldNameMoveOverlap && k) {
				var A = n.ensureRecord(r);
				n.resolveAxisNameOverlap(e, n, r, k, _, A);
			}
		}
	}
};
function SS(e, t, n, r, i, a, o, s) {
	MS(t) || jS(e, t, i, s, r, o);
	var c = t.labelLayoutList;
	PS(e, r, c, a), zS(r, e.rotation, c);
	var l = e.optionHideOverlap;
	wS(r, c, l), l && nS(L(c, function(e) {
		return e && !e.label.ignore;
	})), pS(e, n, r, c);
}
function CS(e, t, n, r) {
	var i = Ts(n - e), a, o, s = r[0] > r[1], c = t === "start" && !s || t !== "start" && s;
	return Es(i - sS / 2) ? (o = c ? "bottom" : "top", a = "center") : Es(i - sS * 1.5) ? (o = c ? "top" : "bottom", a = "center") : (o = "middle", a = i < sS * 1.5 && i > sS / 2 ? c ? "left" : "right" : c ? "right" : "left"), {
		rotation: i,
		textAlign: a,
		textVerticalAlign: o
	};
}
function wS(e, t, n) {
	var r = e.axis, i = e.get(["axisLabel", "customValues"]);
	if (lb(r)) return;
	function a(e, a, o) {
		var s = Yx(t[a]), c = Yx(t[o]), l = r.scale;
		if (!(!s || !c)) {
			if (e == null) {
				if (!n && i) return;
				var u = uS(s.label).labelInfo.tick;
				if (yy(l) && u.notNice || xy(l) && u.offInterval) {
					ES(s.label);
					return;
				}
			}
			if (e === !1 || s.suggestIgnore) {
				ES(s.label);
				return;
			}
			if (c.suggestIgnore) {
				ES(c.label);
				return;
			}
			var d = .1;
			if (!n) {
				var f = [
					0,
					0,
					0,
					0
				];
				s = eS({ marginForce: f }, s), c = eS({ marginForce: f }, c);
			}
			rS(s, c, null, { touchThreshold: d }) && ES(e ? c.label : s.label);
		}
	}
	var o = e.get(["axisLabel", "showMinLabel"]), s = e.get(["axisLabel", "showMaxLabel"]), c = t.length;
	a(o, 0, 1), a(s, c - 1, c - 2);
}
function TS(e, t, n) {
	e.showMinorTicks || F(t, function(e) {
		if (e && e.label.ignore) for (var t = 0; t < n.length; t++) {
			var r = n[t], i = dS(r), a = uS(e.label);
			if (i.tickValue != null && !i.onBand && i.tickValue === a.labelInfo.tick.value) {
				ES(r);
				return;
			}
		}
	});
}
function ES(e) {
	e && (e.ignore = !0);
}
function DS(e, t, n, r, i) {
	for (var a = [], o = [], s = [], c = 0; c < e.length; c++) {
		var l = e[c].coord;
		o[0] = l, o[1] = 0, s[0] = l, s[1] = n, t && (Ct(o, o, t), Ct(s, s, t));
		var u = new ld({
			shape: {
				x1: o[0],
				y1: o[1],
				x2: s[0],
				y2: s[1]
			},
			style: r,
			z2: 2,
			autoBatch: !0,
			silent: !0
		});
		tf(u.shape, u.style.lineWidth), u.anid = i + "_" + e[c].tickValue, a.push(u);
		var d = dS(u);
		d.onBand = !!e[c].onBand, d.tickValue = e[c].tickValue;
	}
	return a;
}
function OS(e, t, n, r) {
	var i = r.axis, a = r.getModel("axisTick"), o = a.get("show");
	if (o === "auto" && (o = !0, e.raw.axisTickAutoShow != null && (o = !!e.raw.axisTickAutoShow)), !o || i.scale.isBlank()) return [];
	for (var s = a.getModel("lineStyle"), c = e.tickDirection * a.get("length"), l = DS(i.getTicksCoords(), n.transform, c, j(s.getLineStyle(), { stroke: r.get([
		"axisLine",
		"lineStyle",
		"color"
	]) }), "ticks"), u = 0; u < l.length; u++) t.add(l[u]);
	return l;
}
function kS(e, t, n, r, i) {
	var a = r.axis, o = r.getModel("minorTick");
	if (!(!e.showMinorTicks || a.scale.isBlank())) {
		var s = a.getMinorTicksCoords();
		if (s.length) for (var c = o.getModel("lineStyle"), l = i * o.get("length"), u = j(c.getLineStyle(), j(r.getModel("axisTick").getLineStyle(), { stroke: r.get([
			"axisLine",
			"lineStyle",
			"color"
		]) })), d = 0; d < s.length; d++) for (var f = DS(s[d], n.transform, l, u, "minorticks_" + d), p = 0; p < f.length; p++) t.add(f[p]);
	}
}
function AS(e, t, n) {
	if (MS(e)) {
		var r = e.axisLabelsCreationContext.out.noPxChangeTryDetermine;
		if (n.noPxChange) {
			for (var i = !0, a = 0; a < r.length; a++) i &&= r[a]();
			if (i) return !1;
		}
		r.length && (t.remove(e.labelGroup), NS(e, null, null, null));
	}
	return !0;
}
function jS(e, t, n, r, i, a) {
	var o = i.axis, s = ue(e.raw.axisLabelShow, i.get(["axisLabel", "show"])), c = new ju();
	n.add(c);
	var l = Ub(r);
	if (!s || o.scale.isBlank()) {
		NS(t, [], c, l);
		return;
	}
	var u = i.getModel("axisLabel"), d = o.getViewLabels(l), f = (ue(e.raw.labelRotate, u.get("rotate")) || 0) * sS / 180, p = yS.innerTextLayout(e.rotation, f, e.labelDirection), m = i.getCategories && i.getCategories(!0), h = [], g = i.get("triggerEvent"), _ = Infinity, v = -Infinity;
	F(d, function(e, t) {
		var n = e.tick, r = e.formattedLabel, s = e.rawLabel, l = u, f = gb(o.scale, n);
		if (m && m[f]) {
			var y = m[f];
			G(y) && y.textStyle && (l = new lp(y.textStyle, u, i.ecModel));
		}
		var b = l.getTextColor() || i.get([
			"axisLine",
			"lineStyle",
			"color"
		]), x = l.getShallow("align", !0) || p.textAlign, S = K(l.getShallow("alignMinLabel", !0), x), C = K(l.getShallow("alignMaxLabel", !0), x), w = l.getShallow("verticalAlign", !0) || l.getShallow("baseline", !0) || p.textVerticalAlign, T = K(l.getShallow("verticalAlignMinLabel", !0), w), E = K(l.getShallow("verticalAlignMaxLabel", !0), w), D = 10 + (n.time?.level || 0);
		_ = Math.min(_, D), v = Math.max(v, D);
		var O = new Ro({
			x: 0,
			y: 0,
			rotation: 0,
			silent: yS.isLabelSilent(i),
			z2: D,
			style: Vf(l, {
				text: r,
				align: t === 0 ? S : t === d.length - 1 ? C : x,
				verticalAlign: t === 0 ? T : t === d.length - 1 ? E : w,
				fill: H(b) ? b(o.type === "category" ? s : o.type === "value" ? f + "" : f, t) : b
			})
		});
		O.anid = "label_" + f;
		var k = uS(O);
		if (k.labelInfo = e, k.layoutRotation = p.rotation, xf({
			el: O,
			componentModel: i,
			itemName: r,
			formatterParamsExtra: {
				isTruncated: function() {
					return O.isTruncated;
				},
				value: s,
				tickIndex: t
			}
		}), g) {
			var A = yS.makeAxisEventDataBase(i);
			A.targetType = "axisLabel", A.value = s, A.tickIndex = t;
			var j = e.tick.break;
			if (j) {
				var M = j.parsedBreak;
				A.break = {
					start: M.vmin,
					end: M.vmax
				};
			}
			o.type === "category" && (A.dataIndex = f), Z(O).eventData = A, j && RS(i, a, O, j);
		}
		h.push(O), c.add(O);
	}), NS(t, I(h, function(e) {
		return {
			label: e,
			priority: uS(e).labelInfo.tick.break ? e.z2 + (v - _ + 1) : e.z2,
			defaultAttr: { ignore: e.ignore }
		};
	}), c, l);
}
function MS(e) {
	return !!e.labelLayoutList;
}
function NS(e, t, n, r) {
	e.labelLayoutList = t, e.labelGroup = n, e.axisLabelsCreationContext = r;
}
function PS(e, t, n, r) {
	var i = t.get(["axisLabel", "margin"]);
	F(n, function(n, a) {
		var o = Yx(n);
		if (o) {
			var s = o.label, c = uS(s);
			o.suggestIgnore = s.ignore, s.ignore = !1, Gn(FS, IS);
			var l = t.axis;
			FS.x = l.dataToCoord(gb(l.scale, c.labelInfo.tick)), FS.y = e.labelOffset + e.labelDirection * i, FS.rotation = c.layoutRotation, r.add(FS), FS.updateTransform(), r.remove(FS), FS.decomposeTransform(), Gn(s, FS), s.markRedraw(), qx(o, !0), Yx(o);
		}
	});
}
var FS = new No(), IS = new No();
function LS(e) {
	return !!e;
}
function RS(e, t, n, r) {
	n.on("click", function(n) {
		var i = {
			type: oS,
			breaks: [{
				start: r.parsedBreak.breakOption.start,
				end: r.parsedBreak.breakOption.end
			}]
		};
		i[e.axis.dim + "AxisIndex"] = e.componentIndex, t.dispatchAction(i);
	});
}
function zS(e, t, n) {
	var r = Hh();
	if (r) {
		var i = r.retrieveAxisBreakPairs(n, function(e) {
			return e && uS(e.label).labelInfo.tick.break;
		}, !0), a = e.get(["breakLabelLayout", "moveOverlap"], !0);
		(a === !0 || a === "auto") && F(i, function(r) {
			aS().adjustBreakLabelPair(e.axis.inverse, t, [Yx(n[r[0]]), Yx(n[r[1]])]);
		});
	}
}
//#endregion
//#region node_modules/echarts/lib/coord/cartesian/cartesianAxisHelper.js
function BS(e, t, n) {
	n ||= {};
	var r = t.axis, i = {}, a = r.getAxesOnZeroOf()[0], o = r.position, s = a ? "onZero" : o, c = r.dim, l = [
		e.x,
		e.x + e.width,
		e.y,
		e.y + e.height
	], u = {
		left: 0,
		right: 1,
		top: 0,
		bottom: 1,
		onZero: 2
	}, d = t.get("offset") || 0, f = c === "x" ? [l[2] - d, l[3] + d] : [l[0] - d, l[1] + d];
	if (a) {
		var p = a.toGlobalCoord(a.dataToCoord(0));
		f[u.onZero] = Math.max(Math.min(p, f[1]), f[0]);
	}
	i.position = [c === "y" ? f[u[s]] : l[0], c === "x" ? f[u[s]] : l[3]], i.rotation = Math.PI / 2 * (c === "x" ? 0 : 1), i.labelDirection = i.tickDirection = i.nameDirection = {
		top: -1,
		bottom: 1,
		left: -1,
		right: 1
	}[o], i.labelOffset = a ? f[u[o]] - f[u.onZero] : 0, t.get(["axisTick", "inside"]) && (i.tickDirection = -i.tickDirection), ue(n.labelInside, t.get(["axisLabel", "inside"])) && (i.labelDirection = -i.labelDirection);
	var m = t.get(["axisLabel", "rotate"]);
	return i.labelRotate = s === "top" ? -m : m, i.z2 = 1, i;
}
function VS(e) {
	return e.coordinateSystem && e.coordinateSystem.type === "cartesian2d";
}
function HS(e) {
	var t = {
		xAxisModel: null,
		yAxisModel: null
	};
	return F(t, function(n, r) {
		var i = r.replace(/Model$/, "");
		t[r] = e.getReferringComponents(i, gc).models[0];
	}), t;
}
function US(e, t, n, r, i, a) {
	for (var o = BS(e, n), s = !1, c = !1, l = 0; l < t.length; l++) _y(t[l].getOtherAxis(n.axis).scale) && (s = c = !0, n.axis.type === "category" && n.axis.onBand && (c = !1));
	return o.axisLineAutoShow = s, o.axisTickAutoShow = c, o.defaultNameMoveOverlap = a, new yS(n, r, o, i);
}
function WS(e, t, n) {
	var r = BS(t, n);
	e.updateCfg(r);
}
//#endregion
//#region node_modules/echarts/lib/coord/scaleRawExtentInfo.js
var GS = X(), KS = 3, qS = function() {
	function e(e, t, n, r, i) {
		var a = xy(e), o = a ? t.getCategories().length : null, s;
		if (a) {
			var c = t.getCategories(!0);
			s = c && !c.length;
		}
		var l = n.slice();
		(vy(e) || by(e) || yy(e)) && (Ec(l, YS(e, t.get("dataMin", !0))), Dc(l, YS(e, t.get("dataMax", !0)))), jc(l) || (l[0] = l[1] = NaN);
		var u = [], d = [!1, !1], f = t.get("min", !0);
		f === "dataMin" ? (u[0] = l[0], d[0] = !0) : (u[0] = YS(e, H(f) ? f({
			min: l[0],
			max: l[1]
		}) : f), d[0] = u[0] != null);
		var p = t.get("max", !0);
		p === "dataMax" ? (u[1] = l[1], d[1] = !0) : (u[1] = YS(e, H(p) ? p({
			min: l[0],
			max: l[1]
		}) : p), d[1] = u[1] != null);
		var m = XS(e, t), h = a ? null : l[1] - l[0] || Math.abs(l[0]);
		u[0] ??= a ? s ? l[0] : o ? 0 : NaN : l[0] - m[0] * h, u[1] ??= a ? s ? l[1] : o ? o - 1 : NaN : l[1] + m[1] * h, !kc(u[0]) && (u[0] = NaN), !kc(u[1]) && (u[1] = NaN);
		var g = s || le(u[0]) || le(u[1]) || a && !o, _ = vy(e), v = _ && t.needIncludeZero && t.needIncludeZero();
		v && (u[0] > 0 && u[1] > 0 && !d[0] && (u[0] = 0), u[0] < 0 && u[1] < 0 && !d[1] && (u[1] = 0));
		var y = !1;
		u[0] > u[1] && (u.reverse(), y = !0);
		var b = YS(e, t.get("startValue", !0)), x = b != null;
		!Ls(b) && r && (b = e.getDefaultStartValue ? e.getDefaultStartValue() : 0), Ls(b) && (x || !_ || v) && (b < u[0] && !d[0] ? (u[0] = b, d[0] = !0) : b > u[1] && !d[1] && (u[1] = b, d[1] = !0)), JS(this._i = {
			scale: e,
			dataMM: l,
			noZoomEffMM: u,
			zoomMM: [],
			fixMM: d,
			zoomFixMM: [!1, !1],
			startValue: b,
			isBlank: g,
			incl0: v,
			tggAxInv: y,
			ctnShp: i
		}, u);
	}
	return e.prototype.makeNoZoom = function() {
		return this._i.noZoomEffMM.slice();
	}, e.prototype.makeFinal = function() {
		var e = this._i, t = e.zoomMM, n = e.noZoomEffMM, r = e.zoomFixMM, i = e.fixMM, a = {
			fixMM: i,
			zoomFixMM: r,
			isBlank: e.isBlank,
			incl0: e.incl0,
			tggAxInv: e.tggAxInv,
			ctnShp: e.ctnShp,
			effMM: n.slice()
		}, o = a.effMM;
		return t[0] != null && (o[0] = t[0], i[0] = r[0] = !0), t[1] != null && (o[1] = t[1], i[1] = r[1] = !0), JS(e, o), a;
	}, e.prototype.makeRenderInfo = function() {
		return { startValue: this._i.startValue };
	}, e.prototype.setZoomMM = function(e, t) {
		this._i.zoomMM[e] = t;
	}, e;
}();
function JS(e, t) {
	var n = e.scale, r = e.dataMM;
	n.sanitize && (t[0] = n.sanitize(t[0], r), t[1] = n.sanitize(t[1], r), Mc(t));
}
function YS(e, t) {
	return t == null ? null : le(t) ? NaN : e.parse(t);
}
function XS(e, t) {
	var n;
	if (xy(e)) n = [0, 0];
	else {
		var r = t.get("boundaryGap");
		typeof r == "boolean" && (r = null), n = V(r) ? r : [r, r];
	}
	return [ZS(n[0]), ZS(n[1])];
}
function ZS(e) {
	return un(typeof e == "boolean" ? 0 : e, 1) || 0;
}
function QS(e) {
	var t = GS(e.scale);
	return t.extent ||= wc(), t;
}
function $S(e, t) {
	QS(e).dimIdxInCoord = t.get(e.dim);
}
function eC(e, t) {
	var n = e.scale, r = e.model, i = e.dim;
	n.rawExtentInfo || tC(n, e, i, r, t);
}
function tC(e, t, n, r, i) {
	var a = QS(t), o = a.extent, s = !1;
	xx(t, function(r) {
		if (r.boxCoordinateSystem) {
			var i = Jm(r).coord, c = a.dimIdxInCoord;
			if (c >= 0 && V(i)) {
				var l = i[c];
				l != null && !V(l) && Tc(o, e.parse(l));
			}
		} else if (r.coordinateSystem) {
			var u = r.getData();
			if (u) {
				var d = e.getFilter ? e.getFilter() : null;
				F(ub(u, n), function(e) {
					Oc(o, u.getApproximateExtent(e, d));
				});
			}
			r.__requireStartValue && r.__requireStartValue(t) && (s = !0);
		}
	});
	var c = sC(e, t, r);
	rC(e, new qS(e, r, o, s, c), i), a.extent = null;
}
function nC(e, t) {
	var n = e.scale;
	rC(n, new qS(n, e.model, t, !1, !1), KS);
}
function rC(e, t, n) {
	e.rawExtentInfo = t, t.from = n;
}
function iC(e, t) {
	aC.set(e, t);
}
var aC = q();
function oC(e, t, n, r, i) {
	e.rawExtentInfo || nC({
		scale: e,
		model: t
	}, i || wc());
	var a = e.rawExtentInfo.makeFinal(), o = a.effMM;
	return e.setExtent(o[0], o[1]), e.setBlank(a.isBlank), r && a.tggAxInv && n && !n.get("legacyMinMaxDontInverseAxis") && (r.inverse = !r.inverse), a;
}
function sC(e, t, n) {
	var r = _b(e, n), i = n.get("containShape", !0);
	if (i == null && !r && (i = !0), !i) return !1;
	var a = !1;
	return Ex(t, function(e) {
		a = !!aC.get(e) || a;
	}), a;
}
function cC(e, t, n, r) {
	if (n.ctnShp) {
		var i;
		if (Ex(e, function(t) {
			var n = aC.get(t);
			if (n) {
				var a = n(e, r);
				a && (i ||= [0, 0], Ec(i, a[0]), Dc(i, a[1]), ib(e));
			}
		}), i) {
			var a = t.getExtent();
			if (xy(t)) e.onBand || t.setExtent2(1, ts(a[0], a[0] + i[0]), ns(a[1], a[1] + i[1]));
			else {
				var o = a.slice();
				n.zoomFixMM[0] || (o[0] = ts(o[0], t.transformOut(t.transformIn(o[0], null) + i[0], null))), n.zoomFixMM[1] || (o[1] = ns(o[1], t.transformOut(t.transformIn(o[1], null) + i[1], null))), (o[0] < a[0] || o[1] > a[1]) && t.setExtent2(1, o[0], o[1]);
			}
		}
	}
}
//#endregion
//#region node_modules/echarts/lib/coord/axisStatisticsMetricsImpl.js
function lC() {
	Ox("liPosMinGap", uC);
}
function uC(e, t, n) {
	var r = q(), i = n.serUids, a = n.liPosMinGap, o, s = t.axis, c = s.scale, l = c.needTransform(), u = c.getFilter ? c.getFilter() : null, d = om(u);
	function f(n) {
		Cx(e, t.sers, function(e) {
			var t = e.getRawData(), r = t.getDimensionIndex(t.mapDimension(s.dim));
			r >= 0 && n(r, e, t.getStore());
		});
	}
	var p = 0;
	if (f(function(e, t, n) {
		r.set(t.uid, 1), (!i || !i.hasKey(t.uid)) && (o = !0), p += n.count();
	}), (!i || i.keys().length !== r.keys().length) && (o = !0), !o && a != null) {
		t.liPosMinGap = a;
		return;
	}
	Nv(dC, p);
	var m = 0;
	f(function(e, t, n) {
		for (var r = 0, i = n.count(); r < i; ++r) {
			var a = n.get(e, r);
			isFinite(a) && (!u || sm(d, a)) && (l && (a = c.transformIn(a, null)), dC.arr[m++] = a);
		}
	});
	var h = dC.typed ? dC.arr.subarray(0, m) : (dC.arr.length = m, dC.arr);
	dC.typed ? h.sort() : ys(h);
	for (var g = Infinity, _ = 1; _ < m; ++_) {
		var v = h[_] - h[_ - 1];
		v > 0 && v < g && (g = v);
	}
	n.liPosMinGap = t.liPosMinGap = Ls(g) ? g : m > 0 ? -2 : -1, n.serUids = r;
}
var dC = Nv({ ctor: jv }, 50);
//#endregion
//#region node_modules/echarts/lib/chart/helper/axisSnippets.js
function fC(e) {
	return function(t, n) {
		var r = Fx(t, { fromStat: { key: e } });
		if (Ls(r.w2)) return [-r.w2 / 2, r.w2 / 2];
	};
}
function pC(e, t) {
	return e + "|&" + t;
}
function mC(e) {
	return lC(), { liPosMinGap: !xy(e.scale) };
}
//#endregion
//#region node_modules/echarts/lib/layout/barCommon.js
function hC(e, t, n, r) {
	Mx(e, {
		key: t,
		seriesType: n,
		coordSysType: r,
		getMetrics: mC
	});
}
function gC(e) {
	return e.scale.rawExtentInfo.makeRenderInfo().startValue;
}
//#endregion
//#region node_modules/echarts/lib/coord/cartesian/GridModel.js
var _C = {
	left: 0,
	right: 0,
	top: 0,
	bottom: 0
}, vC = ["25%", "25%"], yC = "cartesian2d", bC = function(e) {
	r(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t.prototype.mergeDefaultAndTheme = function(t, n) {
		var r = Jg(t.outerBounds);
		e.prototype.mergeDefaultAndTheme.apply(this, arguments), r && t.outerBounds && qg(t.outerBounds, r);
	}, t.prototype.mergeOption = function(t, n) {
		e.prototype.mergeOption.apply(this, arguments), this.option.outerBounds && t.outerBounds && qg(this.option.outerBounds, t.outerBounds);
	}, t.type = "grid", t.dependencies = ["xAxis", "yAxis"], t.layoutMode = "box", t.defaultOption = {
		show: !1,
		z: 0,
		left: "15%",
		top: 65,
		right: "10%",
		bottom: 80,
		containLabel: !1,
		outerBoundsMode: "auto",
		outerBounds: _C,
		outerBoundsContain: "all",
		outerBoundsClampWidth: vC[0],
		outerBoundsClampHeight: vC[1],
		backgroundColor: Q.color.transparent,
		borderWidth: 1,
		borderColor: Q.color.neutral30
	}, t;
}(Zg), xC = Nc(), SC = "__ec_stack_";
function CC(e) {
	return e.get("stack") || SC + e.seriesIndex;
}
function wC(e, t) {
	var n = TC(e, t);
	return n.columnMap = EC(n), n;
}
function TC(e, t) {
	var n = pC(t, yC), r = [], i = Fx(e, {
		fromStat: { key: n },
		min: 1
	});
	return Sx(e, n, function(e) {
		r.push({
			barWidth: ps(e.get("barWidth"), i.w),
			barMaxWidth: ps(e.get("barMaxWidth"), i.w),
			barMinWidth: ps(e.get("barMinWidth") || (kC(e) ? .5 : 1), i.w),
			barGap: e.get("barGap"),
			barCategoryGap: e.get("barCategoryGap"),
			defaultBarGap: e.get("defaultBarGap"),
			stackId: CC(e)
		});
	}), {
		bandWidthResult: i,
		seriesInfo: r
	};
}
function EC(e) {
	var t = e.bandWidthResult.w, n = t, r = 0, i, a, o = [], s = {};
	F(e.seriesInfo, function(e, t) {
		t || (a = e.defaultBarGap || 0);
		var c = e.stackId;
		Te(s, c) || r++;
		var l = s[c];
		l || (l = s[c] = {
			width: 0,
			maxWidth: 0
		}, o.push(c));
		var u = e.barWidth;
		u && !l.width && (l.width = u, u = ts(n, u), n -= u);
		var d = e.barMaxWidth;
		d && (l.maxWidth = d);
		var f = e.barMinWidth;
		f && (l.minWidth = f);
		var p = e.barGap;
		p != null && (a = p);
		var m = e.barCategoryGap;
		m != null && (i = m);
	}), i ??= ns(35 - o.length * 4, 15) + "%";
	var c = ps(i, t), l = ps(a, 1), u = (n - c) / (r + (r - 1) * l);
	u = ns(u, 0), F(o, function(e) {
		var t = s[e], i = t.maxWidth, a = t.minWidth;
		if (t.width) {
			var o = t.width;
			i && (o = ts(o, i)), a && (o = ns(o, a)), t.width = o, n -= o + l * o, r--;
		} else {
			var o = u;
			i && i < o && (o = ts(i, n)), a && a > o && (o = a), o !== u && (t.width = o, n -= o + l * o, r--);
		}
	}), u = (n - c) / (r + (r - 1) * l), u = ns(u, 0);
	var d = 0, f;
	F(o, function(e) {
		var t = s[e];
		t.width ||= u, f = t, d += t.width * (1 + l);
	}), f && (d -= f.width * l);
	var p = {}, m = -d / 2;
	return F(o, function(e) {
		var n = s[e];
		p[e] = p[e] || {
			bandWidth: t,
			offset: m,
			width: n.width
		}, m += n.width * (1 + l);
	}), p;
}
function DC(e) {
	return {
		seriesType: e,
		overallReset: function(t) {
			var n = pC(e, yC);
			Tx(t, n, function(t) {
				var r = wC(t, e);
				Sx(t, n, function(e) {
					var t = r.columnMap[CC(e)];
					e.getData().setLayout({
						bandWidth: t.bandWidth,
						offset: t.offset,
						size: t.width
					});
				});
			});
		}
	};
}
function OC(e) {
	return {
		seriesType: e,
		plan: Uv(),
		reset: function(e) {
			if (VS(e)) {
				var t = e.getData(), n = e.coordinateSystem, r = n.getBaseAxis(), i = n.getOtherAxis(r), a = t.getDimensionIndex(t.mapDimension(i.dim)), o = t.getDimensionIndex(t.mapDimension(r.dim)), s = e.get("showBackground", !0), c = t.mapDimension(i.dim), l = t.getCalculationInfo("stackResultDimension"), u = rh(t, c) && !!t.getCalculationInfo("stackedOnSeries"), d = i.isHorizontal(), f = i.toGlobalCoord(i.dataToCoord(gC(i))), p = kC(e), m = e.get("barMinHeight") || 0, h = l && t.getDimensionIndex(l), g = t.getLayout("size"), _ = t.getLayout("offset");
				return { progress: function(e, t) {
					for (var r = e.count, i = p && Mv(r * 3), c = p && s && Mv(r * 3), l = p && Mv(r), v = n.master.getRect(), y = d ? v.width : v.height, b, x = t.getStore(), S = 0; (b = e.next()) != null;) {
						var C = x.get(u ? h : a, b), w = x.get(o, b), T = f, E = void 0;
						u && (E = +C - x.get(a, b));
						var D = void 0, O = void 0, k = void 0, A = void 0;
						if (d) {
							var j = n.dataToPoint([C, w]);
							u && (T = n.dataToPoint([E, w])[0]), D = T, O = j[1] + _, k = j[0] - T, A = g, rs(k) < m && (k = (k < 0 ? -1 : 1) * m);
						} else {
							var j = n.dataToPoint([w, C]);
							u && (T = n.dataToPoint([w, E])[1]), D = j[0] + _, O = T, k = g, A = j[1] - T, rs(A) < m && (A = (A <= 0 ? -1 : 1) * m);
						}
						p ? (i[S] = D, i[S + 1] = O, i[S + 2] = d ? k : A, c && (c[S] = d ? v.x : D, c[S + 1] = d ? O : v.y, c[S + 2] = y), l[b] = b) : t.setItemLayout(b, {
							x: D,
							y: O,
							width: k,
							height: A
						}), S += 3;
					}
					p && t.setLayout({
						largePoints: i,
						largeDataIndices: l,
						largeBackgroundPoints: c,
						valueAxisHorizontal: d
					});
				} };
			}
		}
	};
}
function kC(e) {
	return e.pipelineContext && e.pipelineContext.large;
}
function AC(e) {
	return fC(pC(e, yC));
}
function jC(e) {
	xC(e, function() {
		function t(t) {
			var n = pC(t, yC);
			hC(e, n, t, yC), iC(n, AC(t));
		}
		t("bar"), t("pictorialBar");
	});
}
//#endregion
//#region node_modules/echarts/lib/chart/bar/BaseBarSeries.js
var MC = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.getInitialData = function(e, t) {
		return sh(null, this, { useEncodeDefaulter: !0 });
	}, t.prototype.getMarkerPosition = function(e, t, n) {
		var r = this.coordinateSystem;
		if (r && r.clampData) {
			var i = r.clampData(e), a = r.dataToPoint(i);
			if (n) F(r.getAxes(), function(e, n) {
				if (e.type === "category" && t != null) {
					var r = e.getTicksCoords(), o = e.getTickModel().get("alignWithLabel"), s = i[n], c = t[n] === "x1" || t[n] === "y1";
					if (c && !o && (s += 1), r.length < 2) return;
					if (r.length === 2) {
						a[n] = e.toGlobalCoord(e.getExtent()[+!!c]);
						return;
					}
					for (var l = void 0, u = void 0, d = 1, f = 0; f < r.length; f++) {
						var p = r[f].coord, m = f === r.length - 1 ? r[f - 1].tickValue + d : r[f].tickValue;
						if (m === s) {
							u = p;
							break;
						}
						if (m < s) l = p;
						else if (l != null && m > s) {
							u = (p + l) / 2;
							break;
						}
						f === 1 && (d = m - r[0].tickValue);
					}
					u ?? (l ? l && (u = r[r.length - 1].coord) : u = r[0].coord), a[n] = e.toGlobalCoord(u);
				}
			});
			else {
				var o = this.getData(), s = o.getLayout("offset"), c = o.getLayout("size"), l = +!r.getBaseAxis().isHorizontal();
				a[l] += s + c / 2;
			}
			return a;
		}
		return [NaN, NaN];
	}, t.prototype.__requireStartValue = function(e) {
		return this.getBaseAxis() !== e;
	}, t.type = "series.__base_bar__", t.defaultOption = {
		z: 2,
		coordinateSystem: "cartesian2d",
		legendHoverLink: !0,
		barMinHeight: 0,
		barMinAngle: 0,
		large: !1,
		largeThreshold: 400,
		progressive: 3e3,
		progressiveChunkMode: "mod",
		defaultBarGap: "10%"
	}, t;
}(Q_);
Q_.registerClass(MC);
//#endregion
//#region node_modules/echarts/lib/chart/bar/BarSeries.js
var NC = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.getInitialData = function() {
		return sh(null, this, {
			useEncodeDefaulter: !0,
			createInvertedIndices: !!this.get("realtimeSort", !0) || null
		});
	}, t.prototype.getProgressive = function() {
		return this.get("large") ? this.get("progressive") : !1;
	}, t.prototype.__preparePipelineContext = function(e, t) {
		var n = zc(this, e, t);
		return n.progressiveRender && (n.large = !0), n;
	}, t.prototype.brushSelector = function(e, t, n) {
		return n.rect(t.getItemLayout(e));
	}, t.type = "series.bar", t.dependencies = ["grid", "polar"], t.defaultOption = mh(MC.defaultOption, {
		clip: !0,
		roundCap: !1,
		showBackground: !1,
		backgroundStyle: {
			color: "rgba(180, 180, 180, 0.2)",
			borderColor: null,
			borderWidth: 0,
			borderType: "solid",
			borderRadius: 0,
			shadowBlur: 0,
			shadowColor: null,
			shadowOffsetX: 0,
			shadowOffsetY: 0,
			opacity: 1
		},
		select: { itemStyle: {
			borderColor: Q.color.primary,
			borderWidth: 2
		} },
		realtimeSort: !1
	}), t;
}(MC), PC = "\0__throttleOriginMethod", FC = "\0__throttleRate", IC = "\0__throttleType";
function LC(e, t, n) {
	var r, i = 0, a = 0, o = null, s, c, l, u;
	t ||= 0;
	function d() {
		a = (/* @__PURE__ */ new Date()).getTime(), o = null, e.apply(c, l || []);
	}
	var f = function() {
		var e = [...arguments];
		r = (/* @__PURE__ */ new Date()).getTime(), c = this, l = e;
		var f = u || t, p = u || n;
		u = null, s = r - (p ? i : a) - f, clearTimeout(o), p ? o = setTimeout(d, f) : s >= 0 ? d() : o = setTimeout(d, -s), i = r;
	};
	return f.clear = function() {
		o &&= (clearTimeout(o), null);
	}, f.debounceNextCall = function(e) {
		u = e;
	}, f;
}
function RC(e, t, n, r) {
	var i = e[t];
	if (i) {
		var a = i[PC] || i, o = i[IC];
		if (i[FC] !== n || o !== r) {
			if (n == null || !r) return e[t] = a;
			i = e[t] = LC(a, n, r === "debounce"), i[PC] = a, i[IC] = r, i[FC] = n;
		}
		return i;
	}
}
function zC(e, t) {
	var n = e[t];
	n && n[PC] && (n.clear && n.clear(), e[t] = n[PC]);
}
//#endregion
//#region node_modules/echarts/lib/util/shape/sausage.js
var BC = function() {
	function e() {
		this.cx = 0, this.cy = 0, this.r0 = 0, this.r = 0, this.startAngle = 0, this.endAngle = Math.PI * 2, this.clockwise = !0;
	}
	return e;
}(), VC = function(e) {
	r(t, e);
	function t(t) {
		var n = e.call(this, t) || this;
		return n.type = "sausage", n;
	}
	return t.prototype.getDefaultShape = function() {
		return new BC();
	}, t.prototype.buildPath = function(e, t) {
		var n = t.cx, r = t.cy, i = Math.max(t.r0 || 0, 0), a = Math.max(t.r, 0), o = (a - i) * .5, s = i + o, c = t.startAngle, l = t.endAngle, u = t.clockwise, d = Math.PI * 2, f = u ? l - c < d : c - l < d;
		f || (c = l - (u ? d : -d));
		var p = Math.cos(c), m = Math.sin(c), h = Math.cos(l), g = Math.sin(l);
		f ? (e.moveTo(p * i + n, m * i + r), e.arc(p * s + n, m * s + r, o, -Math.PI + c, c, !u)) : e.moveTo(p * a + n, m * a + r), e.arc(n, r, a, c, l, !u), e.arc(h * s + n, g * s + r, o, l - Math.PI * 2, l - Math.PI, !u), i !== 0 && e.arc(n, r, i, l, c, u);
	}, t;
}(yo);
//#endregion
//#region node_modules/echarts/lib/label/sectorLabel.js
function HC(e, t) {
	t ||= {};
	var n = t.isRoundCap;
	return function(t, r, i) {
		var a = r.position;
		if (!a || a instanceof Array) return dn(t, r, i);
		var o = e(a), s = r.distance == null ? 5 : r.distance, c = this.shape, l = c.cx, u = c.cy, d = c.r, f = c.r0, p = (d + f) / 2, m = c.startAngle, h = c.endAngle, g = (m + h) / 2, _ = n ? Math.abs(d - f) / 2 : 0, v = Math.cos, y = Math.sin, b = l + d * v(m), x = u + d * y(m), S = "left", C = "top";
		switch (o) {
			case "startArc":
				b = l + (f - s) * v(g), x = u + (f - s) * y(g), S = "center", C = "top";
				break;
			case "insideStartArc":
				b = l + (f + s) * v(g), x = u + (f + s) * y(g), S = "center", C = "bottom";
				break;
			case "startAngle":
				b = l + p * v(m) + WC(m, s + _, !1), x = u + p * y(m) + GC(m, s + _, !1), S = "right", C = "middle";
				break;
			case "insideStartAngle":
				b = l + p * v(m) + WC(m, -s + _, !1), x = u + p * y(m) + GC(m, -s + _, !1), S = "left", C = "middle";
				break;
			case "middle":
				b = l + p * v(g), x = u + p * y(g), S = "center", C = "middle";
				break;
			case "endArc":
				b = l + (d + s) * v(g), x = u + (d + s) * y(g), S = "center", C = "bottom";
				break;
			case "insideEndArc":
				b = l + (d - s) * v(g), x = u + (d - s) * y(g), S = "center", C = "top";
				break;
			case "endAngle":
				b = l + p * v(h) + WC(h, s + _, !0), x = u + p * y(h) + GC(h, s + _, !0), S = "left", C = "middle";
				break;
			case "insideEndAngle":
				b = l + p * v(h) + WC(h, -s + _, !0), x = u + p * y(h) + GC(h, -s + _, !0), S = "right", C = "middle";
				break;
			default: return dn(t, r, i);
		}
		return t ||= {}, t.x = b, t.y = x, t.align = S, t.verticalAlign = C, t;
	};
}
function UC(e, t, n, r) {
	if (W(r)) {
		e.setTextConfig({ rotation: r });
		return;
	}
	if (V(t)) {
		e.setTextConfig({ rotation: 0 });
		return;
	}
	var i = e.shape, a = i.clockwise ? i.startAngle : i.endAngle, o = i.clockwise ? i.endAngle : i.startAngle, s = (a + o) / 2, c, l = n(t);
	switch (l) {
		case "startArc":
		case "insideStartArc":
		case "middle":
		case "insideEndArc":
		case "endArc":
			c = s;
			break;
		case "startAngle":
		case "insideStartAngle":
			c = a;
			break;
		case "endAngle":
		case "insideEndAngle":
			c = o;
			break;
		default:
			e.setTextConfig({ rotation: 0 });
			return;
	}
	var u = Math.PI * 1.5 - c;
	l === "middle" && u > Math.PI / 2 && u < Math.PI * 1.5 && (u -= Math.PI), e.setTextConfig({ rotation: u });
}
function WC(e, t, n) {
	return t * Math.sin(e) * (n ? -1 : 1);
}
function GC(e, t, n) {
	return t * Math.cos(e) * (n ? 1 : -1);
}
//#endregion
//#region node_modules/echarts/lib/chart/helper/sectorHelper.js
function KC(e, t, n) {
	var r = e.get("borderRadius");
	if (r == null) return n ? { cornerRadius: 0 } : null;
	V(r) || (r = [
		r,
		r,
		r,
		r
	]);
	var i = Math.abs(t.r || 0 - t.r0 || 0);
	return { cornerRadius: I(r, function(e) {
		return un(e, i);
	}) };
}
//#endregion
//#region node_modules/echarts/lib/chart/bar/BarView.js
var qC = Math.max, JC = Math.min, YC = function(e) {
	r(t, e);
	function t() {
		var t = e.call(this) || this;
		return t.type = "bar", t._isFirstFrame = !0, t;
	}
	return t.prototype.render = function(e, t, n, r) {
		this._model = e, this._removeOnRenderedListener(n), this._updateDrawMode(e);
		var i = e.get("coordinateSystem");
		(i === "cartesian2d" || i === "polar") && (this._progressiveEls = null, this._isLargeDraw ? this._renderLarge(e, t, n) : this._renderNormal(e, t, n, r));
	}, t.prototype.incrementalPrepareRender = function(e) {
		this._clear(), this._updateDrawMode(e), this._updateLargeClip(e);
	}, t.prototype.incrementalRender = function(e, t) {
		this._progressiveEls = [], this._incrementalRenderLarge(e, t);
	}, t.prototype.eachRendered = function(e) {
		Cf(this._progressiveEls || this.group, e);
	}, t.prototype._updateDrawMode = function(e) {
		var t = e.pipelineContext.large;
		(this._isLargeDraw == null || t !== this._isLargeDraw) && (this._isLargeDraw = t, this._clear());
	}, t.prototype._renderNormal = function(e, t, n, r) {
		var i = this.group, a = e.getData(), o = this._data, s = e.coordinateSystem, c = s.getBaseAxis(), l;
		s.type === "cartesian2d" ? l = c.isHorizontal() : s.type === "polar" && (l = c.dim === "angle");
		var u = e.isAnimationEnabled() ? e : null, d = QC(e, s);
		d && this._enableRealtimeSort(d, a, n);
		var f = e.get("clip", !0) || d, p = s.getArea();
		i.removeClipPath();
		var m = e.get("roundCap", !0), h = e.get("showBackground", !0), g = e.getModel("backgroundStyle"), _ = g.get("borderRadius") || 0, v = [], y = this._backgroundEls, b = r && r.isInitSort, x = r && r.type === "changeAxisOrder";
		function S(e) {
			var t = iw[s.type](a, e);
			if (!t) return null;
			var n = hw(s, l, t);
			return n.useStyle(g.getItemStyle()), s.type === "cartesian2d" ? n.setShape("r", _) : n.setShape("cornerRadius", _), v[e] = n, n;
		}
		a.diff(o).add(function(t) {
			var n = a.getItemModel(t), r = iw[s.type](a, t, n);
			if (r && (h && S(t), !(!a.hasValue(t) || !rw[s.type](r)))) {
				var o = !1;
				f && (o = XC[s.type](p, r));
				var g = ZC[s.type](e, a, t, r, l, u, c.model, !1, m);
				d && (g.forceLabelAnimation = !0), sw(g, a, t, n, r, e, l, s.type === "polar"), b ? g.attr({ shape: r }) : d ? $C(d, u, g, r, t, l, !1, !1) : Fd(g, { shape: r }, e, t), a.setItemGraphicEl(t, g), i.add(g), g.ignore = o;
			}
		}).update(function(t, n) {
			var r = a.getItemModel(t), C = iw[s.type](a, t, r);
			if (C) {
				if (h) {
					var w = void 0;
					y.length === 0 ? w = S(n) : (w = y[n], w.useStyle(g.getItemStyle()), s.type === "cartesian2d" ? w.setShape("r", _) : w.setShape("cornerRadius", _), v[t] = w);
					var T = iw[s.type](a, t), E = mw(l, T, s);
					Pd(w, { shape: E }, u, t);
				}
				var D = o.getItemGraphicEl(n);
				if (!a.hasValue(t) || !rw[s.type](C)) {
					i.remove(D);
					return;
				}
				var O = !1;
				if (f && (O = XC[s.type](p, C), O && i.remove(D)), D && (D.type === "sector" && m || D.type === "sausage" && !m) && (D && zd(D, e, n), D = null), D ? Bd(D) : D = ZC[s.type](e, a, t, C, l, u, c.model, !0, m), d && (D.forceLabelAnimation = !0), x) {
					var k = D.getTextContent();
					if (k) {
						var A = Xf(k);
						A.prevValue != null && (A.prevValue = A.value);
					}
				} else sw(D, a, t, r, C, e, l, s.type === "polar");
				b ? D.attr({ shape: C }) : d ? $C(d, u, D, C, t, l, !0, x) : Pd(D, { shape: C }, e, t, null), a.setItemGraphicEl(t, D), D.ignore = O, i.add(D);
			}
		}).remove(function(t) {
			var n = o.getItemGraphicEl(t);
			n && zd(n, e, t);
		}).execute();
		var C = this._backgroundGroup ||= new ju();
		C.removeAll();
		for (var w = 0; w < v.length; ++w) C.add(v[w]);
		i.add(C), this._backgroundEls = v, this._data = a;
	}, t.prototype._renderLarge = function(e, t, n) {
		this._clear(), dw(e, this.group), this._updateLargeClip(e);
	}, t.prototype._incrementalRenderLarge = function(e, t) {
		this._removeBackground(), dw(t, this.group, this._progressiveEls, !0);
	}, t.prototype._updateLargeClip = function(e) {
		var t = e.get("clip", !0) && ey(e.coordinateSystem, !1, e), n = this.group;
		t ? n.setClipPath(t) : n.removeClipPath();
	}, t.prototype._enableRealtimeSort = function(e, t, n) {
		var r = this;
		if (t.count()) {
			var i = e.baseAxis;
			if (this._isFirstFrame) this._dispatchInitSort(t, e, n), this._isFirstFrame = !1;
			else {
				var a = function(e) {
					var n = t.getItemGraphicEl(e), r = n && n.shape;
					return r && Math.abs(i.isHorizontal() ? r.height : r.width) || 0;
				};
				this._onRendered = function() {
					r._updateSortWithinSameData(t, a, i, n);
				}, n.getZr().on("rendered", this._onRendered);
			}
		}
	}, t.prototype._dataSort = function(e, t, n) {
		var r = [];
		return e.each(e.mapDimension(t.dim), function(e, t) {
			var i = n(t);
			i ??= NaN, r.push({
				dataIndex: t,
				mappedValue: i,
				ordinalNumber: e
			});
		}), r.sort(function(e, t) {
			return t.mappedValue - e.mappedValue;
		}), { ordinalNumbers: I(r, function(e) {
			return e.ordinalNumber;
		}) };
	}, t.prototype._isOrderChangedWithinSameData = function(e, t, n) {
		for (var r = n.scale, i = e.mapDimension(n.dim), a = Number.MAX_VALUE, o = 0, s = r.getOrdinalMeta().categories.length; o < s; ++o) {
			var c = e.rawIndexOf(i, r.getRawOrdinalNumber(o)), l = c < 0 ? Number.MIN_VALUE : t(e.indexOfRawIndex(c));
			if (l > a) return !0;
			a = l;
		}
		return !1;
	}, t.prototype._isOrderDifferentInView = function(e, t) {
		for (var n = t.scale, r = n.getExtent(), i = Math.max(0, r[0]), a = Math.min(r[1], n.getOrdinalMeta().categories.length - 1); i <= a; ++i) if (e.ordinalNumbers[i] !== n.getRawOrdinalNumber(i)) return !0;
	}, t.prototype._updateSortWithinSameData = function(e, t, n, r) {
		if (this._isOrderChangedWithinSameData(e, t, n)) {
			var i = this._dataSort(e, n, t);
			this._isOrderDifferentInView(i, n) && (this._removeOnRenderedListener(r), r.dispatchAction({
				type: "changeAxisOrder",
				componentType: n.dim + "Axis",
				axisId: n.index,
				sortInfo: i
			}));
		}
	}, t.prototype._dispatchInitSort = function(e, t, n) {
		var r = t.baseAxis, i = this._dataSort(e, r, function(n) {
			return e.get(e.mapDimension(t.otherAxis.dim), n);
		});
		n.dispatchAction({
			type: "changeAxisOrder",
			componentType: r.dim + "Axis",
			isInitSort: !0,
			axisId: r.index,
			sortInfo: i
		});
	}, t.prototype.remove = function(e, t) {
		this._clear(this._model), this._removeOnRenderedListener(t);
	}, t.prototype.dispose = function(e, t) {
		this._removeOnRenderedListener(t);
	}, t.prototype._removeOnRenderedListener = function(e) {
		this._onRendered &&= (e.getZr().off("rendered", this._onRendered), null);
	}, t.prototype._clear = function(e) {
		var t = this.group, n = this._data;
		e && e.isAnimationEnabled() && n && !this._isLargeDraw ? (this._removeBackground(), this._backgroundEls = [], n.eachItemGraphicEl(function(t) {
			zd(t, e, Z(t).dataIndex);
		})) : t.removeAll(), this._data = null, this._isFirstFrame = !0;
	}, t.prototype._removeBackground = function() {
		this.group.remove(this._backgroundGroup), this._backgroundGroup = null;
	}, t.type = "bar", t;
}(Kv), XC = {
	cartesian2d: function(e, t) {
		var n = t.width < 0 ? -1 : 1, r = t.height < 0 ? -1 : 1;
		n < 0 && (t.x += t.width, t.width = -t.width), r < 0 && (t.y += t.height, t.height = -t.height);
		var i = e.x + e.width, a = e.y + e.height, o = qC(t.x, e.x), s = JC(t.x + t.width, i), c = qC(t.y, e.y), l = JC(t.y + t.height, a), u = s < o, d = l < c;
		return t.x = u && o > i ? s : o, t.y = d && c > a ? l : c, t.width = u ? 0 : s - o, t.height = d ? 0 : l - c, n < 0 && (t.x += t.width, t.width = -t.width), r < 0 && (t.y += t.height, t.height = -t.height), u || d;
	},
	polar: function(e, t) {
		var n = t.r0 <= t.r ? 1 : -1;
		if (n < 0) {
			var r = t.r;
			t.r = t.r0, t.r0 = r;
		}
		var i = JC(t.r, e.r), a = qC(t.r0, e.r0);
		t.r = i, t.r0 = a;
		var o = i - a < 0;
		if (n < 0) {
			var r = t.r;
			t.r = t.r0, t.r0 = r;
		}
		return o;
	}
}, ZC = {
	cartesian2d: function(e, t, n, r, i, a, o, s, c) {
		var l = new No({
			shape: k({}, r),
			z2: 1
		});
		if (l.__dataIndex = n, l.name = "item", a) {
			var u = l.shape, d = i ? "height" : "width";
			u[d] = 0;
		}
		return l;
	},
	polar: function(e, t, n, r, i, a, o, s, c) {
		var l = !i && c ? VC : Qu, u = new l({
			shape: r,
			z2: 1
		});
		if (u.name = "item", u.calculateTextPosition = HC(ow(i), { isRoundCap: l === VC }), a) {
			var d = u.shape, f = i ? "r" : "endAngle", p = {};
			d[f] = i ? r.r0 : r.startAngle, p[f] = r[f], (s ? Pd : Fd)(u, { shape: p }, a);
		}
		return u;
	}
};
function QC(e, t) {
	var n = e.get("realtimeSort", !0), r = t.getBaseAxis();
	if (n && r.type === "category" && t.type === "cartesian2d") return {
		baseAxis: r,
		otherAxis: t.getOtherAxis(r)
	};
}
function $C(e, t, n, r, i, a, o, s) {
	var c, l;
	a ? (l = {
		x: r.x,
		width: r.width
	}, c = {
		y: r.y,
		height: r.height
	}) : (l = {
		y: r.y,
		height: r.height
	}, c = {
		x: r.x,
		width: r.width
	}), s || (o ? Pd : Fd)(n, { shape: c }, t, i, null);
	var u = t ? e.baseAxis.model : null;
	(o ? Pd : Fd)(n, { shape: l }, u, i);
}
function ew(e, t) {
	for (var n = 0; n < t.length; n++) if (!isFinite(e[t[n]])) return !0;
	return !1;
}
var tw = [
	"x",
	"y",
	"width",
	"height"
], nw = [
	"cx",
	"cy",
	"r",
	"startAngle",
	"endAngle"
], rw = {
	cartesian2d: function(e) {
		return !ew(e, tw);
	},
	polar: function(e) {
		return !ew(e, nw);
	}
}, iw = {
	cartesian2d: function(e, t, n) {
		var r = e.getItemLayout(t);
		if (!r) return null;
		var i = n ? cw(n, r) : 0, a = r.width > 0 ? 1 : -1, o = r.height > 0 ? 1 : -1;
		return {
			x: r.x + a * i / 2,
			y: r.y + o * i / 2,
			width: r.width - a * i,
			height: r.height - o * i
		};
	},
	polar: function(e, t, n) {
		var r = e.getItemLayout(t);
		return {
			cx: r.cx,
			cy: r.cy,
			r0: r.r0,
			r: r.r,
			startAngle: r.startAngle,
			endAngle: r.endAngle,
			clockwise: r.clockwise
		};
	}
};
function aw(e) {
	return e.startAngle != null && e.endAngle != null && e.startAngle === e.endAngle;
}
function ow(e) {
	return function(e) {
		var t = e ? "Arc" : "Angle";
		return function(e) {
			switch (e) {
				case "start":
				case "insideStart":
				case "end":
				case "insideEnd": return e + t;
				default: return e;
			}
		};
	}(e);
}
function sw(e, t, n, r, i, a, o, s) {
	var c = t.getItemVisual(n, "style");
	if (!s) {
		var l = r.get(["itemStyle", "borderRadius"]) || 0;
		e.setShape("r", l);
	} else if (!a.get("roundCap")) {
		var u = e.shape;
		k(u, KC(r.getModel("itemStyle"), u, !0)), e.setShape(u);
	}
	e.useStyle(c);
	var d = r.getShallow("cursor");
	d && e.attr("cursor", d);
	var f = s ? o ? i.r >= i.r0 ? "endArc" : "startArc" : i.endAngle >= i.startAngle ? "endAngle" : "startAngle" : o ? gw(i, a.coordinateSystem) : _w(i, a.coordinateSystem), p = Bf(r);
	zf(e, p, {
		labelFetcher: a,
		labelDataIndex: n,
		defaultText: _v(a.getData(), n),
		inheritColor: c.fill,
		defaultOpacity: c.opacity,
		defaultOutsidePosition: f
	});
	var m = e.getTextContent();
	if (s && m) {
		var h = r.get(["label", "position"]);
		e.textConfig.inside = h === "middle" || null, UC(e, h === "outside" ? f : h, ow(o), r.get(["label", "rotate"]));
	}
	Zf(m, p, a.getRawValue(n), function(e) {
		return vv(t, e);
	});
	var g = r.getModel(["emphasis"]);
	Ql(e, g.get("focus"), g.get("blurScope"), g.get("disabled")), nu(e, r), aw(i) && (e.style.fill = "none", e.style.stroke = "none", F(e.states, function(e) {
		e.style && (e.style.fill = e.style.stroke = "none");
	}));
}
function cw(e, t) {
	var n = e.get(["itemStyle", "borderColor"]);
	if (!n || n === "none") return 0;
	var r = e.get(["itemStyle", "borderWidth"]) || 0, i = isNaN(t.width) ? Number.MAX_VALUE : Math.abs(t.width), a = isNaN(t.height) ? Number.MAX_VALUE : Math.abs(t.height);
	return Math.min(r, i, a);
}
var lw = function() {
	function e() {}
	return e;
}(), uw = function(e) {
	r(t, e);
	function t(t) {
		var n = e.call(this, t) || this;
		return n.type = "largeBar", n;
	}
	return t.prototype.getDefaultShape = function() {
		return new lw();
	}, t.prototype.buildPath = function(e, t) {
		for (var n = t.points, r = this.baseDimIdx, i = 1 - this.baseDimIdx, a = [], o = [], s = this.barWidth, c = 0; c < n.length; c += 3) o[r] = s, o[i] = n[c + 2], a[r] = n[c + r], a[i] = n[c + i], e.rect(a[0], a[1], o[0], o[1]);
	}, t;
}(yo);
function dw(e, t, n, r) {
	var i = e.getData(), a = +!!i.getLayout("valueAxisHorizontal"), o = i.getLayout("largeDataIndices"), s = i.getLayout("size"), c = e.getModel("backgroundStyle"), l = i.getLayout("largeBackgroundPoints"), u = r ? Rc(e) : 0;
	if (l) {
		var d = new uw({
			shape: { points: l },
			incremental: u,
			silent: !0,
			z2: 0
		});
		d.baseDimIdx = a, d.largeDataIndices = o, d.barWidth = s, d.useStyle(c.getItemStyle()), t.add(d), n && n.push(d);
	}
	var f = new uw({
		shape: { points: i.getLayout("largePoints") },
		incremental: u,
		ignoreCoarsePointer: !0,
		z2: 1
	});
	f.baseDimIdx = a, f.largeDataIndices = o, f.barWidth = s, t.add(f), f.useStyle(i.getVisual("style")), f.style.stroke = null, Z(f).seriesIndex = e.seriesIndex, e.get("silent") || (f.on("mousedown", fw), f.on("mousemove", fw)), n && n.push(f);
}
var fw = LC(function(e) {
	var t = this, n = pw(t, e.offsetX, e.offsetY);
	Z(t).dataIndex = n >= 0 ? n : null;
}, 30, !1);
function pw(e, t, n) {
	for (var r = e.baseDimIdx, i = 1 - r, a = e.shape.points, o = e.largeDataIndices, s = [], c = [], l = e.barWidth, u = 0, d = a.length / 3; u < d; u++) {
		var f = u * 3;
		if (c[r] = l, c[i] = a[f + 2], s[r] = a[f + r], s[i] = a[f + i], c[i] < 0 && (s[i] += c[i], c[i] = -c[i]), t >= s[0] && t <= s[0] + c[0] && n >= s[1] && n <= s[1] + c[1]) return o[u];
	}
	return -1;
}
function mw(e, t, n) {
	if (ty(n, "cartesian2d")) {
		var r = t, i = n.getArea();
		return {
			x: e ? r.x : i.x,
			y: e ? i.y : r.y,
			width: e ? r.width : i.width,
			height: e ? i.height : r.height
		};
	}
	var i = n.getArea(), a = t;
	return {
		cx: i.cx,
		cy: i.cy,
		r0: e ? i.r0 : a.r0,
		r: e ? i.r : a.r,
		startAngle: e ? a.startAngle : 0,
		endAngle: e ? a.endAngle : Math.PI * 2
	};
}
function hw(e, t, n) {
	return new (e.type === "polar" ? Qu : No)({
		shape: mw(t, n, e),
		silent: !0,
		z2: 0
	});
}
function gw(e, t) {
	return e.height === 0 ? t.getOtherAxis(t.getBaseAxis()).inverse ? "bottom" : "top" : e.height > 0 ? "bottom" : "top";
}
function _w(e, t) {
	return e.width === 0 ? t.getOtherAxis(t.getBaseAxis()).inverse ? "left" : "right" : e.width >= 0 ? "right" : "left";
}
//#endregion
//#region node_modules/echarts/lib/chart/bar/install.js
function vw(e) {
	e.registerChartView(YC), e.registerSeriesModel(NC), e.registerLayout(e.PRIORITY.VISUAL.LAYOUT, DC("bar")), e.registerLayout(e.PRIORITY.VISUAL.PROGRESSIVE_LAYOUT, OC("bar")), e.registerProcessor(e.PRIORITY.PROCESSOR.STATISTIC, Rb("bar")), e.registerAction({
		type: "changeAxisOrder",
		event: "changeAxisOrder",
		update: "update"
	}, function(e, t) {
		var n = e.componentType || "series";
		t.eachComponent({
			mainType: n,
			query: e
		}, function(t) {
			e.sortInfo && t.axis.setCategorySortInfo(e.sortInfo);
		});
	}), jC(e);
}
//#endregion
//#region node_modules/echarts/lib/legacy/dataSelectAction.js
function yw(e, t, n, r, i) {
	var a = e + t;
	n.isSilent(a) || r.eachComponent({
		mainType: "series",
		subType: "pie"
	}, function(e) {
		for (var t = e.seriesIndex, r = e.option.selectedMap, o = i.selected, s = 0; s < o.length; s++) if (o[s].seriesIndex === t) {
			var c = e.getData(), l = fc(c, i.fromActionPayload);
			n.trigger(a, {
				type: a,
				seriesId: e.id,
				name: V(l) ? c.getName(l[0]) : c.getName(l),
				selected: U(r) ? r : k({}, r)
			});
		}
	});
}
function bw(e, t, n) {
	e.on("selectchanged", function(e) {
		var r = n.getModel();
		e.isFromClick ? (yw("map", "selectchanged", t, r, e), yw("pie", "selectchanged", t, r, e)) : e.fromAction === "select" ? (yw("map", "selected", t, r, e), yw("pie", "selected", t, r, e)) : e.fromAction === "unselect" && (yw("map", "unselected", t, r, e), yw("pie", "unselected", t, r, e));
	});
}
//#endregion
//#region node_modules/zrender/lib/mixin/Draggable.js
var xw = function() {
	function e(e, t) {
		this.target = e, this.topTarget = t && t.topTarget;
	}
	return e;
}(), Sw = function() {
	function e(e) {
		this.handler = e, e.on("mousedown", this._dragStart, this), e.on("mousemove", this._drag, this), e.on("mouseup", this._dragEnd, this);
	}
	return e.prototype._dragStart = function(e) {
		for (var t = e.target; t && !t.draggable;) t = t.parent || t.__hostTarget;
		t && (this._draggingTarget = t, t.dragging = !0, this._x = e.offsetX, this._y = e.offsetY, this.handler.dispatchToElement(new xw(t, e), "dragstart", e.event));
	}, e.prototype._drag = function(e) {
		var t = this._draggingTarget;
		if (t) {
			var n = e.offsetX, r = e.offsetY, i = n - this._x, a = r - this._y;
			this._x = n, this._y = r, t.drift(i, a, e), this.handler.dispatchToElement(new xw(t, e), "drag", e.event);
			var o = this.handler.findHover(n, r, t).target, s = this._dropTarget;
			this._dropTarget = o, t !== o && (s && o !== s && this.handler.dispatchToElement(new xw(s, e), "dragleave", e.event), o && o !== s && this.handler.dispatchToElement(new xw(o, e), "dragenter", e.event));
		}
	}, e.prototype._dragEnd = function(e) {
		var t = this._draggingTarget;
		t && (t.dragging = !1), this.handler.dispatchToElement(new xw(t, e), "dragend", e.event), this._dropTarget && this.handler.dispatchToElement(new xw(this._dropTarget, e), "drop", e.event), this._draggingTarget = null, this._dropTarget = null;
	}, e;
}(), Cw = /^(?:mouse|pointer|contextmenu|drag|drop)|click/, ww = [], Tw = J.browser.firefox && +J.browser.version.split(".")[0] < 39;
function Ew(e, t, n, r) {
	return n ||= {}, r ? Dw(e, t, n) : Tw && t.layerX != null && t.layerX !== t.offsetX ? (n.zrX = t.layerX, n.zrY = t.layerY) : t.offsetX == null ? Dw(e, t, n) : (n.zrX = t.offsetX, n.zrY = t.offsetY), n;
}
function Dw(e, t, n) {
	if (J.domSupported && e.getBoundingClientRect) {
		var r = t.clientX, i = t.clientY;
		if (Th(e)) {
			var a = e.getBoundingClientRect();
			n.zrX = r - a.left, n.zrY = i - a.top;
			return;
		}
		if (Sh(ww, e, r, i)) {
			n.zrX = ww[0], n.zrY = ww[1];
			return;
		}
	}
	n.zrX = n.zrY = 0;
}
function Ow(e) {
	return e || window.event;
}
function kw(e, t, n) {
	if (t = Ow(t), t.zrX != null) return t;
	var r = t.type;
	if (r && r.indexOf("touch") >= 0) {
		var i = r === "touchend" ? t.changedTouches[0] : t.targetTouches[0];
		i && Ew(e, i, t, n);
	} else {
		Ew(e, t, t, n);
		var a = Aw(t);
		t.zrDelta = a ? a / 120 : -(t.detail || 0) / 3;
	}
	var o = t.button;
	return t.which == null && o !== void 0 && Cw.test(t.type) && (t.which = o & 1 ? 1 : o & 2 ? 3 : o & 4 ? 2 : 0), t;
}
function Aw(e) {
	var t = e.wheelDelta;
	if (t) return t;
	var n = e.deltaX, r = e.deltaY;
	if (n == null || r == null) return t;
	var i = Math.abs(r === 0 ? n : r), a = r > 0 ? -1 : r < 0 ? 1 : n > 0 ? -1 : 1;
	return 3 * i * a;
}
function jw(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function Mw(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var Nw = function(e) {
	e.preventDefault(), e.stopPropagation(), e.cancelBubble = !0;
};
function Pw(e) {
	return e.which === 2 || e.which === 3;
}
//#endregion
//#region node_modules/zrender/lib/core/GestureMgr.js
var Fw = function() {
	function e() {
		this._track = [];
	}
	return e.prototype.recognize = function(e, t, n) {
		return this._doTrack(e, t, n), this._recognize(e);
	}, e.prototype.clear = function() {
		return this._track.length = 0, this;
	}, e.prototype._doTrack = function(e, t, n) {
		var r = e.touches;
		if (r) {
			for (var i = {
				points: [],
				touches: [],
				target: t,
				event: e
			}, a = 0, o = r.length; a < o; a++) {
				var s = r[a], c = Ew(n, s, {});
				i.points.push([c.zrX, c.zrY]), i.touches.push(s);
			}
			this._track.push(i);
		}
	}, e.prototype._recognize = function(e) {
		for (var t in Rw) if (Rw.hasOwnProperty(t)) {
			var n = Rw[t](this._track, e);
			if (n) return n;
		}
	}, e;
}();
function Iw(e) {
	var t = e[1][0] - e[0][0], n = e[1][1] - e[0][1];
	return Math.sqrt(t * t + n * n);
}
function Lw(e) {
	return [(e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2];
}
var Rw = { pinch: function(e, t) {
	var n = e.length;
	if (n) {
		var r = (e[n - 1] || {}).points, i = (e[n - 2] || {}).points || r;
		if (i && i.length > 1 && r && r.length > 1) {
			var a = Iw(r) / Iw(i);
			!isFinite(a) && (a = 1), t.pinchScale = a;
			var o = Lw(r);
			return t.pinchX = o[0], t.pinchY = o[1], {
				type: "pinch",
				target: e[0].target,
				event: t
			};
		}
	}
} }, zw = "silent";
function Bw(e, t, n) {
	return {
		type: e,
		event: n,
		target: t.target,
		topTarget: t.topTarget,
		cancelBubble: !1,
		offsetX: n.zrX,
		offsetY: n.zrY,
		gestureEvent: n.gestureEvent,
		pinchX: n.pinchX,
		pinchY: n.pinchY,
		pinchScale: n.pinchScale,
		wheelDelta: n.zrDelta,
		zrByTouch: n.zrByTouch,
		which: n.which,
		stop: Vw
	};
}
function Vw() {
	Nw(this.event);
}
var Hw = function(e) {
	r(t, e);
	function t() {
		var t = e !== null && e.apply(this, arguments) || this;
		return t.handler = null, t;
	}
	return t.prototype.dispose = function() {}, t.prototype.setCursor = function() {}, t;
}(Ii), Uw = function() {
	function e(e, t) {
		this.x = e, this.y = t;
	}
	return e;
}(), Ww = [
	"click",
	"dblclick",
	"mousewheel",
	"mouseout",
	"mouseup",
	"mousedown",
	"mousemove",
	"contextmenu"
], Gw = new Y(0, 0, 0, 0), Kw = function(e) {
	r(t, e);
	function t(t, n, r, i, a) {
		var o = e.call(this) || this;
		return o._hovered = new Uw(0, 0), o.storage = t, o.painter = n, o.painterRoot = i, o._pointerSize = a, r ||= new Hw(), o.proxy = null, o.setHandlerProxy(r), o._draggingMgr = new Sw(o), o;
	}
	return t.prototype.setHandlerProxy = function(e) {
		this.proxy && this.proxy.dispose(), e && (F(Ww, function(t) {
			e.on && e.on(t, this[t], this);
		}, this), e.handler = this), this.proxy = e;
	}, t.prototype.mousemove = function(e) {
		var t = e.zrX, n = e.zrY, r = Yw(this, t, n), i = this._hovered, a = i.target;
		a && !a.__zr && (i = this.findHover(i.x, i.y), a = i.target);
		var o = this._hovered = r ? new Uw(t, n) : this.findHover(t, n), s = o.target, c = this.proxy;
		c.setCursor && c.setCursor(s ? s.cursor : "default"), a && s !== a && this.dispatchToElement(i, "mouseout", e), this.dispatchToElement(o, "mousemove", e), s && s !== a && this.dispatchToElement(o, "mouseover", e);
	}, t.prototype.mouseout = function(e) {
		var t = e.zrEventControl;
		t !== "only_globalout" && this.dispatchToElement(this._hovered, "mouseout", e), t !== "no_globalout" && this.trigger("globalout", {
			type: "globalout",
			event: e
		});
	}, t.prototype.resize = function() {
		this._hovered = new Uw(0, 0);
	}, t.prototype.dispatch = function(e, t) {
		var n = this[e];
		n && n.call(this, t);
	}, t.prototype.dispose = function() {
		this.proxy.dispose(), this.storage = null, this.proxy = null, this.painter = null;
	}, t.prototype.setCursorStyle = function(e) {
		var t = this.proxy;
		t.setCursor && t.setCursor(e);
	}, t.prototype.dispatchToElement = function(e, t, n) {
		e ||= {};
		var r = e.target;
		if (!(r && r.silent)) {
			for (var i = "on" + t, a = Bw(t, e, n); r && (r[i] && (a.cancelBubble = !!r[i].call(r, a)), r.trigger(t, a), r = r.__hostTarget ? r.__hostTarget : r.parent, !a.cancelBubble););
			a.cancelBubble || (this.trigger(t, a), this.painter && this.painter.eachOtherLayer && this.painter.eachOtherLayer(function(e) {
				typeof e[i] == "function" && e[i].call(e, a), e.trigger && e.trigger(t, a);
			}));
		}
	}, t.prototype.findHover = function(e, t, n) {
		var r = this.storage.getDisplayList(), i = new Uw(e, t);
		if (Jw(r, i, e, t, n), this._pointerSize && !i.target) {
			for (var a = [], o = this._pointerSize, s = o / 2, c = new Y(e - s, t - s, o, o), l = r.length - 1; l >= 0; l--) {
				var u = r[l];
				u !== n && !u.ignore && !u.ignoreCoarsePointer && (!u.parent || !u.parent.ignoreCoarsePointer) && (Gw.copy(u.getBoundingRect()), u.transform && Gw.applyTransform(u.transform), Gw.intersect(c) && a.push(u));
			}
			if (a.length) {
				for (var d = 4, f = Math.PI / 12, p = Math.PI * 2, m = 0; m < s; m += d) for (var h = 0; h < p; h += f) if (Jw(a, i, e + m * Math.cos(h), t + m * Math.sin(h), n), i.target) return i;
			}
		}
		return i;
	}, t.prototype.processGesture = function(e, t) {
		this._gestureMgr ||= new Fw();
		var n = this._gestureMgr;
		t === "start" && n.clear();
		var r = n.recognize(e, this.findHover(e.zrX, e.zrY, null).target, this.proxy.dom);
		if (t === "end" && n.clear(), r) {
			var i = r.type;
			e.gestureEvent = i;
			var a = new Uw();
			a.target = r.target, this.dispatchToElement(a, i, r.event);
		}
	}, t;
}(Ii);
F([
	"click",
	"mousedown",
	"mouseup",
	"mousewheel",
	"dblclick",
	"contextmenu"
], function(e) {
	Kw.prototype[e] = function(t) {
		var n = t.zrX, r = t.zrY, i = Yw(this, n, r), a, o;
		if ((e !== "mouseup" || !i) && (a = this.findHover(n, r), o = a.target), e === "mousedown") this._downEl = o, this._downPoint = [t.zrX, t.zrY], this._upEl = o;
		else if (e === "mouseup") this._upEl = o;
		else if (e === "click") {
			if (this._downEl !== this._upEl || !this._downPoint || bt(this._downPoint, [t.zrX, t.zrY]) > 4) return;
			this._downPoint = null;
		}
		this.dispatchToElement(a, e, t);
	};
});
function qw(e, t, n) {
	if (e[e.rectHover ? "rectContain" : "contain"](t, n)) {
		for (var r = e, i = void 0, a = !1; r;) {
			if (r.ignoreClip && (a = !0), !a) {
				var o = r.getClipPath();
				if (o && !o.contain(t, n)) return !1;
			}
			r.silent && (i = !0);
			var s = r.__hostTarget;
			r = s ? r.ignoreHostSilent ? null : s : r.parent;
		}
		return !i || zw;
	}
	return !1;
}
function Jw(e, t, n, r, i) {
	for (var a = e.length - 1; a >= 0; a--) {
		var o = e[a], s = void 0;
		if (o !== i && !o.ignore && (s = qw(o, n, r)) && (!t.topTarget && (t.topTarget = o), s !== zw)) {
			t.target = o;
			break;
		}
	}
}
function Yw(e, t, n) {
	var r = e.painter;
	return t < 0 || t > r.getWidth() || n < 0 || n > r.getHeight();
}
//#endregion
//#region node_modules/zrender/lib/core/timsort.js
var Xw = 32, Zw = 7;
function Qw(e) {
	for (var t = 0; e >= Xw;) t |= e & 1, e >>= 1;
	return e + t;
}
function $w(e, t, n, r) {
	var i = t + 1;
	if (i === n) return 1;
	if (r(e[i++], e[t]) < 0) {
		for (; i < n && r(e[i], e[i - 1]) < 0;) i++;
		eT(e, t, i);
	} else for (; i < n && r(e[i], e[i - 1]) >= 0;) i++;
	return i - t;
}
function eT(e, t, n) {
	for (n--; t < n;) {
		var r = e[t];
		e[t++] = e[n], e[n--] = r;
	}
}
function tT(e, t, n, r, i) {
	for (r === t && r++; r < n; r++) {
		for (var a = e[r], o = t, s = r, c; o < s;) c = o + s >>> 1, i(a, e[c]) < 0 ? s = c : o = c + 1;
		var l = r - o;
		switch (l) {
			case 3: e[o + 3] = e[o + 2];
			case 2: e[o + 2] = e[o + 1];
			case 1:
				e[o + 1] = e[o];
				break;
			default: for (; l > 0;) e[o + l] = e[o + l - 1], l--;
		}
		e[o] = a;
	}
}
function nT(e, t, n, r, i, a) {
	var o = 0, s = 0, c = 1;
	if (a(e, t[n + i]) > 0) {
		for (s = r - i; c < s && a(e, t[n + i + c]) > 0;) o = c, c = (c << 1) + 1, c <= 0 && (c = s);
		c > s && (c = s), o += i, c += i;
	} else {
		for (s = i + 1; c < s && a(e, t[n + i - c]) <= 0;) o = c, c = (c << 1) + 1, c <= 0 && (c = s);
		c > s && (c = s);
		var l = o;
		o = i - c, c = i - l;
	}
	for (o++; o < c;) {
		var u = o + (c - o >>> 1);
		a(e, t[n + u]) > 0 ? o = u + 1 : c = u;
	}
	return c;
}
function rT(e, t, n, r, i, a) {
	var o = 0, s = 0, c = 1;
	if (a(e, t[n + i]) < 0) {
		for (s = i + 1; c < s && a(e, t[n + i - c]) < 0;) o = c, c = (c << 1) + 1, c <= 0 && (c = s);
		c > s && (c = s);
		var l = o;
		o = i - c, c = i - l;
	} else {
		for (s = r - i; c < s && a(e, t[n + i + c]) >= 0;) o = c, c = (c << 1) + 1, c <= 0 && (c = s);
		c > s && (c = s), o += i, c += i;
	}
	for (o++; o < c;) {
		var u = o + (c - o >>> 1);
		a(e, t[n + u]) < 0 ? c = u : o = u + 1;
	}
	return c;
}
function iT(e, t) {
	var n = Zw, r, i, a = 0, o = [];
	r = [], i = [];
	function s(e, t) {
		r[a] = e, i[a] = t, a += 1;
	}
	function c() {
		for (; a > 1;) {
			var e = a - 2;
			if (e >= 1 && i[e - 1] <= i[e] + i[e + 1] || e >= 2 && i[e - 2] <= i[e] + i[e - 1]) i[e - 1] < i[e + 1] && e--;
			else if (i[e] > i[e + 1]) break;
			u(e);
		}
	}
	function l() {
		for (; a > 1;) {
			var e = a - 2;
			e > 0 && i[e - 1] < i[e + 1] && e--, u(e);
		}
	}
	function u(n) {
		var o = r[n], s = i[n], c = r[n + 1], l = i[n + 1];
		i[n] = s + l, n === a - 3 && (r[n + 1] = r[n + 2], i[n + 1] = i[n + 2]), a--;
		var u = rT(e[c], e, o, s, 0, t);
		o += u, s -= u, s !== 0 && (l = nT(e[o + s - 1], e, c, l, l - 1, t), l !== 0 && (s <= l ? d(o, s, c, l) : f(o, s, c, l)));
	}
	function d(r, i, a, s) {
		var c = 0;
		for (c = 0; c < i; c++) o[c] = e[r + c];
		var l = 0, u = a, d = r;
		if (e[d++] = e[u++], --s === 0) {
			for (c = 0; c < i; c++) e[d + c] = o[l + c];
			return;
		}
		if (i === 1) {
			for (c = 0; c < s; c++) e[d + c] = e[u + c];
			e[d + s] = o[l];
			return;
		}
		for (var f = n, p, m, h;;) {
			p = 0, m = 0, h = !1;
			do
				if (t(e[u], o[l]) < 0) {
					if (e[d++] = e[u++], m++, p = 0, --s === 0) {
						h = !0;
						break;
					}
				} else if (e[d++] = o[l++], p++, m = 0, --i === 1) {
					h = !0;
					break;
				}
			while ((p | m) < f);
			if (h) break;
			do {
				if (p = rT(e[u], o, l, i, 0, t), p !== 0) {
					for (c = 0; c < p; c++) e[d + c] = o[l + c];
					if (d += p, l += p, i -= p, i <= 1) {
						h = !0;
						break;
					}
				}
				if (e[d++] = e[u++], --s === 0) {
					h = !0;
					break;
				}
				if (m = nT(o[l], e, u, s, 0, t), m !== 0) {
					for (c = 0; c < m; c++) e[d + c] = e[u + c];
					if (d += m, u += m, s -= m, s === 0) {
						h = !0;
						break;
					}
				}
				if (e[d++] = o[l++], --i === 1) {
					h = !0;
					break;
				}
				f--;
			} while (p >= Zw || m >= Zw);
			if (h) break;
			f < 0 && (f = 0), f += 2;
		}
		if (n = f, n < 1 && (n = 1), i === 1) {
			for (c = 0; c < s; c++) e[d + c] = e[u + c];
			e[d + s] = o[l];
		} else if (i === 0) throw Error();
		else for (c = 0; c < i; c++) e[d + c] = o[l + c];
	}
	function f(r, i, a, s) {
		var c = 0;
		for (c = 0; c < s; c++) o[c] = e[a + c];
		var l = r + i - 1, u = s - 1, d = a + s - 1, f = 0, p = 0;
		if (e[d--] = e[l--], --i === 0) {
			for (f = d - (s - 1), c = 0; c < s; c++) e[f + c] = o[c];
			return;
		}
		if (s === 1) {
			for (d -= i, l -= i, p = d + 1, f = l + 1, c = i - 1; c >= 0; c--) e[p + c] = e[f + c];
			e[d] = o[u];
			return;
		}
		for (var m = n;;) {
			var h = 0, g = 0, _ = !1;
			do
				if (t(o[u], e[l]) < 0) {
					if (e[d--] = e[l--], h++, g = 0, --i === 0) {
						_ = !0;
						break;
					}
				} else if (e[d--] = o[u--], g++, h = 0, --s === 1) {
					_ = !0;
					break;
				}
			while ((h | g) < m);
			if (_) break;
			do {
				if (h = i - rT(o[u], e, r, i, i - 1, t), h !== 0) {
					for (d -= h, l -= h, i -= h, p = d + 1, f = l + 1, c = h - 1; c >= 0; c--) e[p + c] = e[f + c];
					if (i === 0) {
						_ = !0;
						break;
					}
				}
				if (e[d--] = o[u--], --s === 1) {
					_ = !0;
					break;
				}
				if (g = s - nT(e[l], o, 0, s, s - 1, t), g !== 0) {
					for (d -= g, u -= g, s -= g, p = d + 1, f = u + 1, c = 0; c < g; c++) e[p + c] = o[f + c];
					if (s <= 1) {
						_ = !0;
						break;
					}
				}
				if (e[d--] = e[l--], --i === 0) {
					_ = !0;
					break;
				}
				m--;
			} while (h >= Zw || g >= Zw);
			if (_) break;
			m < 0 && (m = 0), m += 2;
		}
		if (n = m, n < 1 && (n = 1), s === 1) {
			for (d -= i, l -= i, p = d + 1, f = l + 1, c = i - 1; c >= 0; c--) e[p + c] = e[f + c];
			e[d] = o[u];
		} else if (s === 0) throw Error();
		else for (f = d - (s - 1), c = 0; c < s; c++) e[f + c] = o[c];
	}
	return {
		mergeRuns: c,
		forceMergeRuns: l,
		pushRun: s
	};
}
function aT(e, t, n, r) {
	n ||= 0, r ||= e.length;
	var i = r - n;
	if (!(i < 2)) {
		var a = 0;
		if (i < Xw) {
			a = $w(e, n, r, t), tT(e, n, r, n + a, t);
			return;
		}
		var o = iT(e, t), s = Qw(i);
		do {
			if (a = $w(e, n, r, t), a < s) {
				var c = i;
				c > s && (c = s), tT(e, n, n + c, n + a, t), a = c;
			}
			o.pushRun(n, a), o.mergeRuns(), i -= a, n += a;
		} while (i !== 0);
		o.forceMergeRuns();
	}
}
//#endregion
//#region node_modules/zrender/lib/Storage.js
var oT = !1;
function sT() {
	oT || (oT = !0, console.warn("z / z2 / zlevel of displayable is invalid, which may cause unexpected errors"));
}
function cT(e, t) {
	return e.zlevel === t.zlevel ? e.z === t.z ? e.z2 - t.z2 : e.z - t.z : e.zlevel - t.zlevel;
}
var lT = function() {
	function e() {
		this._roots = [], this._displayList = [], this._displayListLen = 0, this.displayableSortFunc = cT;
	}
	return e.prototype.traverse = function(e, t) {
		for (var n = 0; n < this._roots.length; n++) this._roots[n].traverse(e, t);
	}, e.prototype.getDisplayList = function(e, t) {
		t ||= !1;
		var n = this._displayList;
		return (e || !n.length) && this.updateDisplayList(t), n;
	}, e.prototype.updateDisplayList = function(e) {
		this._displayListLen = 0;
		for (var t = this._roots, n = this._displayList, r = 0, i = t.length; r < i; r++) this._updateAndAddDisplayable(t[r], null, e);
		n.length = this._displayListLen, aT(n, cT);
	}, e.prototype._updateAndAddDisplayable = function(e, t, n) {
		if (!(e.ignore && !n)) {
			e.beforeUpdate(), e.update(), e.afterUpdate();
			var r = e.getClipPath(), i = t && t.length, a = 0, o = e.__clipPaths;
			if (!e.ignoreClip && (i || r)) {
				if (o ||= e.__clipPaths = [], i) for (var s = 0; s < t.length; s++) o[a++] = t[s];
				for (var c = r, l = e; c;) c.parent = l, c.updateTransform(), o[a++] = c, l = c, c = c.getClipPath();
			}
			if (o && (o.length = a), e.childrenRef) {
				for (var u = e.childrenRef(), d = 0; d < u.length; d++) {
					var f = u[d];
					e.__dirty && (f.__dirty |= 1), this._updateAndAddDisplayable(f, o, n);
				}
				e.__dirty = 0;
			} else {
				var p = e;
				isNaN(p.z) && (sT(), p.z = 0), isNaN(p.z2) && (sT(), p.z2 = 0), isNaN(p.zlevel) && (sT(), p.zlevel = 0), this._displayList[this._displayListLen++] = p;
			}
			var m = e.getDecalElement && e.getDecalElement();
			m && this._updateAndAddDisplayable(m, o, n);
			var h = e.getTextGuideLine();
			h && this._updateAndAddDisplayable(h, o, n);
			var g = e.getTextContent();
			g && this._updateAndAddDisplayable(g, o, n);
		}
	}, e.prototype.addRoot = function(e) {
		e.__zr && e.__zr.storage === this || this._roots.push(e);
	}, e.prototype.delRoot = function(e) {
		if (e instanceof Array) {
			for (var t = 0, n = e.length; t < n; t++) this.delRoot(e[t]);
			return;
		}
		var r = M(this._roots, e);
		r >= 0 && this._roots.splice(r, 1);
	}, e.prototype.delAllRoots = function() {
		this._roots = [], this._displayList = [], this._displayListLen = 0;
	}, e.prototype.getRoots = function() {
		return this._roots;
	}, e.prototype.dispose = function() {
		this._displayList = null, this._roots = null;
	}, e;
}(), uT = J.hasGlobalWindow && (window.requestAnimationFrame && window.requestAnimationFrame.bind(window) || window.msRequestAnimationFrame && window.msRequestAnimationFrame.bind(window) || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame) || function(e) {
	return setTimeout(e, 16);
};
//#endregion
//#region node_modules/zrender/lib/animation/Animation.js
function dT() {
	return (/* @__PURE__ */ new Date()).getTime();
}
var fT = function(e) {
	r(t, e);
	function t(t) {
		var n = e.call(this) || this;
		return n._running = !1, n._time = 0, n._pausedTime = 0, n._pauseStart = 0, n._paused = !1, t ||= {}, n.stage = t.stage || {}, n;
	}
	return t.prototype.addClip = function(e) {
		e.animation && this.removeClip(e), this._head ? (this._tail.next = e, e.prev = this._tail, e.next = null, this._tail = e) : this._head = this._tail = e, e.animation = this;
	}, t.prototype.addAnimator = function(e) {
		e.animation = this;
		var t = e.getClip();
		t && this.addClip(t);
	}, t.prototype.removeClip = function(e) {
		if (e.animation) {
			var t = e.prev, n = e.next;
			t ? t.next = n : this._head = n, n ? n.prev = t : this._tail = t, e.next = e.prev = e.animation = null;
		}
	}, t.prototype.removeAnimator = function(e) {
		var t = e.getClip();
		t && this.removeClip(t), e.animation = null;
	}, t.prototype.update = function(e) {
		for (var t = dT() - this._pausedTime, n = t - this._time, r = this._head; r;) {
			var i = r.next;
			r.step(t, n) ? (r.ondestroy(), this.removeClip(r), r = i) : r = i;
		}
		this._time = t, e || (this.trigger("frame", n), this.stage.update && this.stage.update());
	}, t.prototype._startLoop = function() {
		var e = this;
		this._running = !0;
		function t() {
			e._running && (uT(t), !e._paused && e.update());
		}
		uT(t);
	}, t.prototype.start = function() {
		this._running || (this._time = dT(), this._pausedTime = 0, this._startLoop());
	}, t.prototype.stop = function() {
		this._running = !1;
	}, t.prototype.pause = function() {
		this._paused ||= (this._pauseStart = dT(), !0);
	}, t.prototype.resume = function() {
		this._paused &&= (this._pausedTime += dT() - this._pauseStart, !1);
	}, t.prototype.clear = function() {
		for (var e = this._head; e;) {
			var t = e.next;
			e.prev = e.next = e.animation = null, e = t;
		}
		this._head = this._tail = null;
	}, t.prototype.isFinished = function() {
		return this._head == null;
	}, t.prototype.animate = function(e, t) {
		t ||= {}, this.start();
		var n = new Fi(e, t.loop);
		return this.addAnimator(n), n;
	}, t;
}(Ii), pT = 300, mT = J.domSupported, hT = (function() {
	var e = [
		"click",
		"dblclick",
		"mousewheel",
		"wheel",
		"mouseout",
		"mouseup",
		"mousedown",
		"mousemove",
		"contextmenu"
	], t = [
		"touchstart",
		"touchend",
		"touchmove"
	], n = {
		pointerdown: 1,
		pointerup: 1,
		pointermove: 1,
		pointerout: 1
	};
	return {
		mouse: e,
		touch: t,
		pointer: I(e, function(e) {
			var t = e.replace("mouse", "pointer");
			return n.hasOwnProperty(t) ? t : e;
		})
	};
})(), gT = {
	mouse: ["mousemove", "mouseup"],
	pointer: ["pointermove", "pointerup"]
}, _T = !1;
function vT(e) {
	var t = e.pointerType;
	return t === "pen" || t === "touch";
}
function yT(e) {
	e.touching = !0, e.touchTimer != null && (clearTimeout(e.touchTimer), e.touchTimer = null), e.touchTimer = setTimeout(function() {
		e.touching = !1, e.touchTimer = null;
	}, 700);
}
function bT(e) {
	e && (e.zrByTouch = !0);
}
function xT(e, t) {
	return kw(e.dom, new CT(e, t), !0);
}
function ST(e, t) {
	for (var n = t, r = !1; n && n.nodeType !== 9 && !(r = n.domBelongToZr || n !== t && n === e.painterRoot);) n = n.parentNode;
	return r;
}
var CT = function() {
	function e(e, t) {
		this.stopPropagation = Ee, this.stopImmediatePropagation = Ee, this.preventDefault = Ee, this.type = t.type, this.target = this.currentTarget = e.dom, this.pointerType = t.pointerType, this.clientX = t.clientX, this.clientY = t.clientY;
	}
	return e;
}(), wT = {
	mousedown: function(e) {
		e = kw(this.dom, e), this.__mayPointerCapture = [e.zrX, e.zrY], this.trigger("mousedown", e);
	},
	mousemove: function(e) {
		e = kw(this.dom, e);
		var t = this.__mayPointerCapture;
		t && (e.zrX !== t[0] || e.zrY !== t[1]) && this.__togglePointerCapture(!0), this.trigger("mousemove", e);
	},
	mouseup: function(e) {
		e = kw(this.dom, e), this.__togglePointerCapture(!1), this.trigger("mouseup", e);
	},
	mouseout: function(e) {
		e = kw(this.dom, e);
		var t = e.toElement || e.relatedTarget;
		ST(this, t) || (this.__pointerCapturing && (e.zrEventControl = "no_globalout"), this.trigger("mouseout", e));
	},
	wheel: function(e) {
		_T = !0, e = kw(this.dom, e), this.trigger("mousewheel", e);
	},
	mousewheel: function(e) {
		_T || (e = kw(this.dom, e), this.trigger("mousewheel", e));
	},
	touchstart: function(e) {
		e = kw(this.dom, e), bT(e), this.__lastTouchMoment = /* @__PURE__ */ new Date(), this.handler.processGesture(e, "start"), wT.mousemove.call(this, e), wT.mousedown.call(this, e);
	},
	touchmove: function(e) {
		e = kw(this.dom, e), bT(e), this.handler.processGesture(e, "change"), wT.mousemove.call(this, e);
	},
	touchend: function(e) {
		e = kw(this.dom, e), bT(e), this.handler.processGesture(e, "end"), wT.mouseup.call(this, e), /* @__PURE__ */ new Date() - +this.__lastTouchMoment < pT && wT.click.call(this, e);
	},
	pointerdown: function(e) {
		wT.mousedown.call(this, e);
	},
	pointermove: function(e) {
		vT(e) || wT.mousemove.call(this, e);
	},
	pointerup: function(e) {
		wT.mouseup.call(this, e);
	},
	pointerout: function(e) {
		vT(e) || wT.mouseout.call(this, e);
	}
};
F([
	"click",
	"dblclick",
	"contextmenu"
], function(e) {
	wT[e] = function(t) {
		t = kw(this.dom, t), this.trigger(e, t);
	};
});
var TT = {
	pointermove: function(e) {
		vT(e) || TT.mousemove.call(this, e);
	},
	pointerup: function(e) {
		TT.mouseup.call(this, e);
	},
	mousemove: function(e) {
		this.trigger("mousemove", e);
	},
	mouseup: function(e) {
		var t = this.__pointerCapturing;
		this.__togglePointerCapture(!1), this.trigger("mouseup", e), t && (e.zrEventControl = "only_globalout", this.trigger("mouseout", e));
	}
};
function ET(e, t) {
	var n = t.domHandlers;
	J.pointerEventsSupported ? F(hT.pointer, function(r) {
		OT(t, r, function(t) {
			n[r].call(e, t);
		});
	}) : (J.touchEventsSupported && F(hT.touch, function(r) {
		OT(t, r, function(i) {
			n[r].call(e, i), yT(t);
		});
	}), F(hT.mouse, function(r) {
		OT(t, r, function(i) {
			i = Ow(i), t.touching || n[r].call(e, i);
		});
	}));
}
function DT(e, t) {
	J.pointerEventsSupported ? F(gT.pointer, n) : J.touchEventsSupported || F(gT.mouse, n);
	function n(n) {
		function r(r) {
			r = Ow(r), ST(e, r.target) || (r = xT(e, r), t.domHandlers[n].call(e, r));
		}
		OT(t, n, r, { capture: !0 });
	}
}
function OT(e, t, n, r) {
	e.mounted[t] = n, e.listenerOpts[t] = r, jw(e.domTarget, t, n, r);
}
function kT(e) {
	var t = e.mounted;
	for (var n in t) t.hasOwnProperty(n) && Mw(e.domTarget, n, t[n], e.listenerOpts[n]);
	e.mounted = {};
}
var AT = function() {
	function e(e, t) {
		this.mounted = {}, this.listenerOpts = {}, this.touching = !1, this.domTarget = e, this.domHandlers = t;
	}
	return e;
}(), jT = function(e) {
	r(t, e);
	function t(t, n) {
		var r = e.call(this) || this;
		return r.__pointerCapturing = !1, r.dom = t, r.painterRoot = n, r._localHandlerScope = new AT(t, wT), mT && (r._globalHandlerScope = new AT(document, TT)), ET(r, r._localHandlerScope), r;
	}
	return t.prototype.dispose = function() {
		kT(this._localHandlerScope), mT && kT(this._globalHandlerScope);
	}, t.prototype.setCursor = function(e) {
		this.dom.style && (this.dom.style.cursor = e || "default");
	}, t.prototype.__togglePointerCapture = function(e) {
		if (this.__mayPointerCapture = null, mT && this.__pointerCapturing ^ +e) {
			this.__pointerCapturing = e;
			var t = this._globalHandlerScope;
			e ? DT(this, t) : kT(t);
		}
	}, t;
}(Ii), MT = {}, NT = {};
function PT(e) {
	delete NT[e];
}
function FT(e) {
	if (!e) return !1;
	if (typeof e == "string") return Ur(e, 1) < zi;
	if (e.colorStops) {
		for (var t = e.colorStops, n = 0, r = t.length, i = 0; i < r; i++) n += Ur(t[i].color, 1);
		return n /= r, n < zi;
	}
	return !1;
}
var IT = function() {
	function e(e, t, n) {
		var r = this;
		this._sleepAfterStill = 10, this._stillFrameAccum = 0, this._needsRefresh = !0, this._needsRefreshHover = !1, this._darkMode = !1, n ||= {}, this.dom = t, this.id = e;
		var i = new lT(), a = n.renderer || "canvas";
		MT[a] || (a = R(MT)[0]), n.useDirtyRect = n.useDirtyRect != null && n.useDirtyRect;
		var o = new MT[a](t, i, n, e), s = n.ssr || o.ssrOnly;
		this.storage = i, this.painter = o;
		var c = !J.node && !J.worker && !s ? new jT(o.getViewportRoot(), o.root) : null, l = n.useCoarsePointer, u = l == null || l === "auto" ? J.touchEventsSupported : !!l, d = 44, f;
		u && (f = K(n.pointerSize, d)), this.handler = new Kw(i, o, c, o.root, f), this.animation = new fT({ stage: { update: s ? null : function() {
			return r._flush(!1);
		} } }), s || this.animation.start();
	}
	return e.prototype.add = function(e) {
		this._disposed || !e || (this.storage.addRoot(e), e.addSelfToZr(this), this.refresh());
	}, e.prototype.remove = function(e) {
		this._disposed || !e || (this.storage.delRoot(e), e.removeSelfFromZr(this), this.refresh());
	}, e.prototype.configLayer = function(e, t) {
		this._disposed || (this.painter.configLayer && this.painter.configLayer(e, t), this.refresh());
	}, e.prototype.setBackgroundColor = function(e) {
		this._disposed || (this.painter.setBackgroundColor && this.painter.setBackgroundColor(e), this.refresh(), this._backgroundColor = e, this._darkMode = FT(e));
	}, e.prototype.getBackgroundColor = function() {
		return this._backgroundColor;
	}, e.prototype.setDarkMode = function(e) {
		this._darkMode = e;
	}, e.prototype.isDarkMode = function() {
		return this._darkMode;
	}, e.prototype.refreshImmediately = function(e) {
		this._disposed || this._refresh({
			animUpdate: !e,
			refresh: !0,
			refreshHover: !1
		});
	}, e.prototype._refresh = function(e) {
		e.animUpdate && this.animation.update(!0), this._needsRefresh = this._needsRefreshHover = !1, this.painter.refresh({
			refresh: e.refresh,
			refreshHover: e.refreshHover
		}), this._needsRefresh = this._needsRefreshHover = !1;
	}, e.prototype.refresh = function() {
		this._disposed || (this._needsRefresh = !0, this.animation.start());
	}, e.prototype.flush = function() {
		this._disposed || this._flush(!0);
	}, e.prototype._flush = function(e) {
		var t, n = dT(), r = this._needsRefresh, i = this._needsRefreshHover;
		(r || i) && (t = !0, this._refresh({
			animUpdate: e,
			refresh: r,
			refreshHover: i
		}));
		var a = dT();
		t ? (this._stillFrameAccum = 0, this.trigger("rendered", { elapsedTime: a - n })) : this._sleepAfterStill > 0 && (this._stillFrameAccum++, this._stillFrameAccum > this._sleepAfterStill && this.animation.stop());
	}, e.prototype.setSleepAfterStill = function(e) {
		this._sleepAfterStill = e;
	}, e.prototype.wakeUp = function() {
		this._disposed || (this.animation.start(), this._stillFrameAccum = 0);
	}, e.prototype.refreshHover = function() {
		this._needsRefreshHover = !0;
	}, e.prototype.refreshHoverImmediately = function() {
		this._disposed || this._refresh({
			animUpdate: !1,
			refresh: !1,
			refreshHover: !0
		});
	}, e.prototype.resize = function(e) {
		this._disposed || (e ||= {}, this.painter.resize(e.width, e.height), this.handler.resize());
	}, e.prototype.clearAnimation = function() {
		this._disposed || this.animation.clear();
	}, e.prototype.getWidth = function() {
		if (!this._disposed) return this.painter.getWidth();
	}, e.prototype.getHeight = function() {
		if (!this._disposed) return this.painter.getHeight();
	}, e.prototype.setCursorStyle = function(e) {
		this._disposed || this.handler.setCursorStyle(e);
	}, e.prototype.findHover = function(e, t) {
		if (!this._disposed) return this.handler.findHover(e, t);
	}, e.prototype.on = function(e, t, n) {
		return this._disposed || this.handler.on(e, t, n), this;
	}, e.prototype.off = function(e, t) {
		this._disposed || this.handler.off(e, t);
	}, e.prototype.trigger = function(e, t) {
		this._disposed || this.handler.trigger(e, t);
	}, e.prototype.clear = function() {
		if (!this._disposed) {
			for (var e = this.storage.getRoots(), t = 0; t < e.length; t++) e[t] instanceof ju && e[t].removeSelfFromZr(this);
			this.storage.delAllRoots(), this.painter.clear();
		}
	}, e.prototype.dispose = function() {
		this._disposed || (this.animation.stop(), this.clear(), this.storage.dispose(), this.painter.dispose(), this.handler.dispose(), this.animation = this.storage = this.painter = this.handler = null, this._disposed = !0, PT(this.id));
	}, e;
}();
function LT(e, t) {
	var n = new IT(w(), e, t);
	return NT[n.id] = n, n;
}
function RT(e, t) {
	MT[e] = t;
}
var zT;
function BT(e) {
	if (typeof zT == "function") return zT(e);
}
function VT(e) {
	zT = e;
}
//#endregion
//#region node_modules/echarts/lib/model/globalDefault.js
var HT = "";
typeof navigator < "u" && (HT = navigator.platform || "");
var UT = "rgba(0, 0, 0, 0.2)", WT = Q.color.theme[0], GT = Br(WT, null, null, .9), KT = {
	darkMode: "auto",
	colorBy: "series",
	color: Q.color.theme,
	gradientColor: [GT, WT],
	aria: { decal: { decals: [
		{
			color: UT,
			dashArrayX: [1, 0],
			dashArrayY: [2, 5],
			symbolSize: 1,
			rotation: Math.PI / 6
		},
		{
			color: UT,
			symbol: "circle",
			dashArrayX: [[8, 8], [
				0,
				8,
				8,
				0
			]],
			dashArrayY: [6, 0],
			symbolSize: .8
		},
		{
			color: UT,
			dashArrayX: [1, 0],
			dashArrayY: [4, 3],
			rotation: -Math.PI / 4
		},
		{
			color: UT,
			dashArrayX: [[6, 6], [
				0,
				6,
				6,
				0
			]],
			dashArrayY: [6, 0]
		},
		{
			color: UT,
			dashArrayX: [[1, 0], [1, 6]],
			dashArrayY: [
				1,
				0,
				6,
				0
			],
			rotation: Math.PI / 4
		},
		{
			color: UT,
			symbol: "triangle",
			dashArrayX: [[9, 9], [
				0,
				9,
				9,
				0
			]],
			dashArrayY: [7, 2],
			symbolSize: .75
		}
	] } },
	textStyle: {
		fontFamily: HT.match(/^Win/) ? "Microsoft YaHei" : "sans-serif",
		fontSize: 12,
		fontStyle: "normal",
		fontWeight: "normal"
	},
	blendMode: null,
	stateAnimation: {
		duration: 300,
		easing: "cubicOut"
	},
	animation: "auto",
	animationDuration: 1e3,
	animationDurationUpdate: 500,
	animationEasing: "cubicInOut",
	animationEasingUpdate: "cubicInOut",
	animationThreshold: 2e3,
	progressiveThreshold: 3e3,
	progressive: 400,
	hoverLayerThreshold: 3e3,
	useUTC: !1
}, qT = q();
function JT(e, t, n) {
	var r = qT.get(t);
	if (!r) return n;
	var i = r(e);
	return i ? n.concat(i) : n;
}
//#endregion
//#region node_modules/echarts/lib/model/Global.js
var YT, XT, ZT, QT = "\0_ec_inner", $T = 1, eE = function(e) {
	r(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t.prototype.init = function(e, t, n, r, i, a) {
		r ||= {}, this.option = null, this._theme = new lp(r), this._locale = new lp(i), this._optionManager = a;
	}, t.prototype.setOption = function(e, t, n) {
		var r = aE(t);
		this._optionManager.setOption(e, n, r), this._resetOption(null, r);
	}, t.prototype.resetOption = function(e, t) {
		return this._resetOption(e, aE(t));
	}, t.prototype._resetOption = function(e, t) {
		var n = !1, r = this._optionManager;
		if (!e || e === "recreate") {
			var i = r.mountOption(e === "recreate");
			!this.option || e === "recreate" ? ZT(this, i) : (this.restoreData(), this._mergeOption(i, t)), n = !0;
		}
		if ((e === "timeline" || e === "media") && this.restoreData(), !e || e === "recreate" || e === "timeline") {
			var a = r.getTimelineOption(this);
			a && (n = !0, this._mergeOption(a, t));
		}
		if (!e || e === "recreate" || e === "media") {
			var o = r.getMediaOption(this);
			o.length && F(o, function(e) {
				n = !0, this._mergeOption(e, t);
			}, this);
		}
		return n;
	}, t.prototype.mergeOption = function(e) {
		this._mergeOption(e, null);
	}, t.prototype._mergeOption = function(e, t) {
		var n = this.option, r = this._componentsMap, i = this._componentsCount, a = [], o = q(), s = t && t.replaceMergeMainTypeMap;
		hp(this), F(e, function(e, t) {
			e != null && (Zg.hasClass(t) ? t && (a.push(t), o.set(t, !0)) : n[t] = n[t] == null ? E(e) : D(n[t], e, !0));
		}), s && s.each(function(e, t) {
			Zg.hasClass(t) && !o.get(t) && (a.push(t), o.set(t, !0));
		}), Zg.topologicalTravel(a, Zg.getAllClassMainTypes(), c, this);
		function c(t) {
			var a = JT(this, t, qs(e[t])), o = r.get(t), c = Qs(o, a, o ? s && s.get(t) ? "replaceMerge" : "normalMerge" : "replaceAll");
			uc(c, t, Zg), n[t] = null, r.set(t, null), i.set(t, 0);
			var l = [], u = [], d = 0, f;
			F(c, function(e, n) {
				var r = e.existing, i = e.newOption;
				if (!i) r && (r.mergeOption({}, this), r.optionUpdated({}, !1));
				else {
					var a = t === "series", o = Zg.getClass(t, e.keyInfo.subType, !a);
					if (!o) return;
					if (t === "tooltip") {
						if (f) return;
						f = !0;
					}
					if (r && r.constructor === o) r.name = e.keyInfo.name, r.mergeOption(i, this), r.optionUpdated(i, !1);
					else {
						var s = k({ componentIndex: n }, e.keyInfo);
						r = new o(i, this, this, s), k(r, s), e.brandNew && (r.__requireNewView = !0), r.init(i, this, this), r.optionUpdated(null, !0);
					}
				}
				r ? (l.push(r.option), u.push(r), d++) : (l.push(void 0), u.push(void 0));
			}, this), n[t] = l, r.set(t, u), i.set(t, d), t === "series" && YT(this);
		}
		this._seriesIndices || YT(this);
	}, t.prototype.getOption = function() {
		var e = E(this.option);
		return F(e, function(t, n) {
			if (Zg.hasClass(n)) {
				for (var r = qs(t), i = r.length, a = !1, o = i - 1; o >= 0; o--) r[o] && !lc(r[o]) ? a = !0 : (r[o] = null, !a && i--);
				r.length = i, e[n] = r;
			}
		}), delete e[QT], e;
	}, t.prototype.setTheme = function(e) {
		this._theme = new lp(e), this._resetOption("recreate", null);
	}, t.prototype.getTheme = function() {
		return this._theme;
	}, t.prototype.getLocaleModel = function() {
		return this._locale;
	}, t.prototype.setUpdatePayload = function(e) {
		this._payload = e;
	}, t.prototype.getUpdatePayload = function() {
		return this._payload;
	}, t.prototype.getComponent = function(e, t) {
		var n = this._componentsMap.get(e);
		if (n) {
			var r = n[t || 0];
			if (r) return r;
			if (t == null) {
				for (var i = 0; i < n.length; i++) if (n[i]) return n[i];
			}
		}
	}, t.prototype.queryComponents = function(e) {
		var t = e.mainType;
		if (!t) return [];
		var n = e.index, r = e.id, i = e.name, a = this._componentsMap.get(t);
		if (!a || !a.length) return [];
		var o;
		return n == null ? o = r == null ? i == null ? L(a, function(e) {
			return !!e;
		}) : rE("name", i, a) : rE("id", r, a) : (o = [], F(qs(n), function(e) {
			a[e] && o.push(a[e]);
		})), iE(o, e);
	}, t.prototype.findComponents = function(e) {
		var t = e.query, n = e.mainType, r = i(t);
		return a(iE(r ? this.queryComponents(r) : L(this._componentsMap.get(n), function(e) {
			return !!e;
		}), e));
		function i(e) {
			var t = n + "Index", r = n + "Id", i = n + "Name";
			return e && (e[t] != null || e[r] != null || e[i] != null) ? {
				mainType: n,
				index: e[t],
				id: e[r],
				name: e[i]
			} : null;
		}
		function a(t) {
			return e.filter ? L(t, e.filter) : t;
		}
	}, t.prototype.eachComponent = function(e, t, n) {
		var r = this._componentsMap;
		if (H(e)) {
			var i = t, a = e;
			r.each(function(e, t) {
				for (var n = 0; e && n < e.length; n++) {
					var r = e[n];
					r && a.call(i, t, r, r.componentIndex);
				}
			});
		} else for (var o = U(e) ? r.get(e) : G(e) ? this.findComponents(e) : null, s = 0; o && s < o.length; s++) {
			var c = o[s];
			c && t.call(n, c, c.componentIndex);
		}
	}, t.prototype.getSeriesByName = function(e) {
		var t = sc(e, null);
		return L(this._componentsMap.get("series"), function(e) {
			return !!e && t != null && e.name === t;
		});
	}, t.prototype.getSeriesByIndex = function(e) {
		return this._componentsMap.get("series")[e];
	}, t.prototype.getSeriesByType = function(e) {
		return L(this._componentsMap.get("series"), function(t) {
			return !!t && t.subType === e;
		});
	}, t.prototype.getSeries = function() {
		return L(this._componentsMap.get("series"), function(e) {
			return !!e;
		});
	}, t.prototype.getSeriesCount = function() {
		return this._componentsCount.get("series");
	}, t.prototype.eachSeries = function(e, t) {
		XT(this), F(this._seriesIndices, function(n) {
			var r = this._componentsMap.get("series")[n];
			e.call(t, r, n);
		}, this);
	}, t.prototype.eachRawSeries = function(e, t) {
		F(this._componentsMap.get("series"), function(n) {
			n && e.call(t, n, n.componentIndex);
		});
	}, t.prototype.eachSeriesByType = function(e, t, n) {
		XT(this), F(this._seriesIndices, function(r) {
			var i = this._componentsMap.get("series")[r];
			i.subType === e && t.call(n, i, r);
		}, this);
	}, t.prototype.eachRawSeriesByType = function(e, t, n) {
		return F(this.getSeriesByType(e), t, n);
	}, t.prototype.isSeriesFiltered = function(e) {
		return XT(this), this._seriesIndicesMap.get(e.componentIndex) == null;
	}, t.prototype.getCurrentSeriesIndices = function() {
		return (this._seriesIndices || []).slice();
	}, t.prototype.filterSeries = function(e, t) {
		XT(this);
		var n = [];
		F(this._seriesIndices, function(r) {
			var i = this._componentsMap.get("series")[r];
			e.call(t, i, r) && n.push(r);
		}, this), this._seriesIndices = n, this._seriesIndicesMap = q(n);
	}, t.prototype.restoreData = function(e) {
		YT(this);
		var t = this._componentsMap, n = [];
		t.each(function(e, t) {
			Zg.hasClass(t) && n.push(t);
		}), Zg.topologicalTravel(n, Zg.getAllClassMainTypes(), function(n) {
			F(t.get(n), function(t) {
				t && (n !== "series" || !tE(t, e)) && t.restoreData();
			});
		});
	}, t.internalField = function() {
		YT = function(e) {
			var t = e._seriesIndices = [];
			F(e._componentsMap.get("series"), function(e) {
				e && t.push(e.componentIndex);
			}), e._seriesIndicesMap = q(t);
		}, XT = function(e) {}, ZT = function(e, t) {
			e.option = {}, e.option[QT] = $T, e._componentsMap = q({ series: [] }), e._componentsCount = q();
			var n = t.aria;
			G(n) && n.enabled == null && (n.enabled = !0), nE(t, e._theme.option), D(t, KT, !1), e._mergeOption(t, null);
		};
	}(), t;
}(lp);
function tE(e, t) {
	if (t) {
		var n = t.seriesIndex, r = t.seriesId, i = t.seriesName;
		return n != null && e.componentIndex !== n || r != null && e.id !== r || i != null && e.name !== i;
	}
}
function nE(e, t) {
	var n = e.color && !e.colorLayer;
	F(t, function(t, r) {
		r === "colorLayer" && n || r === "color" && e.color || Zg.hasClass(r) || (typeof t == "object" ? e[r] = e[r] ? D(e[r], t, !1) : E(t) : e[r] ?? (e[r] = t));
	});
}
function rE(e, t, n) {
	if (V(t)) {
		var r = q();
		return F(t, function(e) {
			e != null && sc(e, null) != null && r.set(e, !0);
		}), L(n, function(t) {
			return t && r.get(t[e]);
		});
	}
	var i = sc(t, null);
	return L(n, function(t) {
		return t && i != null && t[e] === i;
	});
}
function iE(e, t) {
	return t.hasOwnProperty("subType") ? L(e, function(e) {
		return e && e.subType === t.subType;
	}) : e;
}
function aE(e) {
	var t = q();
	return e && F(qs(e.replaceMerge), function(e) {
		t.set(e, !0);
	}), { replaceMergeMainTypeMap: t };
}
N(eE, e_);
//#endregion
//#region node_modules/echarts/lib/model/OptionManager.js
var oE = /^(min|max)?(.+)$/, sE = function() {
	function e(e) {
		this._timelineOptions = [], this._mediaList = [], this._currentMediaIndices = [], this._api = e;
	}
	return e.prototype.setOption = function(e, t, n) {
		e && (F(qs(e.series), function(e) {
			e && e.data && oe(e.data) && _e(e.data);
		}), F(qs(e.dataset), function(e) {
			e && e.source && oe(e.source) && _e(e.source);
		})), e = E(e);
		var r = this._optionBackup, i = cE(e, t, !r);
		this._newBaseOption = i.baseOption, r ? (i.timelineOptions.length && (r.timelineOptions = i.timelineOptions), i.mediaList.length && (r.mediaList = i.mediaList), i.mediaDefault && (r.mediaDefault = i.mediaDefault)) : this._optionBackup = i;
	}, e.prototype.mountOption = function(e) {
		var t = this._optionBackup;
		return this._timelineOptions = t.timelineOptions, this._mediaList = t.mediaList, this._mediaDefault = t.mediaDefault, this._currentMediaIndices = [], E(e ? t.baseOption : this._newBaseOption);
	}, e.prototype.getTimelineOption = function(e) {
		var t, n = this._timelineOptions;
		if (n.length) {
			var r = e.getComponent("timeline");
			r && (t = E(n[r.getCurrentIndex()]));
		}
		return t;
	}, e.prototype.getMediaOption = function(e) {
		var t = this._api.getWidth(), n = this._api.getHeight(), r = this._mediaList, i = this._mediaDefault, a = [], o = [];
		if (!r.length && !i) return o;
		for (var s = 0, c = r.length; s < c; s++) lE(r[s].query, t, n) && a.push(s);
		return !a.length && i && (a = [-1]), a.length && !dE(a, this._currentMediaIndices) && (o = I(a, function(e) {
			return E(e === -1 ? i.option : r[e].option);
		})), this._currentMediaIndices = a, o;
	}, e;
}();
function cE(e, t, n) {
	var r = [], i, a, o = e.baseOption, s = e.timeline, c = e.options, l = e.media, u = !!e.media, d = !!(c || s || o && o.timeline);
	o ? (a = o, a.timeline || (a.timeline = s)) : ((d || u) && (e.options = e.media = null), a = e), u && V(l) && F(l, function(e) {
		e && e.option && (e.query ? r.push(e) : i ||= e);
	}), f(a), F(c, function(e) {
		return f(e);
	}), F(r, function(e) {
		return f(e.option);
	});
	function f(e) {
		F(t, function(t) {
			t(e, n);
		});
	}
	return {
		baseOption: a,
		timelineOptions: c || [],
		mediaDefault: i,
		mediaList: r
	};
}
function lE(e, t, n) {
	var r = {
		width: t,
		height: n,
		aspectratio: t / n
	}, i = !0;
	return F(e, function(e, t) {
		var n = t.match(oE);
		if (!(!n || !n[1] || !n[2])) {
			var a = n[1];
			uE(r[n[2].toLowerCase()], e, a) || (i = !1);
		}
	}), i;
}
function uE(e, t, n) {
	return n === "min" ? e >= t : n === "max" ? e <= t : e === t;
}
function dE(e, t) {
	return e.join(",") === t.join(",");
}
//#endregion
//#region node_modules/echarts/lib/preprocessor/helper/compatStyle.js
var fE = F, pE = G, mE = [
	"areaStyle",
	"lineStyle",
	"nodeStyle",
	"linkStyle",
	"chordStyle",
	"label",
	"labelLine"
];
function hE(e) {
	var t = e && e.itemStyle;
	if (t) for (var n = 0, r = mE.length; n < r; n++) {
		var i = mE[n], a = t.normal, o = t.emphasis;
		a && a[i] && (e[i] = e[i] || {}, e[i].normal ? D(e[i].normal, a[i]) : e[i].normal = a[i], a[i] = null), o && o[i] && (e[i] = e[i] || {}, e[i].emphasis ? D(e[i].emphasis, o[i]) : e[i].emphasis = o[i], o[i] = null);
	}
}
function gE(e, t, n) {
	if (e && e[t] && (e[t].normal || e[t].emphasis)) {
		var r = e[t].normal, i = e[t].emphasis;
		r && (n ? (e[t].normal = e[t].emphasis = null, j(e[t], r)) : e[t] = r), i && (e.emphasis = e.emphasis || {}, e.emphasis[t] = i, i.focus && (e.emphasis.focus = i.focus), i.blurScope && (e.emphasis.blurScope = i.blurScope));
	}
}
function _E(e) {
	gE(e, "itemStyle"), gE(e, "lineStyle"), gE(e, "areaStyle"), gE(e, "label"), gE(e, "labelLine"), gE(e, "upperLabel"), gE(e, "edgeLabel");
}
function vE(e, t) {
	var n = pE(e) && e[t], r = pE(n) && n.textStyle;
	if (r) for (var i = 0, a = Ys.length; i < a; i++) {
		var o = Ys[i];
		r.hasOwnProperty(o) && (n[o] = r[o]);
	}
}
function yE(e) {
	e && (_E(e), vE(e, "label"), e.emphasis && vE(e.emphasis, "label"));
}
function bE(e) {
	if (pE(e)) {
		hE(e), _E(e), vE(e, "label"), vE(e, "upperLabel"), vE(e, "edgeLabel"), e.emphasis && (vE(e.emphasis, "label"), vE(e.emphasis, "upperLabel"), vE(e.emphasis, "edgeLabel"));
		var t = e.markPoint;
		t && (hE(t), yE(t));
		var n = e.markLine;
		n && (hE(n), yE(n));
		var r = e.markArea;
		r && yE(r);
		var i = e.data;
		if (e.type === "graph") {
			i ||= e.nodes;
			var a = e.links || e.edges;
			if (a && !oe(a)) for (var o = 0; o < a.length; o++) yE(a[o]);
			F(e.categories, function(e) {
				_E(e);
			});
		}
		if (i && !oe(i)) for (var o = 0; o < i.length; o++) yE(i[o]);
		if (t = e.markPoint, t && t.data) for (var s = t.data, o = 0; o < s.length; o++) yE(s[o]);
		if (n = e.markLine, n && n.data) for (var c = n.data, o = 0; o < c.length; o++) V(c[o]) ? (yE(c[o][0]), yE(c[o][1])) : yE(c[o]);
		e.type === "gauge" ? (vE(e, "axisLabel"), vE(e, "title"), vE(e, "detail")) : e.type === "treemap" ? (gE(e.breadcrumb, "itemStyle"), F(e.levels, function(e) {
			_E(e);
		})) : e.type === "tree" && _E(e.leaves);
	}
}
function xE(e) {
	return V(e) ? e : e ? [e] : [];
}
function SE(e) {
	return (V(e) ? e[0] : e) || {};
}
function CE(e, t) {
	fE(xE(e.series), function(e) {
		pE(e) && bE(e);
	});
	var n = [
		"xAxis",
		"yAxis",
		"radiusAxis",
		"angleAxis",
		"singleAxis",
		"parallelAxis",
		"radar"
	];
	t && n.push("valueAxis", "categoryAxis", "logAxis", "timeAxis"), fE(n, function(t) {
		fE(xE(e[t]), function(e) {
			e && (vE(e, "axisLabel"), vE(e.axisPointer, "label"));
		});
	}), fE(xE(e.parallel), function(e) {
		var t = e && e.parallelAxisDefault;
		vE(t, "axisLabel"), vE(t && t.axisPointer, "label");
	}), fE(xE(e.calendar), function(e) {
		gE(e, "itemStyle"), vE(e, "dayLabel"), vE(e, "monthLabel"), vE(e, "yearLabel");
	}), fE(xE(e.radar), function(e) {
		vE(e, "name"), e.name && e.axisName == null && (e.axisName = e.name, delete e.name), e.nameGap != null && e.axisNameGap == null && (e.axisNameGap = e.nameGap, delete e.nameGap);
	}), fE(xE(e.geo), function(e) {
		pE(e) && (yE(e), fE(xE(e.regions), function(e) {
			yE(e);
		}));
	}), fE(xE(e.timeline), function(e) {
		yE(e), gE(e, "label"), gE(e, "itemStyle"), gE(e, "controlStyle", !0);
		var t = e.data;
		V(t) && F(t, function(e) {
			G(e) && (gE(e, "label"), gE(e, "itemStyle"));
		});
	}), fE(xE(e.toolbox), function(e) {
		gE(e, "iconStyle"), fE(e.feature, function(e) {
			gE(e, "iconStyle");
		});
	}), vE(SE(e.axisPointer), "label"), vE(SE(e.tooltip).axisPointer, "label");
}
//#endregion
//#region node_modules/echarts/lib/preprocessor/backwardCompat.js
function wE(e, t) {
	for (var n = t.split(","), r = e, i = 0; i < n.length && (r &&= r[n[i]], r != null); i++);
	return r;
}
function TE(e, t, n, r) {
	for (var i = t.split(","), a = e, o, s = 0; s < i.length - 1; s++) o = i[s], a[o] ?? (a[o] = {}), a = a[o];
	(r || a[i[s]] == null) && (a[i[s]] = n);
}
function EE(e) {
	e && F(DE, function(t) {
		t[0] in e && !(t[1] in e) && (e[t[1]] = e[t[0]]);
	});
}
var DE = [
	["x", "left"],
	["y", "top"],
	["x2", "right"],
	["y2", "bottom"]
], OE = [
	"grid",
	"geo",
	"parallel",
	"legend",
	"toolbox",
	"title",
	"visualMap",
	"dataZoom",
	"timeline"
], kE = [
	["borderRadius", "barBorderRadius"],
	["borderColor", "barBorderColor"],
	["borderWidth", "barBorderWidth"]
];
function AE(e) {
	var t = e && e.itemStyle;
	if (t) for (var n = 0; n < kE.length; n++) {
		var r = kE[n][1], i = kE[n][0];
		t[r] != null && (t[i] = t[r]);
	}
}
function jE(e) {
	e && e.alignTo === "edge" && e.margin != null && e.edgeDistance == null && (e.edgeDistance = e.margin);
}
function ME(e) {
	e && e.downplay && !e.blur && (e.blur = e.downplay);
}
function NE(e) {
	e && e.focusNodeAdjacency != null && (e.emphasis = e.emphasis || {}, e.emphasis.focus ?? (e.emphasis.focus = "adjacency"));
}
function PE(e, t) {
	if (e) for (var n = 0; n < e.length; n++) t(e[n]), e[n] && PE(e[n].children, t);
}
function FE(e, t) {
	CE(e, t), e.series = qs(e.series), F(e.series, function(e) {
		if (G(e)) {
			var t = e.type;
			if (t === "line") e.clipOverflow != null && (e.clip = e.clipOverflow);
			else if (t === "pie" || t === "gauge") {
				e.clockWise != null && (e.clockwise = e.clockWise), jE(e.label);
				var n = e.data;
				if (n && !oe(n)) for (var r = 0; r < n.length; r++) jE(n[r]);
				e.hoverOffset != null && (e.emphasis = e.emphasis || {}, (e.emphasis.scaleSize = null) && (e.emphasis.scaleSize = e.hoverOffset));
			} else if (t === "gauge") {
				var i = wE(e, "pointer.color");
				i != null && TE(e, "itemStyle.color", i);
			} else if (t === "bar") {
				AE(e), AE(e.backgroundStyle), AE(e.emphasis);
				var n = e.data;
				if (n && !oe(n)) for (var r = 0; r < n.length; r++) typeof n[r] == "object" && (AE(n[r]), AE(n[r] && n[r].emphasis));
			} else if (t === "sunburst") {
				var a = e.highlightPolicy;
				a && (e.emphasis = e.emphasis || {}, e.emphasis.focus || (e.emphasis.focus = a)), ME(e), PE(e.data, ME);
			} else t === "graph" || t === "sankey" ? NE(e) : t === "map" && (e.mapType && !e.map && (e.map = e.mapType), e.mapLocation && j(e, e.mapLocation));
			e.hoverAnimation != null && (e.emphasis = e.emphasis || {}, e.emphasis && e.emphasis.scale == null && (e.emphasis.scale = e.hoverAnimation)), EE(e);
		}
	}), e.dataRange && (e.visualMap = e.dataRange), F(OE, function(t) {
		var n = e[t];
		n && (V(n) || (n = [n]), F(n, function(e) {
			EE(e);
		}));
	});
}
//#endregion
//#region node_modules/echarts/lib/processor/dataStack.js
var IE = Vc(LE);
function LE(e) {
	var t = q();
	e.eachSeries(function(e) {
		var n = e.get("stack");
		if (n) {
			var r = t.get(n) || t.set(n, []), i = e.getData(), a = {
				stackResultDimension: i.getCalculationInfo("stackResultDimension"),
				stackedOverDimension: i.getCalculationInfo("stackedOverDimension"),
				stackedDimension: i.getCalculationInfo("stackedDimension"),
				stackedByDimension: i.getCalculationInfo("stackedByDimension"),
				isStackedByIndex: i.getCalculationInfo("isStackedByIndex"),
				data: i,
				seriesModel: e
			};
			if (!a.stackedDimension || !(a.isStackedByIndex || a.stackedByDimension)) return;
			r.push(a);
		}
	}), t.each(function(e) {
		e.length !== 0 && ((e[0].seriesModel.get("stackOrder") || "seriesAsc") === "seriesDesc" && e.reverse(), F(e, function(t, n) {
			t.data.setCalculationInfo("stackedOnSeries", n > 0 ? e[n - 1].seriesModel : null);
		}), RE(e));
	});
}
function RE(e) {
	F(e, function(t, n) {
		var r = [], i = [NaN, NaN], a = [t.stackResultDimension, t.stackedOverDimension], o = t.data, s = t.isStackedByIndex, c = t.seriesModel.get("stackStrategy") || "samesign";
		o.modify(a, function(a, l, u) {
			var d = o.get(t.stackedDimension, u);
			if (isNaN(d)) return i;
			var f, p;
			s ? p = o.getRawIndex(u) : f = o.get(t.stackedByDimension, u);
			for (var m = NaN, h = n - 1; h >= 0; h--) {
				var g = e[h];
				if (s || (p = g.data.rawIndexOf(g.stackedByDimension, f)), p >= 0) {
					var _ = g.data.getByRawIndex(g.stackResultDimension, p);
					if (c === "all" || c === "positive" && _ > 0 || c === "negative" && _ < 0 || c === "samesign" && d >= 0 && _ > 0 || c === "samesign" && d <= 0 && _ < 0) {
						d = Cs(d, _), m = _;
						break;
					}
				}
			}
			return r[0] = d, r[1] = m, r;
		});
	});
}
//#endregion
//#region node_modules/echarts/lib/view/Component.js
var zE = function() {
	function e() {
		this.group = new ju(), this.uid = dh("viewComponent");
	}
	return e.prototype.init = function(e, t) {}, e.prototype.render = function(e, t, n, r) {}, e.prototype.dispose = function(e, t) {}, e.prototype.updateView = function(e, t, n, r) {}, e.prototype.updateLayout = function(e, t, n, r) {}, e.prototype.updateVisual = function(e, t, n, r) {}, e.prototype.toggleBlurSeries = function(e, t, n) {}, e.prototype.eachRendered = function(e) {
		var t = this.group;
		t && t.traverse(e);
	}, e;
}();
Ie(zE), Ue(zE);
//#endregion
//#region node_modules/echarts/lib/visual/style.js
var BE = X(), VE = {
	itemStyle: We(op, !0),
	lineStyle: We(rp, !0)
}, HE = {
	lineStyle: "stroke",
	itemStyle: "fill"
};
function UE(e, t) {
	return e.visualStyleMapper || VE[t] || (console.warn("Unknown style type '" + t + "'."), VE.itemStyle);
}
function WE(e, t) {
	return e.visualDrawType || HE[t] || (console.warn("Unknown style type '" + t + "'."), "fill");
}
var GE = {
	createOnAllSeries: !0,
	performRawSeries: !0,
	reset: function(e, t) {
		var n = e.getData(), r = e.visualStyleAccessPath || "itemStyle", i = e.getModel(r), a = UE(e, r)(i), o = i.getShallow("decal");
		o && (n.setVisual("decal", o), o.dirty = !0);
		var s = WE(e, r), c = a[s], l = H(c) ? c : null, u = a.fill === "auto" || a.stroke === "auto";
		if (!a[s] || l || u) {
			var d = e.getColorFromPalette(e.name, null, t.getSeriesCount());
			a[s] || (a[s] = d, n.setVisual("colorFromPalette", !0)), a.fill = a.fill === "auto" || H(a.fill) ? d : a.fill, a.stroke = a.stroke === "auto" || H(a.stroke) ? d : a.stroke;
		}
		if (n.setVisual("style", a), n.setVisual("drawType", s), !t.isSeriesFiltered(e) && l) return n.setVisual("colorFromPalette", !1), { dataEach: function(t, n) {
			var r = e.getDataParams(n), i = k({}, a);
			i[s] = l(r), t.setItemVisual(n, "style", i);
		} };
	}
}, KE = new lp(), qE = {
	createOnAllSeries: !0,
	reset: function(e, t) {
		if (!e.ignoreStyleOnData) {
			var n = e.getData(), r = e.visualStyleAccessPath || "itemStyle", i = UE(e, r), a = n.getVisual("drawType");
			return { dataEach: n.hasItemOption ? function(e, t) {
				var n = e.getRawDataItem(t);
				if (n && n[r]) {
					KE.option = n[r];
					var o = i(KE);
					k(e.ensureUniqueItemVisual(t, "style"), o), KE.option.decal && (e.setItemVisual(t, "decal", KE.option.decal), KE.option.decal.dirty = !0), a in o && e.setItemVisual(t, "colorFromPalette", !1);
				}
			} : null };
		}
	}
}, JE = {
	performRawSeries: !0,
	overallReset: function(e) {
		var t = q();
		e.eachSeries(function(e) {
			if (!e.isColorBySeries()) {
				var n = e.type + "-" + e.getColorBy();
				BE(e).scope = t.get(n) || t.set(n, {});
			}
		}), e.eachSeries(function(e) {
			if (!e.isColorBySeries()) {
				var t = e.getRawData(), n = {}, r = e.getData(), i = BE(e).scope, a = WE(e, e.visualStyleAccessPath || "itemStyle");
				r.each(function(e) {
					var t = r.getRawIndex(e);
					n[t] = e;
				}), t.each(function(o) {
					var s = n[o];
					if (r.getItemVisual(s, "colorFromPalette")) {
						var c = r.ensureUniqueItemVisual(s, "style"), l = t.getName(o) || o + "", u = t.count();
						c[a] = e.getColorFromPalette(l, i, u);
					}
				});
			}
		});
	}
}, YE = Math.PI;
function XE(e, t) {
	t ||= {}, j(t, {
		text: "loading",
		textColor: Q.color.primary,
		fontSize: 12,
		fontWeight: "normal",
		fontStyle: "normal",
		fontFamily: "sans-serif",
		maskColor: "rgba(255,255,255,0.8)",
		showSpinner: !0,
		color: Q.color.theme[0],
		spinnerRadius: 10,
		lineWidth: 5,
		zlevel: 0
	});
	var n = new ju(), r = new No({
		style: { fill: t.maskColor },
		zlevel: t.zlevel,
		z: 1e4
	});
	n.add(r);
	var i = new Ro({
		style: {
			text: t.text,
			fill: t.textColor,
			fontSize: t.fontSize,
			fontWeight: t.fontWeight,
			fontStyle: t.fontStyle,
			fontFamily: t.fontFamily
		},
		zlevel: t.zlevel,
		z: 10001
	}), a = new No({
		style: { fill: "none" },
		textContent: i,
		textConfig: {
			position: "right",
			distance: 10
		},
		zlevel: t.zlevel,
		z: 10001
	});
	n.add(a);
	var o;
	return t.showSpinner && (o = new hd({
		shape: {
			startAngle: -YE / 2,
			endAngle: -YE / 2 + .1,
			r: t.spinnerRadius
		},
		style: {
			stroke: t.color,
			lineCap: "round",
			lineWidth: t.lineWidth
		},
		zlevel: t.zlevel,
		z: 10001
	}), o.animateShape(!0).when(1e3, { endAngle: YE * 3 / 2 }).start("circularInOut"), o.animateShape(!0).when(1e3, { startAngle: YE * 3 / 2 }).delay(300).start("circularInOut"), n.add(o)), n.resize = function() {
		var n = i.getBoundingRect().width, s = t.showSpinner ? t.spinnerRadius : 0, c = (e.getWidth() - s * 2 - (t.showSpinner && n ? 10 : 0) - n) / 2 - (t.showSpinner && n ? 0 : 5 + n / 2) + (t.showSpinner ? 0 : n / 2) + (n ? 0 : s), l = e.getHeight() / 2;
		t.showSpinner && o.setShape({
			cx: c,
			cy: l
		}), a.setShape({
			x: c - s,
			y: l - s,
			width: s * 2,
			height: s * 2
		}), r.setShape({
			x: 0,
			y: 0,
			width: e.getWidth(),
			height: e.getHeight()
		});
	}, n.resize(), n;
}
//#endregion
//#region node_modules/echarts/lib/core/Scheduler.js
var ZE = function() {
	function e(e, t, n, r) {
		this._stageTaskMap = q(), this.ecInstance = e, this.api = t, n = this._dataProcessorHandlers = n.slice(), r = this._visualHandlers = r.slice(), this._allHandlers = n.concat(r);
	}
	return e.prototype.restoreData = function(e, t) {
		e.restoreData(t), this._stageTaskMap.each(function(e) {
			var t = e.overallTask;
			t && t.dirty();
		});
	}, e.prototype.getPerformArgs = function(e, t) {
		if (e.__pipeline) {
			var n = this._pipelineMap.get(e.__pipeline.id), r = n.context, i = !t && n.progressiveEnabled && (!r || r.progressiveRender) && e.__idxInPipeline > n.blockIndex ? n.step : null, a = r && r.modDataCount;
			return {
				step: i,
				modBy: a == null ? null : Math.ceil(a / i),
				modDataCount: a
			};
		}
	}, e.prototype.getPipeline = function(e) {
		return this._pipelineMap.get(e);
	}, e.prototype.updateStreamModes = function(e, t) {
		var n = this._pipelineMap.get(e.uid);
		e.pipelineContext = n.context = e.__preparePipelineContext ? e.__preparePipelineContext(t, n) : zc(e, t, n);
	}, e.prototype.restorePipelines = function(e, t) {
		var n = this, r = n._pipelineMap = q();
		t.eachSeries(function(t) {
			var i = e.painter.type === "canvas" && t.getProgressive(), a = t.uid;
			r.set(a, {
				id: a,
				head: null,
				tail: null,
				threshold: t.getProgressiveThreshold(),
				progressiveEnabled: i && !(t.preventIncremental && t.preventIncremental()),
				blockIndex: -1,
				step: Math.round(i || 700),
				count: 0
			}), n._pipe(t, t.dataTask);
		});
	}, e.prototype.prepareStageTasks = function() {
		var e = this._stageTaskMap, t = this.api.getModel(), n = this.api;
		F(this._allHandlers, function(r) {
			var i = e.get(r.uid) || e.set(r.uid, {});
			me(!(r.reset && r.overallReset), ""), r.reset && this._createSeriesStageTask(r, i, t, n), r.overallReset && this._createOverallStageTask(r, i, t, n);
		}, this);
	}, e.prototype.prepareView = function(e, t, n, r) {
		var i = e.renderTask, a = i.context;
		a.model = t, a.ecModel = n, a.api = r, i.__block = !e.incrementalPrepareRender, this._pipe(t, i);
	}, e.prototype.performDataProcessorTasks = function(e, t) {
		this._performStageTasks(this._dataProcessorHandlers, e, t, { block: !0 });
	}, e.prototype.performVisualTasks = function(e, t, n) {
		this._performStageTasks(this._visualHandlers, e, t, n);
	}, e.prototype._performStageTasks = function(e, t, n, r) {
		r ||= {};
		var i = !1, a = this;
		F(e, function(e, s) {
			if (!(r.visualType && r.visualType !== e.visualType)) {
				var c = a._stageTaskMap.get(e.uid), l = c.seriesTaskMap, u = c.overallTask;
				if (u) {
					var d, f = u.agentStubMap;
					f.each(function(e) {
						o(r, e) && (e.dirty(), d = !0);
					}), d && u.dirty(), a.updatePayload(u, n);
					var p = a.getPerformArgs(u, r.block);
					f.each(function(e) {
						e.perform(p);
					}), u.perform(p) && (i = !0);
				} else l && l.each(function(s, c) {
					o(r, s) && s.dirty();
					var l = a.getPerformArgs(s, r.block);
					l.skip = !e.performRawSeries && t.isSeriesFiltered(s.context.model), a.updatePayload(s, n), s.perform(l) && (i = !0);
				});
			}
		});
		function o(e, t) {
			return e.setDirty && (!e.dirtyMap || e.dirtyMap.get(t.__pipeline.id));
		}
		this.unfinished = i || this.unfinished;
	}, e.prototype.performSeriesTasks = function(e) {
		var t;
		e.eachSeries(function(e) {
			t = e.dataTask.perform() || t;
		}), this.unfinished = t || this.unfinished;
	}, e.prototype.plan = function() {
		this._pipelineMap.each(function(e) {
			var t = e.tail;
			do {
				if (t.__block) {
					e.blockIndex = t.__idxInPipeline;
					break;
				}
				t = t.getUpstream();
			} while (t);
		});
	}, e.prototype.updatePayload = function(e, t) {
		t !== "remain" && (e.context.payload = t);
	}, e.prototype._createSeriesStageTask = function(e, t, n, r) {
		var i = this, a = t.seriesTaskMap, o = t.seriesTaskMap = q(), s = e.seriesType, c = e.getTargetSeries;
		e.createOnAllSeries ? n.eachRawSeries(l) : s ? n.eachRawSeriesByType(s, l) : c && c(n, r).each(l);
		function l(t) {
			var s = t.uid, c = o.set(s, a && a.get(s) || s_({
				plan: nD,
				reset: rD,
				count: oD
			}));
			c.context = {
				model: t,
				ecModel: n,
				api: r,
				useClearVisual: e.isVisual && !e.isLayout,
				plan: e.plan,
				reset: e.reset,
				scheduler: i
			}, i._pipe(t, c);
		}
	}, e.prototype._createOverallStageTask = function(e, t, n, r) {
		var i = this, a = t.overallTask = t.overallTask || s_({ reset: QE });
		a.context = {
			ecModel: n,
			api: r,
			overallReset: e.overallReset,
			scheduler: i
		};
		var o = a.agentStubMap, s = a.agentStubMap = q(), c = e.seriesType, l = e.getTargetSeries, u = e.dirtyOnOverallProgress, d = !1;
		me(!e.createOnAllSeries, ""), c ? n.eachRawSeriesByType(c, f) : l ? l(n, r).each(f) : F(n.getSeries(), f);
		function f(e) {
			var t = e.uid, n = s.set(t, o && o.get(t) || (d = !0, s_({
				reset: $E,
				onDirty: tD
			})));
			n.context = {
				model: e,
				dirtyOnOverallProgress: u
			}, n.agent = a, n.__block = u, i._pipe(e, n);
		}
		d && a.dirty();
	}, e.prototype._pipe = function(e, t) {
		var n = e.uid, r = this._pipelineMap.get(n);
		!r.head && (r.head = t), r.tail && r.tail.pipe(t), r.tail = t, t.__idxInPipeline = r.count++, t.__pipeline = r;
	}, e.wrapStageHandler = function(e, t) {
		return H(e) && (e = {
			overallReset: e,
			seriesType: sD(e)
		}), e.uid = dh("stageHandler"), t && (e.visualType = t), e;
	}, e;
}();
function QE(e) {
	e.overallReset(e.ecModel, e.api, e.payload);
}
function $E(e) {
	return e.dirtyOnOverallProgress && eD;
}
function eD() {
	this.agent.dirty(), this.getDownstream().dirty();
}
function tD() {
	this.agent && this.agent.dirty();
}
function nD(e) {
	return e.plan ? e.plan(e.model, e.ecModel, e.api, e.payload) : null;
}
function rD(e) {
	e.useClearVisual && e.data.clearAllVisual();
	var t = e.resetDefines = qs(e.reset(e.model, e.ecModel, e.api, e.payload));
	return t.length > 1 ? I(t, function(e, t) {
		return aD(t);
	}) : iD;
}
var iD = aD(0);
function aD(e) {
	return function(t, n) {
		var r = n.data, i = n.resetDefines[e];
		if (i && i.dataEach) for (var a = t.start; a < t.end; a++) i.dataEach(r, a);
		else i && i.progress && i.progress(t, r);
	};
}
function oD(e) {
	return e.data.count();
}
function sD(e) {
	uD = null;
	try {
		e(cD, lD);
	} catch {}
	return uD;
}
var cD = {}, lD = {}, uD;
dD(cD, eE), dD(lD, el), cD.eachSeriesByType = cD.eachRawSeriesByType = function(e) {
	uD = e;
}, cD.eachComponent = function(e) {
	e.mainType === "series" && e.subType && (uD = e.subType);
};
function dD(e, t) {
	for (var n in t.prototype) e[n] = Ee;
}
//#endregion
//#region node_modules/echarts/lib/theme/dark.js
var $ = Q.darkColor, fD = $.background, pD = function() {
	return {
		axisLine: { lineStyle: { color: $.axisLine } },
		splitLine: { lineStyle: { color: $.axisSplitLine } },
		splitArea: { areaStyle: { color: [$.backgroundTint, $.backgroundTransparent] } },
		minorSplitLine: { lineStyle: { color: $.axisMinorSplitLine } },
		axisLabel: { color: $.axisLabel },
		axisName: {}
	};
}, mD = {
	label: { color: $.secondary },
	itemStyle: { borderColor: $.borderTint },
	dividerLineStyle: { color: $.border }
}, hD = {
	darkMode: !0,
	color: $.theme,
	backgroundColor: fD,
	axisPointer: {
		lineStyle: { color: $.border },
		crossStyle: { color: $.borderShade },
		label: { color: $.tertiary }
	},
	legend: {
		textStyle: { color: $.secondary },
		pageTextStyle: { color: $.tertiary }
	},
	textStyle: { color: $.secondary },
	title: {
		textStyle: { color: $.primary },
		subtextStyle: { color: $.quaternary }
	},
	toolbox: {
		iconStyle: { borderColor: $.accent50 },
		feature: { dataView: {
			backgroundColor: fD,
			textColor: $.primary,
			textareaColor: $.background,
			textareaBorderColor: $.border,
			buttonColor: $.accent50,
			buttonTextColor: $.neutral00
		} }
	},
	tooltip: {
		backgroundColor: $.neutral20,
		defaultBorderColor: $.border,
		textStyle: { color: $.tertiary }
	},
	dataZoom: {
		borderColor: $.accent10,
		textStyle: { color: $.tertiary },
		brushStyle: { color: $.backgroundTint },
		handleStyle: {
			color: $.neutral00,
			borderColor: $.accent20
		},
		moveHandleStyle: { color: $.accent40 },
		emphasis: { handleStyle: { borderColor: $.accent50 } },
		dataBackground: {
			lineStyle: { color: $.accent30 },
			areaStyle: { color: $.accent20 }
		},
		selectedDataBackground: {
			lineStyle: { color: $.accent50 },
			areaStyle: { color: $.accent30 }
		}
	},
	visualMap: {
		textStyle: { color: $.secondary },
		handleStyle: { borderColor: $.neutral30 }
	},
	timeline: {
		lineStyle: { color: $.accent10 },
		label: { color: $.tertiary },
		controlStyle: {
			color: $.accent30,
			borderColor: $.accent30
		}
	},
	calendar: {
		itemStyle: {
			color: $.neutral00,
			borderColor: $.neutral20
		},
		dayLabel: { color: $.tertiary },
		monthLabel: { color: $.secondary },
		yearLabel: { color: $.secondary }
	},
	matrix: {
		x: mD,
		y: mD,
		backgroundColor: { borderColor: $.axisLine },
		body: { itemStyle: { borderColor: $.borderTint } }
	},
	timeAxis: pD(),
	logAxis: pD(),
	valueAxis: pD(),
	categoryAxis: pD(),
	line: { symbol: "circle" },
	graph: { color: $.theme },
	gauge: {
		title: { color: $.secondary },
		axisLine: { lineStyle: { color: [[1, $.neutral05]] } },
		axisLabel: { color: $.axisLabel },
		detail: { color: $.primary }
	},
	candlestick: { itemStyle: {
		color: "#f64e56",
		color0: "#54ea92",
		borderColor: "#f64e56",
		borderColor0: "#54ea92"
	} },
	funnel: { itemStyle: { borderColor: $.background } },
	radar: function() {
		var e = pD();
		return e.axisName = { color: $.axisLabel }, e.axisLine.lineStyle.color = $.neutral20, e;
	}(),
	treemap: { breadcrumb: {
		itemStyle: {
			color: $.neutral20,
			textStyle: { color: $.secondary }
		},
		emphasis: { itemStyle: { color: $.neutral30 } }
	} },
	sunburst: { itemStyle: { borderColor: $.background } },
	map: {
		itemStyle: {
			borderColor: $.border,
			areaColor: $.neutral10
		},
		label: { color: $.tertiary },
		emphasis: {
			label: { color: $.primary },
			itemStyle: { areaColor: $.highlight }
		},
		select: {
			label: { color: $.primary },
			itemStyle: { areaColor: $.highlight }
		}
	},
	geo: {
		itemStyle: {
			borderColor: $.border,
			areaColor: $.neutral10
		},
		emphasis: {
			label: { color: $.primary },
			itemStyle: { areaColor: $.highlight }
		},
		select: {
			label: { color: $.primary },
			itemStyle: { color: $.highlight }
		}
	}
};
hD.categoryAxis.splitLine.show = !1;
//#endregion
//#region node_modules/echarts/lib/util/ECEventProcessor.js
var gD = function() {
	function e() {}
	return e.prototype.normalizeQuery = function(e) {
		var t = {}, n = {}, r = {};
		if (U(e)) {
			var i = Ne(e);
			t.mainType = i.main || null, t.subType = i.sub || null;
		} else {
			var a = [
				"Index",
				"Name",
				"Id"
			], o = {
				name: 1,
				dataIndex: 1,
				dataType: 1
			};
			F(e, function(e, i) {
				for (var s = !1, c = 0; c < a.length; c++) {
					var l = a[c], u = i.lastIndexOf(l);
					if (u > 0 && u === i.length - l.length) {
						var d = i.slice(0, u);
						d !== "data" && (t.mainType = d, t[l.toLowerCase()] = e, s = !0);
					}
				}
				o.hasOwnProperty(i) && (n[i] = e, s = !0), s || (r[i] = e);
			});
		}
		return {
			cptQuery: t,
			dataQuery: n,
			otherQuery: r
		};
	}, e.prototype.filter = function(e, t) {
		var n = this.eventInfo;
		if (!n) return !0;
		var r = n.targetEl, i = n.packedEvent, a = n.model, o = n.view;
		if (!a || !o) return !0;
		var s = t.cptQuery, c = t.dataQuery;
		return l(s, a, "mainType") && l(s, a, "subType") && l(s, a, "index", "componentIndex") && l(s, a, "name") && l(s, a, "id") && l(c, i, "name") && l(c, i, "dataIndex") && l(c, i, "dataType") && (!o.filterForExposedEvent || o.filterForExposedEvent(e, t.otherQuery, r, i));
		function l(e, t, n, r) {
			return e[n] == null || t[r || n] === e[n];
		}
	}, e.prototype.afterTrigger = function() {
		this.eventInfo = null;
	}, e;
}(), _D = [
	"symbol",
	"symbolSize",
	"symbolRotate",
	"symbolOffset"
], vD = _D.concat(["symbolKeepAspect"]), yD = {
	createOnAllSeries: !0,
	performRawSeries: !0,
	reset: function(e, t) {
		var n = e.getData();
		if (e.legendIcon && n.setVisual("legendIcon", e.legendIcon), !e.hasSymbolVisual) return;
		for (var r = {}, i = {}, a = !1, o = 0; o < _D.length; o++) {
			var s = _D[o], c = e.get(s);
			H(c) ? (a = !0, i[s] = c) : r[s] = c;
		}
		if (r.symbol = r.symbol || e.defaultSymbol, n.setVisual(k({
			legendIcon: e.legendIcon || r.symbol,
			symbolKeepAspect: e.get("symbolKeepAspect")
		}, r)), t.isSeriesFiltered(e)) return;
		var l = R(i);
		function u(t, n) {
			for (var r = e.getRawValue(n), a = e.getDataParams(n), o = 0; o < l.length; o++) {
				var s = l[o];
				t.setItemVisual(n, s, i[s](r, a));
			}
		}
		return { dataEach: a ? u : null };
	}
}, bD = {
	createOnAllSeries: !0,
	performRawSeries: !0,
	reset: function(e, t) {
		if (!e.hasSymbolVisual || t.isSeriesFiltered(e)) return;
		var n = e.getData();
		function r(e, t) {
			for (var n = e.getItemModel(t), r = 0; r < vD.length; r++) {
				var i = vD[r], a = n.getShallow(i, !0);
				a != null && e.setItemVisual(t, i, a);
			}
		}
		return { dataEach: n.hasItemOption ? r : null };
	}
};
//#endregion
//#region node_modules/echarts/lib/visual/helper.js
function xD(e, t, n) {
	switch (n) {
		case "color": return e.getItemVisual(t, "style")[e.getVisual("drawType")];
		case "opacity": return e.getItemVisual(t, "style").opacity;
		case "symbol":
		case "symbolSize":
		case "liftZ": return e.getItemVisual(t, n);
	}
}
function SD(e, t) {
	switch (t) {
		case "color": return e.getVisual("style")[e.getVisual("drawType")];
		case "opacity": return e.getVisual("style").opacity;
		case "symbol":
		case "symbolSize":
		case "liftZ": return e.getVisual(t);
	}
}
//#endregion
//#region node_modules/echarts/lib/util/event.js
function CD(e, t, n) {
	for (var r; e && !(t(e) && (r = e, n));) e = e.__hostTarget || e.parent;
	return r;
}
//#endregion
//#region node_modules/echarts/lib/core/lifecycle.js
var wD = new Ii(), TD = {};
function ED(e, t) {
	TD[e] = t;
}
function DD(e) {
	return TD[e];
}
//#endregion
//#region node_modules/echarts/lib/chart/custom/customSeriesRegister.js
var OD = {};
function kD(e, t) {
	OD[e] = t;
}
//#endregion
//#region node_modules/zrender/lib/core/WeakMap.js
var AD = Math.round(Math.random() * 9), jD = typeof Object.defineProperty == "function", MD = function() {
	function e() {
		this._id = "__ec_inner_" + AD++;
	}
	return e.prototype.get = function(e) {
		return this._guard(e)[this._id];
	}, e.prototype.set = function(e, t) {
		var n = this._guard(e);
		return jD ? Object.defineProperty(n, this._id, {
			value: t,
			enumerable: !1,
			configurable: !0
		}) : n[this._id] = t, this;
	}, e.prototype.delete = function(e) {
		return this.has(e) ? (delete this._guard(e)[this._id], !0) : !1;
	}, e.prototype.has = function(e) {
		return !!this._guard(e)[this._id];
	}, e.prototype._guard = function(e) {
		if (e !== Object(e)) throw TypeError("Value of WeakMap is not a non-null object.");
		return e;
	}, e;
}();
//#endregion
//#region node_modules/zrender/lib/canvas/helper.js
function ND(e) {
	return isFinite(e);
}
function PD(e, t, n) {
	var r = t.x == null ? 0 : t.x, i = t.x2 == null ? 1 : t.x2, a = t.y == null ? 0 : t.y, o = t.y2 == null ? 0 : t.y2;
	return t.global || (r = r * n.width + n.x, i = i * n.width + n.x, a = a * n.height + n.y, o = o * n.height + n.y), r = ND(r) ? r : 0, i = ND(i) ? i : 1, a = ND(a) ? a : 0, o = ND(o) ? o : 0, e.createLinearGradient(r, a, i, o);
}
function FD(e, t, n) {
	var r = n.width, i = n.height, a = Math.min(r, i), o = t.x == null ? .5 : t.x, s = t.y == null ? .5 : t.y, c = t.r == null ? .5 : t.r;
	return t.global || (o = o * r + n.x, s = s * i + n.y, c *= a), o = ND(o) ? o : .5, s = ND(s) ? s : .5, c = c >= 0 && ND(c) ? c : .5, e.createRadialGradient(o, s, 0, o, s, c);
}
function ID(e, t, n) {
	for (var r = t.type === "radial" ? FD(e, t, n) : PD(e, t, n), i = t.colorStops, a = 0; a < i.length; a++) r.addColorStop(i[a].offset, i[a].color);
	return r;
}
function LD(e, t) {
	if (e === t || !e && !t) return !1;
	if (!e || !t || e.length !== t.length) return !0;
	for (var n = 0; n < e.length; n++) if (e[n] !== t[n]) return !0;
	return !1;
}
function RD(e) {
	return parseInt(e, 10);
}
function zD(e, t, n) {
	var r = ["width", "height"][t], i = ["clientWidth", "clientHeight"][t], a = ["paddingLeft", "paddingTop"][t], o = ["paddingRight", "paddingBottom"][t];
	if (n[r] != null && n[r] !== "auto") return parseFloat(n[r]);
	var s = document.defaultView.getComputedStyle(e);
	return (e[i] || RD(s[r]) || RD(e.style[r])) - (RD(s[a]) || 0) - (RD(s[o]) || 0) || 0;
}
//#endregion
//#region node_modules/zrender/lib/canvas/dashStyle.js
function BD(e, t) {
	return !e || e === "solid" || !(t > 0) ? null : e === "dashed" ? [4 * t, 2 * t] : e === "dotted" ? [t] : W(e) ? [e] : V(e) ? e : null;
}
function VD(e) {
	var t = e.style, n = t.lineDash && t.lineWidth > 0 && BD(t.lineDash, t.lineWidth), r = t.lineDashOffset;
	if (n) {
		var i = t.strokeNoScale && e.getLineScale ? e.getLineScale() : 1;
		i && i !== 1 && (n = I(n, function(e) {
			return e / i;
		}), r /= i);
	}
	return [n, r];
}
//#endregion
//#region node_modules/zrender/lib/canvas/graphic.js
var HD = new qa(!0);
function UD(e) {
	var t = e.stroke;
	return !(t == null || t === "none" || !(e.lineWidth > 0));
}
function WD(e) {
	return typeof e == "string" && e !== "none";
}
function GD(e) {
	var t = e.fill;
	return t != null && t !== "none";
}
function KD(e, t) {
	if (t.fillOpacity != null && t.fillOpacity !== 1) {
		var n = e.globalAlpha;
		e.globalAlpha = t.fillOpacity * t.opacity, e.fill(), e.globalAlpha = n;
	} else e.fill();
}
function qD(e, t) {
	if (t.strokeOpacity != null && t.strokeOpacity !== 1) {
		var n = e.globalAlpha;
		e.globalAlpha = t.strokeOpacity * t.opacity, e.stroke(), e.globalAlpha = n;
	} else e.stroke();
}
function JD(e, t, n) {
	var r = Qe(t.image, t.__image, n);
	if (et(r)) {
		var i = e.createPattern(r, t.repeat || "repeat");
		if (typeof DOMMatrix == "function" && i && i.setTransform) {
			var a = new DOMMatrix();
			a.translateSelf(t.x || 0, t.y || 0), a.rotateSelf(0, 0, (t.rotation || 0) * De), a.scaleSelf(t.scaleX || 1, t.scaleY || 1), i.setTransform(a);
		}
		return i;
	}
}
function YD(e, t, n, r, i) {
	var a, o = UD(n), s = GD(n), c = n.strokePercent, l = c < 1, u = !t.path;
	(!t.silent || l) && u && t.createPathProxy();
	var d = t.path || HD, f = t.__dirty;
	if (!r) {
		var p = n.fill, m = n.stroke, h = s && !!p.colorStops, g = o && !!m.colorStops, _ = s && !!p.image, v = o && !!m.image, y = void 0, b = void 0, x = void 0, S = void 0, C = void 0;
		(h || g) && (C = t.getBoundingRect()), h && (y = f ? ID(e, p, C) : t.__canvasFillGradient, t.__canvasFillGradient = y), g && (b = f ? ID(e, m, C) : t.__canvasStrokeGradient, t.__canvasStrokeGradient = b), _ && (x = f || !t.__canvasFillPattern ? JD(e, p, t) : t.__canvasFillPattern, t.__canvasFillPattern = x), v && (S = f || !t.__canvasStrokePattern ? JD(e, m, t) : t.__canvasStrokePattern, t.__canvasStrokePattern = S), h ? e.fillStyle = y : _ && (x ? e.fillStyle = x : s = !1), g ? e.strokeStyle = b : v && (S ? e.strokeStyle = S : o = !1);
	}
	var w = t.getGlobalScale();
	d.setScale(w[0], w[1], t.segmentIgnoreThreshold);
	var T, E;
	e.setLineDash && n.lineDash && (a = VD(t), T = a[0], E = a[1]);
	var D = !0;
	(u || f & 4) && (d.setDPR(e.dpr), l ? d.setContext(null) : (d.setContext(e), D = !1), d.reset(), t.buildPath(d, t.shape, r), d.toStatic(), t.pathUpdated()), D && d.rebuildPath(e, l ? c : 1), T && (e.setLineDash(T), e.lineDashOffset = E), r ? (i.batchFill = s, i.batchStroke = o) : n.strokeFirst ? (o && qD(e, n), s && KD(e, n)) : (s && KD(e, n), o && qD(e, n)), T && e.setLineDash([]);
}
function XD(e, t, n) {
	var r = t.__image = Qe(n.image, t.__image, t, t.onload);
	if (!(!r || !et(r))) {
		var i = n.x || 0, a = n.y || 0, o = t.getWidth(), s = t.getHeight(), c = r.width / r.height;
		if (o == null && s != null ? o = s * c : s == null && o != null ? s = o / c : o == null && s == null && (o = r.width, s = r.height), n.sWidth && n.sHeight) {
			var l = n.sx || 0, u = n.sy || 0;
			e.drawImage(r, l, u, n.sWidth, n.sHeight, i, a, o, s);
		} else if (n.sx && n.sy) {
			var l = n.sx, u = n.sy, d = o - l, f = s - u;
			e.drawImage(r, l, u, d, f, i, a, o, s);
		} else e.drawImage(r, i, a, o, s);
	}
}
function ZD(e, t, n) {
	var r, i = n.text;
	if (i != null && (i += ""), i) {
		e.font = n.font || "12px sans-serif", e.textAlign = n.textAlign, e.textBaseline = n.textBaseline;
		var a = void 0, o = void 0;
		e.setLineDash && n.lineDash && (r = VD(t), a = r[0], o = r[1]), a && (e.setLineDash(a), e.lineDashOffset = o), n.strokeFirst ? (UD(n) && e.strokeText(i, n.x, n.y), GD(n) && e.fillText(i, n.x, n.y)) : (GD(n) && e.fillText(i, n.x, n.y), UD(n) && e.strokeText(i, n.x, n.y)), a && e.setLineDash([]);
	}
}
var QD = [
	"shadowBlur",
	"shadowOffsetX",
	"shadowOffsetY"
], $D = [
	["lineCap", "butt"],
	["lineJoin", "miter"],
	["miterLimit", 10]
];
function eO(e, t, n, r, i) {
	var a = !1;
	if (!r && (n ||= {}, t === n)) return !1;
	if (r || t.opacity !== n.opacity) {
		dO(e, i), a = !0;
		var o = Math.max(Math.min(t.opacity, 1), 0);
		e.globalAlpha = isNaN(o) ? sa.opacity : o;
	}
	(r || t.blend !== n.blend) && (a ||= (dO(e, i), !0), e.globalCompositeOperation = t.blend || sa.blend);
	for (var s = 0; s < QD.length; s++) {
		var c = QD[s];
		(r || t[c] !== n[c]) && (a ||= (dO(e, i), !0), e[c] = e.dpr * (t[c] || 0));
	}
	return (r || t.shadowColor !== n.shadowColor) && (a ||= (dO(e, i), !0), e.shadowColor = t.shadowColor || sa.shadowColor), a;
}
function tO(e, t, n, r, i) {
	var a = t.style, o = r ? null : n && n.style || {};
	if (a === o) return !1;
	var s = eO(e, a, o, r, i);
	if ((r || a.fill !== o.fill) && (s ||= (dO(e, i), !0), WD(a.fill) && (e.fillStyle = a.fill)), (r || a.stroke !== o.stroke) && (s ||= (dO(e, i), !0), WD(a.stroke) && (e.strokeStyle = a.stroke)), (r || a.opacity !== o.opacity) && (s ||= (dO(e, i), !0), e.globalAlpha = a.opacity == null ? 1 : a.opacity), t.hasStroke()) {
		var c = a.lineWidth / (a.strokeNoScale && t.getLineScale ? t.getLineScale() : 1);
		e.lineWidth !== c && (s ||= (dO(e, i), !0), e.lineWidth = c);
	}
	for (var l = 0; l < $D.length; l++) {
		var u = $D[l], d = u[0];
		(r || a[d] !== o[d]) && (s ||= (dO(e, i), !0), e[d] = a[d] || u[1]);
	}
	return s;
}
function nO(e, t, n, r, i) {
	return eO(e, t.style, n && n.style, r, i);
}
function rO(e, t) {
	var n = t.transform, r = e.dpr || 1;
	n ? e.setTransform(r * n[0], r * n[1], r * n[2], r * n[3], r * n[4], r * n[5]) : e.setTransform(r, 0, 0, r, 0, 0);
}
function iO(e, t, n) {
	for (var r = !1, i = 0; i < e.length; i++) {
		var a = e[i];
		r ||= a.isZeroArea(), rO(t, a), t.beginPath(), a.buildPath(t, a.shape), t.clip();
	}
	n.allClipped = r;
}
function aO(e, t) {
	return e && t ? e[0] !== t[0] || e[1] !== t[1] || e[2] !== t[2] || e[3] !== t[3] || e[4] !== t[4] || e[5] !== t[5] : !(!e && !t);
}
var oO = 1, sO = 2, cO = 3, lO = 4;
function uO(e) {
	var t = GD(e), n = UD(e);
	return !(e.lineDash || !(t ^ +n) || t && typeof e.fill != "string" || n && typeof e.stroke != "string" || e.strokePercent < 1 || e.strokeOpacity < 1 || e.fillOpacity < 1);
}
function dO(e, t) {
	t.batchFill && (t.batchFill = !1, e.fill()), t.batchStroke && (t.batchStroke = !1, e.stroke());
}
function fO(e, t) {
	var n = {
		inHover: !1,
		viewWidth: 0,
		viewHeight: 0,
		beforeBrushParam: {}
	};
	pO(e, t, n), mO(e, n);
}
function pO(e, t, n) {
	var r = t.transform;
	if (!t.shouldBePainted(n.viewWidth, n.viewHeight, !1, !1)) {
		t.__dirty &= -2, t.__isRendered = !1;
		return;
	}
	var i = t.__clipPaths, a = n.prevElClipPaths, o = t.style, s = !1, c = !1;
	if ((!a || LD(i, a)) && (a && (dO(e, n), e.restore(), c = s = !0, n.prevElClipPaths = null, n.allClipped = !1, n.prevEl = null), i && i.length && (dO(e, n), e.save(), iO(i, e, n), s = !0, n.prevElClipPaths = i)), n.allClipped) {
		t.__dirty &= -2, t.__isRendered = !1;
		return;
	}
	t.beforeBrush && t.beforeBrush(n.beforeBrushParam), t.innerBeforeBrush();
	var l = n.prevEl;
	l || (c = s = !0);
	var u = t instanceof yo && t.autoBatch && uO(o);
	s || aO(r, l.transform) ? (dO(e, n), rO(e, t)) : u || dO(e, n), t instanceof yo ? (n.lastDrawType !== oO && (c = !0, n.lastDrawType = oO), tO(e, t, l, c, n), (!u || !n.batchFill && !n.batchStroke) && e.beginPath(), YD(e, t, o, u, n)) : t instanceof xo ? (n.lastDrawType !== cO && (c = !0, n.lastDrawType = cO), tO(e, t, l, c, n), ZD(e, t, o)) : t instanceof To ? (n.lastDrawType !== sO && (c = !0, n.lastDrawType = sO), nO(e, t, l, c, n), XD(e, t, o)) : t.getTemporalDisplayables && (n.lastDrawType !== lO && (c = !0, n.lastDrawType = lO), hO(e, t, n)), t.innerAfterBrush(), t.afterBrush && (u && dO(e, n), t.afterBrush()), n.prevEl = t, t.__dirty = 0, t.__isRendered = !0;
}
function mO(e, t) {
	dO(e, t), t.prevElClipPaths && e.restore();
}
function hO(e, t, n) {
	var r = t.getDisplayables(), i = t.getTemporalDisplayables();
	e.save();
	var a = {
		prevElClipPaths: null,
		prevEl: null,
		allClipped: !1,
		viewWidth: n.viewWidth,
		viewHeight: n.viewHeight,
		inHover: n.inHover,
		beforeBrushParam: {}
	}, o, s;
	for (o = t.getCursor(), s = r.length; o < s; o++) {
		var c = r[o];
		c.beforeBrush && c.beforeBrush(n.beforeBrushParam), c.innerBeforeBrush(), pO(e, c, a), c.innerAfterBrush(), c.afterBrush && c.afterBrush(), a.prevEl = c;
	}
	mO(e, a);
	for (var l = 0, u = i.length; l < u; l++) {
		var c = i[l];
		c.beforeBrush && c.beforeBrush(n.beforeBrushParam), c.innerBeforeBrush(), pO(e, c, a), c.innerAfterBrush(), c.afterBrush && c.afterBrush(), a.prevEl = c;
	}
	mO(e, a), t.clearTemporalDisplayables(), t.notClear = !0, e.restore();
}
//#endregion
//#region node_modules/echarts/lib/util/decal.js
var gO = new MD(), _O = new Ye(100), vO = [
	"symbol",
	"symbolSize",
	"symbolKeepAspect",
	"color",
	"backgroundColor",
	"dashArrayX",
	"dashArrayY",
	"maxTileWidth",
	"maxTileHeight"
];
function yO(e, t) {
	if (e === "none") return null;
	var n = t.getDevicePixelRatio(), r = t.getZr(), i = r.painter.type === "svg";
	e.dirty && gO.delete(e);
	var a = gO.get(e);
	if (a) return a;
	var o = j(e, {
		symbol: "rect",
		symbolSize: 1,
		symbolKeepAspect: !0,
		color: "rgba(0, 0, 0, 0.2)",
		backgroundColor: null,
		dashArrayX: 5,
		dashArrayY: 5,
		rotation: 0,
		maxTileWidth: 512,
		maxTileHeight: 512
	});
	o.backgroundColor === "none" && (o.backgroundColor = null);
	var s = { repeat: "repeat" };
	return c(s), s.rotation = o.rotation, s.scaleX = s.scaleY = i ? 1 : 1 / n, gO.set(e, s), e.dirty = !1, s;
	function c(e) {
		for (var t = [n], a = !0, s = 0; s < vO.length; ++s) {
			var c = o[vO[s]];
			if (c != null && !V(c) && !U(c) && !W(c) && typeof c != "boolean") {
				a = !1;
				break;
			}
			t.push(c);
		}
		var l;
		if (a) {
			l = t.join(",") + (i ? "-svg" : "");
			var d = _O.get(l);
			d && (i ? e.svgElement = d : e.image = d);
		}
		var f = xO(o.dashArrayX), p = SO(o.dashArrayY), m = bO(o.symbol), h = CO(f), g = wO(p), _ = !i && u.createCanvas(), v = i && {
			tag: "g",
			attrs: {},
			key: "dcl",
			children: []
		}, y = x(), b;
		_ && (_.width = y.width * n, _.height = y.height * n, b = _.getContext("2d")), S(), a && _O.put(l, _ || v), e.image = _, e.svgElement = v, e.svgWidth = y.width, e.svgHeight = y.height;
		function x() {
			for (var e = 1, t = 0, n = h.length; t < n; ++t) e = Is(e, h[t]);
			for (var r = 1, t = 0, n = m.length; t < n; ++t) r = Is(r, m[t].length);
			e *= r;
			var i = g * h.length * m.length;
			return {
				width: Math.max(1, Math.min(e, o.maxTileWidth)),
				height: Math.max(1, Math.min(i, o.maxTileHeight))
			};
		}
		function S() {
			b && (b.clearRect(0, 0, _.width, _.height), o.backgroundColor && (b.fillStyle = o.backgroundColor, b.fillRect(0, 0, _.width, _.height)));
			for (var e = 0, t = 0; t < p.length; ++t) e += p[t];
			if (e <= 0) return;
			for (var a = -g, s = 0, c = 0, l = 0; a < y.height;) {
				if (s % 2 == 0) {
					for (var u = c / 2 % m.length, d = 0, h = 0, x = 0; d < y.width * 2;) {
						for (var S = 0, t = 0; t < f[l].length; ++t) S += f[l][t];
						if (S <= 0) break;
						if (h % 2 == 0) {
							var C = (1 - o.symbolSize) * .5, w = d + f[l][h] * C, T = a + p[s] * C, E = f[l][h] * o.symbolSize, D = p[s] * o.symbolSize, O = x / 2 % m[u].length;
							k(w, T, E, D, m[u][O]);
						}
						d += f[l][h], ++x, ++h, h === f[l].length && (h = 0);
					}
					++l, l === f.length && (l = 0);
				}
				a += p[s], ++c, ++s, s === p.length && (s = 0);
			}
			function k(e, t, a, s, c) {
				var l = i ? 1 : n, u = pv(c, e * l, t * l, a * l, s * l, o.color, o.symbolKeepAspect);
				if (i) {
					var d = r.painter.renderOneToVNode(u);
					d && v.children.push(d);
				} else fO(b, u);
			}
		}
	}
}
function bO(e) {
	if (!e || e.length === 0) return [["rect"]];
	if (U(e)) return [[e]];
	for (var t = !0, n = 0; n < e.length; ++n) if (!U(e[n])) {
		t = !1;
		break;
	}
	if (t) return bO([e]);
	for (var r = [], n = 0; n < e.length; ++n) U(e[n]) ? r.push([e[n]]) : r.push(e[n]);
	return r;
}
function xO(e) {
	if (!e || e.length === 0) return [[0, 0]];
	if (W(e)) {
		var t = Math.ceil(e);
		return [[t, t]];
	}
	for (var n = !0, r = 0; r < e.length; ++r) if (!W(e[r])) {
		n = !1;
		break;
	}
	if (n) return xO([e]);
	for (var i = [], r = 0; r < e.length; ++r) if (W(e[r])) {
		var t = Math.ceil(e[r]);
		i.push([t, t]);
	} else {
		var t = I(e[r], function(e) {
			return Math.ceil(e);
		});
		t.length % 2 == 1 ? i.push(t.concat(t)) : i.push(t);
	}
	return i;
}
function SO(e) {
	if (!e || typeof e == "object" && e.length === 0) return [0, 0];
	if (W(e)) {
		var t = Math.ceil(e);
		return [t, t];
	}
	var n = I(e, function(e) {
		return Math.ceil(e);
	});
	return e.length % 2 ? n.concat(n) : n;
}
function CO(e) {
	return I(e, function(e) {
		return wO(e);
	});
}
function wO(e) {
	for (var t = 0, n = 0; n < e.length; ++n) t += e[n];
	return e.length % 2 == 1 ? t * 2 : t;
}
//#endregion
//#region node_modules/echarts/lib/visual/decal.js
var TO = Vc(EO);
function EO(e, t) {
	e.eachRawSeries(function(n) {
		if (!e.isSeriesFiltered(n)) {
			var r = n.getData();
			r.hasItemVisual() && r.each(function(e) {
				var n = r.getItemVisual(e, "decal");
				if (n) {
					var i = r.ensureUniqueItemVisual(e, "style");
					i.decal = yO(n, t);
				}
			});
			var i = r.getVisual("decal");
			if (i) {
				var a = r.getVisual("style");
				a.decal = yO(i, t);
			}
		}
	});
}
//#endregion
//#region node_modules/echarts/lib/core/echarts.js
var DO = "6.1.0", OO = 1, kO = 800, AO = 900, jO = 920, MO = 1e3, NO = 2e3, PO = 5e3, FO = 1e3, IO = 1100, LO = 2e3, RO = 3e3, zO = 4e3, BO = 4500, VO = 4600, HO = 5e3, UO = 6e3, WO = 7e3, GO = {
	PROCESSOR: {
		SERIES_FILTER: kO,
		AXIS_STATISTICS: jO,
		FILTER: MO,
		STATISTIC: PO,
		STATISTICS: PO
	},
	VISUAL: {
		LAYOUT: FO,
		PROGRESSIVE_LAYOUT: IO,
		GLOBAL: LO,
		CHART: RO,
		POST_CHART_LAYOUT: VO,
		COMPONENT: zO,
		BRUSH: HO,
		CHART_ITEM: BO,
		ARIA: UO,
		DECAL: WO
	}
}, KO = "__flagInMainProcess", qO = "__mainProcessVersion", JO = "__pendingUpdate", YO = "__needsUpdateStatus", XO = /^[a-zA-Z0-9_]+$/, ZO = "__connectUpdateStatus", QO = 0, $O = 1, ek = 2;
function tk(e) {
	return function() {
		var t = [...arguments];
		if (this.isDisposed()) {
			this.id;
			return;
		}
		return rk(this, e, t);
	};
}
function nk(e) {
	return function() {
		var t = [...arguments];
		return rk(this, e, t);
	};
}
function rk(e, t, n) {
	return n[0] = n[0] && n[0].toLowerCase(), Ii.prototype[t].apply(e, n);
}
var ik = function(e) {
	r(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t;
}(Ii), ak = ik.prototype;
ak.on = nk("on"), ak.off = nk("off");
var ok, sk, ck, lk, uk, dk, fk, pk, mk, hk, gk, _k, vk, yk, bk, xk, Sk, Ck, wk, Tk = function(e) {
	r(t, e);
	function t(t, n, r) {
		var i = e.call(this, new gD()) || this;
		i._chartsViews = [], i._chartsMap = {}, i._componentsViews = [], i._componentsMap = {}, i._pendingActions = [], r ||= {}, i.__v_skip = !0, i._dom = t;
		var a = "canvas", o = "auto", s = !1;
		i[qO] = 1, r.ssr && VT(function(e) {
			var t = Z(e), n = t.dataIndex;
			if (n != null) {
				var r = q();
				return r.set("series_index", t.seriesIndex), r.set("data_index", n), t.ssrType && r.set("ssr_type", t.ssrType), r;
			}
		});
		var c = i._zr = LT(t, {
			renderer: r.renderer || a,
			devicePixelRatio: r.devicePixelRatio,
			width: r.width,
			height: r.height,
			ssr: r.ssr,
			useDirtyRect: K(r.useDirtyRect, s),
			useCoarsePointer: K(r.useCoarsePointer, o),
			pointerSize: r.pointerSize
		});
		i._ssr = r.ssr, i._throttledZrFlush = LC(z(c.flush, c), 17), i._updateTheme(n), i._locale = Rh(r.locale || Ih), i._coordSysMgr = new Gm();
		var l = i._api = bk(i);
		function u(e, t) {
			return e.__prio - t.__prio;
		}
		return aT(Nk, u), aT(jk, u), i._scheduler = new ZE(i, l, jk, Nk), i._messageCenter = new ik(), i._initEvents(), i.resize = z(i.resize, i), c.animation.on("frame", i._onframe, i), hk(c, i), gk(c, i), _e(i), i;
	}
	return t.prototype._onframe = function() {
		if (!this._disposed) {
			var e = this._scheduler, t = this._model, n = this._api;
			if (Ck(this), this[JO]) {
				var r = this[JO].silent;
				this[KO] = !0, wk(this);
				try {
					ok(this), lk.update.call(this, null, this[JO].updateParams);
				} catch (e) {
					throw this[KO] = !1, this[JO] = null, e;
				}
				this._zr.flush(), this[KO] = !1, this[JO] = null, pk.call(this, r), mk.call(this, r);
			} else if (e.unfinished) {
				var i = OO;
				do {
					e.unfinished = !1;
					var a = u.getTime();
					e.performSeriesTasks(t), e.performDataProcessorTasks(t), dk(this, t), e.performVisualTasks(t), yk(this, this._model, n, "remain", {}), i -= u.getTime() - a;
				} while (i > 0 && e.unfinished);
				e.unfinished || this._zr.flush();
			}
		}
	}, t.prototype.getDom = function() {
		return this._dom;
	}, t.prototype.getId = function() {
		return this.id;
	}, t.prototype.getZr = function() {
		return this._zr;
	}, t.prototype.isSSR = function() {
		return this._ssr;
	}, t.prototype.setOption = function(e, t, n) {
		if (!this[KO]) {
			if (this._disposed) {
				this.id;
				return;
			}
			var r, i, a;
			if (G(t) && (n = t.lazyUpdate, r = t.silent, i = t.replaceMerge, a = t.transition, t = t.notMerge), this[KO] = !0, wk(this), !this._model || t) {
				var o = new sE(this._api), s = this._theme, c = this._model = new eE();
				c.scheduler = this._scheduler, c.ssr = this._ssr, c.init(null, null, null, s, this._locale, o);
			}
			this._model.setOption(e, { replaceMerge: i }, Mk);
			var l = {
				seriesTransition: a,
				optionChanged: !0
			};
			if (n) this[JO] = {
				silent: r,
				updateParams: l
			}, this[KO] = !1, this.getZr().wakeUp();
			else {
				try {
					ok(this), lk.update.call(this, null, l);
				} catch (e) {
					throw this[JO] = null, this[KO] = !1, e;
				}
				this._ssr || this._zr.flush(), this[JO] = null, this[KO] = !1, pk.call(this, r), mk.call(this, r);
			}
		}
	}, t.prototype.setTheme = function(e, t) {
		if (!this[KO]) {
			if (this._disposed) {
				this.id;
				return;
			}
			var n = this._model;
			if (n) {
				var r = t && t.silent, i = null;
				this[JO] && (r ??= this[JO].silent, i = this[JO].updateParams, this[JO] = null), this[KO] = !0, wk(this);
				try {
					this._updateTheme(e), n.setTheme(this._theme), ok(this), lk.update.call(this, { type: "setTheme" }, i);
				} catch (e) {
					throw this[KO] = !1, e;
				}
				this[KO] = !1, pk.call(this, r), mk.call(this, r);
			}
		}
	}, t.prototype._updateTheme = function(e) {
		U(e) && (e = Pk[e]), e && (e = E(e), e && FE(e, !0), this._theme = e);
	}, t.prototype.getModel = function() {
		return this._model;
	}, t.prototype.getOption = function() {
		return this._model && this._model.getOption();
	}, t.prototype.getWidth = function() {
		return this._zr.getWidth();
	}, t.prototype.getHeight = function() {
		return this._zr.getHeight();
	}, t.prototype.getDevicePixelRatio = function() {
		return this._zr.painter.dpr || J.hasGlobalWindow && window.devicePixelRatio || 1;
	}, t.prototype.getRenderedCanvas = function(e) {
		return this.renderToCanvas(e);
	}, t.prototype.renderToCanvas = function(e) {
		return e ||= {}, this._zr.painter.getRenderedCanvas({
			backgroundColor: e.backgroundColor || this._model.get("backgroundColor"),
			pixelRatio: e.pixelRatio || this.getDevicePixelRatio()
		});
	}, t.prototype.renderToSVGString = function(e) {
		return e ||= {}, this._zr.painter.renderToString({ useViewBox: e.useViewBox });
	}, t.prototype.getSvgDataURL = function() {
		var e = this._zr;
		return F(e.storage.getDisplayList(), function(e) {
			e.stopAnimation(null, !0);
		}), e.painter.toDataURL();
	}, t.prototype.getDataURL = function(e) {
		if (this._disposed) {
			this.id;
			return;
		}
		e ||= {};
		var t = e.excludeComponents, n = this._model, r = [], i = this;
		F(t, function(e) {
			n.eachComponent({ mainType: e }, function(e) {
				var t = i._componentsMap[e.__viewId];
				t.group.ignore || (r.push(t), t.group.ignore = !0);
			});
		});
		var a = this._zr.painter.getType() === "svg" ? this.getSvgDataURL() : this.renderToCanvas(e).toDataURL("image/" + (e && e.type || "png"));
		return F(r, function(e) {
			e.group.ignore = !1;
		}), a;
	}, t.prototype.getConnectedDataURL = function(e) {
		if (this._disposed) {
			this.id;
			return;
		}
		var t = e.type === "svg", n = this.group, r = Math.min, i = Math.max, a = Infinity;
		if (Lk[n]) {
			var o = a, s = a, c = -a, l = -a, d = [], f = e && e.pixelRatio || this.getDevicePixelRatio();
			F(Ik, function(a, u) {
				if (a.group === n) {
					var f = t ? a.getZr().painter.getSvgDom().innerHTML : a.renderToCanvas(E(e)), p = a.getDom().getBoundingClientRect();
					o = r(p.left, o), s = r(p.top, s), c = i(p.right, c), l = i(p.bottom, l), d.push({
						dom: f,
						left: p.left,
						top: p.top
					});
				}
			}), o *= f, s *= f, c *= f, l *= f;
			var p = c - o, m = l - s, h = u.createCanvas(), g = LT(h, { renderer: t ? "svg" : "canvas" });
			if (g.resize({
				width: p,
				height: m
			}), t) {
				var _ = "";
				return F(d, function(e) {
					var t = e.left - o, n = e.top - s;
					_ += "<g transform=\"translate(" + t + "," + n + ")\">" + e.dom + "</g>";
				}), g.painter.getSvgRoot().innerHTML = _, e.connectedBackgroundColor && g.painter.setBackgroundColor(e.connectedBackgroundColor), g.refreshImmediately(), g.painter.toDataURL();
			}
			return e.connectedBackgroundColor && g.add(new No({
				shape: {
					x: 0,
					y: 0,
					width: p,
					height: m
				},
				style: { fill: e.connectedBackgroundColor }
			})), F(d, function(e) {
				var t = new To({ style: {
					x: e.left * f - o,
					y: e.top * f - s,
					image: e.dom
				} });
				g.add(t);
			}), g.refreshImmediately(), h.toDataURL("image/" + (e && e.type || "png"));
		}
		return this.getDataURL(e);
	}, t.prototype.convertToPixel = function(e, t, n) {
		return uk(this, "convertToPixel", e, t, n);
	}, t.prototype.convertToLayout = function(e, t, n) {
		return uk(this, "convertToLayout", e, t, n);
	}, t.prototype.convertFromPixel = function(e, t, n) {
		return uk(this, "convertFromPixel", e, t, n);
	}, t.prototype.containPixel = function(e, t) {
		if (this._disposed) {
			this.id;
			return;
		}
		var n = this._model, r;
		return F(mc(n, e), function(e, n) {
			n.indexOf("Models") >= 0 && F(e, function(e) {
				var i = e.coordinateSystem;
				if (i && i.containPoint) r ||= !!i.containPoint(t);
				else if (n === "seriesModels") {
					var a = this._chartsMap[e.__viewId];
					a && a.containPoint && (r ||= a.containPoint(t, e));
				}
			}, this);
		}, this), !!r;
	}, t.prototype.getVisual = function(e, t) {
		var n = this._model, r = mc(n, e, { defaultMainType: "series" }), i = r.seriesModel.getData(), a = r.hasOwnProperty("dataIndexInside") ? r.dataIndexInside : r.hasOwnProperty("dataIndex") ? i.indexOfRawIndex(r.dataIndex) : null;
		return a == null ? SD(i, t) : xD(i, a, t);
	}, t.prototype.getViewOfComponentModel = function(e) {
		return this._componentsMap[e.__viewId];
	}, t.prototype.getViewOfSeriesModel = function(e) {
		return this._chartsMap[e.__viewId];
	}, t.prototype._initEvents = function() {
		var e = this;
		F(Dk, function(t) {
			var n = function(n) {
				var r = e.getModel(), i = n.target, a;
				if (t === "globalout" ? a = {} : i && CD(i, function(e) {
					var t = Z(e);
					if (t && t.dataIndex != null) {
						var n = t.dataModel || r.getSeriesByIndex(t.seriesIndex);
						return a = n && n.getDataParams(t.dataIndex, t.dataType, i) || {}, !0;
					}
					if (t.eventData) return a = k({}, t.eventData), !0;
				}, !0), a) {
					var o = a.componentType, s = a.componentIndex;
					(o === "markLine" || o === "markPoint" || o === "markArea") && (o = "series", s = a.seriesIndex);
					var c = o && s != null && r.getComponent(o, s), l = c && e[c.mainType === "series" ? "_chartsMap" : "_componentsMap"][c.__viewId];
					a.event = n, a.type = t, e._$eventProcessor.eventInfo = {
						targetEl: i,
						packedEvent: a,
						model: c,
						view: l
					}, e.trigger(t, a);
				}
			};
			n.zrEventfulCallAtLast = !0, e._zr.on(t, n, e);
		});
		var t = this._messageCenter;
		F(Ak, function(n, r) {
			t.on(r, function(t) {
				e.trigger(r, t);
			});
		}), bw(t, this, this._api);
	}, t.prototype.isDisposed = function() {
		return this._disposed;
	}, t.prototype.clear = function() {
		if (this._disposed) {
			this.id;
			return;
		}
		this.setOption({ series: [] }, !0);
	}, t.prototype.dispose = function() {
		if (this._disposed) {
			this.id;
			return;
		}
		this._disposed = !0, this.getDom() && yc(this.getDom(), zk, "");
		var e = this, t = e._api, n = e._model;
		F(e._componentsViews, function(e) {
			e.dispose(n, t);
		}), F(e._chartsViews, function(e) {
			e.dispose(n, t);
		}), e._zr.dispose(), e._dom = e._model = e._chartsMap = e._componentsMap = e._chartsViews = e._componentsViews = e._scheduler = e._api = e._zr = e._throttledZrFlush = e._theme = e._coordSysMgr = e._messageCenter = null, delete Ik[e.id];
	}, t.prototype.resize = function(e) {
		if (!this[KO]) {
			if (this._disposed) {
				this.id;
				return;
			}
			this._zr.resize(e);
			var t = this._model;
			if (this._loadingFX && this._loadingFX.resize(), t) {
				var n = t.resetOption("media"), r = e && e.silent;
				this[JO] && (r ??= this[JO].silent, n = !0, this[JO] = null), this[KO] = !0, wk(this);
				try {
					n && ok(this), lk.update.call(this, {
						type: "resize",
						animation: k({ duration: 0 }, e && e.animation)
					});
				} catch (e) {
					throw this[KO] = !1, e;
				}
				this[KO] = !1, pk.call(this, r), mk.call(this, r);
			}
		}
	}, t.prototype.showLoading = function(e, t) {
		if (this._disposed) {
			this.id;
			return;
		}
		if (G(e) && (t = e, e = ""), e ||= "default", this.hideLoading(), Fk[e]) {
			var n = Fk[e](this._api, t), r = this._zr;
			this._loadingFX = n, r.add(n);
		}
	}, t.prototype.hideLoading = function() {
		if (this._disposed) {
			this.id;
			return;
		}
		this._loadingFX && this._zr.remove(this._loadingFX), this._loadingFX = null;
	}, t.prototype.makeActionFromEvent = function(e) {
		var t = k({}, e);
		return t.type = kk[e.type], t;
	}, t.prototype.dispatchAction = function(e, t) {
		if (this._disposed) {
			this.id;
			return;
		}
		if (G(t) || (t = { silent: !!t }), Ok[e.type] && this._model) {
			if (this[KO]) {
				this._pendingActions.push(e);
				return;
			}
			var n = t.silent;
			fk.call(this, e, n);
			var r = t.flush;
			r ? this._zr.flush() : r !== !1 && J.browser.weChat && this._throttledZrFlush(), pk.call(this, n), mk.call(this, n);
		}
	}, t.prototype.updateLabelLayout = function() {
		wD.trigger("series:layoutlabels", this._model, this._api, { updatedSeries: [] });
	}, t.prototype.appendData = function(e) {
		if (this._disposed) {
			this.id;
			return;
		}
		var t = e.seriesIndex;
		this.getModel().getSeriesByIndex(t).appendData(e), this._scheduler.unfinished = !0, this.getZr().wakeUp();
	}, t.internalField = function() {
		ok = function(e) {
			lx(e._model);
			var t = e._scheduler;
			t.restorePipelines(e._zr, e._model), t.prepareStageTasks(), sk(e, !0), sk(e, !1), t.plan();
		}, sk = function(e, t) {
			for (var n = e._model, r = e._scheduler, i = t ? e._componentsViews : e._chartsViews, a = t ? e._componentsMap : e._chartsMap, o = e._zr, s = e._api, c = 0; c < i.length; c++) i[c].__alive = !1;
			t ? n.eachComponent(function(e, t) {
				e !== "series" && l(t);
			}) : n.eachSeries(l);
			function l(e) {
				var c = e.__requireNewView;
				e.__requireNewView = !1;
				var l = "_ec_" + e.id + "_" + e.type, u = !c && a[l];
				if (!u) {
					var d = Ne(e.type);
					u = new (t ? zE.getClass(d.main, d.sub) : Kv.getClass(d.sub))(), u.init(n, s), a[l] = u, i.push(u), o.add(u.group);
				}
				e.__viewId = u.__id = l, u.__alive = !0, u.__model = e, u.group.__ecComponentInfo = {
					mainType: e.mainType,
					index: e.componentIndex
				}, !t && r.prepareView(u, e, n, s);
			}
			for (var c = 0; c < i.length;) {
				var u = i[c];
				u.__alive ? c++ : (!t && u.renderTask.dispose(), o.remove(u.group), u.dispose(n, s), i.splice(c, 1), a[u.__id] === u && delete a[u.__id], u.__id = u.group.__ecComponentInfo = null);
			}
		}, ck = function(e, t, n, r, i) {
			var a = e._model;
			if (a.setUpdatePayload(n), !r) {
				F([].concat(e._componentsViews, e._chartsViews), l);
				return;
			}
			var o = vc(n, r, i), s = n.excludeSeriesId, c;
			s != null && (c = q(), F(qs(s), function(e) {
				var t = sc(e, null);
				t != null && c.set(t, !0);
			})), a && a.eachComponent(o, function(t) {
				if (!(c && c.get(t.id) != null)) {
					if (su(n)) {
						if (t instanceof Q_) n.type === "highlight" && !n.notBlur && !t.get(["emphasis", "disabled"]) && Ul(t, n, e._api);
						else {
							var r = Wl(t.mainType, t.componentIndex, n.name, e._api), i = r.focusSelf, a = r.dispatchers;
							n.type === "highlight" && i && !n.notBlur && Hl(t.mainType, t.componentIndex, e._api), a && F(a, function(e) {
								n.type === "highlight" ? Nl(e) : Pl(e);
							});
						}
					} else ou(n) && t instanceof Q_ && (ql(t, n, e._api), Jl(t), Sk(e));
				}
			}, e), a && a.eachComponent(o, function(t) {
				c && c.get(t.id) != null || l(e[r === "series" ? "_chartsMap" : "_componentsMap"][t.__viewId]);
			}, e);
			function l(r) {
				r && r.__alive && r[t] && r[t](r.__model, a, e._api, n);
			}
		}, lk = {
			prepareAndUpdate: function(e) {
				ok(this), lk.update.call(this, e, e && { optionChanged: e.newOption != null });
			},
			update: function(e, n) {
				var r = this._model, i = this._api, a = this._zr, o = this._coordSysMgr, s = this._scheduler;
				if (r) {
					ux(r), r.setUpdatePayload(e), s.restoreData(r, e), s.performSeriesTasks(r), o.create(r, i), wD.trigger("coordsys:aftercreate", r, i), s.performDataProcessorTasks(r, e), dk(this, r), o.update(r, i), t(r), s.performVisualTasks(r, e);
					var c = r.get("backgroundColor") || "transparent";
					a.setBackgroundColor(c);
					var l = r.get("darkMode");
					l != null && l !== "auto" && a.setDarkMode(l), _k(this, r, i, e, n), wD.trigger("afterupdate", r, i);
				}
			},
			updateTransform: function(e) {
				var t = this, n = t._model, r = t._api;
				if (n) {
					n.setUpdatePayload(e);
					var i = [];
					n.eachComponent(function(a, o) {
						if (a !== "series") {
							var s = t.getViewOfComponentModel(o);
							if (s && s.__alive) {
								if (s.updateTransform) {
									var c = s.updateTransform(o, n, r, e);
									c && c.update && i.push(s);
								} else i.push(s);
							}
						}
					});
					var a = q();
					n.eachSeries(function(i) {
						var o = t._chartsMap[i.__viewId], s = i.pipelineContext;
						if (o.updateTransform && !s.progressiveRender) {
							var c = o.updateTransform(i, n, r, e);
							c && c.update && a.set(i.uid, 1);
						} else a.set(i.uid, 1);
					}), t._scheduler.performVisualTasks(n, e, {
						setDirty: !0,
						dirtyMap: a
					}), yk(t, n, r, e, {}, a), wD.trigger("afterupdate", n, r);
				}
			},
			updateView: function(e) {
				var n = this._model;
				n && (n.setUpdatePayload(e), Kv.markUpdateMethod(e, "updateView"), t(n), this._scheduler.performVisualTasks(n, e, { setDirty: !0 }), _k(this, n, this._api, e, {}), wD.trigger("afterupdate", n, this._api));
			},
			updateVisual: function(e) {
				var n = this, r = this._model;
				r && (r.setUpdatePayload(e), r.eachSeries(function(e) {
					e.getData().clearAllVisual();
				}), Kv.markUpdateMethod(e, "updateVisual"), t(r), this._scheduler.performVisualTasks(r, e, {
					visualType: "visual",
					setDirty: !0
				}), r.eachComponent(function(t, i) {
					if (t !== "series") {
						var a = n.getViewOfComponentModel(i);
						a && a.__alive && a.updateVisual(i, r, n._api, e);
					}
				}), r.eachSeries(function(t) {
					n._chartsMap[t.__viewId].updateVisual(t, r, n._api, e);
				}), wD.trigger("afterupdate", r, this._api));
			},
			updateLayout: function(e) {
				lk.update.call(this, e);
			}
		};
		function e(e, t, n, r, i) {
			if (e._disposed) {
				e.id;
				return;
			}
			for (var a = e._model, o = e._coordSysMgr.getCoordinateSystems(), s, c = mc(a, n), l = 0; l < o.length; l++) {
				var u = o[l];
				if (u[t] && (s = u[t](a, c, r, i)) != null) return s;
			}
		}
		uk = e, dk = function(e, t) {
			var n = e._chartsMap, r = e._scheduler;
			t.eachSeries(function(e) {
				r.updateStreamModes(e, n[e.__viewId]);
			});
		}, fk = function(e, t) {
			var n = this, r = this.getModel(), i = e.type, a = e.escapeConnect, o = Ok[i], s = (o.update || "update").split(":"), c = s.pop(), l = s[0] != null && Ne(s[0]);
			this[KO] = !0, wk(this);
			var u = [e], d = !1;
			e.batch && (d = !0, u = I(e.batch, function(t) {
				return t = j(k({}, t), e), t.batch = null, t;
			}));
			var f = [], p, m = [], h = o.nonRefinedEventType, g = ou(e), _ = su(e);
			if (_ && Bl(this._api), F(u, function(t) {
				var i = o.action(t, r, n._api);
				if (o.refineEvent ? m.push(i) : p = i, p ||= k({}, t), p.type = h, f.push(p), _) {
					var a = hc(e), s = a.queryOptionMap, u = a.mainTypeSpecified ? s.keys()[0] : "series";
					ck(n, c, t, u), Sk(n);
				} else g ? (ck(n, c, t, "series"), Sk(n)) : l && ck(n, c, t, l.main, l.sub);
			}), c !== "none" && !_ && !g && !l) try {
				this[JO] ? (ok(this), lk.update.call(this, e), this[JO] = null) : lk[c].call(this, e);
			} catch (e) {
				throw this[KO] = !1, e;
			}
			if (p = d ? {
				type: h,
				escapeConnect: a,
				batch: f
			} : f[0], this[KO] = !1, !t) {
				var v = void 0;
				if (o.refineEvent) {
					var y = o.refineEvent(m, e, r, this._api).eventContent;
					me(G(y)), v = j({ type: o.refinedEventType }, y), v.fromAction = e.type, v.fromActionPayload = e, v.escapeConnect = !0;
				}
				var b = this._messageCenter;
				b.trigger(p.type, p), v && b.trigger(v.type, v);
			}
		}, pk = function(e) {
			for (var t = this._pendingActions; t.length;) {
				var n = t.shift();
				fk.call(this, n, e);
			}
		}, mk = function(e) {
			!e && this.trigger("updated");
		}, hk = function(e, t) {
			e.on("rendered", function(n) {
				t.trigger("rendered", n), e.animation.isFinished() && !t[JO] && !t._scheduler.unfinished && !t._pendingActions.length ? t.trigger("finished") : e.refresh();
			});
		}, gk = function(e, t) {
			e.on("mouseover", function(e) {
				var n = e.target, r = CD(n, iu);
				r && (Gl(r, e, t._api), Sk(t));
			}).on("mouseout", function(e) {
				var n = e.target, r = CD(n, iu);
				r && (Kl(r, e, t._api), Sk(t));
			}).on("click", function(e) {
				var n = e.target, r = CD(n, function(e) {
					return Z(e).dataIndex != null;
				}, !0);
				if (r) {
					var i = r.selected ? "unselect" : "select", a = Z(r);
					t._api.dispatchAction({
						type: i,
						dataType: a.dataType,
						dataIndexInside: a.dataIndex,
						seriesIndex: a.seriesIndex,
						isFromClick: !0
					});
				}
			});
		};
		function t(e) {
			e.clearColorPalette(), e.eachSeries(function(e) {
				e.clearColorPalette();
			});
		}
		function n(e) {
			var t = [], n = [], r = !1;
			if (e.eachComponent(function(e, i) {
				var a = i.get("zlevel") || 0, o = i.get("z") || 0, s = i.getZLevelKey();
				r ||= !!s, (e === "series" ? n : t).push({
					zlevel: a,
					z: o,
					idx: i.componentIndex,
					type: e,
					key: s
				});
			}), r) {
				var i = t.concat(n), a, o;
				aT(i, function(e, t) {
					return e.zlevel === t.zlevel ? e.z - t.z : e.zlevel - t.zlevel;
				}), F(i, function(t) {
					var n = e.getComponent(t.type, t.idx), r = t.zlevel, i = t.key;
					a != null && (r = Math.max(a, r)), i ? (r === a && i !== o && r++, o = i) : o &&= (r === a && r++, ""), a = r, n.setZLevel(r);
				});
			}
		}
		_k = function(e, t, r, i, a) {
			n(t), vk(e, t, r, i, a), F(e._chartsViews, function(e) {
				e.__alive = !1;
			}), yk(e, t, r, i, a), F(e._chartsViews, function(e) {
				e.__alive || e.remove(t, r);
			});
		}, vk = function(e, t, n, r, i, a) {
			F(a || e._componentsViews, function(e) {
				var i = e.__model;
				c(i, e), e.render(i, t, n, r), s(i, e), l(i, e);
			});
		}, yk = function(e, t, n, r, i, u) {
			var d = e._scheduler;
			i = k(i || {}, { updatedSeries: t.getSeries() }), wD.trigger("series:beforeupdate", t, n, i);
			var f = !1;
			t.eachSeries(function(t) {
				var n = e._chartsMap[t.__viewId];
				n.__alive = !0;
				var i = n.renderTask;
				d.updatePayload(i, r), c(t, n), u && u.get(t.uid) && i.dirty(), i.perform(d.getPerformArgs(i)) && (f = !0), n.group.silent = !!t.get("silent"), o(t, n), Jl(t);
			}), d.unfinished = f || d.unfinished, wD.trigger("series:layoutlabels", t, n, i), wD.trigger("series:transition", t, n, i), t.eachSeries(function(t) {
				var n = e._chartsMap[t.__viewId];
				s(t, n), l(t, n);
			}), a(e, t), wD.trigger("series:afterupdate", t, n, i);
		}, Sk = function(e) {
			e[YO] = !0, e.getZr().wakeUp();
		}, wk = function(e) {
			e[qO] = (e[qO] + 1) % 1e6;
		}, Ck = function(e) {
			e[YO] && (e.getZr().storage.traverse(function(e) {
				Id(e) || i(e);
			}), e[YO] = !1);
		};
		function i(e) {
			for (var t = [], n = e.currentStates, r = 0; r < n.length; r++) {
				var i = n[r];
				i !== "emphasis" && i !== "blur" && i !== "select" && t.push(i);
			}
			e.selected && e.states.select && t.push("select"), e.hoverState === 2 && e.states.emphasis ? t.push("emphasis") : e.hoverState === 1 && e.states.blur && t.push("blur"), e.useStates(t);
		}
		function a(e, t) {
			var n = e._zr;
			if (n.painter.type === "canvas") {
				var r = n.storage, i = 0;
				r.traverse(function(e) {
					e.isGroup || i++;
				});
				var a = i > K(t.get("hoverLayerThreshold"), KT.hoverLayerThreshold) && !J.node && !J.worker;
				(e._usingTHL || a) && (t.eachSeries(function(t) {
					if (!t.preventUsingHoverLayer) {
						var n = e._chartsMap[t.__viewId];
						n.__alive && n.eachRendered(function(e) {
							var t = e.states.emphasis;
							t && t.hoverLayer !== 2 && (t.hoverLayer = +!!a);
						});
					}
				}), e._usingTHL = a);
			}
		}
		function o(e, t) {
			var n = e.get("blendMode") || null;
			t.eachRendered(function(e) {
				e.isGroup || (e.style.blend = n);
			});
		}
		function s(e, t) {
			if (!e.preventAutoZ) {
				var n = Of(e);
				t.eachRendered(function(e) {
					return Af(e, n.z, n.zlevel), !0;
				});
			}
		}
		function c(e, t) {
			t.eachRendered(function(e) {
				if (!Id(e)) {
					var t = e.getTextContent(), n = e.getTextGuideLine();
					e.stateTransition &&= null, t && t.stateTransition && (t.stateTransition = null), n && n.stateTransition && (n.stateTransition = null), e.hasState() ? (e.prevStates = e.currentStates, e.clearStates()) : e.prevStates &&= null;
				}
			});
		}
		function l(e, t) {
			var n = e.getModel("stateAnimation"), r = e.isAnimationEnabled(), a = n.get("duration"), o = a > 0 ? {
				duration: a,
				delay: n.get("delay"),
				easing: n.get("easing")
			} : null;
			t.eachRendered(function(e) {
				if (e.states && e.states.emphasis) {
					if (Id(e)) return;
					if (e instanceof yo && cu(e), e.__dirty) {
						var t = e.prevStates;
						t && e.useStates(t);
					}
					if (r) {
						e.stateTransition = o;
						var n = e.getTextContent(), a = e.getTextGuideLine();
						n && (n.stateTransition = o), a && (a.stateTransition = o);
					}
					e.__dirty && i(e);
				}
			});
		}
		bk = function(e) {
			return new (function(t) {
				r(n, t);
				function n() {
					return t !== null && t.apply(this, arguments) || this;
				}
				return n.prototype.getCoordinateSystems = function() {
					return e._coordSysMgr.getCoordinateSystems();
				}, n.prototype.getComponentByElement = function(t) {
					for (; t;) {
						var n = t.__ecComponentInfo;
						if (n != null) return e._model.getComponent(n.mainType, n.index);
						t = t.parent;
					}
				}, n.prototype.enterEmphasis = function(t, n) {
					Nl(t, n), Sk(e);
				}, n.prototype.leaveEmphasis = function(t, n) {
					Pl(t, n), Sk(e);
				}, n.prototype.enterBlur = function(t) {
					Fl(t), Sk(e);
				}, n.prototype.leaveBlur = function(t) {
					Il(t), Sk(e);
				}, n.prototype.enterSelect = function(t) {
					Ll(t), Sk(e);
				}, n.prototype.leaveSelect = function(t) {
					Rl(t), Sk(e);
				}, n.prototype.getModel = function() {
					return e.getModel();
				}, n.prototype.getViewOfComponentModel = function(t) {
					return e.getViewOfComponentModel(t);
				}, n.prototype.getViewOfSeriesModel = function(t) {
					return e.getViewOfSeriesModel(t);
				}, n.prototype.getECUpdateCycleVersion = function() {
					return e[qO];
				}, n.prototype.usingTHL = function() {
					return e._usingTHL;
				}, n;
			}(el))(e);
		}, xk = function(e) {
			function t(e, t) {
				for (var n = 0; n < e.length; n++) {
					var r = e[n];
					r[ZO] = t;
				}
			}
			F(kk, function(n, r) {
				e._messageCenter.on(r, function(n) {
					if (Lk[e.group] && e[ZO] !== QO) {
						if (n && n.escapeConnect) return;
						var r = e.makeActionFromEvent(n), i = [];
						F(Ik, function(t) {
							t !== e && t.group === e.group && i.push(t);
						}), t(i, QO), F(i, function(e) {
							e[ZO] !== $O && e.dispatchAction(r);
						}), t(i, ek);
					}
				});
			});
		};
	}(), t;
}(Ii), Ek = Tk.prototype;
Ek.on = tk("on"), Ek.off = tk("off"), Ek.one = function(e, t, n) {
	var r = this;
	function i() {
		var n = [...arguments];
		t && t.apply && t.apply(this, n), r.off(e, i);
	}
	this.on.call(this, e, i, n);
};
var Dk = [
	"click",
	"dblclick",
	"mouseover",
	"mouseout",
	"mousemove",
	"mousedown",
	"mouseup",
	"globalout",
	"contextmenu"
], Ok = {}, kk = {}, Ak = {}, jk = [], Mk = [], Nk = [], Pk = {}, Fk = {}, Ik = {}, Lk = {}, Rk = /* @__PURE__ */ new Date() - 0;
/* @__PURE__ */ new Date() - 0;
var zk = "_echarts_instance_";
function Bk(e, t, n) {
	var r = !(n && n.ssr);
	if (r) {
		var i = Hk(e);
		if (i) return i;
	}
	var a = new Tk(e, t, n);
	return a.id = "ec_" + Rk++, Ik[a.id] = a, r && yc(e, zk, a.id), xk(a), wD.trigger("afterinit", a), a;
}
function Vk(e) {
	U(e) ? e = Ik[e] : e instanceof Tk || (e = Hk(e)), e instanceof Tk && !e.isDisposed() && e.dispose();
}
function Hk(e) {
	return Ik[bc(e, zk)];
}
function Uk(e, t) {
	Pk[e] = t;
}
function Wk(e) {
	M(Mk, e) < 0 && Mk.push(e);
}
function Gk(e, t) {
	eA(jk, e, t, NO);
}
function Kk(e) {
	Jk("afterinit", e);
}
function qk(e) {
	Jk("afterupdate", e);
}
function Jk(e, t) {
	wD.on(e, t);
}
function Yk(e, t, n) {
	var r, i, a, o, s;
	H(t) && (n = t, t = ""), G(e) ? (r = e.type, i = e.event, o = e.update, s = e.publishNonRefinedEvent, n ||= e.action, a = e.refineEvent) : (r = e, i = t);
	function c(e) {
		return e.toLowerCase();
	}
	i = c(i || r);
	var l = a ? c(r) : i;
	Ok[r] || (me(XO.test(r) && XO.test(i)), a && me(i !== r), Ok[r] = {
		actionType: r,
		refinedEventType: i,
		nonRefinedEventType: l,
		update: o,
		action: n,
		refineEvent: a
	}, Ak[i] = 1, a && s && (Ak[l] = 1), kk[l] = r);
}
function Xk(e, t) {
	Gm.register(e, t);
}
function Zk(e, t) {
	eA(Nk, e, t, FO, "layout", !0);
}
function Qk(e, t) {
	eA(Nk, e, t, RO, "visual", !0);
}
var $k = [];
function eA(e, t, n, r, i, a) {
	if ((H(t) || G(t)) && (n = t, t = r), !(M($k, n) >= 0)) {
		$k.push(n);
		var o = ZE.wrapStageHandler(n, i);
		o.__prio = t, o.__raw = n, e.push(o);
	}
}
function tA(e, t) {
	Fk[e] = t;
}
function nA(e, t, n) {
	var r = DD("registerMap");
	r && r(e, t, n);
}
var rA = __;
Qk(LO, GE), Qk(BO, qE), Qk(BO, JE), Qk(LO, yD), Qk(BO, bD), Qk(WO, TO), Wk(FE), Gk(AO, IE), tA("default", XE), Yk({
	type: cl,
	event: cl,
	update: cl
}, Ee), Yk({
	type: ll,
	event: ll,
	update: ll
}, Ee), Yk({
	type: ul,
	event: pl,
	update: ul,
	action: Ee,
	refineEvent: iA,
	publishNonRefinedEvent: !0
}), Yk({
	type: dl,
	event: pl,
	update: dl,
	action: Ee,
	refineEvent: iA,
	publishNonRefinedEvent: !0
}), Yk({
	type: fl,
	event: pl,
	update: fl,
	action: Ee,
	refineEvent: iA,
	publishNonRefinedEvent: !0
});
function iA(e, t, n, r) {
	return { eventContent: {
		selected: Yl(n),
		isFromClick: t.isFromClick || !1
	} };
}
Uk("default", {}), Uk("dark", hD);
//#endregion
//#region node_modules/echarts/lib/extension.js
var aA = [], oA = {
	registerPreprocessor: Wk,
	registerProcessor: Gk,
	registerPostInit: Kk,
	registerPostUpdate: qk,
	registerUpdateLifecycle: Jk,
	registerAction: Yk,
	registerCoordinateSystem: Xk,
	registerLayout: Zk,
	registerVisual: Qk,
	registerTransform: rA,
	registerLoading: tA,
	registerMap: nA,
	registerImpl: ED,
	PRIORITY: GO,
	ComponentModel: Zg,
	ComponentView: zE,
	SeriesModel: Q_,
	ChartView: Kv,
	registerComponentModel: function(e) {
		Zg.registerClass(e);
	},
	registerComponentView: function(e) {
		zE.registerClass(e);
	},
	registerSeriesModel: function(e) {
		Q_.registerClass(e);
	},
	registerChartView: function(e) {
		Kv.registerClass(e);
	},
	registerCustomSeries: function(e, t) {
		kD(e, t);
	},
	registerSubTypeDefaulter: function(e, t) {
		Zg.registerSubTypeDefaulter(e, t);
	},
	registerPainter: function(e, t) {
		RT(e, t);
	}
};
function sA(e) {
	if (V(e)) {
		F(e, function(e) {
			sA(e);
		});
		return;
	}
	M(aA, e) >= 0 || (aA.push(e), H(e) && (e = { install: e }), e.install(oA));
}
//#endregion
//#region node_modules/echarts/lib/coord/axisModelCommonMixin.js
var cA = function() {
	function e() {}
	return e.prototype.needIncludeZero = function() {
		return !this.option.scale;
	}, e.prototype.getCoordSysModel = function() {}, e;
}(), lA = function(e) {
	r(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t.prototype.getCoordSysModel = function() {
		return this.getReferringComponents("grid", gc).models[0];
	}, t.type = "cartesian2dAxis", t;
}(Zg);
N(lA, cA);
//#endregion
//#region node_modules/echarts/lib/coord/axisDefault.js
var uA = {
	show: !0,
	z: 0,
	inverse: !1,
	name: "",
	nameLocation: "end",
	nameRotate: null,
	nameTruncate: {
		maxWidth: null,
		ellipsis: "...",
		placeholder: "."
	},
	nameTextStyle: {},
	nameGap: 15,
	silent: !1,
	triggerEvent: !1,
	tooltip: { show: !1 },
	axisPointer: {},
	axisLine: {
		show: !0,
		onZero: "auto",
		onZeroAxisIndex: null,
		lineStyle: {
			color: Q.color.axisLine,
			width: 1,
			type: "solid"
		},
		symbol: ["none", "none"],
		symbolSize: [10, 15],
		breakLine: !0
	},
	axisTick: {
		show: !0,
		inside: !1,
		length: 5,
		lineStyle: { width: 1 }
	},
	axisLabel: {
		show: !0,
		inside: !1,
		rotate: 0,
		showMinLabel: null,
		showMaxLabel: null,
		margin: 8,
		fontSize: 12,
		color: Q.color.axisLabel,
		textMargin: [0, 3]
	},
	splitLine: {
		show: !0,
		showMinLine: !0,
		showMaxLine: !0,
		lineStyle: {
			color: Q.color.axisSplitLine,
			width: 1,
			type: "solid"
		}
	},
	splitArea: {
		show: !1,
		areaStyle: { color: [Q.color.backgroundTint, Q.color.backgroundTransparent] }
	},
	breakArea: {
		show: !0,
		itemStyle: {
			color: Q.color.neutral00,
			borderColor: Q.color.border,
			borderWidth: 1,
			borderType: [3, 3],
			opacity: .6
		},
		zigzagAmplitude: 4,
		zigzagMinSpan: 4,
		zigzagMaxSpan: 20,
		zigzagZ: 100,
		expandOnClick: !0
	},
	breakLabelLayout: { moveOverlap: "auto" }
}, dA = D({
	boundaryGap: !0,
	deduplication: null,
	jitter: 0,
	jitterOverlap: !0,
	jitterMargin: 2,
	splitLine: { show: !1 },
	axisTick: {
		alignWithLabel: !1,
		interval: "auto",
		show: "auto"
	},
	axisLabel: { interval: "auto" }
}, uA), fA = D({
	boundaryGap: [0, 0],
	axisLine: { show: "auto" },
	axisTick: { show: "auto" },
	splitNumber: 5,
	minorTick: {
		show: !1,
		splitNumber: 5,
		length: 3,
		lineStyle: {}
	},
	minorSplitLine: {
		show: !1,
		lineStyle: {
			color: Q.color.axisMinorSplitLine,
			width: 1
		}
	}
}, uA), pA = {
	category: dA,
	value: fA,
	time: D({
		splitNumber: 6,
		axisLabel: { rich: { primary: { fontWeight: "bold" } } },
		splitLine: { show: !1 }
	}, fA),
	log: j({ logBase: 10 }, fA)
};
//#endregion
//#region node_modules/echarts/lib/coord/axisModelCreator.js
function mA(e, t, n, i) {
	F($y, function(a, o) {
		var s = D(D({}, pA[o], !0), i, !0), c = function(e) {
			r(n, e);
			function n() {
				var n = e !== null && e.apply(this, arguments) || this;
				return n.type = t + "Axis." + o, n;
			}
			return n.prototype.mergeDefaultAndTheme = function(e, t) {
				var n = Kg(this), r = n ? Jg(e) : {};
				D(e, t.getTheme().get(o + "Axis")), D(e, this.getDefaultOption()), e.type = hA(e), n && qg(e, r, n);
			}, n.prototype.optionUpdated = function() {
				this.option.type === "category" && (this.__ordinalMeta = iy.createByAxisModel(this));
			}, n.prototype.getCategories = function(e) {
				var t = this.option;
				if (t.type === "category") return e ? t.data : this.__ordinalMeta.categories;
			}, n.prototype.getOrdinalMeta = function() {
				return this.__ordinalMeta;
			}, n.prototype.updateAxisBreaks = function(e) {
				var t = aS();
				return t ? t.updateModelAxisBreak(this, e) : { breaks: [] };
			}, n.type = t + "Axis." + o, n.defaultOption = s, n;
		}(n);
		e.registerComponentModel(c);
	}), e.registerSubTypeDefaulter(t + "Axis", hA);
}
function hA(e) {
	return e.type || (e.data ? "category" : "value");
}
//#endregion
//#region node_modules/echarts/lib/coord/cartesian/Cartesian.js
var gA = function() {
	function e(e) {
		this.type = "cartesian", this._dimList = [], this._axes = {}, this.name = e || "";
	}
	return e.prototype.getAxis = function(e) {
		return this._axes[e];
	}, e.prototype.getAxes = function() {
		return I(this._dimList, function(e) {
			return this._axes[e];
		}, this);
	}, e.prototype.getAxesByScale = function(e) {
		return e = e.toLowerCase(), L(this.getAxes(), function(t) {
			return t.scale.type === e;
		});
	}, e.prototype.addAxis = function(e) {
		var t = e.dim;
		this._axes[t] = e, this._dimList.push(t);
	}, e;
}(), _A = ["x", "y"];
function vA(e) {
	return (e.type === "interval" || e.type === "time") && !Gh(e);
}
var yA = function(e) {
	r(t, e);
	function t() {
		var t = e !== null && e.apply(this, arguments) || this;
		return t.type = yC, t.dimensions = _A, t;
	}
	return t.prototype.calcAffineTransform = function() {
		this._transform = this._invTransform = null;
		var e = this.getAxis("x").scale, t = this.getAxis("y").scale;
		if (!(!vA(e) || !vA(t))) {
			var n = dy(e, null), r = dy(t, null), i = this.dataToPoint([n[0], r[0]]), a = this.dataToPoint([n[1], r[1]]), o = n[1] - n[0], s = r[1] - r[0];
			if (!(!o || !s)) {
				var c = (a[0] - i[0]) / o, l = (a[1] - i[1]) / s, u = i[0] - n[0] * c, d = i[1] - r[0] * l, f = this._transform = [
					c,
					0,
					0,
					l,
					u,
					d
				];
				this._invTransform = ct([], f);
			}
		}
	}, t.prototype.getBaseAxis = function() {
		return this.getAxesByScale("ordinal")[0] || this.getAxesByScale("time")[0] || this.getAxis("x");
	}, t.prototype.containPoint = function(e) {
		var t = this.getAxis("x"), n = this.getAxis("y");
		return t.contain(t.toLocalCoord(e[0])) && n.contain(n.toLocalCoord(e[1]));
	}, t.prototype.containData = function(e) {
		return this.getAxis("x").containData(e[0]) && this.getAxis("y").containData(e[1]);
	}, t.prototype.containZone = function(e, t) {
		var n = this.dataToPoint(e), r = this.dataToPoint(t), i = this.getArea(), a = new Y(n[0], n[1], r[0] - n[0], r[1] - n[1]);
		return i.intersect(a);
	}, t.prototype.dataToPoint = function(e, t, n) {
		n ||= [];
		var r = e[0], i = e[1];
		if (this._transform && r != null && isFinite(r) && i != null && isFinite(i)) return Ct(n, e, this._transform);
		var a = this.getAxis("x"), o = this.getAxis("y");
		return n[0] = a.toGlobalCoord(a.dataToCoord(r, t)), n[1] = o.toGlobalCoord(o.dataToCoord(i, t)), n;
	}, t.prototype.clampData = function(e, t) {
		var n = this.getAxis("x").scale, r = this.getAxis("y").scale, i = n.getExtent(), a = r.getExtent(), o = n.parse(e[0]), s = r.parse(e[1]);
		return t ||= [], t[0] = Math.min(Math.max(Math.min(i[0], i[1]), o), Math.max(i[0], i[1])), t[1] = Math.min(Math.max(Math.min(a[0], a[1]), s), Math.max(a[0], a[1])), t;
	}, t.prototype.pointToData = function(e, t, n) {
		if (n ||= [], this._invTransform) return Ct(n, e, this._invTransform);
		var r = this.getAxis("x"), i = this.getAxis("y");
		return n[0] = r.coordToData(r.toLocalCoord(e[0]), t), n[1] = i.coordToData(i.toLocalCoord(e[1]), t), n;
	}, t.prototype.getOtherAxis = function(e) {
		return this.getAxis(e.dim === "x" ? "y" : "x");
	}, t.prototype.getArea = function(e) {
		e ||= 0;
		var t = this.getAxis("x").getGlobalExtent(), n = this.getAxis("y").getGlobalExtent(), r = Math.min(t[0], t[1]) - e, i = Math.min(n[0], n[1]) - e;
		return new Y(r, i, Math.max(t[0], t[1]) - r + e, Math.max(n[0], n[1]) - i + e);
	}, t;
}(gA);
//#endregion
//#region node_modules/echarts/lib/coord/axisAlignTicks.js
function bA(e, t) {
	var n = e.scale, r = e.model, i = oC(n, r, r.ecModel, e, null), a = by(n), o = by(t) ? t.intervalStub : t, s = a ? n.intervalStub : n, c = n.base, l = o.getTicks(), u = o.getTicks({ expandToNicedExtent: !0 }), d = l.length - 1, f, p, m;
	if (d === 1) f = p = 0, m = 1;
	else if (d === 2) {
		var h = rs(l[0].value - l[1].value), g = rs(l[1].value - l[2].value);
		f = p = 0, h === g ? m = 2 : (m = 1, h < g ? f = h / g : p = g / h);
	} else {
		var _ = o.getConfig().interval;
		f = (1 - (l[0].value - u[0].value) / _) % 1, p = (1 - (u[d].value - l[d].value) / _) % 1, m = d - +!!f - !!p;
	}
	var v = i.zoomFixMM, y = v[0] || v[1], b = [i.fixMM[0] || y, i.fixMM[1] || y], x = n.getExtent(), S = s.getExtent(), C = Ey(S, b), w, T, E, D, O, k;
	function A(e) {
		for (var t = 50, n = 0; n < t && !e(); n++) E = a ? E * ns(c, 2) : Sy(E), D = Cy(E);
	}
	function j() {
		w = vs(k - E * f, D);
	}
	function M() {
		T = vs(O + E * p, D);
	}
	function ee() {
		k = f ? vs(w + E * f, D) : w;
	}
	function N() {
		O = p ? vs(T - E * p, D) : T;
	}
	if (b[0] && b[1]) {
		w = C[0], T = C[1], E = (T - w) / (m + f + p);
		var P = e.getExtent(), F = rs(P[1] - P[0]);
		D = Ss([T, w], F, .5 / m), ee(), N(), Ls(D) && (E = vs(E, D));
	} else {
		var I = C[1] - C[0];
		E = a ? ns(ks(I), 1) : js(I / m, 2), D = Cy(E), b[0] ? (w = C[0], A(function() {
			if (ee(), O = vs(k + E * m, D), M(), T >= C[1]) return !0;
		})) : b[1] ? (T = C[1], A(function() {
			if (N(), k = vs(O - E * m, D), j(), w <= C[0]) return !0;
		})) : A(function() {
			k = vs(os(C[0] / E) * E, D), O = vs(as(C[1] / E) * E, D);
			var e = is((O - k) / E);
			if (e <= m) {
				var t = m - e, n = void 0, r = i.incl0 || a;
				if (r && C[0] === 0) n = [0, t];
				else if (r && C[1] === 0) n = [t, 0];
				else {
					var o = as(t / 2);
					n = t % 2 == 0 ? [o, o] : w + T < C[0] + C[1] ? [o, o + 1] : [o + 1, o];
				}
				if (k = vs(k - E * n[0], D), O = vs(O + E * n[1], D), j(), M(), w <= C[0] && T >= C[1]) return !0;
			}
		});
	}
	hb(n, b, S, [w, T], x, {
		interval: E,
		intervalCount: m,
		intervalPrecision: D,
		niceExtent: [k, O]
	});
}
//#endregion
//#region node_modules/echarts/lib/coord/axisNiceTicks.js
function xA(e, t) {
	var n = by(e), r = n ? e.intervalStub : e, i = t.fixMinMax || [], a = n ? e.getExtent() : null, o = r.getExtent(), s = Ey(o, i, t.rawExtentResult);
	r.setExtent(s[0], s[1]), s = r.getExtent();
	var c = n ? CA(r, t) : SA(r, t), l = c.intervalPrecision, u = c.interval, d = t.userInterval;
	d != null && (c.interval = d, c.intervalPrecision = Cy(d)), i[0] || (s[0] = vs(as(s[0] / u) * u, l)), i[1] || (s[1] = vs(os(s[1] / u) * u, l)), d != null && (c.niceExtent = s.slice()), hb(e, i, o, s, a, c);
}
function SA(e, t) {
	var n = Oy(t.splitNumber, 5), r = py(e), i = t.minInterval, a = t.maxInterval, o = js(r / n, !0);
	i != null && o < i && (o = i), a != null && o > a && (o = a);
	var s = Cy(o), c = e.getExtent(), l = [vs(os(c[0] / o) * o, s), vs(as(c[1] / o) * o, s)];
	return {
		interval: o,
		intervalPrecision: s,
		niceExtent: l
	};
}
function CA(e, t) {
	var n = Oy(t.splitNumber, 10), r = e.getExtent(), i = py(e), a = ns(ks(i), 1);
	n / i * a <= .5 && (a *= 10);
	var o = Cy(a), s = [vs(os(r[0] / a) * a, o), vs(as(r[1] / a) * a, o)];
	return {
		intervalPrecision: o,
		interval: a,
		niceExtent: s
	};
}
function wA(e) {
	var t = e.scale, n = e.model, r = n.axis, i = n.ecModel;
	TA(t, n, r, i, null);
}
function TA(e, t, n, r, i) {
	var a = oC(e, t, r, n, i), o = vy(e) || yy(e);
	EA(e, {
		splitNumber: t.get("splitNumber"),
		fixMinMax: a.fixMM,
		userInterval: t.get("interval"),
		minInterval: o ? t.get("minInterval") : null,
		maxInterval: o ? t.get("maxInterval") : null,
		rawExtentResult: a
	}), n && r && cC(n, e, a, r);
}
function EA(e, t) {
	DA[e.type](e, t);
}
var DA = {
	interval: xA,
	log: xA,
	time: Gy,
	ordinal: Ee
}, OA = [[3, 1], [0, 2]], kA = function() {
	function e(e, t, n) {
		this.type = "grid", this._coordsMap = {}, this._coordsList = [], this._axesMap = {}, this._axesList = [], this.axisPointerEnabled = !0, this.dimensions = _A, this._initCartesian(e, t, n), this.model = e;
	}
	return e.prototype.getRect = function() {
		return this._rect;
	}, e.prototype.update = function(e, t) {
		var n = this._axesMap;
		F(this._axesList, function(e) {
			eC(e, 1);
			var t = e.scale;
			xy(t) && t.setSortInfo(e.model.get("categorySortInfo"));
		});
		function r(e) {
			for (var t = R(e), n = [], r = t.length - 1; r >= 0; r--) {
				var i = e[+t[r]];
				i.__alignTo ? n.push(i) : wA(i);
			}
			F(n, function(e) {
				PA(e, e.__alignTo) ? wA(e) : bA(e, e.__alignTo.scale);
			});
		}
		r(n.x), r(n.y);
		var i = {};
		F(n.x, function(e) {
			jA(n, "y", e, i);
		}), F(n.y, function(e) {
			jA(n, "x", e, i);
		}), this.resize(this.model, t);
	}, e.prototype.resize = function(e, t, n) {
		var r = Gg(e, t), i = this._rect = Ug(e.getBoxLayoutParams(), r.refContainer), a = this._axesMap, o = this._coordsList, s = e.get("containLabel");
		if (IA(a, i), !n) {
			var c = BA(i, o, a, s, t), l = void 0;
			if (s) RA ? (RA(this._axesList, i), IA(a, i)) : l = zA(i.clone(), "axisLabel", null, i, a, c, r);
			else {
				var u = HA(e, i, r), d = u.outerBoundsRect, f = u.parsedOuterBoundsContain, p = u.outerBoundsClamp;
				d && (l = zA(d, f, p, i, a, c, r));
			}
			VA(i, a, Hb.determine, null, l, r), F(this._coordsList, function(e) {
				e.calcAffineTransform();
			});
		}
	}, e.prototype.getAxis = function(e, t) {
		var n = this._axesMap[e];
		if (n != null) return n[t || 0];
	}, e.prototype.getAxes = function() {
		return this._axesList.slice();
	}, e.prototype.getCartesian = function(e, t) {
		if (e != null && t != null) {
			var n = "x" + e + "y" + t;
			return this._coordsMap[n];
		}
		G(e) && (t = e.yAxisIndex, e = e.xAxisIndex);
		for (var r = 0, i = this._coordsList; r < i.length; r++) if (i[r].getAxis("x").index === e || i[r].getAxis("y").index === t) return i[r];
	}, e.prototype.getCartesians = function() {
		return this._coordsList.slice();
	}, e.prototype.convertToPixel = function(e, t, n) {
		var r = this._findConvertTarget(t);
		return r.cartesian ? r.cartesian.dataToPoint(n) : r.axis ? r.axis.toGlobalCoord(r.axis.dataToCoord(n)) : null;
	}, e.prototype.convertFromPixel = function(e, t, n) {
		var r = this._findConvertTarget(t);
		return r.cartesian ? r.cartesian.pointToData(n) : r.axis ? r.axis.coordToData(r.axis.toLocalCoord(n)) : null;
	}, e.prototype._findConvertTarget = function(e) {
		var t = e.seriesModel, n = e.xAxisModel || t && t.getReferringComponents("xAxis", gc).models[0], r = e.yAxisModel || t && t.getReferringComponents("yAxis", gc).models[0], i = e.gridModel, a = this._coordsList, o, s;
		return t ? (o = t.coordinateSystem, M(a, o) < 0 && (o = null)) : n && r ? o = this.getCartesian(n.componentIndex, r.componentIndex) : n ? s = this.getAxis("x", n.componentIndex) : r ? s = this.getAxis("y", r.componentIndex) : i && i.coordinateSystem === this && (o = this._coordsList[0]), {
			cartesian: o,
			axis: s
		};
	}, e.prototype.containPoint = function(e) {
		var t = this._coordsList[0];
		if (t) return t.containPoint(e);
	}, e.prototype._initCartesian = function(e, t, n) {
		var r = this, i = this, a = {
			left: !1,
			right: !1,
			top: !1,
			bottom: !1
		}, o = {
			x: {},
			y: {}
		}, s = {
			x: 0,
			y: 0
		};
		if (t.eachComponent("xAxis", c("x"), this), t.eachComponent("yAxis", c("y"), this), !s.x || !s.y) {
			this._axesMap = {}, this._axesList = [];
			return;
		}
		this._axesMap = o, F(o.x, function(t, n) {
			F(o.y, function(i, a) {
				var o = "x" + n + "y" + a, s = new yA(o);
				s.master = r, s.model = e, r._coordsMap[o] = s, r._coordsList.push(s), s.addAxis(t), s.addAxis(i);
			});
		}), NA(o.x), NA(o.y);
		function c(t) {
			return function(n, r) {
				if (AA(n, e)) {
					var c = n.get("position");
					t === "x" ? c !== "top" && c !== "bottom" && (c = a.bottom ? "top" : "bottom") : c !== "left" && c !== "right" && (c = a.left ? "right" : "left"), a[c] = !0;
					var l = tb(n), u = new Hx(t, nb(n, l, !0), [0, 0], l, c);
					u.onBand = _b(u.scale, n), u.inverse = n.get("inverse"), n.axis = u, u.model = n, u.grid = i, u.index = r, i._axesList.push(u), o[t][r] = u, s[t]++;
				}
			};
		}
	}, e.prototype.getTooltipAxes = function(e) {
		var t = [], n = [];
		return F(this.getCartesians(), function(r) {
			var i = e != null && e !== "auto" ? r.getAxis(e) : r.getBaseAxis(), a = r.getOtherAxis(i);
			M(t, i) < 0 && t.push(i), M(n, a) < 0 && n.push(a);
		}), {
			baseAxes: t,
			otherAxes: n
		};
	}, e.create = function(t, n) {
		var r = [];
		return t.eachComponent("grid", function(i, a) {
			var o = new e(i, t, n);
			o.name = "grid_" + a, o.resize(i, n, !0), i.coordinateSystem = o, r.push(o), F(o._axesList, function(t) {
				$S(t, e.dimIdxMap);
			});
		}), t.eachSeries(function(e) {
			var t, n;
			Xm({
				targetModel: e,
				coordSysType: yC,
				coordSysProvider: r
			});
			function r() {
				var r = HS(e), i = r.xAxisModel, a = r.yAxisModel;
				return t = i.axis, n = a.axis, i.getCoordSysModel().coordinateSystem.getCartesian(i.componentIndex, a.componentIndex);
			}
			t && n && (Ax(t, e, yC), Ax(n, e, yC));
		}, this), r;
	}, e.dimensions = _A, e.dimIdxMap = Sm(_A), e;
}();
function AA(e, t) {
	return e.getCoordSysModel() === t;
}
function jA(e, t, n, r) {
	n.getAxesOnZeroOf = function() {
		return a ? [a] : [];
	};
	var i = e[t], a, o = n.model, s = o.get(["axisLine", "onZero"]), c = o.get(["axisLine", "onZeroAxisIndex"]);
	if (!s) return;
	if (c != null) MA(s, i[c]) && (a = i[c]);
	else for (var l in i) if (Te(i, l) && MA(s, i[l]) && !r[u(i[l])]) {
		a = i[l];
		break;
	}
	a && (r[u(a)] = !0);
	function u(e) {
		return e.dim + "_" + e.index;
	}
}
function MA(e, t) {
	if (!t) return !1;
	var n = t.scale, r = rb(n, 0, !1), i = t && t.type !== "category" && t.type !== "time" && r !== 3;
	return i && e === "auto" && ab(t) && (i = !1), i;
}
function NA(e) {
	for (var t = R(e), n, r = [], i = t.length - 1; i >= 0; i--) {
		var a = e[+t[i]];
		_y(a.scale) && pb(a.model, a.type, !0) == null && (a.model.get("alignTicks") && a.model.get("interval") == null ? r.push(a) : n = a);
	}
	n ||= r.pop(), n && F(r, function(e) {
		e.__alignTo = n;
	});
}
function PA(e, t) {
	return Gh(e.scale) || Gh(t.scale) || t.scale.getTicks().length < 2;
}
function FA(e, t) {
	var n = e.getExtent(), r = n[0] + n[1];
	e.toGlobalCoord = e.dim === "x" ? function(e) {
		return e + t;
	} : function(e) {
		return r - e + t;
	}, e.toLocalCoord = e.dim === "x" ? function(e) {
		return e - t;
	} : function(e) {
		return r - e + t;
	};
}
function IA(e, t) {
	F(e.x, function(e) {
		return LA(e, t.x, t.width);
	}), F(e.y, function(e) {
		return LA(e, t.y, t.height);
	});
}
function LA(e, t, n) {
	var r = [0, n], i = +!!e.inverse;
	e.setExtent(r[i], r[1 - i]), FA(e, t);
}
var RA;
function zA(e, t, n, r, i, a, o) {
	VA(r, i, Hb.estimate, t, !1, o);
	var s = [
		0,
		0,
		0,
		0
	];
	l(0), l(1), u(r, 0, NaN), u(r, 1, NaN);
	var c = ne(s, function(e) {
		return e > 0;
	}) == null;
	return vf(r, s, !0, !0, n), IA(i, r), c;
	function l(e) {
		F(i[Ud[e]], function(t) {
			if (fb(t.model)) {
				var n = a.ensureRecord(t.model), r = n.labelInfoList;
				if (r) for (var i = 0; i < r.length; i++) {
					var o = r[i], s = t.scale.normalize(gb(t.scale, uS(o.label).labelInfo.tick));
					s = e === 1 ? 1 - s : s, u(o.rect, e, s), u(o.rect, 1 - e, NaN);
				}
				var c = n.nameLayout;
				if (c) {
					var s = db(n.nameLocation) ? .5 : NaN;
					u(c.rect, e, s), u(c.rect, 1 - e, NaN);
				}
			}
		});
	}
	function u(t, n, r) {
		var i = e[Ud[n]] - t[Ud[n]], a = t[Wd[n]] + t[Ud[n]] - (e[Wd[n]] + e[Ud[n]]);
		i = d(i, 1 - r), a = d(a, r);
		var o = OA[n][0], c = OA[n][1];
		s[o] = ns(s[o], i), s[c] = ns(s[c], a);
	}
	function d(e, t) {
		return e > 0 && !le(t) && t > 1e-4 && (e /= t), e;
	}
}
function BA(e, t, n, r, i) {
	var a = new fS(UA);
	return F(n, function(n) {
		return F(n, function(n) {
			if (fb(n.model)) {
				var o = !r;
				n.axisBuilder = US(e, t, n.model, i, a, o);
			}
		});
	}), a;
}
function VA(e, t, n, r, i, a) {
	var o = n === Hb.determine;
	F(t, function(t) {
		return F(t, function(t) {
			fb(t.model) && (WS(t.axisBuilder, e, t.model), t.axisBuilder.build(o ? { axisTickLabelDetermine: !0 } : { axisTickLabelEstimate: !0 }, { noPxChange: i }));
		});
	});
	var s = {
		x: 0,
		y: 0
	};
	c(0), c(1);
	function c(t) {
		s[Ud[1 - t]] = e[Wd[t]] <= a.refContainer[Wd[t]] * .5 ? 0 : 1 - t == 1 ? 2 : 1;
	}
	F(t, function(e, t) {
		return F(e, function(e) {
			fb(e.model) && ((r === "all" || o) && e.axisBuilder.build({ axisName: !0 }, { nameMarginLevel: s[t] }), o && e.axisBuilder.build({ axisLine: !0 }));
		});
	});
}
function HA(e, t, n) {
	var r, i = e.get("outerBoundsMode", !0);
	i === "same" ? r = t.clone() : (i == null || i === "auto") && (r = Ug(e.get("outerBounds", !0) || _C, n.refContainer));
	var a = e.get("outerBoundsContain", !0), o = a == null || a === "auto" || M(["all", "axisLabel"], a) < 0 ? "all" : a, s = [hs(K(e.get("outerBoundsClampWidth", !0), vC[0]), t.width), hs(K(e.get("outerBoundsClampHeight", !0), vC[1]), t.height)];
	return {
		outerBoundsRect: r,
		parsedOuterBoundsContain: o,
		outerBoundsClamp: s
	};
}
var UA = function(e, t, n, r, i, a) {
	var o = n.axis.dim === "x" ? "y" : "x";
	gS(e, t, n, r, i, a), db(e.nameLocation) || F(t.recordMap[o], function(e) {
		e && e.labelInfoList && e.dirVec && vS(e.labelInfoList, e.dirVec, r, i);
	});
};
//#endregion
//#region node_modules/echarts/lib/component/axisPointer/modelHelper.js
function WA(e, t) {
	var n = {
		axesInfo: {},
		seriesInvolved: !1,
		coordSysAxesInfo: {},
		coordSysMap: {}
	};
	return GA(n, e, t), n.seriesInvolved && qA(n, e), n;
}
function GA(e, t, n) {
	var r = t.getComponent("tooltip"), i = t.getComponent("axisPointer"), a = i.get("link", !0) || [], o = [];
	F(n.getCoordinateSystems(), function(n) {
		if (!n.axisPointerEnabled) return;
		var s = ej(n.model), c = e.coordSysAxesInfo[s] = {};
		e.coordSysMap[s] = n;
		var l = n.model.getModel("tooltip", r);
		if (F(n.getAxes(), B(p, !1, null)), n.getTooltipAxes && r && l.get("show")) {
			var u = l.get("trigger") === "axis", d = l.get(["axisPointer", "type"]) === "cross", f = n.getTooltipAxes(l.get(["axisPointer", "axis"]));
			(u || d) && F(f.baseAxes, B(p, !d || "cross", u)), d && F(f.otherAxes, B(p, "cross", !1));
		}
		function p(r, s, u) {
			var d = u.model.getModel("axisPointer", i), f = d.get("show");
			if (!(!f || f === "auto" && !r && !$A(d))) {
				s ??= d.get("triggerTooltip"), d = r ? KA(u, l, i, t, r, s) : d;
				var p = d.get("snap"), m = d.get("triggerEmphasis"), h = ej(u.model), g = s || p || u.type === "category", _ = e.axesInfo[h] = {
					key: h,
					axis: u,
					coordSys: n,
					axisPointerModel: d,
					triggerTooltip: s,
					triggerEmphasis: m,
					involveSeries: g,
					snap: p,
					useHandle: $A(d),
					seriesModels: [],
					linkGroup: null
				};
				c[h] = _, e.seriesInvolved = e.seriesInvolved || g;
				var v = JA(a, u);
				if (v != null) {
					var y = o[v] || (o[v] = { axesInfo: {} });
					y.axesInfo[h] = _, y.mapper = a[v].mapper, _.linkGroup = y;
				}
			}
		}
	});
}
function KA(e, t, n, r, i, a) {
	var o = t.getModel("axisPointer"), s = [
		"type",
		"snap",
		"lineStyle",
		"shadowStyle",
		"label",
		"animation",
		"animationDurationUpdate",
		"animationEasingUpdate",
		"z"
	], c = {};
	F(s, function(e) {
		c[e] = E(o.get(e));
	}), c.snap = e.type !== "category" && !!a, o.get("type") === "cross" && (c.type = "line");
	var l = c.label ||= {};
	if (l.show ??= !1, i === "cross" && (l.show = o.get(["label", "show"]) ?? !0, !a)) {
		var u = c.lineStyle = o.get("crossStyle");
		u && j(l, u.textStyle);
	}
	return e.model.getModel("axisPointer", new lp(c, n, r));
}
function qA(e, t) {
	t.eachSeries(function(t) {
		var n = t.coordinateSystem, r = t.get(["tooltip", "trigger"], !0), i = t.get(["tooltip", "show"], !0);
		!n || !n.model || r === "none" || r === !1 || r === "item" || i === !1 || t.get(["axisPointer", "show"], !0) === !1 || F(e.coordSysAxesInfo[ej(n.model)], function(e) {
			var r = e.axis;
			n.getAxis(r.dim) === r && (e.seriesModels.push(t), e.seriesDataCount ??= 0, e.seriesDataCount += t.getData().count());
		});
	});
}
function JA(e, t) {
	for (var n = t.model, r = t.dim, i = 0; i < e.length; i++) {
		var a = e[i] || {};
		if (YA(a[r + "AxisId"], n.id) || YA(a[r + "AxisIndex"], n.componentIndex) || YA(a[r + "AxisName"], n.name)) return i;
	}
}
function YA(e, t) {
	return e === "all" || V(e) && M(e, t) >= 0 || e === t;
}
function XA(e) {
	var t = ZA(e);
	if (t) {
		var n = t.axisPointerModel, r = t.axis.scale, i = n.option, a = n.get("status"), o = n.get("value");
		o != null && (o = r.parse(o));
		var s = $A(n);
		a ?? (i.status = s ? "show" : "hide");
		var c = r.getExtent();
		(o == null || o > c[1]) && (o = c[1]), o < c[0] && (o = c[0]), i.value = o, s && (i.status = t.axis.scale.isBlank() ? "hide" : "show");
	}
}
function ZA(e) {
	var t = (e.ecModel.getComponent("axisPointer") || {}).coordSysAxesInfo;
	return t && t.axesInfo[ej(e)];
}
function QA(e) {
	var t = ZA(e);
	return t && t.axisPointerModel;
}
function $A(e) {
	return !!e.get(["handle", "show"]);
}
function ej(e) {
	return e.type + "||" + e.id;
}
//#endregion
//#region node_modules/echarts/lib/component/axis/AxisView.js
var tj = {}, nj = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.render = function(t, n, r, i) {
		this.axisPointerClass && XA(t), e.prototype.render.apply(this, arguments), this._doUpdateAxisPointerClass(t, r, !0);
	}, t.prototype.updateAxisPointer = function(e, t, n, r) {
		this._doUpdateAxisPointerClass(e, n, !1);
	}, t.prototype.remove = function(e, t) {
		var n = this._axisPointer;
		n && n.remove(t);
	}, t.prototype.dispose = function(t, n) {
		this._disposeAxisPointer(n), e.prototype.dispose.apply(this, arguments);
	}, t.prototype._doUpdateAxisPointerClass = function(e, n, r) {
		var i = t.getAxisPointerClass(this.axisPointerClass);
		if (i) {
			var a = QA(e);
			a ? (this._axisPointer ||= new i()).render(e, a, n, r) : this._disposeAxisPointer(n);
		}
	}, t.prototype._disposeAxisPointer = function(e) {
		this._axisPointer && this._axisPointer.dispose(e), this._axisPointer = null;
	}, t.registerAxisPointerClass = function(e, t) {
		tj[e] = t;
	}, t.getAxisPointerClass = function(e) {
		return e && tj[e];
	}, t.type = "axis", t;
}(zE), rj = X();
function ij(e, t, n, r) {
	var i = n.axis;
	if (!i.scale.isBlank()) {
		var a = n.getModel("splitArea"), o = a.getModel("areaStyle"), s = o.get("color"), c = r.coordinateSystem.getRect(), l = i.getTicksCoords({
			tickModel: a,
			breakTicks: "none",
			pruneByBreak: "preserve_extent_bound"
		});
		if (l.length) {
			var u = s.length, d = rj(e).splitAreaColors, f = q(), p = 0;
			if (d) for (var m = 0; m < l.length; m++) {
				var h = d.get(l[m].tickValue);
				if (h != null) {
					p = (h + (u - 1) * m) % u;
					break;
				}
			}
			var g = i.toGlobalCoord(l[0].coord), _ = o.getAreaStyle();
			s = V(s) ? s : [s];
			for (var m = 1; m < l.length; m++) {
				var v = i.toGlobalCoord(l[m].coord), y = void 0, b = void 0, x = void 0, S = void 0;
				i.isHorizontal() ? (y = g, b = c.y, x = v - y, S = c.height, g = y + x) : (y = c.x, b = g, x = c.width, S = v - b, g = b + S);
				var C = l[m - 1].tickValue;
				C != null && f.set(C, p), t.add(new No({
					anid: C == null ? null : "area_" + C,
					shape: {
						x: y,
						y: b,
						width: x,
						height: S
					},
					style: j({ fill: s[p] }, _),
					autoBatch: !0,
					silent: !0
				})), p = (p + 1) % u;
			}
			rj(e).splitAreaColors = f;
		}
	}
}
function aj(e) {
	rj(e).splitAreaColors = null;
}
//#endregion
//#region node_modules/echarts/lib/component/axis/CartesianAxisView.js
var oj = [
	"splitArea",
	"splitLine",
	"minorSplitLine",
	"breakArea"
], sj = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n.axisPointerClass = "CartesianAxisPointer", n;
	}
	return t.prototype.render = function(t, n, r, i) {
		this.group.removeAll();
		var a = this._axisGroup;
		this._axisGroup = new ju(), this.group.add(this._axisGroup), fb(t) && (this._axisGroup.add(t.axis.axisBuilder.group), F(oj, function(e) {
			t.get([e, "show"]) && cj[e](this, this._axisGroup, t, t.getCoordSysModel(), r);
		}, this), i && i.type === "changeAxisOrder" && i.isInitSort || uf(a, this._axisGroup, t), e.prototype.render.call(this, t, n, r, i));
	}, t.prototype.remove = function() {
		aj(this);
	}, t.type = "cartesianAxis", t;
}(nj), cj = {
	splitLine: function(e, t, n, r, i) {
		var a = n.axis;
		if (!a.scale.isBlank()) {
			var o = n.getModel("splitLine"), s = o.getModel("lineStyle"), c = s.get("color"), l = o.get("showMinLine") !== !1, u = o.get("showMaxLine") !== !1;
			c = V(c) ? c : [c];
			for (var d = r.coordinateSystem.getRect(), f = a.isHorizontal(), p = 0, m = a.getTicksCoords({
				tickModel: o,
				breakTicks: "none",
				pruneByBreak: "preserve_extent_bound"
			}), h = [], g = [], _ = s.getLineStyle(), v = 0; v < m.length; v++) {
				var y = a.toGlobalCoord(m[v].coord);
				if (!(v === 0 && !l || v === m.length - 1 && !u)) {
					var b = m[v].tickValue;
					f ? (h[0] = y, h[1] = d.y, g[0] = y, g[1] = d.y + d.height) : (h[0] = d.x, h[1] = y, g[0] = d.x + d.width, g[1] = y);
					var x = p++ % c.length, S = new ld({
						anid: b == null ? null : "line_" + b,
						autoBatch: !0,
						shape: {
							x1: h[0],
							y1: h[1],
							x2: g[0],
							y2: g[1]
						},
						style: j({ stroke: c[x] }, _),
						silent: !0
					});
					tf(S.shape, _.lineWidth), t.add(S);
				}
			}
		}
	},
	minorSplitLine: function(e, t, n, r, i) {
		var a = n.axis, o = n.getModel("minorSplitLine").getModel("lineStyle"), s = r.coordinateSystem.getRect(), c = a.isHorizontal(), l = a.getMinorTicksCoords();
		if (l.length) for (var u = [], d = [], f = o.getLineStyle(), p = 0; p < l.length; p++) for (var m = 0; m < l[p].length; m++) {
			var h = a.toGlobalCoord(l[p][m].coord);
			c ? (u[0] = h, u[1] = s.y, d[0] = h, d[1] = s.y + s.height) : (u[0] = s.x, u[1] = h, d[0] = s.x + s.width, d[1] = h);
			var g = new ld({
				anid: "minor_line_" + l[p][m].tickValue,
				autoBatch: !0,
				shape: {
					x1: u[0],
					y1: u[1],
					x2: d[0],
					y2: d[1]
				},
				style: f,
				silent: !0
			});
			tf(g.shape, f.lineWidth), t.add(g);
		}
	},
	splitArea: function(e, t, n, r, i) {
		ij(e, t, n, r);
	},
	breakArea: function(e, t, n, r, i) {
		var a = aS(), o = n.axis.scale;
		a && o.type !== "ordinal" && a.rectCoordBuildBreakAxis(t, e, n, r.coordinateSystem.getRect(), i);
	}
}, lj = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.type = "xAxis", t;
}(sj), uj = function(e) {
	r(t, e);
	function t() {
		var t = e !== null && e.apply(this, arguments) || this;
		return t.type = lj.type, t;
	}
	return t.type = "yAxis", t;
}(sj), dj = function(e) {
	r(t, e);
	function t() {
		var t = e !== null && e.apply(this, arguments) || this;
		return t.type = "grid", t;
	}
	return t.prototype.render = function(e, t) {
		this.group.removeAll(), e.get("show") && this.group.add(new No({
			shape: e.coordinateSystem.getRect(),
			style: j({ fill: e.get("backgroundColor") }, e.getItemStyle()),
			silent: !0,
			z2: -1
		}));
	}, t.type = "grid", t;
}(zE), fj = { offset: 0 };
function pj(e) {
	e.registerComponentView(dj), e.registerComponentModel(bC), e.registerCoordinateSystem("cartesian2d", kA), mA(e, "x", lA, fj), mA(e, "y", lA, fj), e.registerComponentView(lj), e.registerComponentView(uj), e.registerPreprocessor(function(e) {
		e.xAxis && e.yAxis && !e.grid && (e.grid = {});
	});
}
//#endregion
//#region node_modules/echarts/lib/component/helper/interactionMutex.js
var mj = X();
function hj(e, t) {
	return !!mj(e)[t];
}
Yk({
	type: "takeGlobalCursor",
	event: "globalCursorTaken",
	update: "update"
}, Ee);
//#endregion
//#region node_modules/echarts/lib/component/helper/cursorHelper.js
var gj = {
	axisPointer: 1,
	tooltip: 1,
	brush: 1
};
function _j(e, t, n) {
	var r = t.getComponentByElement(e.topTarget);
	if (!r || r === n || gj.hasOwnProperty(r.mainType)) return !1;
	var i = r.coordinateSystem;
	if (!i || i.model === n) return !1;
	var a = Of(r), o = Of(n);
	return !((a.zlevel - o.zlevel || a.z - o.z) <= 0);
}
//#endregion
//#region node_modules/echarts/lib/component/helper/RoamController.js
var vj = function(e) {
	r(t, e);
	function t(t) {
		var n = e.call(this) || this;
		n._zr = t;
		var r = z(n._mousedownHandler, n), i = z(n._mousemoveHandler, n), a = z(n._mouseupHandler, n), o = z(n._mousewheelHandler, n), s = z(n._pinchHandler, n);
		return n.enable = function(e, n) {
			var c = n.zInfo, l = Of(c.component), u = l.z, d = l.zlevel, f = {
				component: c.component,
				z: u,
				zlevel: d,
				z2: K(c.z2, -Infinity)
			}, p = k({}, n.triggerInfo);
			this._opt = j(k({}, n), {
				zoomOnMouseWheel: !0,
				moveOnMouseMove: !0,
				moveOnMouseWheel: !1,
				preventDefaultMouseMove: !0,
				zInfoParsed: f,
				triggerInfo: p,
				cursorGrab: "grab",
				cursorGrabbing: "grabbing"
			}), e ??= !0, (!this._enabled || this._controlType !== e) && (this.disable(), this._enabled = !0, (e === !0 || e === "move" || e === "pan") && (Sj(t, "mousedown", r, f), Sj(t, "mousemove", i, f), Sj(t, "mouseup", a, f)), (e === !0 || e === "scale" || e === "zoom") && (Sj(t, "mousewheel", o, f), Sj(t, "pinch", s, f)));
		}, n.disable = function() {
			this._enabled && (this._enabled = !1, Cj(t, "mousedown", r), Cj(t, "mousemove", i), Cj(t, "mouseup", a), Cj(t, "mousewheel", o), Cj(t, "pinch", s));
		}, n;
	}
	return t.prototype.isDragging = function() {
		return this._dragging;
	}, t.prototype.isPinching = function() {
		return this._pinching;
	}, t.prototype._checkPointer = function(e, t, n) {
		var r = this._opt, i = r.zInfoParsed;
		if (_j(e, r.api, i.component)) return !1;
		var a = r.triggerInfo, o = a.roamTrigger, s = !1;
		return o === "global" && (s = !0), s ||= a.isInSelf(e, t, n), s && a.isInClip && !a.isInClip(e, t, n) && (s = !1), s;
	}, t.prototype._decideCursorStyle = function(e, t, n, r) {
		var i = e.target;
		if (!i && this._checkPointer(e, t, n)) return this._opt.cursorGrab;
		if (r) return i && i.cursor || "default";
	}, t.prototype.dispose = function() {
		this.disable();
	}, t.prototype._mousedownHandler = function(e) {
		if (!(Pw(e) || yj(e))) {
			for (var t = e.target; t;) {
				if (t.draggable) return;
				t = t.__hostTarget || t.parent;
			}
			var n = e.offsetX, r = e.offsetY;
			this._checkPointer(e, n, r) && (this._x = n, this._y = r, this._dragging = !0);
		}
	}, t.prototype._mousemoveHandler = function(e) {
		var t = this._zr;
		if (!(e.gestureEvent === "pinch" || hj(t, "globalPan") || yj(e))) {
			var n = e.offsetX, r = e.offsetY;
			if (!this._dragging || !Dj("moveOnMouseMove", e, this._opt)) {
				var i = this._decideCursorStyle(e, n, r, !1);
				i && t.setCursorStyle(i);
				return;
			}
			t.setCursorStyle(this._opt.cursorGrabbing);
			var a = this._x, o = this._y, s = n - a, c = r - o;
			this._x = n, this._y = r, this._opt.preventDefaultMouseMove && Nw(e.event), e.__ecRoamConsumed = !0, Ej(this, "pan", "moveOnMouseMove", e, {
				dx: s,
				dy: c,
				oldX: a,
				oldY: o,
				newX: n,
				newY: r,
				isAvailableBehavior: null
			});
		}
	}, t.prototype._mouseupHandler = function(e) {
		if (!yj(e)) {
			var t = this._zr;
			if (!Pw(e)) {
				this._dragging = !1;
				var n = this._decideCursorStyle(e, e.offsetX, e.offsetY, !0);
				n && t.setCursorStyle(n);
			}
		}
	}, t.prototype._mousewheelHandler = function(e) {
		if (!yj(e)) {
			var t = Dj("zoomOnMouseWheel", e, this._opt), n = Dj("moveOnMouseWheel", e, this._opt), r = e.wheelDelta, i = Math.abs(r), a = e.offsetX, o = e.offsetY;
			if (!(r === 0 || !t && !n)) {
				if (t) {
					var s = i > 3 ? 1.4 : i > 1 ? 1.2 : 1.1, c = r > 0 ? s : 1 / s;
					this._checkTriggerMoveZoom(this, "zoom", "zoomOnMouseWheel", e, {
						scale: c,
						originX: a,
						originY: o,
						isAvailableBehavior: null
					});
				}
				if (n) {
					var l = Math.abs(r), u = (r > 0 ? 1 : -1) * (l > 3 ? .4 : l > 1 ? .15 : .05);
					this._checkTriggerMoveZoom(this, "scrollMove", "moveOnMouseWheel", e, {
						scrollDelta: u,
						originX: a,
						originY: o,
						isAvailableBehavior: null
					});
				}
			}
		}
	}, t.prototype._pinchHandler = function(e) {
		if (!(hj(this._zr, "globalPan") || yj(e))) {
			var t = e.pinchScale > 1 ? 1.1 : 1 / 1.1;
			this._checkTriggerMoveZoom(this, "zoom", null, e, {
				scale: t,
				originX: e.pinchX,
				originY: e.pinchY,
				isAvailableBehavior: null
			});
		}
	}, t.prototype._checkTriggerMoveZoom = function(e, t, n, r, i) {
		e._checkPointer(r, i.originX, i.originY) && (Nw(r.event), r.__ecRoamConsumed = !0, Ej(e, t, n, r, i));
	}, t;
}(Ii);
function yj(e) {
	return e.__ecRoamConsumed;
}
var bj = X();
function xj(e) {
	var t = bj(e);
	return t.roam = t.roam || {}, t.uniform = t.uniform || {}, t;
}
function Sj(e, t, n, r) {
	for (var i = xj(e).roam, a = i[t] = i[t] || [], o = 0; o < a.length; o++) {
		var s = a[o].zInfoParsed;
		if ((s.zlevel - r.zlevel || s.z - r.z || s.z2 - r.z2) <= 0) break;
	}
	a.splice(o, 0, {
		listener: n,
		zInfoParsed: r
	}), wj(e, t);
}
function Cj(e, t, n) {
	for (var r = xj(e).roam[t] || [], i = 0; i < r.length; i++) if (r[i].listener === n) {
		r.splice(i, 1), r.length || Tj(e, t);
		return;
	}
}
function wj(e, t) {
	var n = xj(e);
	n.uniform[t] || e.on(t, n.uniform[t] = function(e) {
		var r = n.roam[t];
		if (r) for (var i = 0; i < r.length; i++) r[i].listener(e);
	});
}
function Tj(e, t) {
	var n = xj(e).uniform;
	n[t] && (e.off(t, n[t]), n[t] = null);
}
function Ej(e, t, n, r, i) {
	i.isAvailableBehavior = z(Dj, null, n, r), e.trigger(t, i);
}
function Dj(e, t, n) {
	var r = n[e];
	return !e || r && (!U(r) || t.event[r + "Key"]);
}
function Oj(e) {
	return e;
}
var kj = "view", Aj = function(e) {
	r(t, e);
	function t(t, n, r) {
		var i = e.call(this) || this;
		i.type = kj, i.dimensions = ["x", "y"];
		var a = Oj(i);
		a.invertY = t, a.lgCt = n, a.lgGeo = r;
		var o = a.trans = [];
		return o[0] = Un(), o[1] = Un(), o[2] = Un(), a.mtRaw = tt(), a.mtRawInv = tt(), a.mtOverall = tt(), a.mtOverallInv = tt(), a.zoom = 1, i;
	}
	return t.prototype.getBoundingRect = function() {
		return Mj(null, this);
	}, t.prototype.getViewRect = function() {
		return Nj(null, this);
	}, t.prototype.getRoamTransform = function() {
		return Hn(Oj(this).trans[1]);
	}, t.prototype.dataToPoint = function(e, t, n) {
		var r = t ? Oj(this).mtRaw : Oj(this).mtOverall;
		return n ||= [], r ? Ct(n, e, r) : ut(n, e);
	}, t.prototype.pointToData = function(e, t, n) {
		n ||= [];
		var r = Oj(this).mtOverallInv;
		return r ? Ct(n, e, r) : ut(n, e);
	}, t.prototype.convertToPixel = function(e, t, n) {
		var r = $j(t);
		return r === this ? r.dataToPoint(n) : null;
	}, t.prototype.convertFromPixel = function(e, t, n) {
		var r = $j(t);
		return r === this ? r.pointToData(n) : null;
	}, t.prototype.containPoint = function(e) {
		var t = Oj(this);
		return Ht(jj, t.dataRect), Wt(jj, jj, t.mtOverall), Gt(jj, e[0], e[1]);
	}, t.dimensions = ["x", "y"], t;
}(Vn), jj = Bt();
function Mj(e, t) {
	return Ht(e || Bt(), Oj(t).dataRect);
}
function Nj(e, t) {
	return Ht(e || Bt(), Oj(t).viewRect);
}
function Pj(e, t, n) {
	return Gn(e || Un(), Oj(t).trans[n]);
}
function Fj(e) {
	return !!(e.dataRect && e.viewRect);
}
function Ij(e, t, n, r) {
	r === 1 ? Xj(e, t.trans[0], n) : Gn(e, n);
}
function Lj(e, t, n) {
	Hn(n, Rj), it(Rj, Rj, t.mtRawInv), Nf(e, Rj);
}
var Rj = tt();
function zj(e, t) {
	var n = Oj(e);
	n.centerOption = t.getShallow("center");
	var r = n.zoomLimit = t.getShallow("scaleLimit");
	n.zoom = vM(t.getShallow("zoom") || 1, r) || 1, Fj(n) && Hj(n);
}
function Bj(e, t, n, r, i) {
	var a = Oj(e);
	a.dataRect = new Y(t, n, r, i), Fj(a) && Hj(a);
}
function Vj(e, t, n, r, i) {
	var a = Oj(e);
	a.viewRect = new Y(t, n, r, i), Fj(a) && Hj(a);
}
function Hj(e) {
	Uj(e), Kj(e), Jj(e);
}
function Uj(e) {
	var t = e.dataRect, n = e.viewRect, r = e.trans[0], i = e.invertY;
	i && (t = Ht(Gj, t), t.y = -t.y - t.height), Ut(Wj, t, n), Nf(r, Wj), i && (r.scaleY = -r.scaleY);
	var a = Hn(r, e.mtRaw);
	ct(e.mtRawInv, a);
}
var Wj = tt(), Gj = Bt();
function Kj(e) {
	var t = eM(e), n = dM(qj, e, e.centerOption) ? Ct(qj, qj, e.mtRaw) : t, r = e.zoom, i = e.trans[1];
	i.x = t[0] - r * n[0], i.y = t[1] - r * n[1], i.scaleX = i.scaleY = r;
}
var qj = [];
function Jj(e) {
	var t = e.trans, n = t[1], r = t[0], i = t[2];
	Xj(i, r, n);
	var a = Hn(i, e.mtOverall), o = ct(e.mtOverallInv, a);
	Yj(e, i, a, o), Yj(e.lgGeo, i, a, o);
}
function Yj(e, t, n, r) {
	e && (Gn(e, t), rt(e.transform ||= [], n), rt(e.invTransform ||= [], r));
}
function Xj(e, t, n) {
	Hn(t, Zj), Hn(n, Qj), it(Qj, Qj, Zj), Nf(e, Qj);
}
var Zj = tt(), Qj = tt();
function $j(e) {
	var t = e.seriesModel;
	return t ? t.coordinateSystem : null;
}
function eM(e) {
	var t = e.viewRect;
	return tM[0] = t.x + t.width / 2, tM[1] = t.y + t.height / 2, tM;
}
var tM = [];
function nM(e, t, n, r) {
	var i = Oj(n);
	i.syncBackEl = e, i.syncBackType = t, r ? Pd(e, Pj(null, n, t), r) : (Pj(e, n, t), e.dirty());
}
function rM(e, t, n, r) {
	var i = Oj(e), a = i.syncBackEl;
	a ? (a.stopAnimation(), Ij(iM, i, a, i.syncBackType)) : Gn(iM, i.trans[2]), Lj(aM, i, iM), r ? lM(iM, aM, i, r) : Gn(iM, aM), Lj(iM, i, iM), hM(i, t, n, iM);
}
var iM = Un(), aM = Un();
function oM(e, t, n) {
	var r = sM(t);
	r && (rM(r, t, n, e), zj(r, t));
}
function sM(e) {
	return e.__ownRoamView ? e.__ownRoamView() : null;
}
function cM(e, t, n, r) {
	n.setUpdatePayload(Mf(e));
	var i = tl(r, t);
	i && i.__updateOnOwnRoam && i.__updateOnOwnRoam(e, t, r);
}
function lM(e, t, n, r) {
	r.dx != null && r.dy != null && (e.x += r.dx, e.y += r.dy);
	var i = r.zoom;
	if (i != null) {
		var a = uM(t), o = vM(a * i, n.zoomLimit) / a;
		e.x -= (r.originX - e.x) * (o - 1), e.y -= (r.originY - e.y) * (o - 1), e.scaleX *= o, e.scaleY *= o;
	}
}
function uM(e) {
	return e.scaleX;
}
function dM(e, t, n) {
	var r = t.dataRect;
	if (!n) return !1;
	var i = t.lgCt;
	return i ? ft(e, ps(n[0], i.w), ps(n[1], i.h)) : r && ft(e, ps(n[0], r.width, r.x), ps(n[1], r.height, r.y)), !0;
}
function fM(e, t) {
	var n = e.centerOption, r = e.dataRect;
	return !n || e.lgCt ? t.slice() : [pM(0, t, n, r), pM(1, t, n, r)];
}
function pM(e, t, n, r) {
	return n && r && r[Wd[e]] && gs(n[e]) ? (t[e] - r[Ud[e]]) / r[Wd[e]] * 100 + "%" : t[e];
}
function mM(e, t) {
	return t && e && e.getShallow("legacyViewCoordSysCenterBase") ? {
		w: t.getWidth(),
		h: t.getHeight()
	} : null;
}
function hM(e, t, n, r) {
	var i = eM(e), a = uM(r), o = rs(a) > 1e-6;
	gM[0] = o ? (i[0] - r.x) / a : i[0], gM[1] = o ? (i[1] - r.y) / a : i[1], Ct(gM, gM, e.mtRawInv);
	var s = fM(e, gM);
	_M(t, s, a), F(n, function(e) {
		e !== t && _M(e, s.slice(), a);
	});
}
var gM = [];
function _M(e, t, n) {
	var r = e.option;
	r.center = t, r.zoom = n;
}
function vM(e, t) {
	if (t) {
		var n = t.min || 0, r = t.max || Infinity;
		e = Math.max(Math.min(r, e), n);
	}
	return e;
}
//#endregion
//#region node_modules/echarts/lib/component/helper/roamHelper.js
function yM(e, t, n, r, i, a, o, s) {
	if (!sM(e)) {
		n.disable();
		return;
	}
	n.enable(K(e.get("roam"), o), {
		api: t,
		zInfo: { component: e },
		triggerInfo: {
			roamTrigger: e.get("roamTrigger"),
			isInSelf: r,
			isInClip: function(e, t, n) {
				return !i || i.contain(t, n);
			}
		}
	});
	function c(n) {
		var r = e.mainType, i = Mf(j({ type: CM(r, e.subType, Qc) }, n));
		s && (i.componentType = r), i[r + "Id"] = e.id, t.dispatchAction(i);
	}
	n.off("pan").off("zoom").on("pan", function(e) {
		a && a("pan"), c({
			dx: e.dx,
			dy: e.dy
		});
	}).on("zoom", function(e) {
		a && a("zoom"), c({
			zoom: e.scale,
			originX: e.originX,
			originY: e.originY
		});
	});
}
function bM(e) {
	return function(t, n, r) {
		return xM.copy(e.getBoundingRect()), xM.applyTransform(e.getComputedTransform()), xM.contain(n, r);
	};
}
var xM = new Y(0, 0, 0, 0);
function SM(e, t, n) {
	var r = CM(t, n, Qc);
	e.registerAction({
		type: r,
		event: r,
		update: "none"
	}, function(e, r, i) {
		r.eachComponent(vc(e, t, n), function(t) {
			oM(e, t), cM(e, t, r, i);
		});
	});
}
function CM(e, t, n) {
	return (e === "series" ? t === "map" ? "geo" : t : e) + n;
}
function wM(e, t, n, r, i, a, o) {
	var s = new Aj(null, mM(e.ecModel, t));
	return Bj(s, n, r, i, a), o ? Vj(s, o.x, o.y, o.width, o.height) : Vj(s, n, r, i, a), zj(s, e), s;
}
//#endregion
//#region node_modules/echarts/lib/data/helper/linkSeriesData.js
var TM = X();
function EM(e) {
	var t = e.mainData, n = e.datas;
	n || (n = { main: t }, e.datasAttr = { main: "data" }), e.datas = e.mainData = null, NM(t, n, e), F(n, function(n) {
		F(t.TRANSFERABLE_METHODS, function(t) {
			n.wrapMethod(t, B(DM, e));
		});
	}), t.wrapMethod("cloneShallow", B(kM, e)), F(t.CHANGABLE_METHODS, function(n) {
		t.wrapMethod(n, B(OM, e));
	}), me(n[t.dataType] === t);
}
function DM(e, t) {
	if (MM(this)) {
		var n = k({}, TM(this).datas);
		n[this.dataType] = t, NM(t, n, e);
	} else PM(t, this.dataType, TM(this).mainData, e);
	return t;
}
function OM(e, t) {
	return e.struct && e.struct.update(), t;
}
function kM(e, t) {
	return F(TM(t).datas, function(n, r) {
		n !== t && PM(n.cloneShallow(), r, t, e);
	}), t;
}
function AM(e) {
	var t = TM(this).mainData;
	return e == null || t == null ? t : TM(t).datas[e];
}
function jM() {
	var e = TM(this).mainData;
	return e == null ? [{ data: e }] : I(R(TM(e).datas), function(t) {
		return {
			type: t,
			data: TM(e).datas[t]
		};
	});
}
function MM(e) {
	return TM(e).mainData === e;
}
function NM(e, t, n) {
	TM(e).datas = {}, F(t, function(t, r) {
		PM(t, r, e, n);
	});
}
function PM(e, t, n, r) {
	TM(n).datas[t] = e, TM(e).mainData = n, e.dataType = t, r.struct && (e[r.structAttr] = r.struct, r.struct[r.datasAttr[t]] = e), e.getLinkedData = AM, e.getLinkedDataAll = jM;
}
//#endregion
//#region node_modules/echarts/lib/visual/VisualMapping.js
var FM = F, IM = G, LM = -1, RM = function() {
	function e(t) {
		var n = t.mappingMethod, r = t.type, i = this.option = E(t);
		this.type = r, this.mappingMethod = n, this._normalizeData = XM[n];
		var a = e.visualHandlers[r];
		this.applyVisual = a.applyVisual, this.getColorMapper = a.getColorMapper, this._normalizedToVisual = a._normalizedToVisual[n], n === "piecewise" ? (VM(i), zM(i)) : n === "category" ? i.categories ? BM(i) : VM(i, !0) : (me(n !== "linear" || i.dataExtent), VM(i));
	}
	return e.prototype.mapValueToVisual = function(e) {
		var t = this._normalizeData(e);
		return this._normalizedToVisual(t, e);
	}, e.prototype.getNormalizer = function() {
		return z(this._normalizeData, this);
	}, e.listVisualTypes = function() {
		return R(e.visualHandlers);
	}, e.isValidType = function(t) {
		return e.visualHandlers.hasOwnProperty(t);
	}, e.eachVisual = function(e, t, n) {
		G(e) ? F(e, t, n) : t.call(n, e);
	}, e.mapVisual = function(t, n, r) {
		var i, a = V(t) ? [] : G(t) ? {} : (i = !0, null);
		return e.eachVisual(t, function(e, t) {
			var o = n.call(r, e, t);
			i ? a = o : a[t] = o;
		}), a;
	}, e.retrieveVisuals = function(t) {
		var n = {}, r;
		return t && FM(e.visualHandlers, function(e, i) {
			t.hasOwnProperty(i) && (n[i] = t[i], r = !0);
		}), r ? n : null;
	}, e.prepareVisualTypes = function(e) {
		if (V(e)) e = e.slice();
		else if (IM(e)) {
			var t = [];
			FM(e, function(e, n) {
				t.push(n);
			}), e = t;
		} else return [];
		return e.sort(function(e, t) {
			return t === "color" && e !== "color" && e.indexOf("color") === 0 ? 1 : -1;
		}), e;
	}, e.dependsOn = function(e, t) {
		return t === "color" ? !!(e && e.indexOf(t) === 0) : e === t;
	}, e.findPieceIndex = function(e, t, n) {
		for (var r, i = Infinity, a = 0, o = t.length; a < o; a++) {
			var s = t[a].value;
			if (s != null) {
				if (s === e || U(s) && s === e + "") return a;
				n && d(s, a);
			}
		}
		for (var a = 0, o = t.length; a < o; a++) {
			var c = t[a], l = c.interval, u = c.close;
			if (l) {
				if (l[0] === -Infinity) {
					if (ZM(u[1], e, l[1])) return a;
				} else if (l[1] === Infinity) {
					if (ZM(u[0], l[0], e)) return a;
				} else if (ZM(u[0], l[0], e) && ZM(u[1], e, l[1])) return a;
				n && d(l[0], a), n && d(l[1], a);
			}
		}
		if (n) return e === Infinity ? t.length - 1 : e === -Infinity ? 0 : r;
		function d(t, n) {
			var a = Math.abs(t - e);
			a < i && (i = a, r = n);
		}
	}, e.visualHandlers = {
		color: {
			applyVisual: WM("color"),
			getColorMapper: function() {
				var e = this.option;
				return z(e.mappingMethod === "category" ? function(e, t) {
					return !t && (e = this._normalizeData(e)), GM.call(this, e);
				} : function(t, n, r) {
					var i = !!r;
					return !n && (t = this._normalizeData(t)), r = Rr(t, e.parsedVisual, r), i ? r : Hr(r, "rgba");
				}, this);
			},
			_normalizedToVisual: {
				linear: function(e) {
					return Hr(Rr(e, this.option.parsedVisual), "rgba");
				},
				category: GM,
				piecewise: function(e, t) {
					var n = JM.call(this, t);
					return n ??= Hr(Rr(e, this.option.parsedVisual), "rgba"), n;
				},
				fixed: KM
			}
		},
		colorHue: HM(function(e, t) {
			return Br(e, t);
		}),
		colorSaturation: HM(function(e, t) {
			return Br(e, null, t);
		}),
		colorLightness: HM(function(e, t) {
			return Br(e, null, null, t);
		}),
		colorAlpha: HM(function(e, t) {
			return Vr(e, t);
		}),
		decal: {
			applyVisual: WM("decal"),
			_normalizedToVisual: {
				linear: null,
				category: GM,
				piecewise: null,
				fixed: null
			}
		},
		opacity: {
			applyVisual: WM("opacity"),
			_normalizedToVisual: qM([0, 1])
		},
		liftZ: {
			applyVisual: WM("liftZ"),
			_normalizedToVisual: {
				linear: KM,
				category: KM,
				piecewise: KM,
				fixed: KM
			}
		},
		symbol: {
			applyVisual: function(e, t, n) {
				n("symbol", this.mapValueToVisual(e));
			},
			_normalizedToVisual: {
				linear: UM,
				category: GM,
				piecewise: function(e, t) {
					var n = JM.call(this, t);
					return n ??= UM.call(this, e), n;
				},
				fixed: KM
			}
		},
		symbolSize: {
			applyVisual: WM("symbolSize"),
			_normalizedToVisual: qM([0, 1])
		}
	}, e;
}();
function zM(e) {
	var t = e.pieceList;
	e.hasSpecialVisual = !1, F(t, function(t, n) {
		t.originIndex = n, t.visual != null && (e.hasSpecialVisual = !0);
	});
}
function BM(e) {
	var t = e.categories, n = e.categoryMap = {}, r = e.visual;
	if (FM(t, function(e, t) {
		n[e] = t;
	}), !V(r)) {
		var i = [];
		G(r) ? FM(r, function(e, t) {
			var r = n[t];
			i[r ?? LM] = e;
		}) : i[LM] = r, r = YM(e, i);
	}
	for (var a = t.length - 1; a >= 0; a--) r[a] ?? (delete n[t[a]], t.pop());
}
function VM(e, t) {
	var n = e.visual, r = [];
	G(n) ? FM(n, function(e) {
		r.push(e);
	}) : n != null && r.push(n), !t && r.length === 1 && !{
		color: 1,
		symbol: 1
	}.hasOwnProperty(e.type) && (r[1] = r[0]), YM(e, r);
}
function HM(e) {
	return {
		applyVisual: function(t, n, r) {
			var i = this.mapValueToVisual(t);
			r("color", e(n("color"), i));
		},
		_normalizedToVisual: qM([0, 1])
	};
}
function UM(e) {
	var t = this.option.visual;
	return t[Math.round(fs(e, [0, 1], [0, t.length - 1], !0))] || {};
}
function WM(e) {
	return function(t, n, r) {
		r(e, this.mapValueToVisual(t));
	};
}
function GM(e) {
	var t = this.option.visual;
	return t[this.option.loop && e !== LM ? e % t.length : e];
}
function KM() {
	return this.option.visual[0];
}
function qM(e) {
	return {
		linear: function(t) {
			return fs(t, e, this.option.visual, !0);
		},
		category: GM,
		piecewise: function(t, n) {
			var r = JM.call(this, n);
			return r ??= fs(t, e, this.option.visual, !0), r;
		},
		fixed: KM
	};
}
function JM(e) {
	var t = this.option, n = t.pieceList;
	if (t.hasSpecialVisual) {
		var r = n[RM.findPieceIndex(e, n)];
		if (r && r.visual) return r.visual[this.type];
	}
}
function YM(e, t) {
	return e.visual = t, e.type === "color" && (e.parsedVisual = I(t, function(e) {
		return Pr(e) || [
			0,
			0,
			0,
			1
		];
	})), t;
}
var XM = {
	linear: function(e) {
		return fs(e, this.option.dataExtent, [0, 1], !0);
	},
	piecewise: function(e) {
		var t = this.option.pieceList, n = RM.findPieceIndex(e, t, !0);
		if (n != null) return fs(n, [0, t.length - 1], [0, 1], !0);
	},
	category: function(e) {
		return (this.option.categories ? this.option.categoryMap[e] : e) ?? LM;
	},
	fixed: Ee
};
function ZM(e, t, n) {
	return e ? t <= n : t < n;
}
//#endregion
//#region node_modules/echarts/lib/data/Graph.js
function QM(e) {
	return "_EC_" + e;
}
var $M = function() {
	function e(e) {
		this.type = "graph", this.nodes = [], this.edges = [], this._nodesMap = {}, this._edgesMap = {}, this._directed = e || !1;
	}
	return e.prototype.isDirected = function() {
		return this._directed;
	}, e.prototype.addNode = function(e, t) {
		e = e == null ? "" + t : "" + e;
		var n = this._nodesMap;
		if (!n[QM(e)]) {
			var r = new eN(e, t);
			return r.hostGraph = this, this.nodes.push(r), n[QM(e)] = r, r;
		}
	}, e.prototype.getNodeByIndex = function(e) {
		var t = this.data.getRawIndex(e);
		return this.nodes[t];
	}, e.prototype.getNodeById = function(e) {
		return this._nodesMap[QM(e)];
	}, e.prototype.addEdge = function(e, t, n) {
		var r = this._nodesMap, i = this._edgesMap;
		if (W(e) && (e = this.nodes[e]), W(t) && (t = this.nodes[t]), e instanceof eN || (e = r[QM(e)]), t instanceof eN || (t = r[QM(t)]), !(!e || !t)) {
			var a = e.id + "-" + t.id, o = new tN(e, t, n);
			return o.hostGraph = this, this._directed && (e.outEdges.push(o), t.inEdges.push(o)), e.edges.push(o), e !== t && t.edges.push(o), this.edges.push(o), i[a] = o, o;
		}
	}, e.prototype.getEdgeByIndex = function(e) {
		var t = this.edgeData.getRawIndex(e);
		return this.edges[t];
	}, e.prototype.getEdge = function(e, t) {
		e instanceof eN && (e = e.id), t instanceof eN && (t = t.id);
		var n = this._edgesMap;
		return this._directed ? n[e + "-" + t] : n[e + "-" + t] || n[t + "-" + e];
	}, e.prototype.eachNode = function(e, t) {
		for (var n = this.nodes, r = n.length, i = 0; i < r; i++) n[i].dataIndex >= 0 && e.call(t, n[i], i);
	}, e.prototype.eachEdge = function(e, t) {
		for (var n = this.edges, r = n.length, i = 0; i < r; i++) n[i].dataIndex >= 0 && n[i].node1.dataIndex >= 0 && n[i].node2.dataIndex >= 0 && e.call(t, n[i], i);
	}, e.prototype.breadthFirstTraverse = function(e, t, n, r) {
		if (t instanceof eN || (t = this._nodesMap[QM(t)]), t) {
			for (var i = n === "out" ? "outEdges" : n === "in" ? "inEdges" : "edges", a = 0; a < this.nodes.length; a++) this.nodes[a].__visited = !1;
			if (!e.call(r, t, null)) for (var o = [t]; o.length;) for (var s = o.shift(), c = s[i], a = 0; a < c.length; a++) {
				var l = c[a], u = l.node1 === s ? l.node2 : l.node1;
				if (!u.__visited) {
					if (e.call(r, u, s)) return;
					o.push(u), u.__visited = !0;
				}
			}
		}
	}, e.prototype.update = function() {
		for (var e = this.data, t = this.edgeData, n = this.nodes, r = this.edges, i = 0, a = n.length; i < a; i++) n[i].dataIndex = -1;
		for (var i = 0, a = e.count(); i < a; i++) n[e.getRawIndex(i)].dataIndex = i;
		t.filterSelf(function(e) {
			var n = r[t.getRawIndex(e)];
			return n.node1.dataIndex >= 0 && n.node2.dataIndex >= 0;
		});
		for (var i = 0, a = r.length; i < a; i++) r[i].dataIndex = -1;
		for (var i = 0, a = t.count(); i < a; i++) r[t.getRawIndex(i)].dataIndex = i;
	}, e.prototype.clone = function() {
		for (var t = new e(this._directed), n = this.nodes, r = this.edges, i = 0; i < n.length; i++) t.addNode(n[i].id, n[i].dataIndex);
		for (var i = 0; i < r.length; i++) {
			var a = r[i];
			t.addEdge(a.node1.id, a.node2.id, a.dataIndex);
		}
		return t;
	}, e;
}(), eN = function() {
	function e(e, t) {
		this.inEdges = [], this.outEdges = [], this.edges = [], this.dataIndex = -1, this.id = e ?? "", this.dataIndex = t ?? -1;
	}
	return e.prototype.degree = function() {
		return this.edges.length;
	}, e.prototype.inDegree = function() {
		return this.inEdges.length;
	}, e.prototype.outDegree = function() {
		return this.outEdges.length;
	}, e.prototype.getModel = function(e) {
		if (!(this.dataIndex < 0)) return this.hostGraph.data.getItemModel(this.dataIndex).getModel(e);
	}, e.prototype.getAdjacentDataIndices = function() {
		for (var e = {
			edge: [],
			node: []
		}, t = 0; t < this.edges.length; t++) {
			var n = this.edges[t];
			n.dataIndex < 0 || (e.edge.push(n.dataIndex), e.node.push(n.node1.dataIndex, n.node2.dataIndex));
		}
		return e;
	}, e.prototype.getTrajectoryDataIndices = function() {
		for (var e = q(), t = q(), n = 0, r = this.edges.length; n < r; n++) {
			var i = this.edges[n];
			if (!(i.dataIndex < 0)) {
				e.set(i.dataIndex, !0);
				for (var a = [i.node1], o = [i.node2], s = 0; s < a.length;) {
					var c = a[s];
					s++, t.set(c.dataIndex, !0);
					for (var l = c.inEdges, u = 0, d = l.length, f = void 0, p = void 0; u < d; u++) f = l[u], p = f.dataIndex, p >= 0 && !e.hasKey(p) && (e.set(p, !0), a.push(f.node1));
				}
				for (s = 0; s < o.length;) {
					var m = o[s];
					s++, t.set(m.dataIndex, !0);
					for (var h = m.outEdges, u = 0, g = h.length, _ = void 0, v = void 0; u < g; u++) _ = h[u], v = _.dataIndex, v >= 0 && !e.hasKey(v) && (e.set(v, !0), o.push(_.node2));
				}
			}
		}
		return {
			edge: e.keys(),
			node: t.keys()
		};
	}, e;
}(), tN = function() {
	function e(e, t, n) {
		this.dataIndex = -1, this.node1 = e, this.node2 = t, this.dataIndex = n ?? -1;
	}
	return e.prototype.getModel = function(e) {
		if (!(this.dataIndex < 0)) return this.hostGraph.edgeData.getItemModel(this.dataIndex).getModel(e);
	}, e.prototype.getAdjacentDataIndices = function() {
		return {
			edge: [this.dataIndex],
			node: [this.node1.dataIndex, this.node2.dataIndex]
		};
	}, e.prototype.getTrajectoryDataIndices = function() {
		var e = q(), t = q();
		e.set(this.dataIndex, !0);
		for (var n = [this.node1], r = [this.node2], i = 0; i < n.length;) {
			var a = n[i];
			i++, t.set(a.dataIndex, !0);
			for (var o = a.inEdges, s = 0, c = o.length, l = void 0, u = void 0; s < c; s++) l = a.inEdges[s], u = l.dataIndex, u >= 0 && !e.hasKey(u) && (e.set(u, !0), n.push(l.node1));
		}
		for (i = 0; i < r.length;) {
			var d = r[i];
			i++, t.set(d.dataIndex, !0);
			for (var f = d.outEdges, s = 0, c = f.length, p = void 0, m = void 0; s < c; s++) p = d.outEdges[s], m = p.dataIndex, m >= 0 && !e.hasKey(m) && (e.set(m, !0), r.push(p.node2));
		}
		return {
			edge: e.keys(),
			node: t.keys()
		};
	}, e;
}();
function nN(e, t) {
	return {
		getValue: function(n) {
			var r = this[e][t];
			return r.getStore().get(r.getDimensionIndex(n || "value"), this.dataIndex);
		},
		setVisual: function(n, r) {
			this.dataIndex >= 0 && this[e][t].setItemVisual(this.dataIndex, n, r);
		},
		getVisual: function(n) {
			return this[e][t].getItemVisual(this.dataIndex, n);
		},
		setLayout: function(n, r) {
			this.dataIndex >= 0 && this[e][t].setItemLayout(this.dataIndex, n, r);
		},
		getLayout: function() {
			return this[e][t].getItemLayout(this.dataIndex);
		},
		getGraphicEl: function() {
			return this[e][t].getItemGraphicEl(this.dataIndex);
		},
		getRawIndex: function() {
			return this[e][t].getRawIndex(this.dataIndex);
		}
	};
}
N(eN, nN("hostGraph", "data")), N(tN, nN("hostGraph", "edgeData"));
//#endregion
//#region node_modules/echarts/lib/chart/helper/createGraphFromNodeEdge.js
function rN(e, t, n, r, i) {
	for (var a = new $M(r), o = 0; o < e.length; o++) a.addNode(ue(e[o].id, e[o].name, o), o);
	for (var s = [], c = [], l = 0, o = 0; o < t.length; o++) {
		var u = t[o], d = u.source, f = u.target;
		a.addEdge(d, f, l) && (c.push(u), s.push(ue(sc(u.id, null), d + " > " + f)), l++);
	}
	var p = n.get("coordinateSystem"), m;
	if (p === "cartesian2d" || p === "polar" || p === "matrix") m = sh(e, n);
	else {
		var h = Gm.get(p), g = h && h.dimensions || [];
		M(g, "value") < 0 && g.concat(["value"]);
		var _ = Bm(e, {
			coordDimensions: g,
			encodeDefine: n.getEncode()
		}).dimensions;
		m = new zm(_, n), m.initData(e);
	}
	var v = new zm(["value"], n);
	return v.initData(c, s), i && i(m, v), EM({
		mainData: m,
		struct: a,
		structAttr: "graph",
		datas: {
			node: m,
			edge: v
		},
		datasAttr: {
			node: "data",
			edge: "edgeData"
		}
	}), a.update(), a;
}
//#endregion
//#region node_modules/echarts/lib/chart/helper/LinePath.js
var iN = ld.prototype, aN = pd.prototype, oN = function() {
	function e() {
		this.x1 = 0, this.y1 = 0, this.x2 = 0, this.y2 = 0, this.percent = 1;
	}
	return e;
}();
(function(e) {
	r(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t;
})(oN);
function sN(e) {
	return isNaN(+e.cpx1) || isNaN(+e.cpy1);
}
var cN = function(e) {
	r(t, e);
	function t(t) {
		var n = e.call(this, t) || this;
		return n.type = "ec-line", n;
	}
	return t.prototype.getDefaultStyle = function() {
		return {
			stroke: Q.color.neutral99,
			fill: null
		};
	}, t.prototype.getDefaultShape = function() {
		return new oN();
	}, t.prototype.buildPath = function(e, t) {
		sN(t) ? iN.buildPath.call(this, e, t) : aN.buildPath.call(this, e, t);
	}, t.prototype.pointAt = function(e) {
		return sN(this.shape) ? iN.pointAt.call(this, e) : aN.pointAt.call(this, e);
	}, t.prototype.tangentAt = function(e) {
		var t = this.shape, n = sN(t) ? [t.x2 - t.x1, t.y2 - t.y1] : aN.tangentAt.call(this, e);
		return vt(n, n);
	}, t;
}(yo), lN = ["fromSymbol", "toSymbol"];
function uN(e) {
	return "_" + e + "Type";
}
function dN(e, t, n) {
	var r = t.getItemVisual(n, e);
	if (!r || r === "none") return r;
	var i = t.getItemVisual(n, e + "Size"), a = t.getItemVisual(n, e + "Rotate"), o = t.getItemVisual(n, e + "Offset"), s = t.getItemVisual(n, e + "KeepAspect"), c = mv(i), l = hv(o || 0, c);
	return r + c + l + (a || "") + (s || "");
}
function fN(e, t, n) {
	var r = t.getItemVisual(n, e);
	if (!(!r || r === "none")) {
		var i = t.getItemVisual(n, e + "Size"), a = t.getItemVisual(n, e + "Rotate"), o = t.getItemVisual(n, e + "Offset"), s = t.getItemVisual(n, e + "KeepAspect"), c = mv(i), l = hv(o || 0, c), u = pv(r, -c[0] / 2 + l[0], -c[1] / 2 + l[1], c[0], c[1], null, s);
		return u.__specifiedRotation = a == null || isNaN(a) ? void 0 : +a * Math.PI / 180 || 0, u.name = e, u;
	}
}
function pN(e) {
	var t = new cN({
		name: "line",
		subPixelOptimize: !0
	});
	return mN(t.shape, e), t;
}
function mN(e, t) {
	e.x1 = t[0][0], e.y1 = t[0][1], e.x2 = t[1][0], e.y2 = t[1][1], e.percent = 1;
	var n = t[2];
	n ? (e.cpx1 = n[0], e.cpy1 = n[1]) : (e.cpx1 = NaN, e.cpy1 = NaN);
}
var hN = function(e) {
	r(t, e);
	function t(t, n, r) {
		var i = e.call(this) || this;
		return i._createLine(t, n, r), i;
	}
	return t.prototype._createLine = function(e, t, n) {
		var r = e.hostModel, i = e.getItemLayout(t), a = e.getItemVisual(t, "z2"), o = pN(i);
		o.shape.percent = 0, Fd(o, {
			z2: K(a, 0),
			shape: { percent: 1 }
		}, r, t), this.add(o), F(lN, function(n) {
			var r = fN(n, e, t);
			this.add(r), this[uN(n)] = dN(n, e, t);
		}, this), this._updateCommonStl(e, t, n);
	}, t.prototype.updateData = function(e, t, n) {
		var r = e.hostModel, i = this.childOfName("line"), a = e.getItemLayout(t), o = { shape: {} };
		mN(o.shape, a), Pd(i, o, r, t), F(lN, function(n) {
			var r = dN(n, e, t), i = uN(n);
			if (this[i] !== r) {
				this.remove(this.childOfName(n));
				var a = fN(n, e, t);
				this.add(a);
			}
			this[i] = r;
		}, this), this._updateCommonStl(e, t, n);
	}, t.prototype.getLinePath = function() {
		return this.childAt(0);
	}, t.prototype._updateCommonStl = function(e, t, n) {
		var r = e.hostModel, i = this.childOfName("line"), a = n && n.emphasisLineStyle, o = n && n.blurLineStyle, s = n && n.selectLineStyle, c = n && n.labelStatesModels, l = n && n.emphasisDisabled, u = n && n.focus, d = n && n.blurScope;
		if (!n || e.hasItemOption) {
			var f = e.getItemModel(t), p = f.getModel("emphasis");
			a = p.getModel("lineStyle").getLineStyle(), o = f.getModel(["blur", "lineStyle"]).getLineStyle(), s = f.getModel(["select", "lineStyle"]).getLineStyle(), l = p.get("disabled"), u = p.get("focus"), d = p.get("blurScope"), c = Bf(f);
		}
		var m = e.getItemVisual(t, "style"), h = m.stroke;
		i.useStyle(m), i.style.fill = null, i.style.strokeNoScale = !0, i.ensureState("emphasis").style = a, i.ensureState("blur").style = o, i.ensureState("select").style = s, F(lN, function(e) {
			var t = this.childOfName(e);
			if (t) {
				t.setColor(h), t.style.opacity = m.opacity;
				for (var n = 0; n < ol.length; n++) {
					var r = ol[n], a = i.getState(r);
					if (a) {
						var o = a.style || {}, s = t.ensureState(r), c = s.style ||= {};
						o.stroke != null && (c[t.__isEmptyBrush ? "stroke" : "fill"] = o.stroke), o.opacity != null && (c.opacity = o.opacity);
					}
				}
				t.markRedraw();
			}
		}, this);
		var g = r.getRawValue(t);
		zf(this, c, {
			labelDataIndex: t,
			labelFetcher: { getFormattedLabel: function(t, n) {
				return r.getFormattedLabel(t, n, e.dataType);
			} },
			inheritColor: h || Q.color.neutral99,
			defaultOpacity: m.opacity,
			defaultText: (g == null ? e.getName(t) : isFinite(g) ? vs(g, 10) : g) + ""
		});
		var _ = this.getTextContent();
		if (_) {
			var v = c.normal;
			_.__align = _.style.align, _.__verticalAlign = _.style.verticalAlign, _.__position = v.get("position") || "middle";
			var y = v.get("distance");
			V(y) || (y = [y, y]), _.__labelDistance = y;
		}
		this.setTextConfig({
			position: null,
			local: !0,
			inside: !1
		}), Ql(this, u, d, l);
	}, t.prototype.highlight = function() {
		Nl(this);
	}, t.prototype.downplay = function() {
		Pl(this);
	}, t.prototype.updateLayout = function(e, t) {
		this.childOfName("line").stopAnimation(), this.setLinePoints(e.getItemLayout(t));
	}, t.prototype.setLinePoints = function(e) {
		var t = this.childOfName("line");
		mN(t.shape, e), t.dirty();
	}, t.prototype.beforeUpdate = function() {
		var e = this, t = e.childOfName("fromSymbol"), n = e.childOfName("toSymbol"), r = e.getTextContent();
		if (!t && !n && (!r || r.ignore)) return;
		for (var i = 1, a = this.parent; a;) a.scaleX && (i /= a.scaleX), a = a.parent;
		var o = e.childOfName("line");
		if (!this.__dirty && !o.__dirty) return;
		var s = o.shape.percent, c = o.pointAt(0), l = o.pointAt(s), u = mt([], l, c);
		vt(u, u);
		function d(e, t) {
			var n = e.__specifiedRotation;
			if (n == null) {
				var r = o.tangentAt(t);
				e.attr("rotation", (t === 1 ? -1 : 1) * Math.PI / 2 - Math.atan2(r[1], r[0]));
			} else e.attr("rotation", n);
		}
		if (t && (t.setPosition(c), d(t, 0), t.scaleX = t.scaleY = i * s, t.markRedraw()), n && (n.setPosition(l), d(n, 1), n.scaleX = n.scaleY = i * s, n.markRedraw()), r && !r.ignore) {
			r.x = r.y = 0, r.originX = r.originY = 0;
			var f = void 0, p = void 0, m = r.__labelDistance, h = m[0] * i, g = m[1] * i, _ = s / 2, v = o.tangentAt(_), y = [v[1], -v[0]], b = o.pointAt(_);
			y[1] > 0 && (y[0] = -y[0], y[1] = -y[1]);
			var x = v[0] < 0 ? -1 : 1;
			if (r.__position !== "start" && r.__position !== "end") {
				var S = -Math.atan2(v[1], v[0]);
				l[0] < c[0] && (S = Math.PI + S), r.rotation = S;
			}
			var C = void 0;
			switch (r.__position) {
				case "insideStartTop":
				case "insideMiddleTop":
				case "insideEndTop":
				case "middle":
					C = -g, p = "bottom";
					break;
				case "insideStartBottom":
				case "insideMiddleBottom":
				case "insideEndBottom":
					C = g, p = "top";
					break;
				default: C = 0, p = "middle";
			}
			switch (r.__position) {
				case "end":
					r.x = u[0] * h + l[0], r.y = u[1] * g + l[1], f = u[0] > .8 ? "left" : u[0] < -.8 ? "right" : "center", p = u[1] > .8 ? "top" : u[1] < -.8 ? "bottom" : "middle";
					break;
				case "start":
					r.x = -u[0] * h + c[0], r.y = -u[1] * g + c[1], f = u[0] > .8 ? "right" : u[0] < -.8 ? "left" : "center", p = u[1] > .8 ? "bottom" : u[1] < -.8 ? "top" : "middle";
					break;
				case "insideStartTop":
				case "insideStart":
				case "insideStartBottom":
					r.x = h * x + c[0], r.y = c[1] + C, f = v[0] < 0 ? "right" : "left", r.originX = -h * x, r.originY = -C;
					break;
				case "insideMiddleTop":
				case "insideMiddle":
				case "insideMiddleBottom":
				case "middle":
					r.x = b[0], r.y = b[1] + C, f = "center", r.originY = -C;
					break;
				case "insideEndTop":
				case "insideEnd":
				case "insideEndBottom": r.x = -h * x + l[0], r.y = l[1] + C, f = v[0] >= 0 ? "right" : "left", r.originX = h * x, r.originY = -C;
			}
			r.scaleX = r.scaleY = i, r.setStyle({
				verticalAlign: r.__verticalAlign || p,
				align: r.__align || f
			});
		}
	}, t;
}(ju), gN = function() {
	function e(e) {
		this.group = new ju(), this._LineCtor = e || hN;
	}
	return e.prototype.updateData = function(e) {
		var t = this;
		this._progressiveEls = null;
		var n = this, r = n.group, i = n._lineData;
		n._lineData = e, i || r.removeAll();
		var a = vN(e);
		e.diff(i).add(function(n) {
			t._doAdd(e, n, a);
		}).update(function(n, r) {
			t._doUpdate(i, e, r, n, a);
		}).remove(function(e) {
			r.remove(i.getItemGraphicEl(e));
		}).execute();
	}, e.prototype.updateLayout = function() {
		var e = this._lineData;
		e && e.eachItemGraphicEl(function(t, n) {
			t.updateLayout(e, n);
		}, this);
	}, e.prototype.incrementalPrepareUpdate = function(e) {
		this._seriesScope = vN(e), this._lineData = null, this.group.removeAll();
	}, e.prototype.incrementalUpdate = function(e, t, n) {
		this._progressiveEls = [];
		function r(e) {
			!e.isGroup && !_N(e) && (e.incremental = n, e.ensureState("emphasis").hoverLayer = 2);
		}
		for (var i = e.start; i < e.end; i++) if (bN(t.getItemLayout(i))) {
			var a = new this._LineCtor(t, i, this._seriesScope);
			a.traverse(r), this.group.add(a), t.setItemGraphicEl(i, a), this._progressiveEls.push(a);
		}
	}, e.prototype.remove = function() {
		this.group.removeAll();
	}, e.prototype.eachRendered = function(e) {
		Cf(this._progressiveEls || this.group, e);
	}, e.prototype._doAdd = function(e, t, n) {
		if (bN(e.getItemLayout(t))) {
			var r = new this._LineCtor(e, t, n);
			e.setItemGraphicEl(t, r), this.group.add(r);
		}
	}, e.prototype._doUpdate = function(e, t, n, r, i) {
		var a = e.getItemGraphicEl(n);
		if (!bN(t.getItemLayout(r))) {
			this.group.remove(a);
			return;
		}
		a ? a.updateData(t, r, i) : a = new this._LineCtor(t, r, i), t.setItemGraphicEl(r, a), this.group.add(a);
	}, e;
}();
function _N(e) {
	return e.animators && e.animators.length > 0;
}
function vN(e) {
	var t = e.hostModel, n = t.getModel("emphasis");
	return {
		lineStyle: t.getModel("lineStyle").getLineStyle(),
		emphasisLineStyle: n.getModel(["lineStyle"]).getLineStyle(),
		blurLineStyle: t.getModel(["blur", "lineStyle"]).getLineStyle(),
		selectLineStyle: t.getModel(["select", "lineStyle"]).getLineStyle(),
		emphasisDisabled: n.get("disabled"),
		blurScope: n.get("blurScope"),
		focus: n.get("focus"),
		labelStatesModels: Bf(t)
	};
}
function yN(e) {
	return isNaN(e[0]) || isNaN(e[1]);
}
function bN(e) {
	return e && !yN(e[0]) && !yN(e[1]);
}
//#endregion
//#region node_modules/echarts/lib/chart/sankey/SankeySeries.js
var xN = "sankey", SN = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.getInitialData = function(e, t) {
		var n = e.edges || e.links || [], r = e.data || e.nodes || [], i = e.levels || [];
		this.levelModels = [];
		for (var a = this.levelModels, o = 0; o < i.length; o++) i[o].depth != null && i[o].depth >= 0 && (a[i[o].depth] = new lp(i[o], this, t));
		return rN(r, n, this, !0, s).data;
		function s(e, t) {
			e.wrapMethod("getItemModel", function(e, t) {
				var n = e.parentModel, r = n.getData().getItemLayout(t);
				if (r) {
					var i = r.depth, a = n.levelModels[i];
					a && (e.parentModel = a);
				}
				return e;
			}), t.wrapMethod("getItemModel", function(e, t) {
				var n = e.parentModel, r = n.getGraph().getEdgeByIndex(t).node1.getLayout();
				if (r) {
					var i = r.depth, a = n.levelModels[i];
					a && (e.parentModel = a);
				}
				return e;
			});
		}
	}, t.prototype.setNodePosition = function(e, t) {
		var n = (this.option.data || this.option.nodes)[e];
		n.localX = t[0], n.localY = t[1];
	}, t.prototype.getGraph = function() {
		return this.getData().graph;
	}, t.prototype.getEdgeData = function() {
		return this.getGraph().edgeData;
	}, t.prototype.formatTooltip = function(e, t, n) {
		function r(e) {
			return isNaN(e) || e == null;
		}
		if (n === "edge") {
			var i = this.getDataParams(e, n), a = i.data, o = i.value;
			return M_("nameValue", {
				name: a.source + " -- " + a.target,
				value: o,
				noValue: r(o)
			});
		}
		var s = this.getGraph().getNodeByIndex(e).getLayout().value, c = this.getDataParams(e, n).data.name;
		return M_("nameValue", {
			name: c == null ? null : c + "",
			value: s,
			noValue: r(s)
		});
	}, t.prototype.optionUpdated = function() {}, t.prototype.getDataParams = function(t, n) {
		var r = e.prototype.getDataParams.call(this, t, n);
		return r.value == null && n === "node" && (r.value = this.getGraph().getNodeByIndex(t).getLayout().value), r;
	}, t.prototype.__ownRoamView = function() {
		return this.coordinateSystem;
	}, t.type = "series." + xN, t.layoutMode = "box", t.defaultOption = {
		z: 2,
		coordinateSystemUsage: "box",
		left: "5%",
		top: "5%",
		right: "20%",
		bottom: "5%",
		orient: "horizontal",
		nodeWidth: 20,
		nodeGap: 8,
		draggable: !0,
		layoutIterations: 32,
		roam: !1,
		roamTrigger: "global",
		center: null,
		zoom: 1,
		label: {
			show: !0,
			position: "right",
			fontSize: 12
		},
		edgeLabel: {
			show: !1,
			fontSize: 12
		},
		levels: [],
		nodeAlign: "justify",
		lineStyle: {
			color: Q.color.neutral50,
			opacity: .2,
			curveness: .5
		},
		emphasis: {
			label: { show: !0 },
			lineStyle: { opacity: .5 }
		},
		select: { itemStyle: { borderColor: Q.color.primary } },
		animationEasing: "linear",
		animationDuration: 1e3
	}, t;
}(Q_), CN = function() {
	function e() {
		this.x1 = 0, this.y1 = 0, this.x2 = 0, this.y2 = 0, this.cpx1 = 0, this.cpy1 = 0, this.cpx2 = 0, this.cpy2 = 0, this.extent = 0;
	}
	return e;
}(), wN = function(e) {
	r(t, e);
	function t(t) {
		return e.call(this, t) || this;
	}
	return t.prototype.getDefaultShape = function() {
		return new CN();
	}, t.prototype.buildPath = function(e, t) {
		var n = t.extent;
		e.moveTo(t.x1, t.y1), e.bezierCurveTo(t.cpx1, t.cpy1, t.cpx2, t.cpy2, t.x2, t.y2), t.orient === "vertical" ? (e.lineTo(t.x2 + n, t.y2), e.bezierCurveTo(t.cpx2 + n, t.cpy2, t.cpx1 + n, t.cpy1, t.x1 + n, t.y1)) : (e.lineTo(t.x2, t.y2 + n), e.bezierCurveTo(t.cpx2, t.cpy2 + n, t.cpx1, t.cpy1 + n, t.x1, t.y1 + n)), e.closePath();
	}, t.prototype.highlight = function() {
		Nl(this);
	}, t.prototype.downplay = function() {
		Pl(this);
	}, t;
}(yo), TN = function(e) {
	r(t, e);
	function t() {
		var t = e !== null && e.apply(this, arguments) || this;
		return t.type = xN, t._mainGroup = new ju(), t;
	}
	return t.prototype.init = function(e, t) {
		this._controller = new vj(t.getZr()), this.group.add(this._mainGroup), this._firstRender = !0;
	}, t.prototype.render = function(e, t, n) {
		var r = e.getGraph(), i = this._mainGroup, a = e.layoutInfo, o = a.width, s = a.height, c = e.getData(), l = e.getData("edge"), u = e.get("orient");
		i.removeAll(), i.x = a.x, i.y = a.y, this._updateViewCoordSys(e, n), yM(e, n, this._controller, bM(i), null), r.eachEdge(function(t) {
			var n = new wN(), r = Z(n);
			r.dataIndex = t.dataIndex, r.seriesIndex = e.seriesIndex, r.dataType = "edge";
			var a = t.getModel(), c = a.getModel("lineStyle"), d = c.get("curveness"), f = t.node1.getLayout(), p = t.node1.getModel(), m = p.get("localX"), h = p.get("localY"), g = t.node2.getLayout(), _ = t.node2.getModel(), v = _.get("localX"), y = _.get("localY"), b = t.getLayout(), x, S, C, w, T, E, D, O;
			n.shape.extent = Math.max(1, b.dy), n.shape.orient = u, u === "vertical" ? (x = (m == null ? f.x : m * o) + b.sy, S = (h == null ? f.y : h * s) + f.dy, C = (v == null ? g.x : v * o) + b.ty, w = y == null ? g.y : y * s, T = x, E = S * (1 - d) + w * d, D = C, O = S * d + w * (1 - d)) : (x = (m == null ? f.x : m * o) + f.dx, S = (h == null ? f.y : h * s) + b.sy, C = v == null ? g.x : v * o, w = (y == null ? g.y : y * s) + b.ty, T = x * (1 - d) + C * d, E = S, D = x * d + C * (1 - d), O = w), n.setShape({
				x1: x,
				y1: S,
				x2: C,
				y2: w,
				cpx1: T,
				cpy1: E,
				cpx2: D,
				cpy2: O
			}), n.useStyle(c.getItemStyle()), EN(n.style, u, t);
			var k = "" + a.get("value"), A = Bf(a, "edgeLabel");
			zf(n, A, {
				labelFetcher: { getFormattedLabel: function(t, n, r, i, a, o) {
					return e.getFormattedLabel(t, n, "edge", i, de(a, A.normal && A.normal.get("formatter"), k), o);
				} },
				labelDataIndex: t.dataIndex,
				defaultText: k
			}), n.setTextConfig({ position: "inside" });
			var j = a.getModel("emphasis");
			nu(n, a, "lineStyle", function(e) {
				var n = e.getItemStyle();
				return EN(n, u, t), n;
			}), i.add(n), l.setItemGraphicEl(t.dataIndex, n);
			var M = j.get("focus");
			Ql(n, M === "adjacency" ? t.getAdjacentDataIndices() : M === "trajectory" ? t.getTrajectoryDataIndices() : M, j.get("blurScope"), j.get("disabled"));
		}), r.eachNode(function(t) {
			var n = t.getLayout(), r = t.getModel(), a = r.get("localX"), l = r.get("localY"), u = r.getModel("emphasis"), d = r.get(["itemStyle", "borderRadius"]) || 0, f = new No({
				shape: {
					x: a == null ? n.x : a * o,
					y: l == null ? n.y : l * s,
					width: n.dx,
					height: n.dy,
					r: d
				},
				style: r.getModel("itemStyle").getItemStyle(),
				z2: 10
			});
			zf(f, Bf(r), {
				labelFetcher: { getFormattedLabel: function(t, n) {
					return e.getFormattedLabel(t, n, "node");
				} },
				labelDataIndex: t.dataIndex,
				defaultText: t.id
			}), f.disableLabelAnimation = !0, f.setStyle("fill", t.getVisual("color")), f.setStyle("decal", t.getVisual("style").decal), nu(f, r), i.add(f), c.setItemGraphicEl(t.dataIndex, f), Z(f).dataType = "node";
			var p = u.get("focus");
			Ql(f, p === "adjacency" ? t.getAdjacentDataIndices() : p === "trajectory" ? t.getTrajectoryDataIndices() : p, u.get("blurScope"), u.get("disabled"));
		}), c.eachItemGraphicEl(function(t, r) {
			c.getItemModel(r).get("draggable") && (t.drift = function(t, i) {
				this.shape.x += t, this.shape.y += i, this.dirty(), n.dispatchAction({
					type: "dragNode",
					seriesId: e.id,
					dataIndex: c.getRawIndex(r),
					localX: this.shape.x / o,
					localY: this.shape.y / s
				});
			}, t.draggable = !0, t.cursor = "move");
		}), !this._data && e.isAnimationEnabled() && i.setClipPath(DN(i.getBoundingRect(), e, function() {
			i.removeClipPath();
		})), this._data = e.getData(), this._firstRender = !1;
	}, t.prototype.__updateOnOwnRoam = function(e, t, n) {
		nM(this.group, 2, t.coordinateSystem, null);
	}, t.prototype.dispose = function() {
		this._controller && this._controller.dispose();
	}, t.prototype._updateViewCoordSys = function(e, t) {
		var n = e.layoutInfo, r = e.coordinateSystem = wM(e, t, n.x, n.y, n.width, n.height);
		nM(this.group, 2, r, this._firstRender ? null : e);
	}, t.type = xN, t;
}(Kv);
function EN(e, t, n) {
	switch (e.fill) {
		case "source":
			e.fill = n.node1.getVisual("color"), e.decal = n.node1.getVisual("style").decal;
			break;
		case "target":
			e.fill = n.node2.getVisual("color"), e.decal = n.node2.getVisual("style").decal;
			break;
		case "gradient":
			var r = n.node1.getVisual("color"), i = n.node2.getVisual("color");
			U(r) && U(i) && (e.fill = new vd(0, 0, +(t === "horizontal"), +(t === "vertical"), [{
				color: r,
				offset: 0
			}, {
				color: i,
				offset: 1
			}]));
	}
}
function DN(e, t, n) {
	var r = new No({ shape: {
		x: e.x - 10,
		y: e.y - 10,
		width: 0,
		height: e.height + 20
	} });
	return Fd(r, { shape: { width: e.width + 20 } }, t, n), r;
}
//#endregion
//#region node_modules/echarts/lib/chart/sankey/sankeyLayout.js
var ON = Bc(xN, kN);
function kN(e, t) {
	e.eachSeriesByType(xN, function(e) {
		var n = e.get("nodeWidth"), r = e.get("nodeGap"), i = Gg(e, t).refContainer, a = Ug(e.getBoxLayoutParams(), i);
		e.layoutInfo = a;
		var o = a.width, s = a.height, c = e.getGraph(), l = c.nodes, u = c.edges;
		jN(l), AN(l, u, n, r, o, s, L(l, function(e) {
			return e.getLayout().value === 0;
		}).length === 0 ? e.get("layoutIterations") : 0, e.get("orient"), e.get("nodeAlign"));
	});
}
function AN(e, t, n, r, i, a, o, s, c) {
	MN(e, t, n, i, a, s, c), LN(e, t, a, i, r, o, s), XN(e, s);
}
function jN(e) {
	F(e, function(e) {
		var t = JN(e.outEdges, qN), n = JN(e.inEdges, qN), r = e.getValue() || 0, i = Math.max(t, n, r);
		e.setLayout({ value: i }, !0);
	});
}
function MN(e, t, n, r, i, a, o) {
	for (var s = [], c = [], l = [], u = [], d = 0, f = 0; f < t.length; f++) s[f] = 1;
	for (var f = 0; f < e.length; f++) c[f] = e[f].inEdges.length, c[f] === 0 && l.push(e[f]);
	for (var p = -1; l.length;) {
		for (var m = 0; m < l.length; m++) {
			var h = l[m], g = h.hostGraph.data.getRawDataItem(h.dataIndex), _ = g.depth != null && g.depth >= 0;
			_ && g.depth > p && (p = g.depth), h.setLayout({ depth: _ ? g.depth : d }, !0), a === "vertical" ? h.setLayout({ dy: n }, !0) : h.setLayout({ dx: n }, !0);
			for (var v = 0; v < h.outEdges.length; v++) {
				var y = h.outEdges[v], b = M(t, y);
				s[b] = 0;
				var x = y.node2, S = M(e, x);
				--c[S] === 0 && M(u, x) < 0 && u.push(x);
			}
		}
		++d, l = u, u = [];
	}
	for (var f = 0; f < s.length; f++) if (s[f] === 1) throw Error("Sankey is a DAG, the original data has cycle!");
	var C = p > d - 1 ? p : d - 1;
	o && o !== "left" && PN(e, o, a, C), IN(e, a === "vertical" ? (i - n) / C : (r - n) / C, a);
}
function NN(e) {
	var t = e.hostGraph.data.getRawDataItem(e.dataIndex);
	return t.depth != null && t.depth >= 0;
}
function PN(e, t, n, r) {
	if (t === "right") {
		for (var i = [], a = e, o = 0; a.length;) {
			for (var s = 0; s < a.length; s++) {
				var c = a[s];
				c.setLayout({ skNodeHeight: o }, !0);
				for (var l = 0; l < c.inEdges.length; l++) {
					var u = c.inEdges[l];
					M(i, u.node1) < 0 && i.push(u.node1);
				}
			}
			a = i, i = [], ++o;
		}
		F(e, function(e) {
			NN(e) || e.setLayout({ depth: Math.max(0, r - e.getLayout().skNodeHeight) }, !0);
		});
	} else t === "justify" && FN(e, r);
}
function FN(e, t) {
	F(e, function(e) {
		!NN(e) && !e.outEdges.length && e.setLayout({ depth: t }, !0);
	});
}
function IN(e, t, n) {
	F(e, function(e) {
		var r = e.getLayout().depth * t;
		n === "vertical" ? e.setLayout({ y: r }, !0) : e.setLayout({ x: r }, !0);
	});
}
function LN(e, t, n, r, i, a, o) {
	var s = RN(e, o);
	zN(s, t, n, r, i, o), BN(s, i, n, r, o);
	for (var c = 1; a > 0; a--) c *= .99, VN(s, c, o), BN(s, i, n, r, o), YN(s, c, o), BN(s, i, n, r, o);
}
function RN(e, t) {
	var n = [], r = t === "vertical" ? "y" : "x", i = Sc(e, function(e) {
		return e.getLayout()[r];
	});
	return ys(i.keys), F(i.keys, function(e) {
		n.push(i.buckets.get(e));
	}), n;
}
function zN(e, t, n, r, i, a) {
	var o = Infinity;
	F(e, function(e) {
		var t = e.length, s = 0;
		F(e, function(e) {
			s += e.getLayout().value;
		});
		var c = a === "vertical" ? (r - (t - 1) * i) / s : (n - (t - 1) * i) / s;
		c < o && (o = c);
	}), F(e, function(e) {
		F(e, function(e, t) {
			var n = e.getLayout().value * o;
			a === "vertical" ? (e.setLayout({ x: t }, !0), e.setLayout({ dx: n }, !0)) : (e.setLayout({ y: t }, !0), e.setLayout({ dy: n }, !0));
		});
	}), F(t, function(e) {
		var t = +e.getValue() * o;
		e.setLayout({ dy: t }, !0);
	});
}
function BN(e, t, n, r, i) {
	var a = i === "vertical" ? "x" : "y";
	F(e, function(e) {
		e.sort(function(e, t) {
			return e.getLayout()[a] - t.getLayout()[a];
		});
		for (var o, s, c, l = 0, u = e.length, d = i === "vertical" ? "dx" : "dy", f = 0; f < u; f++) s = e[f], c = l - s.getLayout()[a], c > 0 && (o = s.getLayout()[a] + c, i === "vertical" ? s.setLayout({ x: o }, !0) : s.setLayout({ y: o }, !0)), l = s.getLayout()[a] + s.getLayout()[d] + t;
		var p = i === "vertical" ? r : n;
		if (c = l - t - p, c > 0) {
			o = s.getLayout()[a] - c, i === "vertical" ? s.setLayout({ x: o }, !0) : s.setLayout({ y: o }, !0), l = o;
			for (var f = u - 2; f >= 0; --f) s = e[f], c = s.getLayout()[a] + s.getLayout()[d] + t - l, c > 0 && (o = s.getLayout()[a] - c, i === "vertical" ? s.setLayout({ x: o }, !0) : s.setLayout({ y: o }, !0)), l = s.getLayout()[a];
		}
	});
}
function VN(e, t, n) {
	F(e.slice().reverse(), function(e) {
		F(e, function(e) {
			if (e.outEdges.length) {
				var r = JN(e.outEdges, HN, n) / JN(e.outEdges, qN);
				if (isNaN(r)) {
					var i = e.outEdges.length;
					r = i ? JN(e.outEdges, UN, n) / i : 0;
				}
				if (n === "vertical") {
					var a = e.getLayout().x + (r - KN(e, n)) * t;
					e.setLayout({ x: a }, !0);
				} else {
					var o = e.getLayout().y + (r - KN(e, n)) * t;
					e.setLayout({ y: o }, !0);
				}
			}
		});
	});
}
function HN(e, t) {
	return KN(e.node2, t) * e.getValue();
}
function UN(e, t) {
	return KN(e.node2, t);
}
function WN(e, t) {
	return KN(e.node1, t) * e.getValue();
}
function GN(e, t) {
	return KN(e.node1, t);
}
function KN(e, t) {
	return t === "vertical" ? e.getLayout().x + e.getLayout().dx / 2 : e.getLayout().y + e.getLayout().dy / 2;
}
function qN(e) {
	return e.getValue();
}
function JN(e, t, n) {
	for (var r = 0, i = e.length, a = -1; ++a < i;) {
		var o = +t(e[a], n);
		isNaN(o) || (r += o);
	}
	return r;
}
function YN(e, t, n) {
	F(e, function(e) {
		F(e, function(e) {
			if (e.inEdges.length) {
				var r = JN(e.inEdges, WN, n) / JN(e.inEdges, qN);
				if (isNaN(r)) {
					var i = e.inEdges.length;
					r = i ? JN(e.inEdges, GN, n) / i : 0;
				}
				if (n === "vertical") {
					var a = e.getLayout().x + (r - KN(e, n)) * t;
					e.setLayout({ x: a }, !0);
				} else {
					var o = e.getLayout().y + (r - KN(e, n)) * t;
					e.setLayout({ y: o }, !0);
				}
			}
		});
	});
}
function XN(e, t) {
	var n = t === "vertical" ? "x" : "y";
	F(e, function(e) {
		e.outEdges.sort(function(e, t) {
			return e.node2.getLayout()[n] - t.node2.getLayout()[n];
		}), e.inEdges.sort(function(e, t) {
			return e.node1.getLayout()[n] - t.node1.getLayout()[n];
		});
	}), F(e, function(e) {
		var t = 0, n = 0;
		F(e.outEdges, function(e) {
			e.setLayout({ sy: t }, !0), t += e.getLayout().dy;
		}), F(e.inEdges, function(e) {
			e.setLayout({ ty: n }, !0), n += e.getLayout().dy;
		});
	});
}
//#endregion
//#region node_modules/echarts/lib/chart/sankey/sankeyVisual.js
var ZN = Bc(xN, QN);
function QN(e) {
	e.eachSeriesByType(xN, function(e) {
		var t = e.getGraph(), n = t.nodes, r = t.edges;
		if (n.length) {
			var i = Infinity, a = -Infinity;
			F(n, function(e) {
				var t = e.getLayout().value;
				t < i && (i = t), t > a && (a = t);
			}), F(n, function(t) {
				var n = new RM({
					type: "color",
					mappingMethod: "linear",
					dataExtent: [i, a],
					visual: e.get("color")
				}).mapValueToVisual(t.getLayout().value), r = t.getModel().get(["itemStyle", "color"]);
				r == null ? (t.setVisual("color", n), t.setVisual("style", { fill: n })) : (t.setVisual("color", r), t.setVisual("style", { fill: r }));
			});
		}
		r.length && F(r, function(e) {
			var t = e.getModel().get("lineStyle");
			e.setVisual("style", t);
		});
	});
}
//#endregion
//#region node_modules/echarts/lib/chart/sankey/install.js
function $N(e) {
	e.registerChartView(TN), e.registerSeriesModel(SN), e.registerLayout(ON), e.registerVisual(ZN), e.registerAction({
		type: "dragNode",
		event: "dragnode",
		update: "update"
	}, function(e, t) {
		t.eachComponent({
			mainType: Uc,
			subType: xN,
			query: e
		}, function(t) {
			t.setNodePosition(e.dataIndex, [e.localX, e.localY]);
		});
	}), SM(e, Uc, xN);
}
//#endregion
//#region node_modules/echarts/lib/component/axisPointer/BaseAxisPointer.js
var eP = X(), tP = E, nP = z, rP = function() {
	function e() {
		this._dragging = !1, this.animationThreshold = 15;
	}
	return e.prototype.render = function(e, t, n, r) {
		var i = t.get("value"), a = t.get("status");
		if (this._axisModel = e, this._axisPointerModel = t, this._api = n, !(!r && this._lastValue === i && this._lastStatus === a)) {
			this._lastValue = i, this._lastStatus = a;
			var o = this._group, s = this._handle;
			if (!a || a === "hide") {
				o && o.hide(), s && s.hide();
				return;
			}
			o && o.show(), s && s.show();
			var c = {};
			this.makeElOption(c, i, e, t, n);
			var l = c.graphicKey;
			l !== this._lastGraphicKey && this.clear(n), this._lastGraphicKey = l;
			var u = this._moveAnimation = this.determineAnimation(e, t);
			if (!o) o = this._group = new ju(), this.createPointerEl(o, c, e, t), this.createLabelEl(o, c, e, t), n.getZr().add(o);
			else {
				var d = B(iP, t, u);
				this.updatePointerEl(o, c, d), this.updateLabelEl(o, c, d, t);
			}
			cP(o, t, !0), this._renderHandle(i);
		}
	}, e.prototype.remove = function(e) {
		this.clear(e);
	}, e.prototype.dispose = function(e) {
		this.clear(e);
	}, e.prototype.determineAnimation = function(e, t) {
		var n = t.get("animation"), r = e.axis, i = r.type === "category", a = t.get("snap");
		if (!a && !i) return !1;
		if (n === "auto" || n == null) {
			var o = this.animationThreshold;
			if (i && Fx(r).w > o) return !0;
			if (a) {
				var s = ZA(e).seriesDataCount, c = r.getExtent();
				return Math.abs(c[0] - c[1]) / s > o;
			}
			return !1;
		}
		return n === !0;
	}, e.prototype.makeElOption = function(e, t, n, r, i) {}, e.prototype.createPointerEl = function(e, t, n, r) {
		var i = t.pointer;
		if (i) {
			var a = eP(e).pointerEl = new Vd[i.type](tP(t.pointer));
			e.add(a);
		}
	}, e.prototype.createLabelEl = function(e, t, n, r) {
		if (t.label) {
			var i = eP(e).labelEl = new Ro(tP(t.label));
			e.add(i), oP(i, r);
		}
	}, e.prototype.updatePointerEl = function(e, t, n) {
		var r = eP(e).pointerEl;
		r && t.pointer && (r.setStyle(t.pointer.style), n(r, { shape: t.pointer.shape }));
	}, e.prototype.updateLabelEl = function(e, t, n, r) {
		var i = eP(e).labelEl;
		i && (i.setStyle(t.label.style), n(i, {
			x: t.label.x,
			y: t.label.y
		}), oP(i, r));
	}, e.prototype._renderHandle = function(e) {
		if (!(this._dragging || !this.updateHandleTransform)) {
			var t = this._axisPointerModel, n = this._api.getZr(), r = this._handle, i = t.getModel("handle"), a = t.get("status");
			if (!i.get("show") || !a || a === "hide") {
				r && n.remove(r), this._handle = null;
				return;
			}
			var o;
			this._handle || (o = !0, r = this._handle = pf(i.get("icon"), {
				cursor: "move",
				draggable: !0,
				onmousemove: function(e) {
					Nw(e.event);
				},
				onmousedown: nP(this._onHandleDragMove, this, 0, 0),
				drift: nP(this._onHandleDragMove, this),
				ondragend: nP(this._onHandleDragEnd, this)
			}), n.add(r)), cP(r, t, !1), r.setStyle(i.getItemStyle(null, [
				"color",
				"borderColor",
				"borderWidth",
				"opacity",
				"shadowColor",
				"shadowBlur",
				"shadowOffsetX",
				"shadowOffsetY"
			]));
			var s = i.get("size");
			V(s) || (s = [s, s]), r.scaleX = s[0] / 2, r.scaleY = s[1] / 2, RC(this, "_doDispatchAxisPointer", i.get("throttle") || 0, "fixRate"), this._moveHandleToValue(e, o);
		}
	}, e.prototype._moveHandleToValue = function(e, t) {
		iP(this._axisPointerModel, !t && this._moveAnimation, this._handle, sP(this.getHandleTransform(e, this._axisModel, this._axisPointerModel)));
	}, e.prototype._onHandleDragMove = function(e, t) {
		var n = this._handle;
		if (n) {
			this._dragging = !0;
			var r = this.updateHandleTransform(sP(n), [e, t], this._axisModel, this._axisPointerModel);
			this._payloadInfo = r, n.stopAnimation(), n.attr(sP(r)), eP(n).lastProp = null, this._doDispatchAxisPointer();
		}
	}, e.prototype._doDispatchAxisPointer = function() {
		if (this._handle) {
			var e = this._payloadInfo, t = this._axisModel;
			this._api.dispatchAction({
				type: "updateAxisPointer",
				x: e.cursorPoint[0],
				y: e.cursorPoint[1],
				tooltipOption: e.tooltipOption,
				axesInfo: [{
					axisDim: t.axis.dim,
					axisIndex: t.componentIndex
				}]
			});
		}
	}, e.prototype._onHandleDragEnd = function() {
		if (this._dragging = !1, this._handle) {
			var e = this._axisPointerModel.get("value");
			this._moveHandleToValue(e), this._api.dispatchAction({ type: "hideTip" });
		}
	}, e.prototype.clear = function(e) {
		this._lastValue = null, this._lastStatus = null;
		var t = e.getZr(), n = this._group, r = this._handle;
		t && n && (this._lastGraphicKey = null, n && t.remove(n), r && t.remove(r), this._group = null, this._handle = null, this._payloadInfo = null), zC(this, "_doDispatchAxisPointer");
	}, e.prototype.doClear = function() {}, e.prototype.buildLabel = function(e, t, n) {
		return n ||= 0, {
			x: e[n],
			y: e[1 - n],
			width: t[n],
			height: t[1 - n]
		};
	}, e;
}();
function iP(e, t, n, r) {
	aP(eP(n).lastProp, r) || (eP(n).lastProp = r, t ? Pd(n, r, e) : (n.stopAnimation(), n.attr(r)));
}
function aP(e, t) {
	if (G(e) && G(t)) {
		var n = !0;
		return F(t, function(t, r) {
			n &&= aP(e[r], t);
		}), !!n;
	}
	return e === t;
}
function oP(e, t) {
	e[t.get(["label", "show"]) ? "show" : "hide"]();
}
function sP(e) {
	return {
		x: e.x || 0,
		y: e.y || 0,
		rotation: e.rotation || 0
	};
}
function cP(e, t, n) {
	var r = t.get("z"), i = t.get("zlevel");
	e && e.traverse(function(e) {
		e.type !== "group" && (r != null && (e.z = r), i != null && (e.zlevel = i), e.silent = n);
	});
}
//#endregion
//#region node_modules/echarts/lib/component/axisPointer/viewHelper.js
function lP(e) {
	var t = e.get("type"), n = e.getModel(t + "Style"), r;
	return t === "line" ? (r = n.getLineStyle(), r.fill = null) : t === "shadow" && (r = n.getAreaStyle(), r.stroke = null), r;
}
function uP(e, t, n, r, i) {
	var a = fP(n.get("value"), t.axis, t.ecModel, n.get("seriesDataIndices"), {
		precision: n.get(["label", "precision"]),
		formatter: n.get(["label", "formatter"])
	}), o = n.getModel("label"), s = Ag(o.get("padding") || 0), c = o.getFont(), l = on(a, c), u = i.position, d = l.width + s[1] + s[3], f = l.height + s[0] + s[2], p = i.align;
	p === "right" && (u[0] -= d), p === "center" && (u[0] -= d / 2);
	var m = i.verticalAlign;
	m === "bottom" && (u[1] -= f), m === "middle" && (u[1] -= f / 2), dP(u, d, f, r);
	var h = o.get("backgroundColor");
	(!h || h === "auto") && (h = t.get([
		"axisLine",
		"lineStyle",
		"color"
	])), e.label = {
		x: u[0],
		y: u[1],
		style: Vf(o, {
			text: a,
			font: c,
			fill: o.getTextColor(),
			padding: s,
			backgroundColor: h
		}),
		z2: 10
	};
}
function dP(e, t, n, r) {
	var i = r.getWidth(), a = r.getHeight();
	e[0] = Math.min(e[0] + t, i) - t, e[1] = Math.min(e[1] + n, a) - n, e[0] = Math.max(e[0], 0), e[1] = Math.max(e[1], 0);
}
function fP(e, t, n, r, i) {
	e = t.scale.parse(e);
	var a = t.scale.getLabel({ value: e }, { precision: i.precision }), o = i.formatter;
	if (o) {
		var s = {
			value: sb(t, { value: e }),
			axisDimension: t.dim,
			axisIndex: t.index,
			seriesData: []
		};
		F(r, function(e) {
			var t = n.getSeriesByIndex(e.seriesIndex), r = e.dataIndexInside, i = t && t.getDataParams(r);
			i && s.seriesData.push(i);
		}), U(o) ? a = o.replace("{value}", a) : H(o) && (a = o(s));
	}
	return a;
}
function pP(e, t, n) {
	var r = tt();
	return ot(r, r, n.rotation), at(r, r, n.position), of([e.dataToCoord(t), (n.labelOffset || 0) + (n.labelDirection || 1) * (n.labelMargin || 0)], r);
}
function mP(e, t, n, r, i, a) {
	var o = yS.innerTextLayout(n.rotation, 0, n.labelDirection);
	n.labelMargin = i.get(["label", "margin"]), uP(t, r, i, a, {
		position: pP(r.axis, e, n),
		align: o.textAlign,
		verticalAlign: o.textVerticalAlign
	});
}
function hP(e, t, n) {
	return n ||= 0, {
		x1: e[n],
		y1: e[1 - n],
		x2: t[n],
		y2: t[1 - n]
	};
}
function gP(e, t, n) {
	return n ||= 0, {
		x: e[n],
		y: e[1 - n],
		width: t[n],
		height: t[1 - n]
	};
}
function _P(e, t, n) {
	return Fx(e, {
		fromStat: { sers: I(t, function(e) {
			return n.getSeriesByIndex(e.seriesIndex);
		}) },
		min: 1
	}).w;
}
function vP(e, t, n) {
	return [ns(ts(t[0], t[1]), e - n / 2), ts(e + n / 2, ns(t[0], t[1]))];
}
//#endregion
//#region node_modules/echarts/lib/component/axisPointer/CartesianAxisPointer.js
var yP = function(e) {
	r(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t.prototype.makeElOption = function(e, t, n, r, i) {
		var a = n.axis, o = a.grid, s = r.get("type"), c = a.getGlobalExtent(), l = bP(o, a).getOtherAxis(a).getGlobalExtent(), u = a.toGlobalCoord(a.dataToCoord(t, !0));
		if (s && s !== "none") {
			var d = lP(r), f = xP[s](a, u, c, l, r.get("seriesDataIndices"), r.ecModel);
			f.style = d, e.graphicKey = f.type, e.pointer = f;
		}
		mP(t, e, BS(o.getRect(), n), n, r, i);
	}, t.prototype.getHandleTransform = function(e, t, n) {
		var r = BS(t.axis.grid.getRect(), t, { labelInside: !1 });
		r.labelMargin = n.get(["handle", "margin"]);
		var i = pP(t.axis, e, r);
		return {
			x: i[0],
			y: i[1],
			rotation: r.rotation + (r.labelDirection < 0 ? Math.PI : 0)
		};
	}, t.prototype.updateHandleTransform = function(e, t, n, r) {
		var i = n.axis, a = i.grid, o = i.getGlobalExtent(!0), s = bP(a, i).getOtherAxis(i).getGlobalExtent(), c = i.dim === "x" ? 0 : 1, l = [e.x, e.y];
		l[c] += t[c], l[c] = ts(o[1], l[c]), l[c] = ns(o[0], l[c]);
		var u = (s[1] + s[0]) / 2, d = [u, u];
		return d[c] = l[c], {
			x: l[0],
			y: l[1],
			rotation: e.rotation,
			cursorPoint: d,
			tooltipOption: [{ verticalAlign: "middle" }, { align: "center" }][c]
		};
	}, t;
}(rP);
function bP(e, t) {
	var n = {};
	return n[t.dim + "AxisIndex"] = t.index, e.getCartesian(n);
}
var xP = {
	line: function(e, t, n, r) {
		return {
			type: "Line",
			subPixelOptimize: !0,
			shape: hP([t, r[0]], [t, r[1]], SP(e))
		};
	},
	shadow: function(e, t, n, r, i, a) {
		var o = _P(e, i, a), s = r[1] - r[0], c = vP(t, n, o), l = c[0], u = c[1];
		return {
			type: "Rect",
			shape: gP([l, r[0]], [u - l, s], SP(e))
		};
	}
};
function SP(e) {
	return e.dim === "x" ? 0 : 1;
}
//#endregion
//#region node_modules/echarts/lib/component/axisPointer/AxisPointerModel.js
var CP = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.type = "axisPointer", t.defaultOption = {
		show: "auto",
		z: 50,
		type: "line",
		snap: !1,
		triggerTooltip: !0,
		triggerEmphasis: !0,
		value: null,
		status: null,
		link: [],
		animation: null,
		animationDurationUpdate: 200,
		lineStyle: {
			color: Q.color.border,
			width: 1,
			type: "dashed"
		},
		shadowStyle: { color: Q.color.shadowTint },
		label: {
			show: !0,
			formatter: null,
			precision: "auto",
			margin: 3,
			color: Q.color.neutral00,
			padding: [
				5,
				7,
				5,
				7
			],
			backgroundColor: Q.color.accent60,
			borderColor: null,
			borderWidth: 0,
			borderRadius: 3
		},
		handle: {
			show: !1,
			icon: "M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7v-1.2h6.6z M13.3,22H6.7v-1.2h6.6z M13.3,19.6H6.7v-1.2h6.6z",
			size: 45,
			margin: 50,
			color: Q.color.accent40,
			throttle: 40
		}
	}, t;
}(Zg), wP = X(), TP = F;
function EP(e, t, n) {
	if (!J.node) {
		var r = t.getZr();
		wP(r).records || (wP(r).records = {}), DP(r, t);
		var i = wP(r).records[e] || (wP(r).records[e] = {});
		i.handler = n;
	}
}
function DP(e, t) {
	if (wP(e).initialized) return;
	wP(e).initialized = !0, n("click", B(AP, "click")), n("mousemove", B(AP, "mousemove")), n("mousewheel", B(AP, "mousewheel")), n("globalout", kP);
	function n(n, r) {
		e.on(n, function(n) {
			var i = jP(t);
			TP(wP(e).records, function(e) {
				e && r(e, n, i.dispatchAction);
			}), OP(i.pendings, t);
		});
	}
}
function OP(e, t) {
	var n = e.showTip.length, r = e.hideTip.length, i;
	n ? i = e.showTip[n - 1] : r && (i = e.hideTip[r - 1]), i && (i.dispatchAction = null, t.dispatchAction(i));
}
function kP(e, t, n) {
	e.handler("leave", null, n);
}
function AP(e, t, n, r) {
	t.handler(e, n, r);
}
function jP(e) {
	var t = {
		showTip: [],
		hideTip: []
	}, n = function(r) {
		var i = t[r.type];
		i ? i.push(r) : (r.dispatchAction = n, e.dispatchAction(r));
	};
	return {
		dispatchAction: n,
		pendings: t
	};
}
function MP(e, t) {
	if (!J.node) {
		var n = t.getZr();
		(wP(n).records || {})[e] && (wP(n).records[e] = null);
	}
}
//#endregion
//#region node_modules/echarts/lib/component/axisPointer/AxisPointerView.js
var NP = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.render = function(e, t, n) {
		var r = t.getComponent("tooltip"), i = e.get("triggerOn") || r && r.get("triggerOn") || "mousemove|click|mousewheel";
		EP("axisPointer", n, function(e, t, n) {
			i !== "none" && (e === "leave" || i.indexOf(e) >= 0) && n({
				type: "updateAxisPointer",
				currTrigger: e,
				x: t && t.offsetX,
				y: t && t.offsetY
			});
		});
	}, t.prototype.remove = function(e, t) {
		MP("axisPointer", t);
	}, t.prototype.dispose = function(e, t) {
		MP("axisPointer", t);
	}, t.type = "axisPointer", t;
}(zE);
//#endregion
//#region node_modules/echarts/lib/component/axisPointer/findPointFromSeries.js
function PP(e, t) {
	var n = [], r = e.seriesIndex, i;
	if (r == null || !(i = t.getSeriesByIndex(r))) return { point: [] };
	var a = i.getData(), o = fc(a, e);
	if (o == null || o < 0 || V(o)) return { point: [] };
	var s = a.getItemGraphicEl(o), c = i.coordinateSystem;
	if (i.getTooltipPosition) n = i.getTooltipPosition(o) || [];
	else if (c && c.dataToPoint) {
		if (e.isStacked) {
			var l = c.getBaseAxis(), u = c.getOtherAxis(l).dim, d = l.dim, f = +(u === "x" || u === "radius"), p = a.mapDimension(d), m = [];
			m[f] = a.get(p, o), m[1 - f] = a.get(a.getCalculationInfo("stackResultDimension"), o), n = c.dataToPoint(m) || [];
		} else n = c.dataToPoint(a.getValues(I(c.dimensions, function(e) {
			return a.mapDimension(e);
		}), o)) || [];
	} else if (s) {
		var h = s.getBoundingRect().clone();
		h.applyTransform(s.transform), n = [h.x + h.width / 2, h.y + h.height / 2];
	}
	return {
		point: n,
		el: s
	};
}
//#endregion
//#region node_modules/echarts/lib/component/axisPointer/axisTrigger.js
var FP = X();
function IP(e, t, n) {
	var r = e.currTrigger, i = [e.x, e.y], a = e, o = e.dispatchAction || z(n.dispatchAction, n), s = t.getComponent("axisPointer").coordSysAxesInfo;
	if (s) {
		KP(i) && (i = PP({
			seriesIndex: a.seriesIndex,
			dataIndex: a.dataIndex
		}, t).point);
		var c = KP(i), l = a.axesInfo, u = s.axesInfo, d = r === "leave" || KP(i), f = {}, p = {}, m = {
			list: [],
			map: {}
		}, h = {
			showPointer: B(zP, p),
			showTooltip: B(BP, m)
		};
		F(s.coordSysMap, function(e, t) {
			var n = c || e.containPoint(i);
			F(s.coordSysAxesInfo[t], function(e, t) {
				var r = e.axis, a = WP(l, e);
				if (!d && n && (!l || a)) {
					var o = a && a.value;
					o == null && !c && (o = r.pointToData(i)), o != null && LP(e, o, h, !1, f);
				}
			});
		});
		var g = {};
		return F(u, function(e, t) {
			var n = e.linkGroup;
			n && !p[t] && F(n.axesInfo, function(t, r) {
				var i = p[r];
				if (t !== e && i) {
					var a = i.value;
					n.mapper && (a = e.axis.scale.parse(n.mapper(a, GP(t), GP(e)))), g[e.key] = a;
				}
			});
		}), F(g, function(e, t) {
			LP(u[t], e, h, !0, f);
		}), VP(p, u, f), HP(m, i, e, o), UP(u, o, n), f;
	}
}
function LP(e, t, n, r, i) {
	var a = e.axis;
	if (!(a.scale.isBlank() || !a.containData(t))) {
		if (!e.involveSeries) {
			n.showPointer(e, t);
			return;
		}
		var o = RP(t, e), s = o.payloadBatch, c = o.snapToValue;
		s[0] && i.seriesIndex == null && k(i, s[0]), !r && e.snap && a.containData(c) && c != null && (t = c), n.showPointer(e, t, s), n.showTooltip(e, o, c);
	}
}
function RP(e, t) {
	var n = t.axis, r = n.dim, i = e, a = [], o = Number.MAX_VALUE, s = -1;
	return F(t.seriesModels, function(t, c) {
		var l = t.getData().mapDimensionsAll(r), u, d;
		if (t.getAxisTooltipData) {
			var f = t.getAxisTooltipData(l, e, n);
			d = f.dataIndices, u = f.nestestValue;
		} else {
			if (d = t.indicesOfNearest(r, l[0], e, n.type === "category" ? .5 : null), !d.length) return;
			u = t.getData().get(l[0], d[0]);
		}
		if (Ls(u)) {
			var p = e - u, m = Math.abs(p);
			m <= o && ((m < o || p >= 0 && s < 0) && (o = m, s = p, i = u, a.length = 0), F(d, function(e) {
				a.push({
					seriesIndex: t.seriesIndex,
					dataIndexInside: e,
					dataIndex: t.getData().getRawIndex(e)
				});
			}));
		}
	}), {
		payloadBatch: a,
		snapToValue: i
	};
}
function zP(e, t, n, r) {
	e[t.key] = {
		value: n,
		payloadBatch: r
	};
}
function BP(e, t, n, r) {
	var i = n.payloadBatch, a = t.axis, o = a.model, s = t.axisPointerModel;
	if (!(!t.triggerTooltip || !i.length)) {
		var c = t.coordSys.model, l = ej(c), u = e.map[l];
		u || (u = e.map[l] = {
			coordSysId: c.id,
			coordSysIndex: c.componentIndex,
			coordSysType: c.type,
			coordSysMainType: c.mainType,
			dataByAxis: []
		}, e.list.push(u)), u.dataByAxis.push({
			axisDim: a.dim,
			axisIndex: o.componentIndex,
			axisType: o.type,
			axisId: o.id,
			value: r,
			valueLabelOpt: {
				precision: s.get(["label", "precision"]),
				formatter: s.get(["label", "formatter"])
			},
			seriesDataIndices: i.slice()
		});
	}
}
function VP(e, t, n) {
	var r = n.axesInfo = [];
	F(t, function(t, n) {
		var i = t.axisPointerModel.option, a = e[n];
		a ? (!t.useHandle && (i.status = "show"), i.value = a.value, i.seriesDataIndices = (a.payloadBatch || []).slice()) : !t.useHandle && (i.status = "hide"), i.status === "show" && r.push({
			axisDim: t.axis.dim,
			axisIndex: t.axis.model.componentIndex,
			value: i.value
		});
	});
}
function HP(e, t, n, r) {
	if (KP(t) || !e.list.length) {
		r({ type: "hideTip" });
		return;
	}
	var i = ((e.list[0].dataByAxis[0] || {}).seriesDataIndices || [])[0] || {};
	r({
		type: "showTip",
		escapeConnect: !0,
		x: t[0],
		y: t[1],
		tooltipOption: n.tooltipOption,
		position: n.position,
		dataIndexInside: i.dataIndexInside,
		dataIndex: i.dataIndex,
		seriesIndex: i.seriesIndex,
		dataByCoordSys: e.list
	});
}
function UP(e, t, n) {
	var r = n.getZr(), i = "axisPointerLastHighlights", a = FP(r)[i] || {}, o = FP(r)[i] = {};
	F(e, function(e, t) {
		var n = e.axisPointerModel.option;
		n.status === "show" && e.triggerEmphasis && F(n.seriesDataIndices, function(e) {
			o[e.seriesIndex + "|" + e.dataIndex] = e;
		});
	});
	var s = [], c = [];
	function l(e) {
		return {
			seriesIndex: e.seriesIndex,
			dataIndex: e.dataIndex
		};
	}
	F(a, function(e, t) {
		!o[t] && c.push(l(e));
	}), F(o, function(e, t) {
		!a[t] && s.push(l(e));
	}), c.length && n.dispatchAction({
		type: "downplay",
		escapeConnect: !0,
		notBlur: !0,
		batch: c
	}), s.length && n.dispatchAction({
		type: "highlight",
		escapeConnect: !0,
		notBlur: !0,
		batch: s
	});
}
function WP(e, t) {
	for (var n = 0; n < (e || []).length; n++) {
		var r = e[n];
		if (t.axis.dim === r.axisDim && t.axis.model.componentIndex === r.axisIndex) return r;
	}
}
function GP(e) {
	var t = e.axis.model, n = {}, r = n.axisDim = e.axis.dim;
	return n.axisIndex = n[r + "AxisIndex"] = t.componentIndex, n.axisName = n[r + "AxisName"] = t.name, n.axisId = n[r + "AxisId"] = t.id, n;
}
function KP(e) {
	return !e || e[0] == null || isNaN(e[0]) || e[1] == null || isNaN(e[1]);
}
//#endregion
//#region node_modules/echarts/lib/component/axisPointer/install.js
function qP(e) {
	nj.registerAxisPointerClass("CartesianAxisPointer", yP), e.registerComponentModel(CP), e.registerComponentView(NP), e.registerPreprocessor(function(e) {
		if (e) {
			(!e.axisPointer || e.axisPointer.length === 0) && (e.axisPointer = {});
			var t = e.axisPointer.link;
			t && !V(t) && (e.axisPointer.link = [t]);
		}
	}), e.registerProcessor(e.PRIORITY.PROCESSOR.STATISTIC, { overallReset: function(e, t) {
		e.getComponent("axisPointer").coordSysAxesInfo = WA(e, t);
	} }), e.registerAction({
		type: "updateAxisPointer",
		event: "updateAxisPointer",
		update: ":updateAxisPointer"
	}, IP);
}
//#endregion
//#region node_modules/echarts/lib/component/grid/install.js
function JP(e) {
	sA(pj), sA(qP);
}
//#endregion
//#region node_modules/echarts/lib/component/helper/listComponent.js
function YP(e, t) {
	var n = Ag(t.get("padding")), r = t.getItemStyle(["color", "opacity"]);
	return r.fill = t.get("backgroundColor"), new No({
		shape: {
			x: e.x - n[3],
			y: e.y - n[0],
			width: e.width + n[1] + n[3],
			height: e.height + n[0] + n[2],
			r: t.get("borderRadius")
		},
		style: r,
		silent: !0,
		z2: -1
	});
}
//#endregion
//#region node_modules/echarts/lib/component/tooltip/TooltipModel.js
var XP = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.type = "tooltip", t.dependencies = ["axisPointer"], t.defaultOption = {
		z: 60,
		show: !0,
		showContent: !0,
		trigger: "item",
		triggerOn: "mousemove|click|mousewheel",
		alwaysShowContent: !1,
		renderMode: "auto",
		confine: null,
		showDelay: 0,
		hideDelay: 100,
		transitionDuration: .4,
		displayTransition: !0,
		enterable: !1,
		backgroundColor: Q.color.neutral00,
		shadowBlur: 10,
		shadowColor: "rgba(0, 0, 0, .2)",
		shadowOffsetX: 1,
		shadowOffsetY: 2,
		borderRadius: 4,
		borderWidth: 1,
		defaultBorderColor: Q.color.border,
		padding: null,
		extraCssText: "",
		axisPointer: {
			type: "line",
			axis: "auto",
			animation: "auto",
			animationDurationUpdate: 200,
			animationEasingUpdate: "exponentialOut",
			crossStyle: {
				color: Q.color.borderShade,
				width: 1,
				type: "dashed",
				textStyle: {}
			}
		},
		textStyle: {
			color: Q.color.tertiary,
			fontSize: 14
		}
	}, t;
}(Zg);
//#endregion
//#region node_modules/echarts/lib/component/tooltip/helper.js
function ZP(e) {
	var t = e.get("confine");
	return t == null ? e.get("renderMode") === "richText" : !!t;
}
function QP(e) {
	if (J.domSupported) {
		for (var t = document.documentElement.style, n = 0, r = e.length; n < r; n++) if (e[n] in t) return e[n];
	}
}
var $P = QP([
	"transform",
	"webkitTransform",
	"OTransform",
	"MozTransform",
	"msTransform"
]), eF = QP([
	"webkitTransition",
	"transition",
	"OTransition",
	"MozTransition",
	"msTransition"
]);
function tF(e, t) {
	if (!e) return t;
	t = kg(t, !0);
	var n = e.indexOf(t);
	return e = n === -1 ? t : "-" + e.slice(0, n) + "-" + t, e.toLowerCase();
}
function nF(e, t) {
	var n = e.currentStyle || document.defaultView && document.defaultView.getComputedStyle(e);
	return n ? t ? n[t] : n : null;
}
//#endregion
//#region node_modules/echarts/lib/component/tooltip/TooltipHTMLContent.js
var rF = tF(eF, "transition"), iF = tF($P, "transform"), aF = "position:absolute;display:block;border-style:solid;white-space:nowrap;z-index:9999999;" + (J.transform3dSupported ? "will-change:transform;" : "");
function oF(e) {
	return e = e === "left" ? "right" : e === "right" ? "left" : e === "top" ? "bottom" : "top", e;
}
function sF(e, t, n) {
	if (!U(n) || n === "inside") return "";
	var r = e.get("backgroundColor"), i = e.get("borderWidth");
	t = Ig(t);
	var a = oF(n), o = Math.max(Math.round(i) * 1.5, 6), s = "", c = iF + ":", l;
	M(["left", "right"], a) > -1 ? (s += "top:50%", c += "translateY(-50%) rotate(" + (l = a === "left" ? -225 : -45) + "deg)") : (s += "left:50%", c += "translateX(-50%) rotate(" + (l = a === "top" ? 225 : 45) + "deg)");
	var u = l * Math.PI / 180, d = o + i, f = d * Math.abs(Math.cos(u)) + d * Math.abs(Math.sin(u)), p = Math.round(((f - Math.SQRT2 * i) / 2 + Math.SQRT2 * i - (f - d) / 2) * 100) / 100;
	s += ";" + a + ":-" + p + "px";
	var m = t + " solid " + i + "px;";
	return "<div style=\"" + [
		"position:absolute;width:" + o + "px;height:" + o + "px;z-index:-1;",
		s + ";" + c + ";",
		"border-bottom:" + m,
		"border-right:" + m,
		"background-color:" + r + ";"
	].join("") + "\"></div>";
}
function cF(e, t, n) {
	var r = "cubic-bezier(0.23,1,0.32,1)", i = "", a = "";
	return n && (i = " " + e / 2 + "s " + r, a = "opacity" + i + ",visibility" + i), t || (i = " " + e + "s " + r, a += (a.length ? "," : "") + (J.transformSupported ? "" + iF + i : ",left" + i + ",top" + i)), rF + ":" + a;
}
function lF(e, t, n) {
	var r = e.toFixed(0) + "px", i = t.toFixed(0) + "px";
	if (!J.transformSupported) return n ? "top:" + i + ";left:" + r + ";" : [["top", i], ["left", r]];
	var a = J.transform3dSupported, o = "translate" + (a ? "3d" : "") + "(" + r + "," + i + (a ? ",0" : "") + ")";
	return n ? "top:0;left:0;" + iF + ":" + o + ";" : [
		["top", 0],
		["left", 0],
		[$P, o]
	];
}
function uF(e) {
	var t = [], n = e.get("fontSize"), r = e.getTextColor();
	r && t.push("color:" + r), t.push("font:" + e.getFont());
	var i = K(e.get("lineHeight"), Math.round(n * 3 / 2));
	n && t.push("line-height:" + i + "px");
	var a = e.get("textShadowColor"), o = e.get("textShadowBlur") || 0, s = e.get("textShadowOffsetX") || 0, c = e.get("textShadowOffsetY") || 0;
	return a && o && t.push("text-shadow:" + s + "px " + c + "px " + o + "px " + a), F(["decoration", "align"], function(n) {
		var r = e.get(n);
		r && t.push("text-" + n + ":" + r);
	}), t.join(";");
}
function dF(e, t, n, r) {
	var i = [], a = e.get("transitionDuration"), o = e.get("backgroundColor"), s = e.get("shadowBlur"), c = e.get("shadowColor"), l = e.get("shadowOffsetX"), u = e.get("shadowOffsetY"), d = e.getModel("textStyle"), f = K_(e, "html"), p = l + "px " + u + "px " + s + "px " + c;
	return i.push("box-shadow:" + p), t && a > 0 && i.push(cF(a, n, r)), o && i.push("background-color:" + o), F([
		"width",
		"color",
		"radius"
	], function(t) {
		var n = "border-" + t, r = kg(n), a = e.get(r);
		a != null && i.push(n + ":" + a + (t === "color" ? "" : "px"));
	}), i.push(uF(d)), f != null && i.push("padding:" + Ag(f).join("px ") + "px"), i.join(";") + ";";
}
function fF(e, t, n, r, i) {
	var a = t && t.painter;
	if (n) {
		var o = a && a.getViewportRoot();
		o && bh(e, o, n, r, i);
	} else {
		e[0] = r, e[1] = i;
		var s = a && a.getViewportRootOffset();
		s && (e[0] += s.offsetLeft, e[1] += s.offsetTop);
	}
	e[2] = e[0] / t.getWidth(), e[3] = e[1] / t.getHeight();
}
var pF = function() {
	function e(e, t) {
		if (this._show = !1, this._styleCoord = [
			0,
			0,
			0,
			0
		], this._enterable = !0, this._alwaysShowContent = !1, this._firstShow = !0, this._longHide = !0, J.wxa) return null;
		var n = document.createElement("div");
		n.domBelongToZr = !0, this.el = n;
		var r = this._zr = e.getZr(), i = t.appendTo, a = i && (U(i) ? document.querySelector(i) : se(i) ? i : H(i) && i(e.getDom()));
		fF(this._styleCoord, r, a, e.getWidth() / 2, e.getHeight() / 2), (a || e.getDom()).appendChild(n), this._api = e, this._container = a;
		var o = this;
		n.onmouseenter = function() {
			o._enterable && (clearTimeout(o._hideTimeout), o._show = !0), o._inContent = !0;
		}, n.onmousemove = function(e) {
			if (e ||= window.event, !o._enterable) {
				var t = r.handler;
				kw(r.painter.getViewportRoot(), e, !0), t.dispatch("mousemove", e);
			}
		}, n.onmouseleave = function() {
			o._inContent = !1, o._enterable && o._show && o.hideLater(o._hideDelay);
		};
	}
	return e.prototype.update = function(e) {
		if (!this._container) {
			var t = this._api.getDom(), n = nF(t, "position"), r = t.style;
			r.position !== "absolute" && n !== "absolute" && (r.position = "relative");
		}
		var i = e.get("alwaysShowContent");
		i && this._moveIfResized(), this._alwaysShowContent = i, this._enableDisplayTransition = e.get("displayTransition") && e.get("transitionDuration") > 0, this.el.className = e.get("className") || "";
	}, e.prototype.show = function(e, t) {
		clearTimeout(this._hideTimeout), clearTimeout(this._longHideTimeout);
		var n = this.el, r = n.style, i = this._styleCoord;
		n.innerHTML ? r.cssText = aF + dF(e, !this._firstShow, this._longHide, this._enableDisplayTransition) + lF(i[0], i[1], !0) + ("border-color:" + Ig(t) + ";") + (e.get("extraCssText") || "") + (";pointer-events:" + (this._enterable ? "auto" : "none")) : r.display = "none", this._show = !0, this._firstShow = !1, this._longHide = !1;
	}, e.prototype.setContent = function(e, t, n, r, i) {
		var a = this.el;
		if (e == null) {
			a.innerHTML = "";
			return;
		}
		var o = "";
		if (U(i) && n.get("trigger") === "item" && !ZP(n) && (o = sF(n, r, i)), U(e)) a.innerHTML = e + o;
		else if (e) {
			a.innerHTML = "", V(e) || (e = [e]);
			for (var s = 0; s < e.length; s++) se(e[s]) && e[s].parentNode !== a && a.appendChild(e[s]);
			if (o && a.childNodes.length) {
				var c = document.createElement("div");
				c.innerHTML = o, a.appendChild(c);
			}
		}
	}, e.prototype.setEnterable = function(e) {
		this._enterable = e;
	}, e.prototype.getSize = function() {
		var e = this.el;
		return e ? [e.offsetWidth, e.offsetHeight] : [0, 0];
	}, e.prototype.moveTo = function(e, t) {
		if (this.el) {
			var n = this._styleCoord;
			if (fF(n, this._zr, this._container, e, t), n[0] != null && n[1] != null) {
				var r = this.el.style;
				F(lF(n[0], n[1]), function(e) {
					r[e[0]] = e[1];
				});
			}
		}
	}, e.prototype._moveIfResized = function() {
		var e = this._styleCoord[2], t = this._styleCoord[3];
		this.moveTo(e * this._zr.getWidth(), t * this._zr.getHeight());
	}, e.prototype.hide = function() {
		var e = this, t = this.el.style;
		this._enableDisplayTransition ? (t.visibility = "hidden", t.opacity = "0") : t.display = "none", J.transform3dSupported && (t.willChange = ""), this._show = !1, this._longHideTimeout = setTimeout(function() {
			return e._longHide = !0;
		}, 500);
	}, e.prototype.hideLater = function(e) {
		this._show && !(this._inContent && this._enterable) && !this._alwaysShowContent && (e ? (this._hideDelay = e, this._show = !1, this._hideTimeout = setTimeout(z(this.hide, this), e)) : this.hide());
	}, e.prototype.isShow = function() {
		return this._show;
	}, e.prototype.dispose = function() {
		clearTimeout(this._hideTimeout), clearTimeout(this._longHideTimeout);
		var e = this._zr;
		xh(e && e.painter && e.painter.getViewportRoot(), this._container);
		var t = this.el;
		if (t) {
			t.onmouseenter = t.onmousemove = t.onmouseleave = null;
			var n = t.parentNode;
			n && n.removeChild(t);
		}
		this.el = this._container = null;
	}, e;
}(), mF = function() {
	function e(e) {
		this._show = !1, this._styleCoord = [
			0,
			0,
			0,
			0
		], this._alwaysShowContent = !1, this._enterable = !0, this._zr = e.getZr(), _F(this._styleCoord, this._zr, e.getWidth() / 2, e.getHeight() / 2);
	}
	return e.prototype.update = function(e) {
		var t = e.get("alwaysShowContent");
		t && this._moveIfResized(), this._alwaysShowContent = t;
	}, e.prototype.show = function() {
		this._hideTimeout && clearTimeout(this._hideTimeout), this.el.show(), this._show = !0;
	}, e.prototype.setContent = function(e, t, n, r, i) {
		var a = this;
		G(e) && Us(""), this.el && this._zr.remove(this.el);
		var o = n.getModel("textStyle");
		this.el = new Ro({
			style: {
				rich: t.richTextStyles,
				text: e,
				lineHeight: 22,
				borderWidth: 1,
				borderColor: r,
				textShadowColor: o.get("textShadowColor"),
				fill: n.get(["textStyle", "color"]),
				padding: K_(n, "richText"),
				verticalAlign: "top",
				align: "left"
			},
			z: n.get("z")
		}), F([
			"backgroundColor",
			"borderRadius",
			"shadowColor",
			"shadowBlur",
			"shadowOffsetX",
			"shadowOffsetY"
		], function(e) {
			a.el.style[e] = n.get(e);
		}), F([
			"textShadowBlur",
			"textShadowOffsetX",
			"textShadowOffsetY"
		], function(e) {
			a.el.style[e] = o.get(e) || 0;
		}), this._zr.add(this.el);
		var s = this;
		this.el.on("mouseover", function() {
			s._enterable && (clearTimeout(s._hideTimeout), s._show = !0), s._inContent = !0;
		}), this.el.on("mouseout", function() {
			s._enterable && s._show && s.hideLater(s._hideDelay), s._inContent = !1;
		});
	}, e.prototype.setEnterable = function(e) {
		this._enterable = e;
	}, e.prototype.getSize = function() {
		var e = this.el, t = this.el.getBoundingRect(), n = gF(e.style);
		return [t.width + n.left + n.right, t.height + n.top + n.bottom];
	}, e.prototype.moveTo = function(e, t) {
		var n = this.el;
		if (n) {
			var r = this._styleCoord;
			_F(r, this._zr, e, t), e = r[0], t = r[1];
			var i = n.style, a = hF(i.borderWidth || 0), o = gF(i);
			n.x = e + a + o.left, n.y = t + a + o.top, n.markRedraw();
		}
	}, e.prototype._moveIfResized = function() {
		var e = this._styleCoord[2], t = this._styleCoord[3];
		this.moveTo(e * this._zr.getWidth(), t * this._zr.getHeight());
	}, e.prototype.hide = function() {
		this.el && this.el.hide(), this._show = !1;
	}, e.prototype.hideLater = function(e) {
		this._show && !(this._inContent && this._enterable) && !this._alwaysShowContent && (e ? (this._hideDelay = e, this._show = !1, this._hideTimeout = setTimeout(z(this.hide, this), e)) : this.hide());
	}, e.prototype.isShow = function() {
		return this._show;
	}, e.prototype.dispose = function() {
		this._zr.remove(this.el);
	}, e;
}();
function hF(e) {
	return Math.max(0, e);
}
function gF(e) {
	var t = hF(e.shadowBlur || 0), n = hF(e.shadowOffsetX || 0), r = hF(e.shadowOffsetY || 0);
	return {
		left: hF(t - n),
		right: hF(t + n),
		top: hF(t - r),
		bottom: hF(t + r)
	};
}
function _F(e, t, n, r) {
	e[0] = n, e[1] = r, e[2] = e[0] / t.getWidth(), e[3] = e[1] / t.getHeight();
}
//#endregion
//#region node_modules/echarts/lib/component/tooltip/TooltipView.js
var vF = new No({ shape: {
	x: -1,
	y: -1,
	width: 2,
	height: 2
} }), yF = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.init = function(e, t) {
		if (!(J.node || !t.getDom())) {
			var n = e.getComponent("tooltip"), r = this._renderMode = xc(n.get("renderMode"));
			this._tooltipContent = r === "richText" ? new mF(t) : new pF(t, { appendTo: n.get("appendToBody", !0) ? "body" : n.get("appendTo", !0) });
		}
	}, t.prototype.render = function(e, t, n) {
		if (!(J.node || !n.getDom())) {
			this.group.removeAll(), this._tooltipModel = e, this._ecModel = t, this._api = n;
			var r = this._tooltipContent;
			r.update(e), r.setEnterable(e.get("enterable")), this._initGlobalListener(), this._keepShow(), this._renderMode !== "richText" && e.get("transitionDuration") ? RC(this, "_updatePosition", 50, "fixRate") : zC(this, "_updatePosition");
		}
	}, t.prototype._initGlobalListener = function() {
		var e = this._tooltipModel.get("triggerOn");
		EP("itemTooltip", this._api, z(function(t, n, r) {
			e !== "none" && (e.indexOf(t) >= 0 ? this._tryShow(n, r) : t === "leave" && this._hide(r));
		}, this));
	}, t.prototype._keepShow = function() {
		var e = this._tooltipModel, t = this._ecModel, n = this._api, r = e.get("triggerOn");
		if (e.get("trigger") !== "axis" && (this._lastDataByCoordSys = null, this._cbParamsList = null), this._lastX != null && this._lastY != null && r !== "none" && r !== "click") {
			var i = this;
			clearTimeout(this._refreshUpdateTimeout), this._refreshUpdateTimeout = setTimeout(function() {
				!n.isDisposed() && i.manuallyShowTip(e, t, n, {
					x: i._lastX,
					y: i._lastY,
					dataByCoordSys: i._lastDataByCoordSys
				});
			});
		}
	}, t.prototype.manuallyShowTip = function(e, t, n, r) {
		if (!(r.from === this.uid || J.node || !n.getDom())) {
			var i = xF(r, n);
			this._ticket = "";
			var a = r.dataByCoordSys, o = EF(r, t, n);
			if (o) {
				var s = o.el.getBoundingRect().clone();
				s.applyTransform(o.el.transform), this._tryShow({
					offsetX: s.x + s.width / 2,
					offsetY: s.y + s.height / 2,
					target: o.el,
					position: r.position,
					positionDefault: "bottom"
				}, i);
			} else if (r.tooltip && r.x != null && r.y != null) {
				var c = vF;
				c.x = r.x, c.y = r.y, c.update(), Z(c).tooltipConfig = {
					name: null,
					option: r.tooltip
				}, this._tryShow({
					offsetX: r.x,
					offsetY: r.y,
					target: c
				}, i);
			} else if (a) this._tryShow({
				offsetX: r.x,
				offsetY: r.y,
				position: r.position,
				dataByCoordSys: a,
				tooltipOption: r.tooltipOption
			}, i);
			else if (r.seriesIndex != null) {
				if (this._manuallyAxisShowTip(e, t, n, r)) return;
				var l = PP(r, t), u = l.point[0], d = l.point[1];
				u != null && d != null && this._tryShow({
					offsetX: u,
					offsetY: d,
					target: l.el,
					position: r.position,
					positionDefault: "bottom"
				}, i);
			} else r.x != null && r.y != null && (n.dispatchAction({
				type: "updateAxisPointer",
				x: r.x,
				y: r.y
			}), this._tryShow({
				offsetX: r.x,
				offsetY: r.y,
				position: r.position,
				target: n.getZr().findHover(r.x, r.y).target
			}, i));
		}
	}, t.prototype.manuallyHideTip = function(e, t, n, r) {
		var i = this._tooltipContent;
		this._tooltipModel && i.hideLater(this._tooltipModel.get("hideDelay")), this._lastX = this._lastY = this._lastDataByCoordSys = null, this._cbParamsList = null, r.from !== this.uid && this._hide(xF(r, n));
	}, t.prototype._manuallyAxisShowTip = function(e, t, n, r) {
		var i = r.seriesIndex, a = r.dataIndex, o = t.getComponent("axisPointer").coordSysAxesInfo;
		if (i != null && a != null && o != null) {
			var s = t.getSeriesByIndex(i);
			if (s && bF([
				s.getData().getItemModel(a),
				s,
				(s.coordinateSystem || {}).model
			], this._tooltipModel).get("trigger") === "axis") return n.dispatchAction({
				type: "updateAxisPointer",
				seriesIndex: i,
				dataIndex: a,
				position: r.position
			}), !0;
		}
	}, t.prototype._tryShow = function(e, t) {
		var n = e.target;
		if (this._tooltipModel) {
			this._lastX = e.offsetX, this._lastY = e.offsetY;
			var r = e.dataByCoordSys;
			if (r && r.length) this._showAxisTooltip(r, e);
			else if (n) {
				if (Z(n).ssrType === "legend") return;
				this._lastDataByCoordSys = null, this._cbParamsList = null;
				var i, a;
				CD(n, function(e) {
					if (e.tooltipDisabled) return i = a = null, !0;
					i || a || (Z(e).dataIndex == null ? Z(e).tooltipConfig != null && (a = e) : i = e);
				}, !0), i ? this._showSeriesItemTooltip(e, i, t) : a ? this._showComponentItemTooltip(e, a, t) : this._hide(t);
			} else this._lastDataByCoordSys = null, this._cbParamsList = null, this._hide(t);
		}
	}, t.prototype._showOrMove = function(e, t) {
		var n = e.get("showDelay");
		t = z(t, this), clearTimeout(this._showTimout), n > 0 ? this._showTimout = setTimeout(t, n) : t();
	}, t.prototype._showAxisTooltip = function(e, t) {
		var n = this._ecModel, r = this._tooltipModel, i = [t.offsetX, t.offsetY], a = bF([t.tooltipOption], r), o = this._renderMode, s = [], c = M_("section", {
			blocks: [],
			noHeader: !0
		}), l = [], u = new q_();
		F(e, function(e) {
			F(e.dataByAxis, function(e) {
				var t = n.getComponent(e.axisDim + "Axis", e.axisIndex), i = e.value, a = t.axis, d = a.scale.parse(i);
				if (!(!t || i == null)) {
					var f = fP(i, a, n, e.seriesDataIndices, e.valueLabelOpt), p = M_("section", {
						header: f,
						noHeader: !he(f),
						sortBlocks: !0,
						blocks: []
					});
					c.blocks.push(p), F(e.seriesDataIndices, function(i) {
						var a = n.getSeriesByIndex(i.seriesIndex), c = i.dataIndexInside, m = a.getDataParams(c);
						if (!(m.dataIndex < 0)) {
							m.axisDim = e.axisDim, m.axisIndex = e.axisIndex, m.axisType = e.axisType, m.axisId = e.axisId, m.axisValue = sb(t.axis, { value: d }), m.axisValueLabel = f, m.marker = u.makeTooltipMarker("item", Ig(m.color), o);
							var h = o_(a.formatTooltip(c, !0, null)), g = h.frag;
							if (g) {
								var _ = bF([a], r).get("valueFormatter");
								p.blocks.push(_ ? k({ valueFormatter: _ }, g) : g);
							}
							h.text && l.push(h.text), s.push(m);
						}
					});
				}
			});
		}), c.blocks.reverse(), l.reverse();
		var d = t.position, f = R_(c, u, o, a.get("order"), n.get("useUTC"), a.get("textStyle"));
		f && l.unshift(f);
		var p = o === "richText" ? "\n\n" : "<br/>", m = l.join(p);
		this._showOrMove(a, function() {
			this._updateContentNotChangedOnAxis(e, s) ? this._updatePosition(a, d, i[0], i[1], this._tooltipContent, s) : this._showTooltipContent(a, m, s, Math.random() + "", i[0], i[1], d, null, u);
		});
	}, t.prototype._showSeriesItemTooltip = function(e, t, n) {
		var r = this._ecModel, i = Z(t), a = i.seriesIndex, o = r.getSeriesByIndex(a), s = i.dataModel || o, c = i.dataIndex, l = i.dataType, u = s.getData(l), d = this._renderMode, f = e.positionDefault, p = bF([
			u.getItemModel(c),
			s,
			o && (o.coordinateSystem || {}).model
		], this._tooltipModel, f ? { position: f } : null), m = p.get("trigger");
		if (m == null || m === "item") {
			var h = s.getDataParams(c, l), g = new q_();
			h.marker = g.makeTooltipMarker("item", Ig(h.color), d);
			var _ = o_(s.formatTooltip(c, !1, l)), v = p.get("order"), y = p.get("valueFormatter"), b = _.frag, x = b ? R_(y ? k({ valueFormatter: y }, b) : b, g, d, v, r.get("useUTC"), p.get("textStyle")) : _.text, S = "item_" + s.name + "_" + c;
			this._showOrMove(p, function() {
				this._showTooltipContent(p, x, h, S, e.offsetX, e.offsetY, e.position, e.target, g);
			}), n({
				type: "showTip",
				dataIndexInside: c,
				dataIndex: u.getRawIndex(c),
				seriesIndex: a,
				from: this.uid
			});
		}
	}, t.prototype._showComponentItemTooltip = function(e, t, n) {
		var r = this._renderMode === "html", i = Z(t), a = i.tooltipConfig.option || {}, o = a.encodeHTMLContent;
		if (U(a)) {
			var s = a;
			a = {
				content: s,
				formatter: s
			}, o = !0;
		}
		o && r && a.content && (a = E(a), a.content = Oh(a.content));
		var c = [a], l = this._ecModel.getComponent(i.componentMainType, i.componentIndex);
		l && c.push(l), c.push({ formatter: a.content });
		var u = e.positionDefault, d = bF(c, this._tooltipModel, u ? { position: u } : null), f = d.get("content"), p = Math.random() + "", m = new q_();
		this._showOrMove(d, function() {
			var n = E(d.get("formatterParams") || {});
			this._showTooltipContent(d, f, n, p, e.offsetX, e.offsetY, e.position, t, m);
		}), n({
			type: "showTip",
			from: this.uid
		});
	}, t.prototype._showTooltipContent = function(e, t, n, r, i, a, o, s, c) {
		if (this._ticket = "", !(!e.get("showContent") || !e.get("show"))) {
			var l = this._tooltipContent;
			l.setEnterable(e.get("enterable"));
			var u = e.get("formatter");
			o ||= e.get("position");
			var d = t, f = this._getNearestPoint([i, a], n, e.get("trigger"), e.get("borderColor"), e.get("defaultBorderColor", !0)).color;
			if (u) {
				if (U(u)) {
					var p = e.ecModel.get("useUTC"), m = V(n) ? n[0] : n, h = m && m.axisType && m.axisType.indexOf("time") >= 0;
					d = u, h && (d = ug(m.axisValue, d, p)), d = Pg(d, n, !0);
				} else if (H(u)) {
					var g = z(function(t, r) {
						t === this._ticket && (l.setContent(r, c, e, f, o), this._updatePosition(e, o, i, a, l, n, s));
					}, this);
					this._ticket = r, d = u(n, r, g);
				} else d = u;
			}
			l.setContent(d, c, e, f, o), l.show(e, f), this._updatePosition(e, o, i, a, l, n, s);
		}
	}, t.prototype._getNearestPoint = function(e, t, n, r, i) {
		if (n === "axis" || V(t)) return { color: r || i };
		if (!V(t)) return { color: r || t.color || t.borderColor };
	}, t.prototype._updatePosition = function(e, t, n, r, i, a, o) {
		var s = this._api.getWidth(), c = this._api.getHeight();
		t ||= e.get("position");
		var l = i.getSize(), u = e.get("align"), d = e.get("verticalAlign"), f = o && o.getBoundingRect().clone();
		if (o && f.applyTransform(o.transform), H(t) && (t = t([n, r], a, i.el, f, {
			viewSize: [s, c],
			contentSize: l.slice()
		})), V(t)) n = ps(t[0], s), r = ps(t[1], c);
		else if (G(t)) {
			var p = t;
			p.width = l[0], p.height = l[1];
			var m = Ug(p, {
				width: s,
				height: c
			});
			n = m.x, r = m.y, u = null, d = null;
		} else if (U(t) && o) {
			var h = wF(t, f, l, e.get("borderWidth"));
			n = h[0], r = h[1];
		} else {
			var h = SF(n, r, i, s, c, u ? null : 20, d ? null : 20);
			n = h[0], r = h[1];
		}
		if (u && (n -= TF(u) ? l[0] / 2 : u === "right" ? l[0] : 0), d && (r -= TF(d) ? l[1] / 2 : d === "bottom" ? l[1] : 0), ZP(e)) {
			var h = CF(n, r, i, s, c);
			n = h[0], r = h[1];
		}
		i.moveTo(n, r);
	}, t.prototype._updateContentNotChangedOnAxis = function(e, t) {
		var n = this._lastDataByCoordSys, r = this._cbParamsList, i = !!n && n.length === e.length;
		return i && F(n, function(n, a) {
			var o = n.dataByAxis || [], s = (e[a] || {}).dataByAxis || [];
			i &&= o.length === s.length, i && F(o, function(e, n) {
				var a = s[n] || {}, o = e.seriesDataIndices || [], c = a.seriesDataIndices || [];
				i = i && e.value === a.value && e.axisType === a.axisType && e.axisId === a.axisId && o.length === c.length, i && F(o, function(e, t) {
					var n = c[t];
					i = i && e.seriesIndex === n.seriesIndex && e.dataIndex === n.dataIndex;
				}), r && F(e.seriesDataIndices, function(e) {
					var n = e.seriesIndex, a = t[n], o = r[n];
					a && o && o.data !== a.data && (i = !1);
				});
			});
		}), this._lastDataByCoordSys = e, this._cbParamsList = t, !!i;
	}, t.prototype._hide = function(e) {
		this._lastDataByCoordSys = null, this._cbParamsList = null, e({
			type: "hideTip",
			from: this.uid
		});
	}, t.prototype.dispose = function(e, t) {
		J.node || !t.getDom() || (zC(this, "_updatePosition"), this._tooltipContent.dispose(), MP("itemTooltip", t), this._tooltipContent = null, this._tooltipModel = null, this._lastDataByCoordSys = null, this._cbParamsList = null);
	}, t.type = "tooltip", t;
}(zE);
function bF(e, t, n) {
	var r = t.ecModel, i;
	n ? (i = new lp(n, r, r), i = new lp(t.option, i, r)) : i = t;
	for (var a = e.length - 1; a >= 0; a--) {
		var o = e[a];
		o && (o instanceof lp && (o = o.get("tooltip", !0)), U(o) && (o = { formatter: o }), o && (i = new lp(o, i, r)));
	}
	return i;
}
function xF(e, t) {
	return e.dispatchAction || z(t.dispatchAction, t);
}
function SF(e, t, n, r, i, a, o) {
	var s = n.getSize(), c = s[0], l = s[1];
	return a != null && (e + c + a + 2 > r ? e -= c + a : e += a), o != null && (t + l + o > i ? t -= l + o : t += o), [e, t];
}
function CF(e, t, n, r, i) {
	var a = n.getSize(), o = a[0], s = a[1];
	return e = Math.min(e + o, r) - o, t = Math.min(t + s, i) - s, e = Math.max(e, 0), t = Math.max(t, 0), [e, t];
}
function wF(e, t, n, r) {
	var i = n[0], a = n[1], o = Math.ceil(Math.SQRT2 * r) + 8, s = 0, c = 0, l = t.width, u = t.height;
	switch (e) {
		case "inside":
			s = t.x + l / 2 - i / 2, c = t.y + u / 2 - a / 2;
			break;
		case "top":
			s = t.x + l / 2 - i / 2, c = t.y - a - o;
			break;
		case "bottom":
			s = t.x + l / 2 - i / 2, c = t.y + u + o;
			break;
		case "left":
			s = t.x - i - o, c = t.y + u / 2 - a / 2;
			break;
		case "right": s = t.x + l + o, c = t.y + u / 2 - a / 2;
	}
	return [s, c];
}
function TF(e) {
	return e === "center" || e === "middle";
}
function EF(e, t, n) {
	var r = hc(e).queryOptionMap, i = r.keys()[0];
	if (!(!i || i === "series")) {
		var a = _c(t, i, r.get(i), {
			useDefault: !1,
			enableAll: !1,
			enableNone: !1
		}).models[0];
		if (a) {
			var o = n.getViewOfComponentModel(a), s;
			if (o.group.traverse(function(t) {
				var n = Z(t).tooltipConfig;
				if (n && n.name === e.name) return s = t, !0;
			}), s) return {
				componentMainType: i,
				componentIndex: a.componentIndex,
				el: s
			};
		}
	}
}
//#endregion
//#region node_modules/echarts/lib/component/tooltip/install.js
function DF(e) {
	sA(qP), e.registerComponentModel(XP), e.registerComponentView(yF), e.registerAction({
		type: "showTip",
		event: "showTip",
		update: "tooltip:manuallyShowTip"
	}, Ee), e.registerAction({
		type: "hideTip",
		event: "hideTip",
		update: "tooltip:manuallyHideTip"
	}, Ee);
}
//#endregion
//#region node_modules/echarts/lib/component/marker/checkMarkerInSeries.js
function OF(e, t) {
	if (!e) return !1;
	for (var n = V(e) ? e : [e], r = 0; r < n.length; r++) if (n[r] && n[r][t]) return !0;
	return !1;
}
//#endregion
//#region node_modules/echarts/lib/component/marker/MarkerModel.js
function kF(e) {
	Js(e, "label", ["show"]);
}
var AF = X(), jF = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n.createdBySelf = !1, n.preventAutoZ = !0, n;
	}
	return t.prototype.init = function(e, t, n) {
		this.mergeDefaultAndTheme(e, n), this._mergeOption(e, n, !1, !0);
	}, t.prototype.isAnimationEnabled = function() {
		if (J.node) return !1;
		var e = this.__hostSeries;
		return this.getShallow("animation") && e && e.isAnimationEnabled();
	}, t.prototype.mergeOption = function(e, t) {
		this._mergeOption(e, t, !1, !1);
	}, t.prototype._mergeOption = function(e, t, n, r) {
		var i = this.mainType;
		n || t.eachSeries(function(e) {
			var n = e.get(this.mainType, !0), a = AF(e)[i];
			if (!n || !n.data) {
				AF(e)[i] = null;
				return;
			}
			a ? a._mergeOption(n, t, !0) : (r && kF(n), F(n.data, function(e) {
				e instanceof Array ? (kF(e[0]), kF(e[1])) : kF(e);
			}), a = this.createMarkerModelFromSeries(n, this, t), k(a, {
				mainType: this.mainType,
				seriesIndex: e.seriesIndex,
				name: e.name,
				createdBySelf: !0
			}), a.__hostSeries = e), AF(e)[i] = a;
		}, this);
	}, t.prototype.formatTooltip = function(e, t, n) {
		var r = this.getData(), i = this.getRawValue(e), a = r.getName(e);
		return M_("section", {
			header: this.name,
			blocks: [M_("nameValue", {
				name: a,
				value: i,
				noName: !a,
				noValue: i == null
			})]
		});
	}, t.prototype.getData = function() {
		return this._data;
	}, t.prototype.setData = function(e) {
		this._data = e;
	}, t.prototype.getDataParams = function(e, t) {
		var n = a_.prototype.getDataParams.call(this, e, t), r = this.__hostSeries;
		return r && (n.seriesId = r.id, n.seriesName = r.name, n.seriesType = r.subType), n;
	}, t.getMarkerModelFromSeries = function(e, t) {
		return AF(e)[t];
	}, t.type = "marker", t.dependencies = [
		"series",
		"grid",
		"polar",
		"geo"
	], t;
}(Zg);
N(jF, a_.prototype);
//#endregion
//#region node_modules/echarts/lib/component/marker/markerHelper.js
function MF(e) {
	return !(isNaN(parseFloat(e.x)) && isNaN(parseFloat(e.y)));
}
function NF(e) {
	return !isNaN(parseFloat(e.x)) && !isNaN(parseFloat(e.y));
}
function PF(e, t, n, r, i, a, o) {
	var s = [], c = rh(t, i) ? t.getCalculationInfo("stackResultDimension") : i, l = HF(t, c, e), u = t.hostModel.indicesOfNearest(n, c, l)[0];
	s[a] = t.get(r, u), s[o] = t.get(c, u);
	var d = t.get(i, u), f = bs(t.get(i, u));
	return f = Math.min(f, 20), f >= 0 && (s[o] = +s[o].toFixed(f)), [s, d];
}
var FF = {
	min: B(PF, "min"),
	max: B(PF, "max"),
	average: B(PF, "average"),
	median: B(PF, "median")
};
function IF(e, t) {
	if (t) {
		var n = e.getData(), r = e.coordinateSystem, i = r && r.dimensions;
		if (!NF(t) && !V(t.coord) && V(i)) {
			var a = LF(t, n, r, e);
			if (t = E(t), t.type && FF[t.type] && a.baseAxis && a.valueAxis) {
				var o = M(i, a.baseAxis.dim), s = M(i, a.valueAxis.dim), c = FF[t.type](n, a.valueAxis.dim, a.baseDataDim, a.valueDataDim, o, s);
				t.coord = c[0], t.value = c[1];
			} else t.coord = [t.xAxis == null ? t.radiusAxis : t.xAxis, t.yAxis == null ? t.angleAxis : t.yAxis];
		}
		if (t.coord == null || !V(i)) {
			t.coord = [];
			var l = e.getBaseAxis();
			if (l && t.type && FF[t.type]) {
				var u = r.getOtherAxis(l);
				u && (t.value = HF(n, n.mapDimension(u.dim), t.type));
			}
		} else for (var d = t.coord, f = 0; f < 2; f++) FF[d[f]] && (d[f] = HF(n, n.mapDimension(i[f]), d[f]));
		return t;
	}
}
function LF(e, t, n, r) {
	var i = {};
	return e.valueIndex != null || e.valueDim != null ? (i.valueDataDim = e.valueIndex == null ? e.valueDim : t.getDimension(e.valueIndex), i.valueAxis = n.getAxis(RF(r, i.valueDataDim)), i.baseAxis = n.getOtherAxis(i.valueAxis), i.baseDataDim = t.mapDimension(i.baseAxis.dim)) : (i.baseAxis = r.getBaseAxis(), i.valueAxis = n.getOtherAxis(i.baseAxis), i.baseDataDim = t.mapDimension(i.baseAxis.dim), i.valueDataDim = t.mapDimension(i.valueAxis.dim)), i;
}
function RF(e, t) {
	var n = e.getData().getDimensionInfo(t);
	return n && n.coordDim;
}
function zF(e, t) {
	return e && e.containData && t.coord && !MF(t) ? e.containData(t.coord) : !0;
}
function BF(e, t, n) {
	return e && e.containZone && t.coord && n.coord && !MF(t) && !MF(n) ? e.containZone(t.coord, n.coord) : !0;
}
function VF(e, t) {
	return e ? function(e, n, r, i) {
		return rm(i < 2 ? e.coord && e.coord[i] : e.value, t[i]);
	} : function(e, n, r, i) {
		return rm(e.value, t[i]);
	};
}
function HF(e, t, n) {
	if (n === "average") {
		var r = 0, i = 0;
		return e.each(t, function(e, t) {
			isNaN(e) || (r += e, i++);
		}), r / i;
	}
	return n === "median" ? e.getMedian(t) : e.getDataExtent(t)[+(n === "max")];
}
//#endregion
//#region node_modules/echarts/lib/component/marker/MarkerView.js
var UF = X(), WF = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.init = function() {
		this.markerGroupMap = q();
	}, t.prototype.render = function(e, t, n) {
		var r = this, i = this.markerGroupMap;
		i.each(function(e) {
			UF(e).keep = !1;
		}), t.eachSeries(function(e) {
			var i = jF.getMarkerModelFromSeries(e, r.type);
			i && r.renderSeries(e, i, t, n);
		}), i.each(function(e) {
			!UF(e).keep && r.group.remove(e.group);
		}), GF(t, i, this.type);
	}, t.prototype.markKeep = function(e) {
		UF(e).keep = !0;
	}, t.prototype.toggleBlurSeries = function(e, t) {
		var n = this;
		F(e, function(e) {
			var r = jF.getMarkerModelFromSeries(e, n.type);
			r && r.getData().eachItemGraphicEl(function(e) {
				e && (t ? Fl(e) : Il(e));
			});
		});
	}, t.type = "marker", t;
}(zE);
function GF(e, t, n) {
	e.eachSeries(function(e) {
		var r = jF.getMarkerModelFromSeries(e, n), i = t.get(e.id);
		if (r && i && i.group) {
			var a = Of(r), o = a.z, s = a.zlevel;
			Af(i.group, o, s);
		}
	});
}
//#endregion
//#region node_modules/echarts/lib/component/marker/MarkLineModel.js
var KF = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.createMarkerModelFromSeries = function(e, n, r) {
		return new t(e, n, r);
	}, t.type = "markLine", t.defaultOption = {
		z: 5,
		symbol: ["circle", "arrow"],
		symbolSize: [8, 16],
		symbolOffset: 0,
		precision: 2,
		tooltip: { trigger: "item" },
		label: {
			show: !0,
			position: "end",
			distance: 5
		},
		lineStyle: { type: "dashed" },
		emphasis: {
			label: { show: !0 },
			lineStyle: { width: 3 }
		},
		animationEasing: "linear"
	}, t;
}(jF), qF = X(), JF = function(e, t, n, r) {
	var i = e.getData(), a;
	if (V(r)) a = r;
	else {
		var o = r.type;
		if (o === "min" || o === "max" || o === "average" || o === "median" || r.xAxis != null || r.yAxis != null) {
			var s = void 0, c = void 0;
			if (r.yAxis != null || r.xAxis != null) s = t.getAxis(r.yAxis == null ? "x" : "y"), c = ue(r.yAxis, r.xAxis);
			else {
				var l = LF(r, i, t, e);
				s = l.valueAxis, c = HF(i, ih(i, l.valueDataDim), o);
			}
			var u = s.dim === "x" ? 0 : 1, d = 1 - u, f = E(r), p = { coord: [] };
			f.type = null, f.coord = [], f.coord[d] = -Infinity, p.coord[d] = Infinity;
			var m = n.get("precision");
			m >= 0 && W(c) && (c = +c.toFixed(Math.min(m, 20))), f.coord[u] = p.coord[u] = c, a = [
				f,
				p,
				{
					type: o,
					valueIndex: r.valueIndex,
					value: c
				}
			];
		} else a = [];
	}
	var h = [
		IF(e, a[0]),
		IF(e, a[1]),
		k({}, a[2])
	];
	return h[2].type = h[2].type || null, D(h[2], h[0]), D(h[2], h[1]), h;
};
function YF(e) {
	return !isNaN(e) && !isFinite(e);
}
function XF(e, t, n, r) {
	var i = 1 - e, a = r.dimensions[e];
	return YF(t[i]) && YF(n[i]) && t[e] === n[e] && r.getAxis(a).containData(t[e]);
}
function ZF(e, t) {
	if (e.type === "cartesian2d") {
		var n = t[0].coord, r = t[1].coord;
		if (n && r && (XF(1, n, r, e) || XF(0, n, r, e))) return !0;
	}
	return zF(e, t[0]) && zF(e, t[1]);
}
function QF(e, t, n, r, i) {
	var a = r.coordinateSystem, o = e.getItemModel(t), s, c = ps(o.get("x"), i.getWidth()), l = ps(o.get("y"), i.getHeight());
	if (!isNaN(c) && !isNaN(l)) s = [c, l];
	else {
		if (r.getMarkerPosition) s = r.getMarkerPosition(e.getValues(e.dimensions, t));
		else {
			var u = a.dimensions, d = e.get(u[0], t), f = e.get(u[1], t);
			s = a.dataToPoint([d, f]);
		}
		if (ty(a, "cartesian2d")) {
			var p = a.getAxis("x"), m = a.getAxis("y"), u = a.dimensions;
			YF(e.get(u[0], t)) ? s[0] = p.toGlobalCoord(p.getExtent()[+!n]) : YF(e.get(u[1], t)) && (s[1] = m.toGlobalCoord(m.getExtent()[+!n]));
		}
		isNaN(c) || (s[0] = c), isNaN(l) || (s[1] = l);
	}
	e.setItemLayout(t, s);
}
var $F = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.updateTransform = function(e, t, n) {
		t.eachSeries(function(e) {
			var t = jF.getMarkerModelFromSeries(e, "markLine");
			if (t) {
				var r = t.getData(), i = qF(t).from, a = qF(t).to;
				i.each(function(t) {
					QF(i, t, !0, e, n), QF(a, t, !1, e, n);
				}), r.each(function(e) {
					r.setItemLayout(e, [i.getItemLayout(e), a.getItemLayout(e)]);
				}), this.markerGroupMap.get(e.id).updateLayout();
			}
		}, this);
	}, t.prototype.renderSeries = function(e, t, n, r) {
		var i = e.coordinateSystem, a = e.id, o = e.getData(), s = this.markerGroupMap, c = s.get(a) || s.set(a, new gN());
		this.group.add(c.group);
		var l = eI(i, e, t), u = l.from, d = l.to, f = l.line;
		qF(t).from = u, qF(t).to = d, t.setData(f);
		var p = t.get("symbol"), m = t.get("symbolSize"), h = t.get("symbolRotate"), g = t.get("symbolOffset");
		V(p) || (p = [p, p]), V(m) || (m = [m, m]), V(h) || (h = [h, h]), V(g) || (g = [g, g]), l.from.each(function(e) {
			_(u, e, !0), _(d, e, !1);
		}), f.each(function(e) {
			var t = f.getItemModel(e), n = t.getModel("lineStyle").getLineStyle();
			f.setItemLayout(e, [u.getItemLayout(e), d.getItemLayout(e)]);
			var r = t.get("z2");
			n.stroke ??= u.getItemVisual(e, "style").fill, f.setItemVisual(e, {
				z2: K(r, 0),
				fromSymbolKeepAspect: u.getItemVisual(e, "symbolKeepAspect"),
				fromSymbolOffset: u.getItemVisual(e, "symbolOffset"),
				fromSymbolRotate: u.getItemVisual(e, "symbolRotate"),
				fromSymbolSize: u.getItemVisual(e, "symbolSize"),
				fromSymbol: u.getItemVisual(e, "symbol"),
				toSymbolKeepAspect: d.getItemVisual(e, "symbolKeepAspect"),
				toSymbolOffset: d.getItemVisual(e, "symbolOffset"),
				toSymbolRotate: d.getItemVisual(e, "symbolRotate"),
				toSymbolSize: d.getItemVisual(e, "symbolSize"),
				toSymbol: d.getItemVisual(e, "symbol"),
				style: n
			});
		}), c.updateData(f), l.line.eachItemGraphicEl(function(e) {
			Z(e).dataModel = t, e.traverse(function(e) {
				Z(e).dataModel = t;
			});
		});
		function _(t, n, i) {
			var a = t.getItemModel(n);
			QF(t, n, i, e, r);
			var s = a.getModel("itemStyle").getItemStyle();
			s.fill ??= SD(o, "color"), t.setItemVisual(n, {
				symbolKeepAspect: a.get("symbolKeepAspect"),
				symbolOffset: K(a.get("symbolOffset", !0), g[+!i]),
				symbolRotate: K(a.get("symbolRotate", !0), h[+!i]),
				symbolSize: K(a.get("symbolSize"), m[+!i]),
				symbol: K(a.get("symbol", !0), p[+!i]),
				style: s
			});
		}
		this.markKeep(c), c.group.silent = t.get("silent") || e.get("silent");
	}, t.type = "markLine", t;
}(WF);
function eI(e, t, n) {
	var r = e ? I(e && e.dimensions, function(e) {
		var n = t.getData();
		return k(k({}, n.getDimensionInfo(n.mapDimension(e)) || {}), {
			name: e,
			ordinalMeta: null
		});
	}) : [{
		name: "value",
		type: "float"
	}], i = new zm(r, n), a = new zm(r, n), o = new zm([], n), s = I(n.get("data"), B(JF, t, e, n));
	e && (s = L(s, B(ZF, e)));
	var c = VF(!!e, r);
	return i.initData(I(s, function(e) {
		return e[0];
	}), null, c), a.initData(I(s, function(e) {
		return e[1];
	}), null, c), o.initData(I(s, function(e) {
		return e[2];
	})), o.hasItemOption = !0, {
		from: i,
		to: a,
		line: o
	};
}
//#endregion
//#region node_modules/echarts/lib/component/marker/installMarkLine.js
function tI(e) {
	e.registerComponentModel(KF), e.registerComponentView($F), e.registerPreprocessor(function(e) {
		OF(e.series, "markLine") && (e.markLine = e.markLine || {});
	});
}
//#endregion
//#region node_modules/echarts/lib/component/marker/MarkAreaModel.js
var nI = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.createMarkerModelFromSeries = function(e, n, r) {
		return new t(e, n, r);
	}, t.type = "markArea", t.defaultOption = {
		z: 1,
		tooltip: { trigger: "item" },
		animation: !1,
		label: {
			show: !0,
			position: "top"
		},
		itemStyle: { borderWidth: 0 },
		emphasis: { label: {
			show: !0,
			position: "top"
		} }
	}, t;
}(jF), rI = X(), iI = function(e, t, n, r) {
	var i = r[0], a = r[1];
	if (!(!i || !a)) {
		var o = IF(e, i), s = IF(e, a), c = o.coord, l = s.coord;
		c[0] = ue(c[0], -Infinity), c[1] = ue(c[1], -Infinity), l[0] = ue(l[0], Infinity), l[1] = ue(l[1], Infinity);
		var u = O([
			{},
			o,
			s
		]);
		return u.coord = [o.coord, s.coord], u.x0 = o.x, u.y0 = o.y, u.x1 = s.x, u.y1 = s.y, u;
	}
};
function aI(e) {
	return !isNaN(e) && !isFinite(e);
}
function oI(e, t, n, r) {
	var i = 1 - e;
	return aI(t[i]) && aI(n[i]);
}
function sI(e, t) {
	var n = t.coord[0], r = t.coord[1], i = {
		coord: n,
		x: t.x0,
		y: t.y0
	}, a = {
		coord: r,
		x: t.x1,
		y: t.y1
	};
	return ty(e, "cartesian2d") ? n && r && (oI(1, n, r, e) || oI(0, n, r, e)) ? !0 : BF(e, i, a) : zF(e, i) || zF(e, a);
}
function cI(e, t, n, r, i) {
	var a = r.coordinateSystem, o = e.getItemModel(t), s, c = ps(o.get(n[0]), i.getWidth()), l = ps(o.get(n[1]), i.getHeight());
	if (!isNaN(c) && !isNaN(l)) s = [c, l];
	else {
		if (r.getMarkerPosition) {
			var u = e.getValues(["x0", "y0"], t), d = e.getValues(["x1", "y1"], t), f = a.clampData(u), p = a.clampData(d), m = [];
			m[0] = n[0] === "x0" ? f[0] > p[0] ? d[0] : u[0] : f[0] > p[0] ? u[0] : d[0], m[1] = n[1] === "y0" ? f[1] > p[1] ? d[1] : u[1] : f[1] > p[1] ? u[1] : d[1], s = r.getMarkerPosition(m, n, !0);
		} else {
			var h = e.get(n[0], t), g = e.get(n[1], t), _ = [h, g];
			a.clampData && a.clampData(_, _), s = a.dataToPoint(_, !0);
		}
		if (ty(a, "cartesian2d")) {
			var v = a.getAxis("x"), y = a.getAxis("y"), h = e.get(n[0], t), g = e.get(n[1], t);
			aI(h) ? s[0] = v.toGlobalCoord(v.getExtent()[n[0] === "x0" ? 0 : 1]) : aI(g) && (s[1] = y.toGlobalCoord(y.getExtent()[n[1] === "y0" ? 0 : 1]));
		}
		isNaN(c) || (s[0] = c), isNaN(l) || (s[1] = l);
	}
	return s;
}
var lI = [
	["x0", "y0"],
	["x1", "y0"],
	["x1", "y1"],
	["x0", "y1"]
], uI = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.updateTransform = function(e, t, n) {
		t.eachSeries(function(e) {
			var t = jF.getMarkerModelFromSeries(e, "markArea");
			if (t) {
				var r = t.getData();
				r.each(function(t) {
					var i = I(lI, function(i) {
						return cI(r, t, i, e, n);
					});
					r.setItemLayout(t, i), r.getItemGraphicEl(t).setShape("points", i);
				});
			}
		}, this);
	}, t.prototype.renderSeries = function(e, t, n, r) {
		var i = e.coordinateSystem, a = e.id, o = e.getData(), s = this.markerGroupMap, c = s.get(a) || s.set(a, { group: new ju() });
		this.group.add(c.group), this.markKeep(c);
		var l = dI(i, e, t);
		t.setData(l), l.each(function(t) {
			var n = I(lI, function(n) {
				return cI(l, t, n, e, r);
			}), a = i.getAxis("x").scale, s = i.getAxis("y").scale, c = a.getExtent(), u = s.getExtent(), d = [a.parse(l.get("x0", t)), a.parse(l.get("x1", t))], f = [s.parse(l.get("y0", t)), s.parse(l.get("y1", t))];
			ys(d), ys(f);
			var p = c[0] > d[1] || c[1] < d[0] || u[0] > f[1] || u[1] < f[0];
			l.setItemLayout(t, {
				points: n,
				allClipped: p
			});
			var m = l.getItemModel(t), h = m.getModel("itemStyle").getItemStyle(), g = m.get("z2"), _ = SD(o, "color");
			h.fill || (h.fill = _, U(h.fill) && (h.fill = Vr(h.fill, .4))), h.stroke ||= _, l.setItemVisual(t, "style", h), l.setItemVisual(t, "z2", K(g, 0));
		}), l.diff(rI(c).data).add(function(e) {
			var t = l.getItemLayout(e), n = l.getItemVisual(e, "z2");
			if (!t.allClipped) {
				var r = new id({
					z2: K(n, 0),
					shape: { points: t.points }
				});
				l.setItemGraphicEl(e, r), c.group.add(r);
			}
		}).update(function(e, n) {
			var r = rI(c).data.getItemGraphicEl(n), i = l.getItemLayout(e), a = l.getItemVisual(e, "z2");
			i.allClipped ? r && c.group.remove(r) : (r ? Pd(r, {
				z2: K(a, 0),
				shape: { points: i.points }
			}, t, e) : r = new id({ shape: { points: i.points } }), l.setItemGraphicEl(e, r), c.group.add(r));
		}).remove(function(e) {
			var t = rI(c).data.getItemGraphicEl(e);
			c.group.remove(t);
		}).execute(), l.eachItemGraphicEl(function(e, n) {
			var r = l.getItemModel(n), i = l.getItemVisual(n, "style");
			e.useStyle(l.getItemVisual(n, "style")), zf(e, Bf(r), {
				labelFetcher: t,
				labelDataIndex: n,
				defaultText: l.getName(n) || "",
				inheritColor: U(i.fill) ? Vr(i.fill, 1) : Q.color.neutral99
			}), nu(e, r), Ql(e, null, null, r.get(["emphasis", "disabled"])), Z(e).dataModel = t;
		}), rI(c).data = l, c.group.silent = t.get("silent") || e.get("silent");
	}, t.type = "markArea", t;
}(WF);
function dI(e, t, n) {
	var r, i, a = [
		"x0",
		"y0",
		"x1",
		"y1"
	];
	if (e) {
		var o = I(e && e.dimensions, function(e) {
			var n = t.getData();
			return k(k({}, n.getDimensionInfo(n.mapDimension(e)) || {}), {
				name: e,
				ordinalMeta: null
			});
		});
		i = I(a, function(e, t) {
			return {
				name: e,
				type: o[t % 2].type
			};
		}), r = new zm(i, n);
	} else i = [{
		name: "value",
		type: "float"
	}], r = new zm(i, n);
	var s = I(n.get("data"), B(iI, t, e, n));
	e && (s = L(s, B(sI, e)));
	var c = e ? function(e, t, n, r) {
		var a = e.coord[Math.floor(r / 2)][r % 2];
		return rm(a, i[r]);
	} : function(e, t, n, r) {
		return rm(e.value, i[r]);
	};
	return r.initData(s, null, c), r.hasItemOption = !0, r;
}
//#endregion
//#region node_modules/echarts/lib/component/marker/installMarkArea.js
function fI(e) {
	e.registerComponentModel(nI), e.registerComponentView(uI), e.registerPreprocessor(function(e) {
		OF(e.series, "markArea") && (e.markArea = e.markArea || {});
	});
}
//#endregion
//#region node_modules/echarts/lib/component/legend/LegendModel.js
var pI = function(e, t) {
	if (t === "all") return {
		type: "all",
		title: e.getLocaleModel().get([
			"legend",
			"selector",
			"all"
		])
	};
	if (t === "inverse") return {
		type: "inverse",
		title: e.getLocaleModel().get([
			"legend",
			"selector",
			"inverse"
		])
	};
}, mI = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n.layoutMode = {
			type: "box",
			ignoreSize: !0
		}, n;
	}
	return t.prototype.init = function(e, t, n) {
		this.mergeDefaultAndTheme(e, n), e.selected = e.selected || {}, this._updateSelector(e);
	}, t.prototype.mergeOption = function(t, n) {
		e.prototype.mergeOption.call(this, t, n), this._updateSelector(t);
	}, t.prototype._updateSelector = function(e) {
		var t = e.selector, n = this.ecModel;
		t === !0 && (t = e.selector = ["all", "inverse"]), V(t) && F(t, function(e, r) {
			U(e) && (e = { type: e }), t[r] = D(e, pI(n, e.type));
		});
	}, t.prototype.optionUpdated = function() {
		this._updateData(this.ecModel);
		var e = this._data;
		if (e[0] && this.get("selectedMode") === "single") {
			for (var t = !1, n = 0; n < e.length; n++) {
				var r = e[n].get("name");
				if (this.isSelected(r)) {
					this.select(r), t = !0;
					break;
				}
			}
			!t && this.select(e[0].get("name"));
		}
	}, t.prototype._updateData = function(e) {
		var t = [], n = [];
		e.eachRawSeries(function(r) {
			var i = r.name;
			n.push(i);
			var a;
			if (r.legendVisualProvider) {
				var o = r.legendVisualProvider.getAllNames();
				e.isSeriesFiltered(r) || (n = n.concat(o)), o.length ? t = t.concat(o) : a = !0;
			} else a = !0;
			a && cc(r) && t.push(r.name);
		}), this._availableNames = n;
		var r = this.get("data") || t, i = q(), a = I(r, function(e) {
			return (U(e) || W(e)) && (e = { name: e }), i.get(e.name) ? null : (i.set(e.name, !0), new lp(e, this, this.ecModel));
		}, this);
		this._data = L(a, function(e) {
			return !!e;
		});
	}, t.prototype.getData = function() {
		return this._data;
	}, t.prototype.select = function(e) {
		var t = this.option.selected;
		if (this.get("selectedMode") === "single") {
			var n = this._data;
			F(n, function(e) {
				t[e.get("name")] = !1;
			});
		}
		t[e] = !0;
	}, t.prototype.unSelect = function(e) {
		this.get("selectedMode") !== "single" && (this.option.selected[e] = !1);
	}, t.prototype.toggleSelected = function(e) {
		var t = this.option.selected;
		t.hasOwnProperty(e) || (t[e] = !0), this[t[e] ? "unSelect" : "select"](e);
	}, t.prototype.allSelect = function() {
		var e = this._data, t = this.option.selected;
		F(e, function(e) {
			t[e.get("name", !0)] = !0;
		});
	}, t.prototype.inverseSelect = function() {
		var e = this._data, t = this.option.selected;
		F(e, function(e) {
			var n = e.get("name", !0);
			t.hasOwnProperty(n) || (t[n] = !0), t[n] = !t[n];
		});
	}, t.prototype.isSelected = function(e) {
		var t = this.option.selected;
		return !(t.hasOwnProperty(e) && !t[e]) && M(this._availableNames, e) >= 0;
	}, t.prototype.getOrient = function() {
		return this.get("orient") === "vertical" ? {
			index: 1,
			name: "vertical"
		} : {
			index: 0,
			name: "horizontal"
		};
	}, t.type = "legend.plain", t.dependencies = ["series"], t.defaultOption = {
		z: 4,
		show: !0,
		orient: "horizontal",
		left: "center",
		bottom: Q.size.m,
		align: "auto",
		backgroundColor: Q.color.transparent,
		borderColor: Q.color.border,
		borderRadius: 0,
		borderWidth: 0,
		padding: 5,
		itemGap: 8,
		itemWidth: 25,
		itemHeight: 14,
		symbolRotate: "inherit",
		symbolKeepAspect: !0,
		inactiveColor: Q.color.disabled,
		inactiveBorderColor: Q.color.disabled,
		inactiveBorderWidth: "auto",
		itemStyle: {
			color: "inherit",
			opacity: "inherit",
			borderColor: "inherit",
			borderWidth: "auto",
			borderCap: "inherit",
			borderJoin: "inherit",
			borderDashOffset: "inherit",
			borderMiterLimit: "inherit"
		},
		lineStyle: {
			width: "auto",
			color: "inherit",
			inactiveColor: Q.color.disabled,
			inactiveWidth: 2,
			opacity: "inherit",
			type: "inherit",
			cap: "inherit",
			join: "inherit",
			dashOffset: "inherit",
			miterLimit: "inherit"
		},
		textStyle: { color: Q.color.secondary },
		selectedMode: !0,
		selector: !1,
		selectorLabel: {
			show: !0,
			borderRadius: 10,
			padding: [
				3,
				5,
				3,
				5
			],
			fontSize: 12,
			fontFamily: "sans-serif",
			color: Q.color.tertiary,
			borderWidth: 1,
			borderColor: Q.color.border
		},
		emphasis: { selectorLabel: {
			show: !0,
			color: Q.color.quaternary
		} },
		selectorPosition: "auto",
		selectorItemGap: 7,
		selectorButtonGap: 10,
		tooltip: { show: !1 },
		triggerEvent: !1
	}, t;
}(Zg), hI = B, gI = F, _I = ju, vI = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n.newlineDisabled = !1, n;
	}
	return t.prototype.init = function() {
		this.group.add(this._contentGroup = new _I()), this.group.add(this._selectorGroup = new _I()), this._isFirstRender = !0;
	}, t.prototype.getContentGroup = function() {
		return this._contentGroup;
	}, t.prototype.getSelectorGroup = function() {
		return this._selectorGroup;
	}, t.prototype.render = function(e, t, n) {
		var r = this._isFirstRender;
		if (this._isFirstRender = !1, this.resetInner(), e.get("show", !0)) {
			var i = e.get("align"), a = e.get("orient");
			(!i || i === "auto") && (i = e.get("left") === "right" && a === "vertical" ? "right" : "left");
			var o = e.get("selector", !0), s = e.get("selectorPosition", !0);
			o && (!s || s === "auto") && (s = a === "horizontal" ? "end" : "start"), this.renderInner(i, e, t, n, o, a, s);
			var c = Gg(e, n).refContainer, l = e.getBoxLayoutParams(), u = e.get("padding"), d = Ug(l, c, u), f = this.layoutInner(e, i, d, r, o, s), p = Ug(j({
				width: f.width,
				height: f.height
			}, l), c, u);
			this.group.x = p.x - f.x, this.group.y = p.y - f.y, this.group.markRedraw(), this.group.add(this._backgroundEl = YP(f, e));
		}
	}, t.prototype.resetInner = function() {
		this.getContentGroup().removeAll(), this._backgroundEl && this.group.remove(this._backgroundEl), this.getSelectorGroup().removeAll();
	}, t.prototype.renderInner = function(e, t, n, r, i, a, o) {
		var s = this.getContentGroup(), c = q(), l = t.get("selectedMode"), u = t.get("triggerEvent"), d = [];
		n.eachRawSeries(function(e) {
			!e.get("legendHoverLink") && d.push(e.id);
		}), gI(t.getData(), function(i, a) {
			var o = this, f = i.get("name");
			if (!this.newlineDisabled && (f === "" || f === "\n")) {
				var p = new _I();
				p.newline = !0, s.add(p);
				return;
			}
			var m = n.getSeriesByName(f)[0];
			if (!c.get(f)) {
				if (m) {
					var h = m.getData(), g = h.getVisual("legendLineStyle") || {}, _ = h.getVisual("legendIcon"), v = h.getVisual("style"), y = this._createItem(m, f, a, i, t, e, g, v, _, l, r);
					y.on("click", hI(xI, f, null, r, d)).on("mouseover", hI(SI, m.name, null, r, d)).on("mouseout", hI(CI, m.name, null, r, d)), n.ssr && y.eachChild(function(e) {
						var t = Z(e);
						t.seriesIndex = m.seriesIndex, t.dataIndex = a, t.ssrType = "legend";
					}), u && y.eachChild(function(e) {
						o.packEventData(e, t, m, a, f);
					}), c.set(f, !0);
				} else n.eachRawSeries(function(o) {
					var s = this;
					if (!c.get(f) && o.legendVisualProvider) {
						var p = o.legendVisualProvider;
						if (!p.containName(f)) return;
						var m = p.indexOfName(f), h = p.getItemVisual(m, "style"), g = p.getItemVisual(m, "legendIcon"), _ = Pr(h.fill);
						_ && _[3] === 0 && (_[3] = .2, h = k(k({}, h), { fill: Hr(_, "rgba") }));
						var v = this._createItem(o, f, a, i, t, e, {}, h, g, l, r);
						v.on("click", hI(xI, null, f, r, d)).on("mouseover", hI(SI, null, f, r, d)).on("mouseout", hI(CI, null, f, r, d)), n.ssr && v.eachChild(function(e) {
							var t = Z(e);
							t.seriesIndex = o.seriesIndex, t.dataIndex = a, t.ssrType = "legend";
						}), u && v.eachChild(function(e) {
							s.packEventData(e, t, o, a, f);
						}), c.set(f, !0);
					}
				}, this);
			}
		}, this), i && this._createSelector(i, t, r, a, o);
	}, t.prototype.packEventData = function(e, t, n, r, i) {
		var a = {
			componentType: "legend",
			componentIndex: t.componentIndex,
			dataIndex: r,
			value: i,
			seriesIndex: n.seriesIndex
		};
		Z(e).eventData = a;
	}, t.prototype._createSelector = function(e, t, n, r, i) {
		var a = this.getSelectorGroup();
		gI(e, function(e) {
			var r = e.type, i = new Ro({
				style: {
					x: 0,
					y: 0,
					align: "center",
					verticalAlign: "middle"
				},
				onclick: function() {
					n.dispatchAction({
						type: r === "all" ? "legendAllSelect" : "legendInverseSelect",
						legendId: t.id
					});
				}
			});
			a.add(i), zf(i, {
				normal: t.getModel("selectorLabel"),
				emphasis: t.getModel(["emphasis", "selectorLabel"])
			}, { defaultText: e.title }), Xl(i);
		});
	}, t.prototype._createItem = function(e, t, n, r, i, a, o, s, c, l, u) {
		var d = e.visualDrawType, f = i.get("itemWidth"), p = i.get("itemHeight"), m = i.isSelected(t), h = r.get("symbolRotate"), g = r.get("symbolKeepAspect"), _ = r.get("icon");
		c = _ || c || "roundRect";
		var v = yI(c, r, o, s, d, m, u), y = new _I(), b = r.getModel("textStyle");
		if (H(e.getLegendIcon) && (!_ || _ === "inherit")) y.add(e.getLegendIcon({
			itemWidth: f,
			itemHeight: p,
			icon: c,
			iconRotate: h,
			itemStyle: v.itemStyle,
			lineStyle: v.lineStyle,
			symbolKeepAspect: g
		}));
		else {
			var x = _ === "inherit" && e.getData().getVisual("symbol") ? h === "inherit" ? e.getData().getVisual("symbolRotate") : h : 0;
			y.add(bI({
				itemWidth: f,
				itemHeight: p,
				icon: c,
				iconRotate: x,
				itemStyle: v.itemStyle,
				lineStyle: v.lineStyle,
				symbolKeepAspect: g
			}));
		}
		var S = a === "left" ? f + 5 : -5, C = a, w = i.get("formatter"), T = t;
		U(w) && w ? T = w.replace("{name}", t ?? "") : H(w) && (T = w(t));
		var E = m ? b.getTextColor() : r.get("inactiveColor");
		y.add(new Ro({ style: Vf(b, {
			text: T,
			x: S,
			y: p / 2,
			fill: E,
			align: C,
			verticalAlign: "middle"
		}, { inheritColor: E }) }));
		var D = new No({
			shape: y.getBoundingRect(),
			style: { fill: "transparent" }
		}), O = r.getModel("tooltip");
		return O.get("show") && xf({
			el: D,
			componentModel: i,
			itemName: t,
			itemTooltipOption: O.option
		}), y.add(D), y.eachChild(function(e) {
			e.silent = !0;
		}), D.silent = !l, this.getContentGroup().add(y), Xl(y), y.__legendDataIndex = n, y;
	}, t.prototype.layoutInner = function(e, t, n, r, i, a) {
		var o = this.getContentGroup(), s = this.getSelectorGroup();
		Vg(e.get("orient"), o, e.get("itemGap"), n.width, n.height);
		var c = o.getBoundingRect(), l = [-c.x, -c.y];
		if (s.markRedraw(), o.markRedraw(), i) {
			Vg("horizontal", s, e.get("selectorItemGap", !0));
			var u = s.getBoundingRect(), d = [-u.x, -u.y], f = e.get("selectorButtonGap", !0), p = e.getOrient().index, m = p === 0 ? "width" : "height", h = p === 0 ? "height" : "width", g = p === 0 ? "y" : "x";
			a === "end" ? d[p] += c[m] + f : l[p] += u[m] + f, d[1 - p] += c[h] / 2 - u[h] / 2, s.x = d[0], s.y = d[1], o.x = l[0], o.y = l[1];
			var _ = {
				x: 0,
				y: 0
			};
			return _[m] = c[m] + f + u[m], _[h] = Math.max(c[h], u[h]), _[g] = Math.min(0, u[g] + d[1 - p]), _;
		}
		return o.x = l[0], o.y = l[1], this.group.getBoundingRect();
	}, t.prototype.remove = function() {
		this.getContentGroup().removeAll(), this._isFirstRender = !0;
	}, t.type = "legend.plain", t;
}(zE);
function yI(e, t, n, r, i, a, o) {
	function s(e, t) {
		e.lineWidth === "auto" && (e.lineWidth = t.lineWidth > 0 ? 2 : 0), gI(e, function(n, r) {
			e[r] === "inherit" && (e[r] = t[r]);
		});
	}
	var c = t.getModel("itemStyle"), l = c.getItemStyle(), u = e.lastIndexOf("empty", 0) === 0 ? "fill" : "stroke", d = c.getShallow("decal");
	l.decal = !d || d === "inherit" ? r.decal : yO(d, o), l.fill === "inherit" && (l.fill = r[i]), l.stroke === "inherit" && (l.stroke = r[u]), l.opacity === "inherit" && (l.opacity = (i === "fill" ? r : n).opacity), s(l, r);
	var f = t.getModel("lineStyle"), p = f.getLineStyle();
	if (s(p, n), l.fill === "auto" && (l.fill = r.fill), l.stroke === "auto" && (l.stroke = r.fill), p.stroke === "auto" && (p.stroke = r.fill), !a) {
		var m = t.get("inactiveBorderWidth"), h = l[u];
		l.lineWidth = m === "auto" ? r.lineWidth > 0 && h ? 2 : 0 : l.lineWidth, l.fill = t.get("inactiveColor"), l.stroke = t.get("inactiveBorderColor"), p.stroke = f.get("inactiveColor"), p.lineWidth = f.get("inactiveWidth");
	}
	return {
		itemStyle: l,
		lineStyle: p
	};
}
function bI(e) {
	var t = e.icon || "roundRect", n = pv(t, 0, 0, e.itemWidth, e.itemHeight, e.itemStyle.fill, e.symbolKeepAspect);
	return n.setStyle(e.itemStyle), n.rotation = (e.iconRotate || 0) * Math.PI / 180, n.setOrigin([e.itemWidth / 2, e.itemHeight / 2]), t.indexOf("empty") > -1 && (n.style.stroke = n.style.fill, n.style.fill = Q.color.neutral00, n.style.lineWidth = 2), n;
}
function xI(e, t, n, r) {
	CI(e, t, n, r), n.dispatchAction({
		type: "legendToggleSelect",
		name: e ?? t
	}), SI(e, t, n, r);
}
function SI(e, t, n, r) {
	n.usingTHL() || n.dispatchAction({
		type: "highlight",
		seriesName: e,
		name: t,
		excludeSeriesId: r
	});
}
function CI(e, t, n, r) {
	n.usingTHL() || n.dispatchAction({
		type: "downplay",
		seriesName: e,
		name: t,
		excludeSeriesId: r
	});
}
//#endregion
//#region node_modules/echarts/lib/component/legend/legendAction.js
function wI(e, t, n) {
	var r = e === "allSelect" || e === "inverseSelect", i = {}, a = [];
	n.eachComponent({
		mainType: "legend",
		query: t
	}, function(n) {
		r ? n[e]() : n[e](t.name), TI(n, i), a.push(n.componentIndex);
	});
	var o = {};
	return n.eachComponent("legend", function(e) {
		F(i, function(t, n) {
			e[t ? "select" : "unSelect"](n);
		}), TI(e, o);
	}), r ? {
		selected: o,
		legendIndex: a
	} : {
		name: t.name,
		selected: o
	};
}
function TI(e, t) {
	var n = t || {};
	return F(e.getData(), function(t) {
		var r = t.get("name");
		if (r !== "\n" && r !== "") {
			var i = e.isSelected(r);
			n[r] = Te(n, r) ? n[r] && i : i;
		}
	}), n;
}
function EI(e) {
	e.registerAction("legendToggleSelect", "legendselectchanged", B(wI, "toggleSelected")), e.registerAction("legendAllSelect", "legendselectall", B(wI, "allSelect")), e.registerAction("legendInverseSelect", "legendinverseselect", B(wI, "inverseSelect")), e.registerAction("legendSelect", "legendselected", B(wI, "select")), e.registerAction("legendUnSelect", "legendunselected", B(wI, "unSelect"));
}
//#endregion
//#region node_modules/echarts/lib/component/legend/legendFilter.js
var DI = Vc(OI);
function OI(e) {
	var t = e.findComponents({ mainType: "legend" });
	t && t.length && e.filterSeries(function(e) {
		for (var n = 0; n < t.length; n++) if (!t[n].isSelected(e.name)) return !1;
		return !0;
	});
}
//#endregion
//#region node_modules/echarts/lib/component/legend/installLegendPlain.js
function kI(e) {
	e.registerComponentModel(mI), e.registerComponentView(vI), e.registerProcessor(e.PRIORITY.PROCESSOR.SERIES_FILTER, DI), e.registerSubTypeDefaulter("legend", function() {
		return "plain";
	}), EI(e);
}
//#endregion
//#region node_modules/echarts/lib/component/legend/ScrollableLegendModel.js
var AI = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n;
	}
	return t.prototype.setScrollDataIndex = function(e) {
		this.option.scrollDataIndex = e;
	}, t.prototype.init = function(t, n, r) {
		var i = Jg(t);
		e.prototype.init.call(this, t, n, r), jI(this, t, i);
	}, t.prototype.mergeOption = function(t, n) {
		e.prototype.mergeOption.call(this, t, n), jI(this, this.option, t);
	}, t.type = "legend.scroll", t.defaultOption = mh(mI.defaultOption, {
		scrollDataIndex: 0,
		pageButtonItemGap: 5,
		pageButtonGap: null,
		pageButtonPosition: "end",
		pageFormatter: "{current}/{total}",
		pageIcons: {
			horizontal: ["M0,0L12,-10L12,10z", "M0,0L-12,-10L-12,10z"],
			vertical: ["M0,0L20,0L10,-20z", "M0,0L20,0L10,20z"]
		},
		pageIconColor: Q.color.accent50,
		pageIconInactiveColor: Q.color.accent10,
		pageIconSize: 15,
		pageTextStyle: { color: Q.color.tertiary },
		animationDurationUpdate: 800
	}), t;
}(mI);
function jI(e, t, n) {
	var r = e.getOrient(), i = [1, 1];
	i[r.index] = 0, qg(t, n, {
		type: "box",
		ignoreSize: !!i
	});
}
//#endregion
//#region node_modules/echarts/lib/component/legend/ScrollableLegendView.js
var MI = ju, NI = ["width", "height"], PI = ["x", "y"], FI = function(e) {
	r(t, e);
	function t() {
		var n = e !== null && e.apply(this, arguments) || this;
		return n.type = t.type, n.newlineDisabled = !0, n._currentIndex = 0, n;
	}
	return t.prototype.init = function() {
		e.prototype.init.call(this), this.group.add(this._containerGroup = new MI()), this._containerGroup.add(this.getContentGroup()), this.group.add(this._controllerGroup = new MI());
	}, t.prototype.resetInner = function() {
		e.prototype.resetInner.call(this), this._controllerGroup.removeAll(), this._containerGroup.removeClipPath(), this._containerGroup.__rectSize = null;
	}, t.prototype.renderInner = function(t, n, r, i, a, o, s) {
		var c = this;
		e.prototype.renderInner.call(this, t, n, r, i, a, o, s);
		var l = this._controllerGroup, u = n.get("pageIconSize", !0), d = V(u) ? u : [u, u];
		p("pagePrev", 0);
		var f = n.getModel("pageTextStyle");
		l.add(new Ro({
			name: "pageText",
			style: {
				text: "xx/xx",
				fill: f.getTextColor(),
				font: f.getFont(),
				verticalAlign: "middle",
				align: "center"
			},
			silent: !0
		})), p("pageNext", 1);
		function p(e, t) {
			var r = e + "DataIndex", a = pf(n.get("pageIcons", !0)[n.getOrient().name][t], { onclick: z(c._pageGo, c, r, n, i) }, {
				x: -d[0] / 2,
				y: -d[1] / 2,
				width: d[0],
				height: d[1]
			});
			a.name = e, l.add(a);
		}
	}, t.prototype.layoutInner = function(e, t, n, r, i, a) {
		var o = this.getSelectorGroup(), s = e.getOrient().index, c = NI[s], l = PI[s], u = NI[1 - s], d = PI[1 - s];
		i && Vg("horizontal", o, e.get("selectorItemGap", !0));
		var f = e.get("selectorButtonGap", !0), p = o.getBoundingRect(), m = [-p.x, -p.y], h = E(n);
		i && (h[c] = n[c] - p[c] - f);
		var g = this._layoutContentAndController(e, r, h, s, c, u, d, l);
		if (i) {
			if (a === "end") m[s] += g[c] + f;
			else {
				var _ = p[c] + f;
				m[s] -= _, g[l] -= _;
			}
			g[c] += p[c] + f, m[1 - s] += g[d] + g[u] / 2 - p[u] / 2, g[u] = Math.max(g[u], p[u]), g[d] = Math.min(g[d], p[d] + m[1 - s]), o.x = m[0], o.y = m[1], o.markRedraw();
		}
		return g;
	}, t.prototype._layoutContentAndController = function(e, t, n, r, i, a, o, s) {
		var c = this.getContentGroup(), l = this._containerGroup, u = this._controllerGroup;
		Vg(e.get("orient"), c, e.get("itemGap"), r ? n.width : null, r ? null : n.height), Vg("horizontal", u, e.get("pageButtonItemGap", !0));
		var d = c.getBoundingRect(), f = u.getBoundingRect(), p = this._showController = d[i] > n[i], m = [-d.x, -d.y];
		t || (m[r] = c[s]);
		var h = [0, 0], g = [-f.x, -f.y], _ = K(e.get("pageButtonGap", !0), e.get("itemGap", !0));
		p && (e.get("pageButtonPosition", !0) === "end" ? g[r] += n[i] - f[i] : h[r] += f[i] + _), g[1 - r] += d[a] / 2 - f[a] / 2, c.setPosition(m), l.setPosition(h), u.setPosition(g);
		var v = {
			x: 0,
			y: 0
		};
		if (v[i] = p ? n[i] : d[i], v[a] = Math.max(d[a], f[a]), v[o] = Math.min(0, f[o] + g[1 - r]), l.__rectSize = n[i], p) {
			var y = {
				x: 0,
				y: 0
			};
			y[i] = Math.max(n[i] - f[i] - _, 0), y[a] = v[a], l.setClipPath(new No({ shape: y })), l.__rectSize = y[i];
		} else u.eachChild(function(e) {
			e.attr({
				invisible: !0,
				silent: !0
			});
		});
		var b = this._getPageInfo(e);
		return b.pageIndex != null && Pd(c, {
			x: b.contentPosition[0],
			y: b.contentPosition[1]
		}, p ? e : null), this._updatePageInfoView(e, b), v;
	}, t.prototype._pageGo = function(e, t, n) {
		var r = this._getPageInfo(t)[e];
		r != null && n.dispatchAction({
			type: "legendScroll",
			scrollDataIndex: r,
			legendId: t.id
		});
	}, t.prototype._updatePageInfoView = function(e, t) {
		var n = this._controllerGroup;
		F(["pagePrev", "pageNext"], function(r) {
			var i = t[r + "DataIndex"] != null, a = n.childOfName(r);
			a && (a.setStyle("fill", i ? e.get("pageIconColor", !0) : e.get("pageIconInactiveColor", !0)), a.cursor = i ? "pointer" : "default");
		});
		var r = n.childOfName("pageText"), i = e.get("pageFormatter"), a = t.pageIndex, o = a == null ? 0 : a + 1, s = t.pageCount;
		r && i && r.setStyle("text", U(i) ? i.replace("{current}", o == null ? "" : o + "").replace("{total}", s == null ? "" : s + "") : i({
			current: o,
			total: s
		}));
	}, t.prototype._getPageInfo = function(e) {
		var t = e.get("scrollDataIndex", !0), n = this.getContentGroup(), r = this._containerGroup.__rectSize, i = e.getOrient().index, a = NI[i], o = PI[i], s = this._findTargetItemIndex(t), c = n.children(), l = c[s], u = c.length, d = +!!u, f = {
			contentPosition: [n.x, n.y],
			pageCount: d,
			pageIndex: d - 1,
			pagePrevDataIndex: null,
			pageNextDataIndex: null
		};
		if (!l) return f;
		var p = v(l);
		f.contentPosition[i] = -p.s;
		for (var m = s + 1, h = p, g = p, _ = null; m <= u; ++m) _ = v(c[m]), (!_ && g.e > h.s + r || _ && !y(_, h.s)) && (h = g.i > h.i ? g : _, h && (f.pageNextDataIndex ??= h.i, ++f.pageCount)), g = _;
		for (var m = s - 1, h = p, g = p, _ = null; m >= -1; --m) _ = v(c[m]), (!_ || !y(g, _.s)) && h.i < g.i && (g = h, f.pagePrevDataIndex ??= h.i, ++f.pageCount, ++f.pageIndex), h = _;
		return f;
		function v(e) {
			if (e) {
				var t = e.getBoundingRect(), n = t[o] + e[o];
				return {
					s: n,
					e: n + t[a],
					i: e.__legendDataIndex
				};
			}
		}
		function y(e, t) {
			return e.e >= t && e.s <= t + r;
		}
	}, t.prototype._findTargetItemIndex = function(e) {
		if (!this._showController) return 0;
		var t, n = this.getContentGroup(), r;
		return n.eachChild(function(n, i) {
			var a = n.__legendDataIndex;
			r == null && a != null && (r = i), a === e && (t = i);
		}), t ?? r;
	}, t.type = "legend.scroll", t;
}(vI);
//#endregion
//#region node_modules/echarts/lib/component/legend/scrollableLegendAction.js
function II(e) {
	e.registerAction("legendScroll", "legendscroll", function(e, t) {
		var n = e.scrollDataIndex;
		n != null && t.eachComponent({
			mainType: "legend",
			subType: "scroll",
			query: e
		}, function(e) {
			e.setScrollDataIndex(n);
		});
	});
}
//#endregion
//#region node_modules/echarts/lib/component/legend/installLegendScroll.js
function LI(e) {
	sA(kI), e.registerComponentModel(AI), e.registerComponentView(FI), II(e);
}
//#endregion
//#region node_modules/echarts/lib/component/legend/install.js
function RI(e) {
	sA(kI), sA(LI);
}
//#endregion
//#region node_modules/zrender/lib/svg/SVGPathRebuilder.js
var zI = Math.sin, BI = Math.cos, VI = Math.PI, HI = Math.PI * 2, UI = 180 / VI, WI = function() {
	function e() {}
	return e.prototype.reset = function(e) {
		this._start = !0, this._d = [], this._str = "", this._p = 10 ** (e || 4);
	}, e.prototype.moveTo = function(e, t) {
		this._add("M", e, t);
	}, e.prototype.lineTo = function(e, t) {
		this._add("L", e, t);
	}, e.prototype.bezierCurveTo = function(e, t, n, r, i, a) {
		this._add("C", e, t, n, r, i, a);
	}, e.prototype.quadraticCurveTo = function(e, t, n, r) {
		this._add("Q", e, t, n, r);
	}, e.prototype.arc = function(e, t, n, r, i, a) {
		this.ellipse(e, t, n, n, 0, r, i, a);
	}, e.prototype.ellipse = function(e, t, n, r, i, a, o, s) {
		var c = o - a, l = !s, u = Math.abs(c), d = Yr(u - HI) || (l ? c >= HI : -c >= HI), f = c > 0 ? c % HI : c % HI + HI, p = !1;
		p = d ? !0 : !Yr(u) && f >= VI == !!l;
		var m = e + n * BI(a), h = t + r * zI(a);
		this._start && this._add("M", m, h);
		var g = Math.round(i * UI);
		if (d) {
			var _ = 1 / this._p, v = (l ? 1 : -1) * (HI - _);
			this._add("A", n, r, g, 1, +l, e + n * BI(a + v), t + r * zI(a + v)), _ > .01 && this._add("A", n, r, g, 0, +l, m, h);
		} else {
			var y = e + n * BI(o), b = t + r * zI(o);
			this._add("A", n, r, g, +p, +l, y, b);
		}
	}, e.prototype.rect = function(e, t, n, r) {
		this._add("M", e, t), this._add("l", n, 0), this._add("l", 0, r), this._add("l", -n, 0), this._add("Z");
	}, e.prototype.closePath = function() {
		this._d.length > 0 && this._add("Z");
	}, e.prototype._add = function(e, t, n, r, i, a, o, s, c) {
		for (var l = [], u = this._p, d = 1; d < arguments.length; d++) {
			var f = arguments[d];
			if (isNaN(f)) {
				this._invalid = !0;
				return;
			}
			l.push(Math.round(f * u) / u);
		}
		this._d.push(e + l.join(" ")), this._start = e === "Z";
	}, e.prototype.generateStr = function() {
		this._str = this._invalid ? "" : this._d.join(""), this._d = [];
	}, e.prototype.getStr = function() {
		return this._str;
	}, e;
}(), GI = "none", KI = Math.round;
function qI(e) {
	var t = e.fill;
	return t != null && t !== GI;
}
function JI(e) {
	var t = e.stroke;
	return t != null && t !== GI;
}
var YI = [
	"lineCap",
	"miterLimit",
	"lineJoin"
], XI = I(YI, function(e) {
	return "stroke-" + e.toLowerCase();
});
function ZI(e, t, n, r) {
	var i = t.opacity == null ? 1 : t.opacity;
	if (n instanceof To) {
		e("opacity", i);
		return;
	}
	if (qI(t)) {
		var a = qr(t.fill);
		e("fill", a.color);
		var o = t.fillOpacity == null ? a.opacity * i : t.fillOpacity * a.opacity * i;
		(r || o < 1) && e("fill-opacity", o);
	} else e("fill", GI);
	if (JI(t)) {
		var s = qr(t.stroke);
		e("stroke", s.color);
		var c = t.strokeNoScale ? n.getLineScale() : 1, l = c ? (t.lineWidth || 0) / c : 0, u = t.strokeOpacity == null ? s.opacity * i : t.strokeOpacity * s.opacity * i, d = t.strokeFirst;
		if ((r || l !== 1) && e("stroke-width", l), (r || d) && e("paint-order", d ? "stroke" : "fill"), (r || u < 1) && e("stroke-opacity", u), t.lineDash) {
			var f = VD(n), p = f[0], m = f[1];
			p && (m = KI(m || 0), e("stroke-dasharray", p.join(",")), (m || r) && e("stroke-dashoffset", m));
		} else r && e("stroke-dasharray", GI);
		for (var h = 0; h < YI.length; h++) {
			var g = YI[h];
			if (r || t[g] !== go[g]) {
				var _ = t[g] || go[g];
				_ && e(XI[h], _);
			}
		}
	} else r && e("stroke", GI);
}
//#endregion
//#region node_modules/zrender/lib/svg/core.js
var QI = "http://www.w3.org/2000/svg", $I = "http://www.w3.org/1999/xlink", eL = "http://www.w3.org/2000/xmlns/", tL = "http://www.w3.org/XML/1998/namespace", nL = "ecmeta_";
function rL(e) {
	return document.createElementNS(QI, e);
}
function iL(e, t, n, r, i) {
	return {
		tag: e,
		attrs: n || {},
		children: r,
		text: i,
		key: t
	};
}
function aL(e, t) {
	var n = [];
	if (t) for (var r in t) {
		var i = t[r], a = r;
		i !== !1 && (i !== !0 && i != null && (a += "=\"" + i + "\""), n.push(a));
	}
	return "<" + e + " " + n.join(" ") + ">";
}
function oL(e) {
	return "</" + e + ">";
}
function sL(e, t) {
	t ||= {};
	var n = t.newline ? "\n" : "";
	function r(e) {
		var t = e.children, i = e.tag, a = e.attrs, o = e.text;
		return aL(i, a) + (i === "style" ? o || "" : Oh(o)) + (t ? "" + n + I(t, function(e) {
			return r(e);
		}).join(n) + n : "") + oL(i);
	}
	return r(e);
}
function cL(e, t, n) {
	n ||= {};
	var r = n.newline ? "\n" : "", i = " {" + r, a = r + "}", o = I(R(e), function(t) {
		return t + i + I(R(e[t]), function(n) {
			return n + ":" + e[t][n] + ";";
		}).join(r) + a;
	}).join(r), s = I(R(t), function(e) {
		return "@keyframes " + e + i + I(R(t[e]), function(n) {
			return n + i + I(R(t[e][n]), function(r) {
				var i = t[e][n][r];
				return r === "d" && (i = "path(\"" + i + "\")"), r + ":" + i + ";";
			}).join(r) + a;
		}).join(r) + a;
	}).join(r);
	return !o && !s ? "" : [
		"<![CDATA[",
		o,
		s,
		"]]>"
	].join(r);
}
function lL(e) {
	return {
		zrId: e,
		shadowCache: {},
		patternCache: {},
		gradientCache: {},
		clipPathCache: {},
		defs: {},
		cssNodes: {},
		cssAnims: {},
		cssStyleCache: {},
		cssAnimIdx: 0,
		shadowIdx: 0,
		gradientIdx: 0,
		patternIdx: 0,
		clipPathIdx: 0
	};
}
function uL(e, t, n, r) {
	return iL("svg", "root", {
		width: e,
		height: t,
		xmlns: QI,
		"xmlns:xlink": $I,
		version: "1.1",
		baseProfile: "full",
		viewBox: r ? "0 0 " + e + " " + t : !1
	}, n);
}
//#endregion
//#region node_modules/zrender/lib/svg/cssClassId.js
var dL = 0;
function fL() {
	return dL++;
}
//#endregion
//#region node_modules/zrender/lib/svg/cssAnimation.js
var pL = {
	cubicIn: "0.32,0,0.67,0",
	cubicOut: "0.33,1,0.68,1",
	cubicInOut: "0.65,0,0.35,1",
	quadraticIn: "0.11,0,0.5,0",
	quadraticOut: "0.5,1,0.89,1",
	quadraticInOut: "0.45,0,0.55,1",
	quarticIn: "0.5,0,0.75,0",
	quarticOut: "0.25,1,0.5,1",
	quarticInOut: "0.76,0,0.24,1",
	quinticIn: "0.64,0,0.78,0",
	quinticOut: "0.22,1,0.36,1",
	quinticInOut: "0.83,0,0.17,1",
	sinusoidalIn: "0.12,0,0.39,0",
	sinusoidalOut: "0.61,1,0.88,1",
	sinusoidalInOut: "0.37,0,0.63,1",
	exponentialIn: "0.7,0,0.84,0",
	exponentialOut: "0.16,1,0.3,1",
	exponentialInOut: "0.87,0,0.13,1",
	circularIn: "0.55,0,1,0.45",
	circularOut: "0,0.55,0.45,1",
	circularInOut: "0.85,0,0.15,1"
}, mL = "transform-origin";
function hL(e, t, n) {
	var r = k({}, e.shape);
	k(r, t), e.buildPath(n, r);
	var i = new WI();
	return i.reset(ui(e)), n.rebuildPath(i, 1), i.generateStr(), i.getStr();
}
function gL(e, t) {
	var n = t.originX, r = t.originY;
	(n || r) && (e[mL] = n + "px " + r + "px");
}
var _L = {
	fill: "fill",
	opacity: "opacity",
	lineWidth: "stroke-width",
	lineDashOffset: "stroke-dashoffset"
};
function vL(e, t) {
	var n = t.zrId + "-ani-" + t.cssAnimIdx++;
	return t.cssAnims[n] = e, n;
}
function yL(e, t, n) {
	var r = e.shape.paths, i = {}, a, o;
	if (F(r, function(e) {
		var t = lL(n.zrId);
		t.animation = !0, xL(e, {}, t, !0);
		var r = t.cssAnims, s = t.cssNodes, c = R(r), l = c.length;
		if (l) {
			o = c[l - 1];
			var u = r[o];
			for (var d in u) {
				var f = u[d];
				i[d] = i[d] || { d: "" }, i[d].d += f.d || "";
			}
			for (var p in s) {
				var m = s[p].animation;
				m.indexOf(o) >= 0 && (a = m);
			}
		}
	}), a) {
		t.d = !1;
		var s = vL(i, n);
		return a.replace(o, s);
	}
}
function bL(e) {
	return U(e) ? pL[e] ? "cubic-bezier(" + pL[e] + ")" : yr(e) ? e : "" : "";
}
function xL(e, t, n, r) {
	var i = e.animators, a = i.length, o = [];
	if (e instanceof gd) {
		var s = yL(e, t, n);
		if (s) o.push(s);
		else if (!a) return;
	} else if (!a) return;
	for (var c = {}, l = 0; l < a; l++) {
		var u = i[l], d = [u.getMaxTime() / 1e3 + "s"], f = bL(u.getClip().easing), p = u.getDelay();
		f ? d.push(f) : d.push("linear"), p && d.push(p / 1e3 + "s"), u.getLoop() && d.push("infinite");
		var m = d.join(" ");
		c[m] = c[m] || [m, []], c[m][1].push(u);
	}
	function h(i) {
		var a = i[1], o = a.length, s = {}, c = {}, l = {}, u = "animation-timing-function";
		function d(e, t, n) {
			for (var r = e.getTracks(), i = e.getMaxTime(), a = 0; a < r.length; a++) {
				var o = r[a];
				if (o.needsAnimate()) {
					var s = o.keyframes, c = o.propName;
					if (n && (c = n(c)), c) for (var l = 0; l < s.length; l++) {
						var d = s[l], f = Math.round(d.time / i * 100) + "%", p = bL(d.easing), m = d.rawValue;
						(U(m) || W(m)) && (t[f] = t[f] || {}, t[f][c] = d.rawValue, p && (t[f][u] = p));
					}
				}
			}
		}
		for (var f = 0; f < o; f++) {
			var p = a[f], m = p.targetName;
			m ? m === "shape" && d(p, c) : !r && d(p, s);
		}
		for (var h in s) {
			var g = {};
			Gn(g, e), k(g, s[h]);
			var _ = di(g), v = s[h][u];
			l[h] = _ ? { transform: _ } : {}, gL(l[h], g), v && (l[h][u] = v);
		}
		var y, b = !0;
		for (var h in c) {
			l[h] = l[h] || {};
			var x = !y, v = c[h][u];
			x && (y = new qa());
			var S = y.len();
			y.reset(), l[h].d = hL(e, c[h], y);
			var C = y.len();
			if (!x && S !== C) {
				b = !1;
				break;
			}
			v && (l[h][u] = v);
		}
		if (!b) for (var h in l) delete l[h].d;
		if (!r) for (var f = 0; f < o; f++) {
			var p = a[f], m = p.targetName;
			m === "style" && d(p, l, function(e) {
				return _L[e];
			});
		}
		for (var w = R(l), T = !0, E, f = 1; f < w.length; f++) {
			var D = w[f - 1], O = w[f];
			if (l[D][mL] !== l[O][mL]) {
				T = !1;
				break;
			}
			E = l[D][mL];
		}
		if (T && E) {
			for (var h in l) l[h][mL] && delete l[h][mL];
			t[mL] = E;
		}
		if (L(w, function(e) {
			return R(l[e]).length > 0;
		}).length) return vL(l, n) + " " + i[0] + " both";
	}
	for (var g in c) {
		var s = h(c[g]);
		s && o.push(s);
	}
	if (o.length) {
		var _ = n.zrId + "-cls-" + fL();
		n.cssNodes["." + _] = { animation: o.join(",") }, t.class = _;
	}
}
//#endregion
//#region node_modules/zrender/lib/svg/cssEmphasis.js
function SL(e, t, n) {
	if (!e.ignore) {
		if (e.isSilent()) {
			var r = { "pointer-events": "none" };
			CL(r, t, n, !0);
		} else {
			var i = e.states.emphasis && e.states.emphasis.style ? e.states.emphasis.style : {}, a = i.fill;
			if (!a) {
				var o = e.style && e.style.fill, s = e.states.select && e.states.select.style && e.states.select.style.fill, c = e.currentStates.indexOf("select") >= 0 && s || o;
				c && (a = Gr(c));
			}
			var l = i.lineWidth;
			if (l) {
				var u = !i.strokeNoScale && e.transform ? e.transform[0] : 1;
				l /= u;
			}
			var r = { cursor: "pointer" };
			a && (r.fill = a), i.stroke && (r.stroke = i.stroke), l && (r["stroke-width"] = l), CL(r, t, n, !0);
		}
	}
}
function CL(e, t, n, r) {
	var i = JSON.stringify(e), a = n.cssStyleCache[i];
	a || (a = n.zrId + "-cls-" + fL(), n.cssStyleCache[i] = a, n.cssNodes["." + a + (r ? ":hover" : "")] = e), t.class = t.class ? t.class + " " + a : a;
}
//#endregion
//#region node_modules/zrender/lib/svg/graphic.js
var wL = Math.round;
function TL(e) {
	return e && U(e.src);
}
function EL(e) {
	return e && H(e.toDataURL);
}
function DL(e, t, n, r) {
	ZI(function(i, a) {
		var o = i === "fill" || i === "stroke";
		o && ci(a) ? HL(t, e, i, r) : o && ai(a) ? UL(n, e, i, r) : e[i] = a, o && r.ssr && a === "none" && (e["pointer-events"] = "visible");
	}, t, n, !1), VL(n, e, r);
}
function OL(e, t) {
	var n = BT(t);
	n && (n.each(function(t, n) {
		t != null && (e[("ecmeta_" + n).toLowerCase()] = t + "");
	}), t.isSilent() && (e[nL + "silent"] = "true"));
}
function kL(e) {
	return Yr(e[0] - 1) && Yr(e[1]) && Yr(e[2]) && Yr(e[3] - 1);
}
function AL(e) {
	return Yr(e[4]) && Yr(e[5]);
}
function jL(e, t, n) {
	if (t && !(AL(t) && kL(t))) {
		var r = n ? 10 : 1e4;
		e.transform = kL(t) ? "translate(" + wL(t[4] * r) / r + " " + wL(t[5] * r) / r + ")" : Qr(t);
	}
}
function ML(e, t, n) {
	for (var r = e.points, i = [], a = 0; a < r.length; a++) i.push(wL(r[a][0] * n) / n), i.push(wL(r[a][1] * n) / n);
	t.points = i.join(" ");
}
function NL(e) {
	return !e.smooth;
}
function PL(e) {
	var t = I(e, function(e) {
		return typeof e == "string" ? [e, e] : e;
	});
	return function(e, n, r) {
		for (var i = 0; i < t.length; i++) {
			var a = t[i], o = e[a[0]];
			o != null && (n[a[1]] = wL(o * r) / r);
		}
	};
}
var FL = {
	circle: [PL([
		"cx",
		"cy",
		"r"
	])],
	polyline: [ML, NL],
	polygon: [ML, NL]
};
function IL(e) {
	for (var t = e.animators, n = 0; n < t.length; n++) if (t[n].targetName === "shape") return !0;
	return !1;
}
function LL(e, t) {
	var n = e.style, r = e.shape, i = FL[e.type], a = {}, o = t.animation, s = "path", c = e.style.strokePercent, l = t.compress && ui(e) || 4;
	if (i && !t.willUpdate && !(i[1] && !i[1](r)) && !(o && IL(e)) && !(c < 1)) {
		s = e.type;
		var u = 10 ** l;
		i[0](r, a, u);
	} else {
		var d = !e.path || e.shapeChanged();
		e.path || e.createPathProxy();
		var f = e.path;
		d && (f.beginPath(), e.buildPath(f, e.shape), e.pathUpdated());
		var p = f.getVersion(), m = e, h = m.__svgPathBuilder;
		(m.__svgPathVersion !== p || !h || c !== m.__svgPathStrokePercent) && (h ||= m.__svgPathBuilder = new WI(), h.reset(l), f.rebuildPath(h, c), h.generateStr(), m.__svgPathVersion = p, m.__svgPathStrokePercent = c), a.d = h.getStr();
	}
	return jL(a, e.transform), DL(a, n, e, t), OL(a, e), t.animation && xL(e, a, t), t.emphasis && SL(e, a, t), iL(s, e.id + "", a);
}
function RL(e, t) {
	var n = e.style, r = n.image;
	if (r && !U(r) && (TL(r) ? r = r.src : EL(r) && (r = r.toDataURL())), r) {
		var i = n.x || 0, a = n.y || 0, o = n.width, s = n.height, c = {
			href: r,
			width: o,
			height: s
		};
		return i && (c.x = i), a && (c.y = a), jL(c, e.transform), DL(c, n, e, t), OL(c, e), t.animation && xL(e, c, t), iL("image", e.id + "", c);
	}
}
function zL(e, t) {
	var n = e.style, r = n.text;
	if (r != null && (r += ""), !(!r || isNaN(n.x) || isNaN(n.y))) {
		var i = n.font || "12px sans-serif", a = n.x || 0, o = ei(n.y || 0, ln(i), n.textBaseline), s = {
			"dominant-baseline": "central",
			"text-anchor": $r[n.textAlign] || n.textAlign
		};
		if (Wo(n)) {
			var c = "", l = n.fontStyle, u = Ho(n.fontSize);
			if (!parseFloat(u)) return;
			var d = n.fontFamily || "sans-serif", f = n.fontWeight;
			c += "font-size:" + u + ";font-family:" + d + ";", l && l !== "normal" && (c += "font-style:" + l + ";"), f && f !== "normal" && (c += "font-weight:" + f + ";"), s.style = c;
		} else s.style = "font: " + i;
		return r.match(/\s/) && (s["xml:space"] = "preserve"), a && (s.x = a), o && (s.y = o), jL(s, e.transform), DL(s, n, e, t), OL(s, e), t.animation && xL(e, s, t), iL("text", e.id + "", s, void 0, r);
	}
}
function BL(e, t) {
	if (e instanceof yo) return LL(e, t);
	if (e instanceof To) return RL(e, t);
	if (e instanceof xo) return zL(e, t);
}
function VL(e, t, n) {
	var r = e.style;
	if (ti(r)) {
		var i = ni(e), a = n.shadowCache, o = a[i];
		if (!o) {
			var s = e.getGlobalScale(), c = s[0], l = s[1];
			if (!c || !l) return;
			var u = r.shadowOffsetX || 0, d = r.shadowOffsetY || 0, f = r.shadowBlur, p = qr(r.shadowColor), m = p.opacity, h = p.color, g = f / 2 / c, _ = f / 2 / l, v = g + " " + _;
			o = n.zrId + "-s" + n.shadowIdx++, n.defs[o] = iL("filter", o, {
				id: o,
				x: "-100%",
				y: "-100%",
				width: "300%",
				height: "300%"
			}, [iL("feDropShadow", "", {
				dx: u / c,
				dy: d / l,
				stdDeviation: v,
				"flood-color": h,
				"flood-opacity": m
			})]), a[i] = o;
		}
		t.filter = li(o);
	}
}
function HL(e, t, n, r) {
	var i = e[n], a, o = { gradientUnits: i.global ? "userSpaceOnUse" : "objectBoundingBox" };
	if (oi(i)) a = "linearGradient", o.x1 = i.x, o.y1 = i.y, o.x2 = i.x2, o.y2 = i.y2;
	else if (si(i)) a = "radialGradient", o.cx = K(i.x, .5), o.cy = K(i.y, .5), o.r = K(i.r, .5);
	else return;
	for (var s = i.colorStops, c = [], l = 0, u = s.length; l < u; ++l) {
		var d = Zr(s[l].offset) * 100 + "%", f = s[l].color, p = qr(f), m = p.color, h = p.opacity, g = { offset: d };
		g["stop-color"] = m, h < 1 && (g["stop-opacity"] = h), c.push(iL("stop", l + "", g));
	}
	var _ = sL(iL(a, "", o, c)), v = r.gradientCache, y = v[_];
	y || (y = r.zrId + "-g" + r.gradientIdx++, v[_] = y, o.id = y, r.defs[y] = iL(a, y, o, c)), t[n] = li(y);
}
function UL(e, t, n, r) {
	var i = e.style[n], a = e.getBoundingRect(), o = {}, s = i.repeat, c = s === "no-repeat", l = s === "repeat-x", u = s === "repeat-y", d;
	if (ri(i)) {
		var f = i.imageWidth, p = i.imageHeight, m = void 0, h = i.image;
		if (U(h) ? m = h : TL(h) ? m = h.src : EL(h) && (m = h.toDataURL()), typeof Image > "u") {
			var g = "Image width/height must been given explictly in svg-ssr renderer.";
			me(f, g), me(p, g);
		} else if (f == null || p == null) {
			var _ = function(e, t) {
				if (e) {
					var n = e.elm, r = f || t.width, i = p || t.height;
					e.tag === "pattern" && (l ? (i = 1, r /= a.width) : u && (r = 1, i /= a.height)), e.attrs.width = r, e.attrs.height = i, n && (n.setAttribute("width", r), n.setAttribute("height", i));
				}
			}, v = Qe(m, null, e, function(e) {
				c || _(S, e), _(d, e);
			});
			v && v.width && v.height && (f ||= v.width, p ||= v.height);
		}
		d = iL("image", "img", {
			href: m,
			width: f,
			height: p
		}), o.width = f, o.height = p;
	} else i.svgElement && (d = E(i.svgElement), o.width = i.svgWidth, o.height = i.svgHeight);
	if (d) {
		var y, b;
		c ? y = b = 1 : l ? (b = 1, y = o.width / a.width) : u ? (y = 1, b = o.height / a.height) : o.patternUnits = "userSpaceOnUse", y != null && !isNaN(y) && (o.width = y), b != null && !isNaN(b) && (o.height = b);
		var x = di(i);
		x && (o.patternTransform = x);
		var S = iL("pattern", "", o, [d]), C = sL(S), w = r.patternCache, T = w[C];
		T || (T = r.zrId + "-p" + r.patternIdx++, w[C] = T, o.id = T, S = r.defs[T] = iL("pattern", T, o, [d])), t[n] = li(T);
	}
}
function WL(e, t, n) {
	var r = n.clipPathCache, i = n.defs, a = r[e.id];
	if (!a) {
		a = n.zrId + "-c" + n.clipPathIdx++;
		var o = { id: a };
		r[e.id] = a, i[a] = iL("clipPath", a, o, [LL(e, n)]);
	}
	t["clip-path"] = li(a);
}
//#endregion
//#region node_modules/zrender/lib/svg/domapi.js
function GL(e) {
	return document.createTextNode(e);
}
function KL(e, t, n) {
	e.insertBefore(t, n);
}
function qL(e, t) {
	e.removeChild(t);
}
function JL(e, t) {
	e.appendChild(t);
}
function YL(e) {
	return e.parentNode;
}
function XL(e) {
	return e.nextSibling;
}
function ZL(e, t) {
	e.textContent = t;
}
//#endregion
//#region node_modules/zrender/lib/svg/patch.js
var QL = 58, $L = 120, eR = iL("", "");
function tR(e) {
	return e === void 0;
}
function nR(e) {
	return e !== void 0;
}
function rR(e, t, n) {
	for (var r = {}, i = t; i <= n; ++i) {
		var a = e[i].key;
		a !== void 0 && (r[a] = i);
	}
	return r;
}
function iR(e, t) {
	var n = e.key === t.key;
	return e.tag === t.tag && n;
}
function aR(e) {
	var t, n = e.children, r = e.tag;
	if (nR(r)) {
		var i = e.elm = rL(r);
		if (cR(eR, e), V(n)) for (t = 0; t < n.length; ++t) {
			var a = n[t];
			a != null && JL(i, aR(a));
		}
		else nR(e.text) && !G(e.text) && JL(i, GL(e.text));
	} else e.elm = GL(e.text);
	return e.elm;
}
function oR(e, t, n, r, i) {
	for (; r <= i; ++r) {
		var a = n[r];
		a != null && KL(e, aR(a), t);
	}
}
function sR(e, t, n, r) {
	for (; n <= r; ++n) {
		var i = t[n];
		i != null && (nR(i.tag) ? qL(YL(i.elm), i.elm) : qL(e, i.elm));
	}
}
function cR(e, t) {
	var n, r = t.elm, i = e && e.attrs || {}, a = t.attrs || {};
	if (i !== a) {
		for (n in a) {
			var o = a[n];
			i[n] !== o && (o === !0 ? r.setAttribute(n, "") : o === !1 ? r.removeAttribute(n) : n === "style" ? r.style.cssText = o : n.charCodeAt(0) === $L ? n === "xmlns:xlink" || n === "xmlns" ? r.setAttributeNS(eL, n, o) : n.charCodeAt(3) === QL ? r.setAttributeNS(tL, n, o) : n.charCodeAt(5) === QL ? r.setAttributeNS($I, n, o) : r.setAttribute(n, o) : r.setAttribute(n, o));
		}
		for (n in i) n in a || r.removeAttribute(n);
	}
}
function lR(e, t, n) {
	for (var r = 0, i = 0, a = t.length - 1, o = t[0], s = t[a], c = n.length - 1, l = n[0], u = n[c], d, f, p, m; r <= a && i <= c;) o == null ? o = t[++r] : s == null ? s = t[--a] : l == null ? l = n[++i] : u == null ? u = n[--c] : iR(o, l) ? (uR(o, l), o = t[++r], l = n[++i]) : iR(s, u) ? (uR(s, u), s = t[--a], u = n[--c]) : iR(o, u) ? (uR(o, u), KL(e, o.elm, XL(s.elm)), o = t[++r], u = n[--c]) : iR(s, l) ? (uR(s, l), KL(e, s.elm, o.elm), s = t[--a], l = n[++i]) : (tR(d) && (d = rR(t, r, a)), f = d[l.key], tR(f) ? KL(e, aR(l), o.elm) : (p = t[f], p.tag === l.tag ? (uR(p, l), t[f] = void 0, KL(e, p.elm, o.elm)) : KL(e, aR(l), o.elm)), l = n[++i]);
	(r <= a || i <= c) && (r > a ? (m = n[c + 1] == null ? null : n[c + 1].elm, oR(e, m, n, i, c)) : sR(e, t, r, a));
}
function uR(e, t) {
	var n = t.elm = e.elm, r = e.children, i = t.children;
	e !== t && (cR(e, t), tR(t.text) ? nR(r) && nR(i) ? r !== i && lR(n, r, i) : nR(i) ? (nR(e.text) && ZL(n, ""), oR(n, null, i, 0, i.length - 1)) : nR(r) ? sR(n, r, 0, r.length - 1) : nR(e.text) && ZL(n, "") : e.text !== t.text && (nR(r) && sR(n, r, 0, r.length - 1), ZL(n, t.text)));
}
function dR(e, t) {
	if (iR(e, t)) uR(e, t);
	else {
		var n = e.elm, r = YL(n);
		aR(t), r !== null && (KL(r, t.elm, XL(n)), sR(r, [e], 0, 0));
	}
	return t;
}
//#endregion
//#region node_modules/zrender/lib/svg/Painter.js
var fR = 0, pR = function() {
	function e(e, t, n) {
		if (this.type = "svg", this.configLayer = mR("configLayer"), this.storage = t, this._opts = n = k({}, n), this.root = e, this._id = "zr" + fR++, this._oldVNode = uL(n.width, n.height), e && !n.ssr) {
			var r = this._viewport = document.createElement("div");
			r.style.cssText = "position:relative;overflow:hidden";
			var i = this._svgDom = this._oldVNode.elm = rL("svg");
			cR(null, this._oldVNode), r.appendChild(i), e.appendChild(r);
		}
		this.resize(n.width, n.height);
	}
	return e.prototype.getType = function() {
		return this.type;
	}, e.prototype.getViewportRoot = function() {
		return this._viewport;
	}, e.prototype.getViewportRootOffset = function() {
		var e = this.getViewportRoot();
		if (e) return {
			offsetLeft: e.offsetLeft || 0,
			offsetTop: e.offsetTop || 0
		};
	}, e.prototype.getSvgDom = function() {
		return this._svgDom;
	}, e.prototype.refresh = function() {
		if (this.root) {
			var e = this.renderToVNode({ willUpdate: !0 });
			e.attrs.style = "position:absolute;left:0;top:0;user-select:none", dR(this._oldVNode, e), this._oldVNode = e;
		}
	}, e.prototype.renderOneToVNode = function(e) {
		return BL(e, lL(this._id));
	}, e.prototype.renderToVNode = function(e) {
		e ||= {};
		var t = this.storage.getDisplayList(!0), n = this._width, r = this._height, i = lL(this._id);
		i.animation = e.animation, i.willUpdate = e.willUpdate, i.compress = e.compress, i.emphasis = e.emphasis, i.ssr = this._opts.ssr;
		var a = [], o = this._bgVNode = hR(n, r, this._backgroundColor, i);
		o && a.push(o);
		var s = e.compress ? null : this._mainVNode = iL("g", "main", {}, []);
		this._paintList(t, i, s ? s.children : a), s && a.push(s);
		var c = I(R(i.defs), function(e) {
			return i.defs[e];
		});
		if (c.length && a.push(iL("defs", "defs", {}, c)), e.animation) {
			var l = cL(i.cssNodes, i.cssAnims, { newline: !0 });
			if (l) {
				var u = iL("style", "stl", {}, [], l);
				a.push(u);
			}
		}
		return uL(n, r, a, e.useViewBox);
	}, e.prototype.renderToString = function(e) {
		return e ||= {}, sL(this.renderToVNode({
			animation: K(e.cssAnimation, !0),
			emphasis: K(e.cssEmphasis, !0),
			willUpdate: !1,
			compress: !0,
			useViewBox: K(e.useViewBox, !0)
		}), { newline: !0 });
	}, e.prototype.setBackgroundColor = function(e) {
		this._backgroundColor = e;
	}, e.prototype.getSvgRoot = function() {
		return this._mainVNode && this._mainVNode.elm;
	}, e.prototype._paintList = function(e, t, n) {
		for (var r = e.length, i = [], a = 0, o, s, c = 0, l = 0; l < r; l++) {
			var u = e[l];
			if (!u.invisible) {
				var d = u.__clipPaths, f = d && d.length || 0, p = s && s.length || 0, m = void 0;
				for (m = Math.max(f - 1, p - 1); m >= 0 && !(d && s && d[m] === s[m]); m--);
				for (var h = p - 1; h > m; h--) a--, o = i[a - 1];
				for (var g = m + 1; g < f; g++) {
					var _ = {};
					WL(d[g], _, t);
					var v = iL("g", "clip-g-" + c++, _, []);
					(o ? o.children : n).push(v), i[a++] = v, o = v;
				}
				s = d;
				var y = BL(u, t);
				y && (o ? o.children : n).push(y);
			}
		}
	}, e.prototype.resize = function(e, t) {
		var n = this._opts, r = this.root, i = this._viewport;
		if (e != null && (n.width = e), t != null && (n.height = t), r && i && (i.style.display = "none", e = zD(r, 0, n), t = zD(r, 1, n), i.style.display = ""), this._width !== e || this._height !== t) {
			if (this._width = e, this._height = t, i) {
				var a = i.style;
				a.width = e + "px", a.height = t + "px";
			}
			if (ai(this._backgroundColor)) this.refresh();
			else {
				var o = this._svgDom;
				o && (o.setAttribute("width", e), o.setAttribute("height", t));
				var s = this._bgVNode && this._bgVNode.elm;
				s && (s.setAttribute("width", e), s.setAttribute("height", t));
			}
		}
	}, e.prototype.getWidth = function() {
		return this._width;
	}, e.prototype.getHeight = function() {
		return this._height;
	}, e.prototype.dispose = function() {
		this.root && (this.root.innerHTML = ""), this._svgDom = this._viewport = this.storage = this._oldVNode = this._bgVNode = this._mainVNode = null;
	}, e.prototype.clear = function() {
		this._svgDom && (this._svgDom.innerHTML = null), this._oldVNode = null;
	}, e.prototype.toDataURL = function(e) {
		var t = this.renderToString(), n = "data:image/svg+xml;";
		return e ? (t = fi(t), t && n + "base64," + t) : n + "charset=UTF-8," + encodeURIComponent(t);
	}, e;
}();
function mR(e) {
	return function() {};
}
function hR(e, t, n, r) {
	var i;
	if (n && n !== "none") {
		if (i = iL("rect", "bg", {
			width: e,
			height: t,
			x: "0",
			y: "0"
		}), ci(n)) HL({ fill: n }, i.attrs, "fill", r);
		else if (ai(n)) UL({
			style: { fill: n },
			dirty: Ee,
			getBoundingRect: function() {
				return {
					width: e,
					height: t
				};
			}
		}, i.attrs, "fill", r);
		else {
			var a = qr(n), o = a.color, s = a.opacity;
			i.attrs.fill = o, s < 1 && (i.attrs["fill-opacity"] = s);
		}
	}
	return i;
}
//#endregion
//#region node_modules/echarts/lib/renderer/installSVGRenderer.js
function gR(e) {
	e.registerPainter("svg", pR);
}
//#endregion
//#region src/frontend/co-energy-chart-v6.js
sA([
	vw,
	zb,
	$N,
	JP,
	DF,
	RI,
	tI,
	fI,
	gR
]);
var _R = "echarts", vR = DO;
function yR(e, t) {
	let n = Bk(e, null, { renderer: "svg" });
	return t !== void 0 && n.setOption(t), n;
}
function bR(e) {
	e && !e.isDisposed() && Vk(e);
}
function xR(e) {
	e && !e.isDisposed() && e.resize();
}
//#endregion
export { _R as chartEngine, vR as chartEngineVersion, bR as disposeChart, yR as initChart, xR as resizeChart };
