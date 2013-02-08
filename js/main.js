var application = {};

(function(_){
    var extend = function(protoProps, staticProps) {
        var parent = this;
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && _.has(protoProps, 'constructor')) {
            child = protoProps.constructor;
        } else {
            child = function(){ return parent.apply(this, arguments); };
        }

        // Add static properties to the constructor function, if supplied.
        _.extend(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function(){ this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) _.extend(child.prototype, protoProps);

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.__super__ = parent.prototype;

        return child;
    };

    var Element = application.Element = {
        position : {
            x : 0,
            y : 0
        },
        myName : "Element",
        objType : 0,
        echoMyName : function(){
            console.log("My name is: " + this.myName);
        },
        echoMyPos : function(){
            console.log("My coordinates: x: " + this.position.x + " y: " + this.position.y);
        },
        paint : function(canvas, context){

        }
    };

    var WObject = application.WObject = function(){};
    _.extend(WObject.prototype, Element, {
        width:0,
        height:0,
        myName : "WObject",
        world : {
          size : {
              width : 0,
              height: 0
          }
        },
        collision:function(obj){
            return;
        },
        collisionTest : function(obj){
            if(!obj) return false;

            var x1 = this.position.x,y1 = this.position.y,w1 = this.width,h1=this.height,
                x2 = obj.position.x,y2 = obj.position.y, w2=obj.width,h2=obj.height;

            if (x1 + w1/2 >= x2-w2/2 && x1-w1/2 <= x2+w2/2 && y1+ h1/2 >= y2-h2/2 && y1-h1/2 <= y2+h2/2) {
                return true;    // if a hit, return true
            }

            return false;
        }
    });

    WObject.extend = extend;

    var StaticObject = application.StaticObject = WObject.extend({
        myName : "StaticObject"
    });

    var MovingObject = application.MovingObject = WObject.extend({
        myName : "MovingObject",
        defaultSpeed: 5,
        moveUp : function(speed){
            this.move({speed: speed, direction:"up"});
        },
        moveDown : function(speed){
            this.move({speed: speed, direction:"down"});
        },
        moveLeft : function(speed){
            this.move({speed: speed, direction:"left"});
        },
        moveRight : function(speed){
            this.move({speed: speed, direction:"right"});
        },
        move : function(param){
            var s = param.speed || this.defaultSpeed;

            var cw = this.world.size.width, ch = this.world.size.height;
            //console.log(this.world);
            //console.log("cw:" + cw + " ch:" + ch);

            switch(param.direction){
                case "up":
                    this.position.y = this.position.y - s;
                    if(this.position.y < 0){
                        this.position.y = ch;
                    }
                    break;
                case "down":
                    this.position.y = this.position.y + s;
                    if(this.position.y > ch){
                        this.position.y = 0;
                    }
                    break;
                case "left":
                    this.position.x = this.position.x - s;
                    if(this.position.x < 0){
                        this.position.x = cw;
                    }
                    break;
                case "right":
                    this.position.x = this.position.x + s;
                    if(this.position.x > cw){
                        this.position.x = 0;
                    }
                    break;
            }
        }
    }, {

    });

    var GameSubTitle = application.GameSubTitle = StaticObject.extend({
        constructor : function(opt){
            this.objType = 3;
            myName = "GameSubTitle";

            this.text = opt.text || "Game Over .";

            _.extend(this.position, opt.position);

            this.width = opt.width || 200;
            this.height = opt.height || 80;
        },
        paint:function(canvas, context){
            context.font = "20pt Arial";
            context.fillText(this.text, this.position.x, this.position.y);

            context.save();
        }
    });

    var FlashingDot = application.FlashingDot = StaticObject.extend({
        constructor : function(opt){
            this.objType = 2;
            this.myName = opt.name || "Flashing Dot";

            _.extend(this.position, opt.position);
            this.width = opt.width || 10;
            this.height = opt.height || 10;
            this.isAlive = true;
        },
        paint: function(canvas, context){
            context.fillRect(this.position.x, this.position.y, this.width, this.height);
            context.strokeRect(this.position.x, this.position.y, this.width, this.height);
            context.save();
            //console.log('x: ' + this.position.x + ', y: ' + this.position.y + ', width: ' +this.width + ', height: ' +this.height);
        },
        collision : function(obj){
            if(!this.isAlive || obj.objType === this.objType){
                return;
            }

            if(this.collisionTest(obj)){
                console.log("Touched something " + this.myName);
                this.isAlive = false;
            }
        }
    });

    var Snake = application.Snake = MovingObject.extend({
        constructor: function(opt){
            this.objType = 1;
            this.myName = opt.name || "Snake Player 1";
            this.position = {x: opt.position.x, y:opt.position.y};
            this.width = opt.width;
            this.height = opt.height;

            //console.log(opt.world);
             _.extend(this.world.size, opt.world.size);
            //console.log(this.world);

            this.bodyCount = 5;
            this.bodyParts = [];
            this.direction = opt.direction || "right";
            this.defaultSpeed = opt.speed;
            this.lastPosition = [];
            this.isAlive = true;


            //console.log(this);
            //this.constructor.__super__.constructor.apply(this, [opt]);

            //This is used to initialize the last position queue
            var offsetX = 0, offsetY = 0;

            for(var i = 0; i < this.bodyCount; i++){
                switch(this.direction){
                    case "up":
                        offsetY = i * this.height;
                        break;
                    case "down":
                        offsetY = - (i * this.height);
                        break;
                    case "right":
                        offsetX = - (i * this.width);
                        break;
                    case "left":
                        offsetX =  i * this.width;
                        break;
                }

                this.lastPosition.push({
                    x: this.position.x + offsetX,
                    y: this.position.y + offsetY
                });
            }
            //bodyParts record all body parts location.
            this.bodyParts = this.lastPosition.slice(0);

            //Last position has the latest head location at last in the array
            this.lastPosition.reverse();
            //console.log(this.lastPosition);

        },
        myName : "Snake",
        move : function(param){
            //We need to stop the snake be able to move to the opposite direction
            var oppositeDirection = false;

            switch(param.direction){
                case "up":
                    if(this.direction === "down"){
                        oppositeDirection = true;
                    }
                    break;
                case "down":
                    if(this.direction === "up"){
                        oppositeDirection = true;
                    }
                    break;
                case "right":
                    if(this.direction === "left"){
                        oppositeDirection = true;
                    }
                    break;
                case "left":
                    if(this.direction === "right"){
                        oppositeDirection = true;
                    }
                    break;
            }

            if(oppositeDirection){
                return;
            }

            //change the direction
            this.direction = param.direction;

            //This will be the MovingObject's move method
            this.constructor.__super__.move.apply(this, [param]);

            //record the new snake head's position
            this.lastPosition.push({x:this.position.x, y:this.position.y});

            this.bodyParts = this.lastPosition.slice(this.lastPosition.length - this.bodyCount , this.lastPosition.length - 1).reverse();
        },
        paint: function(canvas, context){
            context.lineWidth = 2;

            for(var i = 0; i < this.bodyCount; i++){
                if(i==0){
                    context.strokeRect(this.position.x, this.position.y, this.width, this.height);
                }else{
                    //we will use recorded last position queue to paint the rest of the snake,
                    if(this.lastPosition.length - 1 < i){
                        //console.log("Need add one more now");
                        console.log(this.lastPosition.length);
                    }else{
                        var pos = this.lastPosition[this.lastPosition.length - 1 - i];
                        context.strokeRect(pos.x, pos.y, this.width, this.height);
                    }
                }

            }

            context.save();
            //console.log('x: ' + this.position.x + ', y: ' + this.position.y + ', width: ' +this.width + ', height: ' +this.height);
        },
        collisionToSelf : function(){
            var hitSelf = false;

            for(var i = 2, l = this.bodyParts.length; i< l; i++){
                var bodyPart = {position:{x:this.bodyParts[i].x, y:this.bodyParts[i].y}, width:this.width, height:this.height};
                if(this.collisionTest(bodyPart)){
                    hitSelf = true;
                    break;
                };
            }

            if(hitSelf){
                this.isAlive = false;
                console.log("Snake just dead!");
            }
        },
        collision : function(obj){
            if(obj.objType === this.objType){
                //we need to test if the snake hits itself then it is GAME OVER.
                if(this.isAlive){
                    this.collisionToSelf();
                }
                return;
            }

            if(obj.isAlive && this.collisionTest(obj)){
                this.bodyCount ++;
            }
        }
    });
}).call(this, _);


