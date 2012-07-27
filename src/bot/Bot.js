var _ = require('underscore'),
		TTAPIBot = require('ttapi');


function Bot(id, auth, userid) {
	this._id = id;
	this._auth = auth;
	this._userid = userid;
	this.speechHandlers = {};
	this.songHandlers = {};
	this._currentRoomId = null;
	this._api = new TTAPIBot(this._auth, this._userid);
	this.logger = function() {};
	this.users = {};
	this.bots = {};
	this.info = null;
	this.context = {};
}

Bot.prototype = {
	_handleSpeech: function(data) {
		if(!(data.userid in this.bots)) {
			_.each(this.speechHandlers, function(handler, name) {
				console.log('handling speech');
				handler.fn.call(handler, this, this.context);
			}, this);	
		}
	}, 
	_handleSong: function(data) {
		_.each(this.songHandlers, function(handler, name) {
			handler.fn.call(handler, this, this.context);
		}, this);	
	},
	_logEvent: function(text, details) {
		this.logger(text, details);
	},
	setLogger: function (fn) {
		this.logger = fn;
	},
	connect: function() {
		var me = this;
		//when someone comes in 
		this._api.on('registered', function(data) {
			me.context.room_activity = data;
			me.logger(data.name+' has joined the room', me.context, 'joinroom');
		});
		//when someone leaves
		this._api.on('deregistered', function(data) {
			me.context.room_activity = data;
			me.logger(data.name+' has left the room', me.context, 'leaveroom');	
		});
		//someone says something
		this._api.on('speak', function(data) {
			me.context.speak = data;
			me.logger(data.name+ ' said '+ data.text, me.context, 'speak');	
			me._handleSpeech(data);
		});
		this._api.on('newsong', function(data) {
			me.context.song = data;
			me.logger('new song', me.context, 'newsong');	
			me._handleSong(data);	
		});
		this._api.on('ready', function() {
			me._api.userInfo(function(d) {
				me.info = d;	
				me.context.bot_info = d;
				me.logger('Ready',  me.context, 'botready');
			});		
		});

	},
	changeRoom: function(id, cb) {
		var me = this;
		this._api.roomRegister(id, function(data) {
			this.context.current_room = data;
			me.logger('Room Changed', this.context, 'roomchange');
			if(cb) {
				cb(data);	
			}
		});
	},
	leaveRoom: function() {
		var me = this;
		this._api.roomDeregister(function(d) {
			me.logger('LEFT ROOM', d);
		});
	},
	say: function(text) {
		this._api.speak(text);	
	},
	upvote: function() {
		this._api.bop();
	},
	downvote: function() {
		this._api.vote('down');
	},
	startDj: function(cb) {
		var me = this;
		this._api.addDj(function(data) {
			me.logger('I am now a DJ', data);
			if(cb) {
				cb(data);	
			}	
		});	
	},
	stopDj: function(cb) {
		var me = this;
		this._api.remDj(function(data) {
			me.logger('I am not a DJ', data);
			if(cb) {
				cb(data);	
			}
		});
	},
	skip: function() {
		var me = this;
		this._api.skip(function(d) {
			me.logger('Song Skipped', d);	
		});
	},
	destroy: function() {
		//possible memory leak.. Not documented how to kill bots
		this.leaveRoom();
		this._api.close();	
	}
	
};

exports.Bot = Bot;
