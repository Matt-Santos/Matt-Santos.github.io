// ADDITIVE ANIMATIONS
// Combines concurrent animations of the same object into one smooth continuous animation
// https://developer.apple.com/videos/play/wwdc2014-236/

// Simple version (http://codepen.io/osublake/pen/PPmJpL/)


console.clear();
var log = console.log.bind(console);

var baseURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/106114/";

//
// EVENT EMITTER
// ===========================================================================
class EventEmitter {

  constructor() {
    
    this.eventLookup = {};

    // Aliases
    this.emit = this.fire;
    this.trigger = this.fire;
    this.addListener = this.on;
    this.removeListener = this.off;
  }

  once(event, callback, scope = this, priority = 0) {
    return this.on(event, callback, scope, priority, true);
  }

  on(event, callback, scope = this, priority = 0, once = false) {

    var listeners = this.eventLookup[event];
    if (!listeners) this.eventLookup[event] = listeners = [];

    var index = 0;

    for (var i = 0, ii = listeners.length; i < ii; i++) {
      if (listeners[i].priority > priority) index = i + 1;
    }

    listeners.splice(index, 0, { callback, scope, priority, once });
    return () => this.off(event, callback, scope);
  }

  off(event, callback, scope = this) {

    var listeners = this.eventLookup[event];
    if (event === "*") this.eventLookup = {};
    else if (!callback) this.eventLookup[event] = [];
    else {
      var total = listeners.length;
      for (var i = 0; i < total; i++) {
        if (listeners[i].callback === callback && listeners[i].scope === scope) {
          listeners.splice(i, 1);
          return;
        }
      }
    }
  }

  fire(event, ...data) {

    var listeners = this.eventLookup[event];
    if (!listeners) return;

    for (var i = 0, ii = listeners.length; i < ii; i++) {

      var listener = listeners[i];
      if (listener.once) {
        this.off(event, listener.callback, listener.scope);
      }

      listener.callback.apply(listener.scope, data);
    }
  }
}

//
// SCREEN
// ===========================================================================
class Screen extends PIXI.Rectangle {
  
  constructor(wait = 100) {
    super();
    
    var mousemove = _.throttle(event => this.pointerMove(event), wait);
    
    this.set(0, 0, window.innerWidth, window.innerHeight);
    
    this.pointerX = null;
    this.pointerY = null;   
       
    window.addEventListener("mousemove", mousemove);    
    window.addEventListener("resize", event => this.resize(event));
    
    document.addEventListener("mouseleave", event => this.pointerLeave(event));
    document.addEventListener("mouseenter", event => this.pointerEnter(event));
  }
    
  set(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width  = width;
    this.height = height;
  }
  
  resize(event) {    
    this.set(0, 0, window.innerWidth, window.innerHeight);
    events.emit("screen:resized", this.width, this.height);
  }
  
  pointerEnter(event) {
    var x = this.pointerX = event.clientX;
    var y = this.pointerY = event.clientY;
    events.emit("pointer:entered", x, y);
  }
  
  pointerLeave(event) {
    var x = this.pointerX = event.clientX;
    var y = this.pointerY = event.clientY;
    events.emit("pointer:left", x, y);
  }
   
  pointerMove(event) {
    var x = this.pointerX = event.clientX;
    var y = this.pointerY = event.clientY;
    events.emit("pointer:moved", x, y);
  }
}

//
// RENDERER
// ===========================================================================
class Renderer {
  
  constructor(assets, count = 10) {
    
    this.assets = assets;
    
    this.renderer = PIXI.autoDetectRenderer(screen.width, screen.height, {
      view: $("#stage"),
      antialias: true,
      autoResize: true,
      backgroundColor: 0x000000
    });
    
    this.stage = new PIXI.Container();
    
    this.ghostContainers = [];
    
    for (var i = 0; i < count; i++) {
      var container = new PIXI.Container();
      this.stage.addChild(container);
      this.ghostContainers.push(container);
    }
    
    this.ghostController = new GhostController(this, count, assets.trail.texture);
    
    TweenLite.set("main", { autoAlpha: 1 });
    
    events.on("screen:resized", this.resize, this);
    events.on("ticker:updated", this.render, this);    
  } 
  
