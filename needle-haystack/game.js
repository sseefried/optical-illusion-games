var con = console;

var Game = (function(canvas) {
  // Constants

  var NUM               = 20,
      PADDING           = 100,
      FRAMES_PER_SECOND = 30, // percent
      CHANGE_EVERY      = 3,  // seconds
      DEFAULT_COLOR     = { r: 0,   g: 0,   b: 255, a: 1 },
      DIFFERENT_COLOR   = { r: 255, g: 255, b: 0,   a: 1 },
      CHANGE_DURATION   = 500;


  //-----------------------------------------------

  var canvas, side, objs = {}, different, frames;;

  // c1, c2 are colors in form { r:, g:, b: , a: }
  // p is between 0 and 1
  var interp_color = function(c1, c2, p) {
    var c = { r: Math.floor((1-p) * c1.r + p*c2.r),
              g: Math.floor((1-p) * c1.g + p*c2.g),
              b: Math.floor((1-p) * c1.b + p*c2.b),
              a: Math.floor((1-p) * c1.a + p*c2.a) };
    return col(c);
  };

  var col = function(c) {
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + c.a + ")";
  };

  var init = function() {

    var pos = $('#canvas').position(),
        h = $(window).height(),
        w = $(window).width();
    side = Math.min(w,h);
    frames = 0;

    $('#canvas').attr('width', side).attr('height', side).css("margin", "auto");

    canvas = new fabric.StaticCanvas('canvas', { backgroundColor: "rgba(0,0,0,1)"});

    var i,j;
    for (i=0; i < NUM; i++) {
      for (j=0; j < NUM; j++) {
        addRect({x: i, y: j });
      }
    }

    different = { rotated: newDifferent(), colored: [newDifferent()] };
    setTimeout(anim, 1000/FRAMES_PER_SECOND);

  };


  var newDifferent = function() {
    return { x: Math.floor(Math.random() * NUM),
             y: Math.floor(Math.random() * NUM) };
  };

  var objAt = function(pos) {
    return objs[pos.x][pos.y];
  };

  var addRect = function(pos) {

    var w = side / (NUM*(1+PADDING/100)),
        w_ = side / NUM,
        padding_frac = w*PADDING/100,
        x = pos.x*w_ + w_/2,
        y = pos.y*w_ + w_/2;

    var rect = new fabric.Rect({
      left: x,
      top: y,
      fill: col(DEFAULT_COLOR),
      width: w,
      height: w,
      originX: "center",
      originY: "center",
      angle: 0
    });

    if (!objs[pos.x]) { objs[pos.x] = {}}
    objs[pos.x][pos.y] = rect;

    canvas.add(rect);

  };

  var anim = function() {
    var i;

    if (frames % (CHANGE_EVERY*FRAMES_PER_SECOND) == 0) {

      objAt(different.rotated).set({ angle: 0 });
      for (i=0; i < different.colored.length; i++) {
        objAt(different.colored[i]).set({ fill: col(DEFAULT_COLOR) });
        different.colored[i] = newDifferent();
      }
      different.colored[i] = newDifferent();
      different.rotated    = newDifferent();

      objAt(different.rotated).animate("angle", 20, {
        duration: CHANGE_DURATION,
        onChange: canvas.renderAll.bind(canvas)
      });


      var foo = function(o) {

        var f = (1+(PADDING/100)/2);

        o.animate('fill', "", {
          duration: CHANGE_DURATION,
          onChange: canvas.renderAll.bind(canvas),
          easing: function(e,t,n,r) {
            var p = e/r;
            return interp_color(DEFAULT_COLOR, DIFFERENT_COLOR, p);
          }
        });


        o.animate('width', w*f, {
          duration: CHANGE_DURATION,
          onChange: canvas.renderAll.bind(canvas),
          onComplete: function() {
            o.animate('width', w, {
              duration: CHANGE_DURATION,
              onChange: canvas.renderAll.bind(canvas),
            })
          }
        });

        o.animate('height', w*f, {
          duration: CHANGE_DURATION,
          onChange: canvas.renderAll.bind(canvas),
          onComplete: function() {
            o.animate('height', w, {
              duration: CHANGE_DURATION,
              onChange: canvas.renderAll.bind(canvas),
            })
          }
        });

      };

      for (i=0; i < different.colored.length; i++ ) {
        var o = objAt(different.colored[i]), w = o.width, h = o.height;
        foo(o);
      }

      canvas.renderAll();
    }
    frames += 1;
    setTimeout(anim, 1000/FRAMES_PER_SECOND);
  };

  return({
    init: init
  })

});


jQuery(function() {


  //-----------------------------------------------------------------------


  var game  = Game('canvas');
  game.init();

});