var Bot = require('./Bot').Bot,
		_ = require('underscore');


function BotFactory() {
	this.bots = {};
}

BotFactory.prototype = {
	getNewBot: function(id, auth, userid) {
		var bot = new Bot(id, auth, userid),
				bid = _.uniqueId(id),
				me = this;
				
		this.bots[bid] = {
			id:bid,
			name: id,
			instance: bot,
			startTime: new Date()
		};	
		this.bots[bid].instance.connect();
		setTimeout(function() {	
			_.each(me.bots, function(b) {

				_.each(me.bots, function(lb) {
					b.instance.bots[lb.instance.info.userid] = true;	
				});
			
			});
		}, 4000);
		return this.bots[bid];
	},
	getBotCount: function() {
		return _.size(this.bots);	
	},
	getBotInfo: function() {
		var out = [];
		_.each(this.bots, function(bot) {
			var info = {
				users: bot.instance.users,
				info: bot.instance.info, 
				speechHandlers: bot.instance.speechHandlers,
				songHandlers: bot.instance.songHandlers
			};	
			out.push(info);
		});
		return out;
	},
	getBotById: function(id) {
		return this.bots[id];	
	},
	destroyBot: function(id) {
		var bot;

		if(id.id) {
			delete this.bots[id.id];
			id.instance.destroy();
		} else {
			bot = this.bots[id];	
			if(bot) {
				bot.instance.destroy();	
			}
			delete this.bots[id];
		}
	}
};



exports.BotFactory = BotFactory;