(function(window, $, undefined){
    var config = {
        verbose: true,
        canvasId : 'star_object',
        world:{
            size : {
                width: 600,
                height: 400
            }
        },
        dotsMap:[
            {name: "Dot 1", x:400,y:260},
            {name: "Dot 2",x:300,y:120},
            {name: "Dot 3",x:240,y:360},
            {name: "Dot 4",x:510,y:100},
            {name: "Dot 5",x:400,y:60},
            {name: "Dot 6",x:490,y:180},
            {name: "Dot 7",x:250,y:260},
            {name: "Dot 8",x:500,y:200},
            {name: "Dot 9",x:90,y:360},
            {name: "Dot 10",x:240,y:20},
            {name: "Dot 11",x:50,y:360},
            {name: "Dot 12",x:190,y:50}
        ],
        myObj : {
            name: "Player 1",
            iObjSize : 100,
            x : 0,
            y : 0,
            width : 10,
            height: 10,
            speed : 10
        },
        defaultSpeed : 500
    },
    constants = {

    },
    onLoad = function(){
        var canvas = document.getElementById(config.canvasId),
            c = config,
            o = config.myObj,
            player = new application.Snake({name:o.name, position : {x:o.x, y:o.y}, speed:o.speed, width:o.width, height:o.height, world :c.world}),
            skynet = [player];

        // set size of our canvas area
        canvas.width = c.world.size.width;
        canvas.height = c.world.size.height;

        var context = canvas.getContext('2d');

        $("body").keydown(function(e){
            e.preventDefault();
            //utils.print(e);
            switch(e.which){
                case 37:
                    player.moveLeft();
                    break;
                case 38:
                    player.moveUp();
                    break;
                case 39:
                    player.moveRight();
                    break;
                case 40:
                    player.moveDown();
                    break;
                default:
                break;
            }
        });

        //utils.print("Window has been loaded");
        setInterval(function(){
            run(canvas, context,skynet);
        }, 40);

        var currentDotConfig = c.dotsMap.shift(),
            currentDot = new application.FlashingDot({
                name : currentDotConfig.name,
                position:{
                    x:currentDotConfig.x,
                    y:currentDotConfig.y
                }
            });

        skynet.push(currentDot);

        var timeLine = setInterval(function(){
            if(!currentDot.isAlive){
                if(c.dotsMap.length == 0){
                    clearInterval(timeLine);

                    var gameOverWin = new application.GameSubTitle({
                        position:{
                            x: c.world.size.width/2 - 100,
                            y: c.world.size.height/2 - 40
                        },
                        width:200,
                        height:80,
                        text:"You Win!"
                    });
                    skynet.push(gameOverWin);
                    return;
                }

                skynet.pop();
                currentDotConfig = c.dotsMap.shift(),
                console.log(currentDotConfig);
                currentDot = new application.FlashingDot({
                    name : currentDotConfig.name,
                    position:{
                        x:currentDotConfig.x,
                        y:currentDotConfig.y
                    }
                });

                skynet.push(currentDot);
            }

            if(!player.isAlive){
                clearInterval(timeLine);

                var gameOver = new application.GameSubTitle({
                    position:{
                        x: c.world.size.width/2 - 100,
                        y: c.world.size.height/2 - 40
                    },
                    width:200,
                    height:80,
                    text:"Game Over!"
                });
                skynet.push(gameOver);
                return;
            }

            switch(player.direction){
                case "left":
                    player.moveLeft();
                    break;
                case "up":
                    player.moveUp();
                    break;
                case "right":
                    player.moveRight();
                    break;
                case "down":
                    player.moveDown();
                    break;
                default:
                    break;
            }

        }, c.defaultSpeed);

    },
    run = function(canvas, context, skynet){
        //Test collision
        _.each(skynet, function(e,i,l){
            _.each(skynet, function(e2, i2, l2){
                e.collision(e2);
            });
        });

        //if(player.collisionTest(currentDot.position.x, currentDot.position.y, currentDot.width, currentDot.height)){
        //    player.collision();
        //    currentDot.collision();
        //}

        render(canvas, context, skynet);
    },
    render = function(canvas, context, skynet){
        var c = config;
        context.clearRect(0, 0, c.world.size.width, c.world.size.height);
        context.save();

        _.each(skynet, function(element, index, list){
            element.paint(canvas, context);
        });

        context.font = "12pt Arial";
        context.fillText('Player x: ' + skynet[0].position.x + '; y: ' + skynet[0].position.y, 10, 15);
        context.fillText('Current Dot: "' +  skynet[1].myName + '" x: ' + skynet[1].position.x + '; y: ' + skynet[1].position.y, 10, 35);
        context.save();
    },
    utils = function(){
        var print = function(msg){
            if(console){
                console.log(msg);
            }
        },
        /**
         * listener - Singleton.  used to subscribe to and fire events
         */
        listener = function () {
            /**
             * @param {Object} evts the container for all event listeners
             * @private
             */
            var evts = {};

            /**
             * listen - subscribe to events
             * @param {String} evtName the name to be listening for
             * @param {Function} method the function to be fired
             * @param {Object} scope the value for the 'this' object inside the function
             */
            var listen = function (evtName, method, scope) {
                if (method && method.constructor == Function) {
                    evts[evtName] = evts[evtName] || [];
                    evts[evtName][evts[evtName].length] = { method: method, scope: scope };
                }
            };

            /**
             * fire - call all the event handlers
             * @param {String} evtName the name of the event listner to invoke
             * @param {Boolean} remove Whether or not to unsubscribe all listeners
             */
            var fire = function (evtName, args) {
                args = args || [];
                if (evts.hasOwnProperty(evtName)) {
                    var evt = evts[evtName].reverse();
                    for (var i = evt.length; i--; ) {
                        try {
                            evt[i].method.apply(evt[i].scope || [], (args.data || []));
                        } catch (e) {
                            if (args && args.data && args.data.push) {
                                evt[i].method(args.data[0]);
                            } else {
                                evt[i].method();
                            }
                        }
                    }
                    if (args.remove) { kill(evtName); }
                }
            };

            var listening = function (evtName) {
                return !!evts[evtName];
            };

            var kill = function (evtName) {
                if (evts.hasOwnProperty(evtName)) { delete evts[evtName]; }
            };

            // return the public functions
            return { listen: listen, fire: fire, kill: kill, listening: listening };
        } ();

        return  {listener : listener, print: print};
    }();

    $(function(){
        onLoad();
    })

})(window, jQuery);




