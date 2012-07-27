(function (ko, $, now, _, g, undefined) {
	

	var bot,
			log = ko.observableArray([]),
			handlers = ko.observableArray([]),
			songHandlers = ko.observableArray([]),
			lastContext = null,
			output = ko.observable(),
			editor, 
			botInfos = ko.observableArray([]);
	
	function Bot(data) {
		var me = this, name;
		data = data || {};
		name = new Date().getTime()+'';
		this.auth = ko.observable(data.auth);
		this.userid = ko.observable(data.userid);
		this.id = ko.observable(data.id);
		this.name = ko.observable(data.name || name);
		this.isActive = ko.observable(false);
		this.room = ko.observable(data.room);
		this.init();
		
		//function save

	}

	Bot.prototype = {
		toJSON: function () {
			var obj = {
				auth: this.auth(),
				userid: this.userid(),
				name: this.name(),
				room: this.room(),
				id: this.id()
			};
			return JSON.stringify(obj);
		},
		init: function() {
			if(this.id()) {
				now.getBotStatus(this.id());
			}	
		},
		save: function() {
			localStorage.setItem('bot', this.toJSON());	
		},
		create: function() {
			now.createBot(this.name().trim(), this.auth().trim(), this.userid().trim());	
		},
		changeRoom: function() {
			now.changeRoom(this.id(), this.room().trim());	
		},
		say: function(form) {
			var text = $(form).find('input').val();
			now.speak(this.id(), text);	
		},
		startDj: function() {
			now.startDj(this.id());
		},
		stopDj: function() {
			now.stopDj(this.id());
		},
		upVote: function() {
			now.upvote(this.id());
		},
		skip: function() {
			now.skip(this.id());	
		},
		downVote: function() {
			now.downvote(this.id());
		},
		destroy: function() {
			now.stopBot(this.id());	
			this.id(null);
			this.isActive(false);
			this.save();
		}


	};

	Bot.fromJSON = function (json) {
		return new Bot(JSON.parse(json));
	};

	Bot.restore = function() {
		var data = localStorage.getItem('bot'), bot;
		bot = Bot.fromJSON(data);
		bot.init();
		return bot;
	};

	function SongHandler(data) {
		this.name = ko.observable(data.name);
		this.desc = ko.observable(data.desc);
		this.min = ko.observable(data.min);
		this.max = ko.observable(data.max);
		this.tmpl = ko.observable(data.tmpl);
		this.isActive = ko.observable(false);
		this.error = ko.observable(null);
	}

	SongHandler.prototype.toObj = function() {
		return {
			name: this.name(),
			min: this.min(),
			max: this.max(),
			tmpl: this.tmpl()
		};
	};

	SongHandler.prototype.update = function(data) {
		this.name(data.name);
		this.desc(data.desc);
		this.min(data.min);
		this.max(data.max);
		this.tmpl(data.tmpl);
		this.isActive(true);
	};

	SongHandler.prototype.action = function() {

		if(1*this.max() < 1*this.min()) {
			this.error('min > max');
			return;
		}
		
		if(this.isActive()) {
			now.removeSongHandler(bot.id(), this.toObj());
		} else {
			now.addSongHandler(bot.id(), this.toObj());
		}	
		now.getSongHandlers(bot.id());
		
	};

	function SpeechHandler(data) {
		this.name = ko.observable(data.name);
		this.desc = ko.observable(data.desc);
		this.random = ko.observable(data.random);
		this.min = ko.observable(data.min);
		this.max = ko.observable(data.max);
		this.tmpl = ko.observable(data.tmpl);
		this.match = ko.observable(data.match);
		this.isActive = ko.observable(false);
		this.error = ko.observable(null);
	}

	SpeechHandler.prototype.update = function(data) {
		this.name(data.name);
		this.desc(data.desc);
		this.random(data.random);
		this.min(data.min);
		this.max(data.max);
		this.match(data.match);
		this.tmpl(data.tmpl);
		this.isActive(true);
	};

	SpeechHandler.prototype.toObj = function() {
		return {
			name: this.name(),
			random: this.random(),
			min: this.min(),
			max: this.max(),
			tmpl: this.tmpl(),
			match: this.match()
		};
	};
	
	SpeechHandler.prototype.action = function() {
		if(this.isActive()) {
			now.removeSpeechHandler(bot.id(), this.toObj());
		} else {
			if(1*this.max() < 1*this.min()) {
				this.error('min > max');
				return;
			}
			try {
				new RegExp(this.match(), 'i');
				now.addSpeechHandler(bot.id(), this.toObj());
			} catch(e) {
				this.error('Invalid RegEx');
				console.log('invalid regex');
				console.log(e);
				return;
			}
		}	
		now.getSpeechHandlers(bot.id());
	};

	function BotInfo(data) {
		var me = this;
		this.name = '';
		if(data.info) {
			this.name = data.info.name;
		}
		this.users = _.values(data.users);
		this.word = '';
		if(data.speechHandlers) {
			_.each(data.speechHandlers, function(handler, key) {
				if(key.toLowerCase() === 'register upvote') {
					me.word = handler.match;	
				}	
			});	
		}
	}

	now.botStatus = function(obj) {
		if(obj.id) {
			g.bot.id(obj.id);	
		}
		if(obj.isActive) {
			g.bot.isActive(obj.isActive);	
			
		} else {
			handlers([]);
			songHandlers([]);
		}
		bot.save();
		now.getSpeechHandlers(bot.id());
		now.getSongHandlers(bot.id());
	}; 
	now.botLogger = function(message, data) {
		console.log(message);
		console.log(data);
		console.log('=============================');
		lastContext = data;
		log.push({message:message, data:data});
	};
	now.handlersChanged = function(resp) {
		handlers.removeAll(handlers());

		_.each(resp.all, function(v) {
			handlers.push(new SpeechHandler(v));
		});

		_.each(resp.reg, function(v) {
			_.all(handlers(), function(h) {
				if(h.name() === v.name) {
					h.update(v);
					return false;
				}
				return true;
			});	
		});	
	};

	now.songHandlersChanged = function(resp) {
		songHandlers.removeAll(songHandlers());

		_.each(resp.all, function(v) {
			songHandlers.push(new SongHandler(v));
		});

		_.each(resp.reg, function(v) {
			_.all(songHandlers(), function(h) {
				if(h.name() === v.name) {
					h.update(v);
					return false;
				}
				return true;
			});	
		});	
	};

	now.updateBotStatus = function(infos) {
		botInfos.removeAll(botInfos());
		_.each(infos, function(info) {
			botInfos.push(new BotInfo(info));	
		});
	};

	function testTemplate() {
		var tmpl = editor.getSession().getValue(), out;
		$('#errorOutput').css('color', '');

		try{
			if(lastContext == null) {
				throw 'No Context Please Wait for Room Event. (Someone Say something!)';	
			}
			out = _.template(tmpl, lastContext);
			output(out);
		} catch(e) {
			console.log('**********************');
			console.log('Template Error');
			console.log(e);
			console.log('Template:');
			console.log(tmpl);
			console.log('Context Object:');
			console.log(lastContext);
			console.log('************************');
			output('Template Error See JavaScript Console');
			$('#errorOutput').css('color', 'red');
		}
	}
	
	now.ready(function() {
		$(function() {
		
			bot = Bot.restore();
			var	bindingObj = {
						bot: bot,
						log: log,
						handlers: handlers,
						songHandlers: songHandlers,
						output: output,
						testTemplate: testTemplate,
						botInfos: botInfos
					};	
			ko.bindingHandlers.fadeIn = {
				update: function(ele, val) {
					$(ele).hide().text(val()).fadeIn(600);	
				}	
			}

			ko.bindingHandlers.logRenderer = {
				update: function(element, valAcces) {
					var $ele = $(element),
							$tmpl = $('<div>'),
							rawLog,
							entry,
							now = $('<strong>', {
								text:new Date().toString()	
							});

					rawLog = valAcces()();
					
					if(rawLog.length) {
						entry = rawLog[rawLog.length-1];
					}


					if(entry && entry.message) {
						$tmpl.text(entry.message);
						$ele.append($tmpl);
					}

					if($ele.find('div').length > 200) {
						$ele.find('div:lt(1)').remove();	
					}
					$ele.animate({ scrollTop: $ele.prop("scrollHeight") }, 300);
				}
			};

			ko.applyBindings(bindingObj);
			g.bot = bot;
			
			//ace editor
			editor = ace.edit("templateInput");
			editor.setTheme("ace/theme/twilight");
			var JavaScriptMode = require("ace/mode/javascript").Mode;
			editor.getSession().setMode(new JavaScriptMode());
			editor.setShowPrintMargin(false);
			editor.getSession().setTabSize(2);

			window.editor = editor;
			editor.getSession().setValue($('#code').val());

		});

	});

}(this.ko, this.$, this.now, this._, this));

