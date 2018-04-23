var con = console;

var Game = (function(canvas) {


  var Key = { Forward: 38, Left: 37, Right: 39,
              Z: 90, X: 88, W: 87, A: 65, S: 83, D: 68 };

  var FRAMES_PER_SECOND = 30;
  var FRAME_LENGTH = 1/FRAMES_PER_SECOND*1000;

  var FSM = { title: 1, game: 2, incorrect: 3, instructions: 4 };

  var state = {};
  var MAX_RECTANGLES = 7;
  var DISPLAY_RECTANGLE_FOR = 2; // seconds
  var INCORRECT_DISPLAY_RECTANGLE_FOR = 0.5;

  //------------------------------------------------------------------------------------------------
  var ctx,                   // canvas context
      cw,  ch,               // canvas width, height
      minSide;

  //------------------------------------------------------------------------------------------------
  var init = function() {
    ctx    = canvas.getContext('2d');
    cw     = canvas.width;
    ch     = canvas.height;
    minSide = Math.min(cw,ch);
    $(canvas).focus();
//    $(window).keydown(keyDownHandler);
//    $(window).keyup(keyUpHandler);

  };
  //------------------------------------------------------------------------------------------------
  var mod = function(x,m) {
    var r = x % m;
    return r < 0 ? r + m : r;
  };

  //------------------------------------------------------------------------------------------------
  var isKeyDown = function(keycode) {
    return player.keyState[keycode];
  };

  //------------------------------------------------------------------------------------------------
  var isKeyUp = function(keycode) {
    return !isKeyDown(keycode);
  };

  //------------------------------------------------------------------------------------------------
  var keyDownHandler = function(ev) {
//    player.keyState[ev.keyCode] = true;
//    console.log(player.keyState);
  };
  //------------------------------------------------------------------------------------------------
  var keyUpHandler = function(ev) {
//    delete player.keyState[ev.keyCode];
  };
  //------------------------------------------------------------------------------------------------
  var drawPoly = function(pos, pts) {

    var mkPt = function(pt) {
      return w2c({ x: pos.x + pt.x, y: pos.y + pt.y });
    };

    var i, pt = mkPt(pts[0]);
    ctx.beginPath();

    ctx.moveTo(pt.x, pt.y);
    for (i=1; i < pts.length; i++) {
      pt = mkPt(pts[i]);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();

  };

  //------------------------------------------------------------------------------------------------
  // World to canvas
  var w2c = function(pt) {
    return { x: ccx + (cmzoom * (pt.x - cmx)),
             y: ccy - (cmzoom * (pt.y - cmy)) };
  };

  //------------------------------------------------------------------------------------------------
  var visibleBounds = function() {
    var w = cw/(cmzoom), h = ch/(cmzoom);
    return { left: -w/2 + cmx, right: w/2 + cmx, top: h/2 + cmy, bottom: -h/2 + cmy,
              w: w, h: h };
  };

  //------------------------------------------------------------------------------------------------
  var drawCircleAt = function(pos) {
    inCtx(function() {
      ctx.beginPath();
      ctx.fillStyle = 'green';
      ctx.arc(pos.x, pos.y, GRID_WIDTH/2*0.8*cmzoom, 2*Math.PI, false);
      ctx.fill();
    });
  }

  //------------------------------------------------------------------------------------------------
  // draws text centered
  var drawText = function(h, x,y, str, color) {
    ctx.font = h + "px Helvetica";
    ctx.fillStyle = color;
    m = ctx.measureText(str);
    ctx.fillText(str, x -m.width/2 + cw/2,y + h/3 + ch/2);
//    ctx.lineWidth = h/50;
//    ctx.strokeStyle = "#000000";
//    ctx.strokeText(str, x -m.width/2 + cw/2,y + h/3 + ch/2);

  };

  //------------------------------------------------------------------------------------------------
  var initTitle = function() {
    var h = 200;
    var fnt = "" + h + "px Helvetica, Arial, sans-serif";
    ctx.font = fnt;
    state.localState = { titleFrames: FRAMES_PER_SECOND*2,
                         titleFrame: 0,
                         subtitleFrames: FRAMES_PER_SECOND*3,
                         subtitleFrame: 0,
                         titleFinished: false
                       }

  };

  //------------------------------------------------------------------------------------------------
  var drawTitle = function() {
    var s = state.localState;
    var title = function(frac) {
      var alpha, color;
      alpha = frac*frac;
      color = "rgba(255,255,255,"+alpha+")";
      drawText(minSide/5, 0, 0, "Certainty", color);
    }

    var subtitle = function(frac) {
      var alpha, color;
      alpha = frac*frac;
      color = "rgba(255,255,255,"+alpha+")";
      drawText(minSide/20, 0, minSide/5, "a mini-game by Peaceful Lake", color);
    };

    if (!s.titleFinished) {

      if (s.titleFrame <= s.titleFrames) {
        ctx.clearRect(0,0,cw,ch);
        title(s.titleFrame/s.titleFrames);
        s.titleFrame += 1
      } else if (s.subtitleFrame <= s.subtitleFrames) {
        ctx.clearRect(0,0,cw,ch);
        title(1.0);
        subtitle(s.subtitleFrame / (s.subtitleFrames*0.75));
        s.subtitleFrame += 1
      } else {
        console.log("hi");
        s.titleFinished = true;
        state.fsm = FSM.instructions;
        state.fsmInit = initInstructions;
      }
    }
  };

  //------------------------------------------------------------------------------------------------
  var randBetween = function(x,y) {
    var min = Math.min(x,y),
        max = Math.max(x,y),
        range = max - min;

    return(Math.random()*range + min);
  };

  //------------------------------------------------------------------------------------------------
  var initGame = function() {
    var rects = Math.round(randBetween(3,MAX_RECTANGLES)),
        greyStart = randBetween(0.8,0.9);
    state.localState = { rectangles: rects,
                         currentRect: 1,
                         greyStart: greyStart,
                         greyDiff: (1.0 - greyStart),
                         gameOver: false,
                         t: 0 };
    gameHandlers(state.localState);
  };

  //------------------------------------------------------------------------------------------------
  var rectWidth = function() {
    return cw / (MAX_RECTANGLES);
  };

  var rectHeight = function() {
    return ch / (MAX_RECTANGLES);
  };

  //------------------------------------------------------------------------------------------------
  var drawRect = function(x,y,w,h,color) {
    ctx.fillStyle = color;
    ctx.fillRect(x + cw/2 - w/2,y+ ch/2 -h/2,w,h);
  };

  var unbindHandlers = function() {
      $(canvas).unbind("click");
      $('body').unbind("keydown");
  };

  var bindHandlers = function(h) {
    var h_ = function(e) {
      if ((e.type == 'keydown' && e.keyCode == 32) || e.type != 'keydown' ) {
        unbindHandlers();
        e.preventDefault();
        e.stopPropagation();
        h(e);
      }

    };

    $(canvas).click(h_);
    $('body').keydown(h_);

  }

  //------------------------------------------------------------------------------------------------
  var gameHandlers = function(s) {
    unbindHandlers();
    var h = function(e) {

      s.gameOver = true;
      if (s.currentRect == s.rectangles) {
        drawText(minSide/5,  0,    0, "Correct!", "#00CC00");
        state.score += 1;
        state.gamesPlayed += 1;
        drawText(minSide/10, 0, minSide/8, "Your score is " + state.score + "/" + state.gamesPlayed,
                                   "#666666");
        drawText(minSide/20, 0, minSide/5, "Tap/space/click to play again", "#999999");
        newGameHandlers();

      } else {
        unbindHandlers();
        state.fsm = FSM.incorrect;
        s.incorrectStartRect = s.currentRect;
        s.t = 0;
        s.gameOver = false;
      }
    };
    bindHandlers(h);
  }

  //------------------------------------------------------------------------------------------------
  var newGameHandlers = function() {
    unbindHandlers();
    var h = function (e) {
      state.fsm = FSM.game;
      state.fsmInit = initGame;
    }
    bindHandlers(h);
  };
  //------------------------------------------------------------------------------------------------
  var initInstructions = function() {
  };
  //------------------------------------------------------------------------------------------------
  var instructions = function () {
      var color, d = 30;
      ctx.clearRect(0,0,cw,ch);
      color = "#CCCCFF";

      drawText(minSide/d, 0, -minSide/5,
          "[Direct experience] is a sort of virtual reality, created by", color);
      drawText(minSide/d, 0, -(3*minSide)/20,
          "our brains using sketchy and flawed sensory clues", color);
      drawText(minSide/d, 0, -minSide/10,
          "- David Deutsch", color);

      color = "#FFFFFF";
      drawText(minSide/d, 0, 3*minSide/20,
          "In this game a series of rectangles will appear.", color);
      drawText(minSide/d, 0, minSide/5,
          "Tap/space/click when the outermost rectangle is white", color);

      drawText(minSide/d, 0, minSide/3,
          "Tap/space/click to play", "#CCCCCC");



      newGameHandlers();

  }

  var drawRects = function() {
    var s = state.localState;
    for (i=s.currentRect; i >= 1; i--) {
      n = i;
      // v is between 0.0 and 1.0.
      v = (Math.log(n) / Math.log(s.rectangles));
      c = Math.floor((s.greyStart + v*s.greyDiff)*255.0);
//        console.log(s.currentRect, s.rectangles, v, c);
      color = "rgba("+c+","+c+","+c+",1.0)";
      drawRect(0,0,rectWidth()*n, rectHeight()*n, color);
    }
  };

  //------------------------------------------------------------------------------------------------
  var incorrect = function() {
    var s = state.localState;
    var c, color, i, n, v, cur;

    if (!s.gameOver) {
      ctx.clearRect(0,0,cw,ch);
      drawRects();
      drawText(minSide/10,  0,    0, "Nope!", "#CC0000");

      cur = Math.floor(s.t / INCORRECT_DISPLAY_RECTANGLE_FOR) + s.incorrectStartRect;
      s.currentRect = Math.min(s.rectangles, cur);


      if (cur > s.rectangles) {

        drawText(minSide/10, 0, minSide/8, "Your score is " + state.score + "/" + state.gamesPlayed,
                                 "#666666");
        drawText(minSide/20, 0, minSide/5, "Tap/press/click to play again", "#999999");
        state.gamesPlayed += 1;
        s.gameOver = true;
        newGameHandlers();
      }
      s.t += FRAME_LENGTH/1000.0;
    }
  };



  //------------------------------------------------------------------------------------------------
  var game = function() {
    var s = state.localState;
    var c, color, i, n, v, cur;


    if (!s.gameOver) {
      ctx.clearRect(0,0,cw,ch);
      drawRects();

      cur = Math.floor(s.t / DISPLAY_RECTANGLE_FOR) + 1;
      s.currentRect = Math.min(s.rectangles, cur);

      if (cur > s.rectangles || cur == MAX_RECTANGLES) {
        drawText(minSide/5,  0,    0, "Too late!", "#CC0000");
        drawText(minSide/10, 0, minSide/8, "Your score is " + state.score + "/" + state.gamesPlayed,
                                 "#666666");
        drawText(minSide/20, 0, minSide/5, "Tap/press/click to play again", "#999999");
        state.gamesPlayed += 1;
        s.gameOver = true;
        newGameHandlers();
      }
      s.t += FRAME_LENGTH/1000.0;
    }
  };
  //------------------------------------------------------------------------------------------------
  var drawFrame = function() {

    // initialise if needed
    if (state.fsmInit) {
      state.fsmInit();
      state.fsmInit = false;
    }

    if (state.fsm == FSM.title) {
      drawTitle();
    } else if (state.fsm == FSM.game) {
      game();
    } else if (state.fsm == FSM.incorrect) {
      incorrect();
    } else if (state.fsm == FSM.instructions) {
      instructions();
    }

    setTimeout(drawFrame, FRAME_LENGTH);
  };

  //------------------------------------------------------------------------------------------------
  var play = function () {
    state.fsmInit = initTitle;
    state.fsm     = FSM.title;
    state.score   = 0;
    state.gamesPlayed = 0;
    setTimeout(drawFrame,FRAME_LENGTH);
  }

  // -----------------------------------------------------------------------------------------------
  return({
    init: init,
    play: play
  });
});


jQuery(function() {
  var pos = $('#canvas').position(),
      h = $(window).height(),
      w = $(window).width(),
      min = Math.min(w,h),

      percent = 0.8;


  $('#canvas').attr('width', w).attr('height', h)
              .css('left', 0)
              .css('top', 0)
              .css('padding', 0);

  var game  = Game($('canvas')[0]);
  game.init();
  game.play();
});