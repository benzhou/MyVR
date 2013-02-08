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
        collisionTest : function(o){
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

    var Person = application.Person = MovingObject.extend({
        constructor: function(opt){
            this.myName = opt.name;
            this.position = {x: opt.position.x, y:opt.position.y};
            this.width = opt.width;
            this.height = opt.height;
            this.defaultSpeed = opt.speed;

            //this.constructor.__super__.constructor.apply(this, [opt]);
        },
        myName : "Person",
        communicate : function(context){
            console.log("I m a person, this is me:");
            console.log(this);
        },
        paint: function(canvas, context){
            //context.fillStyle = "rgb(150,29,28)";
            //console.log('x: ' + this.position.x + ', y: ' + this.position.y + ', width: ' +this.width + ', height: ' +this.height);
            //context.fillRect (this.position.x, this.position.y, this.width, this.height);
            context.strokeRect(this.position.x, this.position.y, this.width, this.height);
        }
    });

    var Snake = application.Snake = MovingObject.extend({
        constructor: function(opt){
            this.myName = opt.name || "Snake Player 1";
            this.position = {x: opt.position.x, y:opt.position.y};
            this.width = opt.width;
            this.height = opt.height;

            console.log(opt.world);
             _.extend(this.world.size, opt.world.size);
            console.log(this.world);

            this.bodyCount = 5;
            this.direction = opt.direction || "right";
            this.defaultSpeed = opt.speed;
            this.lastPosition = [];

            console.log(this);
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
            this.lastPosition.reverse();
            //console.log(this.lastPosition);

        },
        myName : "Snake",
        move : function(param){
            //change the direction
            this.direction = param.direction;

            //This will be the MovingObject's move method
            this.constructor.__super__.move.apply(this, [param]);

            //record the new snake head's position
            this.lastPosition.push({x:this.position.x, y:this.position.y});

            //If lastPosition queue is longer than total body count, trim it.
            if(this.lastPosition.length > this.bodyCount){
                this.lastPosition.splice(0, this.lastPosition.length - this.bodyCount)
            }

            //console.log(this.lastPosition);
        },
        paint: function(canvas, context){
            context.lineWidth = 2;

            for(var i = 0; i < this.bodyCount; i++){
                if(i==0){
                    context.strokeRect(this.position.x, this.position.y, this.width, this.height);
                }else{
                    //we will use recorded last position queue to paint the rest of the snake,
                    var pos = this.lastPosition[this.lastPosition.length - 1 - i];
                    context.strokeRect(pos.x, pos.y, this.width, this.height);
                }

            }
            //console.log('x: ' + this.position.x + ', y: ' + this.position.y + ', width: ' +this.width + ', height: ' +this.height);
        },
        collisionTest : function(o){
            return false;
        }
    });
}).call(this, _);


(function(window, $, undefined){
    var config = {
        verbose: true,
        canvasId : 'star_object',
        world:{
            items : [],
            size : {
                width: 600,
                height: 400
            }
        },
        myObj : {
            name: "Player 1",
            iObjSize : 100,
            x : 0,
            y : 0,
            width : 10,
            height: 10,
            speed : 10
        }
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

        //TODO: Adds event listener
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
    },
    run = function(canvas, context, skynet){
        render(canvas, context, skynet);
    },
    render = function(canvas, context, skynet){
        var c = config;
        context.clearRect(0, 0, c.world.size.width, c.world.size.height);
        context.save();

        _.each(skynet, function(element, index, list){
            element.paint(canvas, context);
        });

        context.fillText('x: ' + skynet[0].position.x + '; y: ' + skynet[0].position.y, 10, 15);

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




