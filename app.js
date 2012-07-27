var http = require('http'),
		StaticServer = require('node-static').Server,
		nowjs = require('now'),
		server,
		everyone,
		staticServer,
		_ = require('underscore'),
		BotFactory = require('./src/bot/BotFactory').BotFactory,
		handlers = require('./src/bot/BotSpeechHandlers').handlers,
		songHandlers = require('./src/bot/BotSpeechHandlers').songhandlers,
		bots = new BotFactory();

	//server setup
	staticServer = new StaticServer('./public');
	server = http.createServer(function(req, resp) {
		req.addListener('end', function() {
			staticServer.serve(req, resp);	
		});	
	});
	server.listen(3333);
	console.log('Server Listening on 3333');
	everyone = nowjs.initialize(server);


	function updateStatus(client, bot) {	
		var bs = {};
		if(bot) {
			bs.id = bot.id;
			bs.name = bot.name;
			bs.startTime =  bot.startTime;
			bs.isActive =  true;
		} else {
			bs.isActive = false;
		}
		client.now.botStatus(bs);
		everyone.now.updateBotStatus(bots.getBotInfo());
	}

	function registerLogger(client, bot) {		
		bot.instance.setLogger( function(message, obj) {
			client.now.botLogger(message, obj);
			everyone.now.updateBotStatus(bots.getBotInfo());
		});
	}
	
	everyone.now.getBotStatus = function(id) {
		var bot = bots.getBotById(id);
		updateStatus(this, bot);
		if(bot) {
			registerLogger(this, bot);	
		}

	};
	

	//define client functions
	everyone.now.createBot = function(id, auth, userid ) {
		var bot = bots.getNewBot(id, auth, userid),
				client = this;
		registerLogger(this, bot);	
		updateStatus(this, bot);	
	};

	everyone.now.changeRoom = function(botid, roomid) {
		var bot = bots.getBotById(botid);
		console.log(arguments);
		if(bot == null) {
			console.log('Botid not found ' + botid);	
		} else {
			bot.instance.changeRoom(roomid);
			updateStatus(this, bot);	
		}
	};

	everyone.now.speak = function(id, text) {
		var bot = bots.getBotById(id);
		if(bot) {
			bot.instance.say(text);	
		}
	};

	everyone.now.upvote = function(id) {
		var bot = bots.getBotById(id);
		if(bot) {
			bot.instance.upvote();	
		}
	};

	everyone.now.downvote = function(id) {
		
		var bot = bots.getBotById(id);
		if(bot) {
			bot.instance.downvote();	
		}
	};

	everyone.now.startDj = function(id) {
		
		var bot = bots.getBotById(id);
		if(bot) {
			bot.instance.startDj();	
		}
	};


	everyone.now.skip = function(id) {
		
		var bot = bots.getBotById(id);
		if(bot) {
			bot.instance.skip();	
		}
	};

	everyone.now.stopDj = function(id) {
		
		var bot = bots.getBotById(id);
		if(bot) {
			bot.instance.stopDj();	
		}
	};

	everyone.now.stopBot = function(id) {
		
		var bot = bots.getBotById(id);
		if(bot) {
			bots.destroyBot(bot);	
		}
	};

	everyone.now.getSongHandlers = function(id) {
			
		var bot = bots.getBotById(id),
				out = {
					reg: [],
					all: []
				};

		if(!bot) {
			return;	
		}

		_.each(songHandlers, function(h) {
			out.all.push({
				name: h.name,
				desc: h.description,
				min: h.minResponse,
				max: h.maxResponse,
				tmpl: h.template
			});
		});

		if(bot) {
			_.each(bot.instance.songHandlers, function(h) {
				out.reg.push({
					name: h.name,
					desc: h.description,
					min: h.minResponse,
					max: h.maxResponse,
					tmpl: h.template
				});
			});
		}

		this.now.songHandlersChanged(out);
	};

	everyone.now.addSongHandler = function(id, obj) {
		
		var bot = bots.getBotById(id), 
				handler;
		if(!bot) {
			return;
		}
		
		_.all(songHandlers, function(h) {
			var clone;
			if(h.name === obj.name) {
				clone = _.clone(h);
				clone.minResponse = obj.min;
				clone.maxResponse = obj.max;
				clone.template = obj.tmpl;
				bot.instance.songHandlers[clone.name] = clone;
				return false;
			}	
			return true;
		});

		everyone.now.updateBotStatus(bots.getBotInfo());
	};

	everyone.now.removeSongHandler = function(id, obj) {
		var bot = bots.getBotById(id);
		if(!bot) {
			console.log('No Bot %s', id);
			console.log(obj);
			return;
		}

		delete bot.instance.songHandlers[obj.name];

		everyone.now.updateBotStatus(bots.getBotInfo());
	};

	everyone.now.getSpeechHandlers = function(id) {
		var bot = bots.getBotById(id),
				out = {
					reg: [],
					all: []
				};

		if(!bot) {
			return;	
		}

		_.each(handlers, function(h) {
			out.all.push({
				name: h.name,
				desc: h.description,
				random: h.randomness,
				min: h.minResponse,
				max: h.maxResponse,
				tmpl: h.template,
				match: h.match
			});
		});

		if(bot) {
			_.each(bot.instance.speechHandlers, function(h) {
				out.reg.push({
					name: h.name,
					desc: h.description,
					random: h.randomness,
					min: h.minResponse,
					max: h.maxResponse,
					tmpl: h.template,
					match: h.match
				});
			});
		}

		this.now.handlersChanged(out);
	};

	everyone.now.addSpeechHandler = function(id, obj) {
		var bot = bots.getBotById(id), 
				handler;
		if(!bot) {
			return;
		}
		
		_.all(handlers, function(h) {
			var clone;
			if(h.name === obj.name) {
				clone = _.clone(h);
				clone.minResponse = obj.min;
				clone.maxResponse = obj.max;
				clone.match = obj.match;
				clone.template = obj.tmpl;
				clone.randomness = obj.random;
				bot.instance.speechHandlers[clone.name] = clone;
				return false;
			}	
			return true;
		});

		everyone.now.updateBotStatus(bots.getBotInfo());
	};

	everyone.now.removeSpeechHandler = function(id, obj) {
		var bot = bots.getBotById(id);
		if(!bot) {
			console.log('No Bot %s', id);
			console.log(obj);
			return;
		}

		delete bot.instance.speechHandlers[obj.name];
		everyone.now.updateBotStatus(bots.getBotInfo());
	};
	