  resize(width, height) {
    this.renderer.resize(width, height);
  }
  
  render(time) {
    this.ghostController.renderGhosts(time);
    this.renderer.render(this.stage);
  }
}

//
// GHOST CONTROLLER
// ===========================================================================
class GhostController {

  constructor(scope, count, texture) {

    this.scope  = scope;
    this.count  = count;
    this.ghosts = new LinkedList();
    this.active = false;
        
    var stage = scope.stage;
    var containers = scope.ghostContainers;
    
    for (var i = 0; i < count; i++) {      
      var ghost = new Ghost(scope, texture, containers[i], this);
      this.ghosts.add(ghost);
    } 
        
    events.on("pointer:moved", this.updateGhosts, this);
    events.on("pointer:left", () => { this.active = false; });
  }
    
  updateGhosts(x, y) {
        
    this.active = true;
    
    var size  = this.count;
    var ghost = this.ghosts.first;
    
    while (size--) {      
      ghost.tweenTo(x, y);
      ghost = ghost.next;
    }
  }
  
  renderGhosts(time) {
        
    var size  = this.count;
    var ghost = this.ghosts.first;
    
    while (size--) {
      if (!this.active) ghost.release(true);
      ghost.update(time);
      ghost = ghost.next;      
    }    
  }
}

//
// GHOST EMITTER
// ===========================================================================
class GhostEmitter {

  constructor(scope, container) {

    this.scope     = scope;
    this.texture   = scope.assets.trail.texture;    
    this.container = container;
    
    this.emitter = new cloudkid.Emitter(this.container, [this.texture], {
      
      alpha: { start: 0.8, end: 0.1 },
      scale: { start: 1, end: 0.3, minimumScaleMultiplier: 1 },
      color: { start: "#e3f9ff", end: "#0ec8f8" },
      speed: { start: 0, end: 0 },
      acceleration: { x: 0, y: 0 },
      startRotation: { min: 0, max: 0 },
      rotationSpeed: { min: 0, max: 0 },
      lifetime: { min: 0.2, max: 0.2 },
      blendMode: "normal", 
      frequency: 0.008, 
      emitterLifetime: -1, 
      maxParticles: 1000,
      pos: { x: 0, y: 0 },
      addAtBack: false,
      spawnType: "point"      
    });
    
    this.emitter.emit = true;
  }
  
  set emit(flag) { this.emitter.emit = flag; }
  
  spawn(x, y, time) {
    this.emitter.updateSpawnPos(x, y);
    this.emitter.update(time);
  } 
}

//
// GHOST
// ===========================================================================
class Ghost extends PIXI.Sprite {
  
  constructor(scope, texture, container, controller) {
    super(texture);
        
    this.scope      = scope;    
    this.container  = container;            
    this.controller = controller;
    this.tweens     = new LinkedList();      
    this.emitter    = new GhostEmitter(scope, container);
        
    this.anchor.set(0.5);
    this.pivot.set(0.5);     
    
    this.x  = _.random(screen.width);
    this.y  = _.random(screen.height);       
    this.tx = _.random(screen.width);
    this.ty = _.random(screen.height);
        
    this.container.addChild(this);    
    
    this.release(true);
  }
    
  release(delayed = false) {   
    
    TweenLite.delayedCall(delayed ? 1 : 0, () => {
      this.tweenTo(_.random(screen.width), _.random(screen.height));
    });
    return this;
  }
  
  tweenTo(x, y) {  
  
    var tween = new AdditiveTween(this, this.tx, this.ty, x, y, _.random(1, 2.9));
    
    this.tweens.add(tween);
    
    this.tx = x;
    this.ty = y;
    return this;
  }
  
  removeTween(tween) {
    this.tweens.remove(tween);
    return this;
  }
  
  update(time) {
        
    var size = this.tweens.size;
        
    if (!size) return;
    
    var tween = this.tweens.last;   
    
    var x = this.tx;
    var y = this.ty;
            
    while (size--) {
      x += tween.x;
      y += tween.y;      
      tween = tween.prev;
    }
    
    this.x = x;
    this.y = y;
    
    this.emitter.spawn(x, y, time * 0.001);           
    return this;
  }
}

//
// ADDITIVE TWEEN
// ===========================================================================
class AdditiveTween {
  
  constructor(scope, x1, y1, x2, y2, duration) {
            
    var onComplete = () => scope.removeTween(this);
    
    var signX = x1 < x2 ? -1 : 1;
    var signY = y1 < y2 ? -1 : 1;
    
    this._x = Math.abs(x1 - x2) * signX;
    this._y = Math.abs(y1 - y2) * signY;
    
    this.tween = TweenLite.to(this, duration, { x: 0, y: 0, ease, onComplete });    
  }
  
  get x() { return 0 - this._x; }
  get y() { return 0 - this._y; }
  
  set x(x) { this._x = x;}  
  set y(y) { this._y = y;}  
}


//
// LINKED LIST
// ===========================================================================
class LinkedList {

  constructor() {

    // Alias
    this.add = this.append;
    this.clear();
  }

  get isEmpty() { return !this.size && !this.first && !this.last; }

  static fromArray(array) {

    var list = new LinkedList();
    var size = array.length;

    while (size--) list.prepend(array[size]);
    return list;
  }
  
  clear() {

    this.size  = 0;
    this.first = null;
    this.last  = null;
    this.next  = null;
    this.prev  = null;

    return this;
  }

  get(i) {

    if (this.isEmpty) return null;

    var node = this.first;
    var size = i % this.size;

    while (size--) node = node.next;
    return node;
  }

  random() {

    var n = Math.random() * this.size >> 0;
    return this.get(n);
  }

  toArray() {

    var array = [];
    var node  = this.first;
    var size  = this.size;

    while (size--) {
      array.push(node);
      node = node.next;
    }

    return array;
  }

  forEach(callback, scope) {

    var node = this.first;
    var size = this.size;

    for (var i = 0; i < size; i++) {
      callback.call(scope, node, i);
      node = node.next;
    }
  }

  append(node) {
   
    if (this.first === null) {

      node.prev = node;
      node.next = node;

      this.first = node;
      this.last  = node;
      this.next  = node;

    } else {

      node.prev = this.last;
      node.next = this.first;

      this.last.next = node;
      this.last      = node;
    }
    
    this.size++;
    return node;
  }

  prepend(node) {

    if (this.first === null) {

      return this.append(node);

    } else {

      node.prev = this.last;
      node.next = this.first;

      this.first.prev = node;
      this.last.next  = node;
      this.first      = node;
    }

    this.size++;
    return node;
  }

  remove(node) {

    if (this.size > 1) {

      node.prev.next = node.next;
      node.next.prev = node.prev;

      if (node === this.first) this.first = node.next;
      if (node === this.last)  this.last = node.prev;

    } else {

      this.first = null;
      this.last  = null;
    }

    node.prev = null;
    node.next = null;

    this.size--;    
    return node;
  }

  insertBefore(node, newNode) {

    newNode.prev = node.prev;
    newNode.next = node;

    node.prev.next = newNode;
    node.prev      = newNode;

    if (newNode.next === this.first) this.first = newNode;

    this.size++;
    return newNode;
  }

  insertAfter(node, newNode) {

    newNode.prev = node;
    newNode.next = node.next;

    node.next.prev = newNode;
    node.next      = newNode;

    if (newNode.prev === this.last) this.last = newNode;

    this.size++;
    return newNode;
  }
}


//
// 
// ===========================================================================
var $ = document.querySelector.bind(document);

var ease   = Power1.easeInOut;
var events = new EventEmitter();
var screen = new Screen();

var last = _.now();
var time = last;

TweenLite.ticker.addEventListener("tick", () => {  
  var current = _.now();
  time = current - last;
  last = current;
  events.emit("ticker:updated", time);
});  

var loader = new PIXI.loaders.Loader(baseURL)
  .add("trail", "particle-01.png")
  .load((load, assets) => new Renderer(assets));














