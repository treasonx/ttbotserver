
var http = require('http'),
		twss = require('twss'),
		$ = require('jquery'),
		_ = require('underscore');

function scheduleResponse(min, max, fn) {
	
	var seconds = Math.ceil(Math.random()*(max - min));

	setTimeout(function() {
		
		setTimeout(function() {
			fn();
		}, seconds*1000);
			
	}, min*1000);
		
}

function sayChuckJoke(bot, firstname, lastname) {
	var options =  {
		host: 'api.icndb.com',
		port: 80,
		path: '/jokes/random',
		method: 'GET'
	},
	chuckJoke = '',
	req;

	if(firstname && lastname) {
		options.path+= '?firstName='+firstname+'&lastName='+lastname;
	}

	try{

		req = http.get(options, function(res) {
			res.on('data', function (chunk) {
				chuckJoke += chunk;
			});
			res.on('end', function(){
				var obj = JSON.parse(chuckJoke),
						decoder = $('<div>');
				if(obj && obj.value && obj.value.joke) {
					decoder.html(obj.value.joke);
					bot.say(decoder.text());
					bot.logger(decoder.text());
				}
				
			});
		});
	} catch(e) {
		bot.logger('ERROR getting joke', e);
	}

}

function shouldReply(randomness) {
	var random = Math.ceil(Math.random()*randomness),
			lucky = parseInt(randomness/2, 10);

	return random === lucky;
}

function getResponse(data, tmpl) {
	var c = _.template(tmpl),
			out = {};
	try {
		out.text = c(data);
	} catch (e) {
		out.isError = true;
		out.details = e
	}
	return out;
}

exports.songhandlers = [
	{
		name: 'Upvote',
		description: 'Upvote Registered Users',
		minResponse: 10,
		maxResponse: 100,
		template: '<%= song.name %> great song!',
		fn: function(bot, data) {
			var userid = data.song.room.metadata.current_dj, reply;
			
			if(userid in bot.users) {
				data.song.name = bot.users[userid];
				
				reply = getResponse(data, this.template);
				if(reply.isError) {
					bot.logger('Upvote Song Handler Template Error', reply.details);	
				} else {
					bot.logger('Scheduling Upvote', data);
					scheduleResponse(this.minResponse, this.maxResponse, function() {
						if(reply.text !== '') {
							bot.say(reply.text);
						}
						bot.upvote();
					});	
				}
			}

		}
	},
	{	
		name: 'Generic',
		description: 'Will trigger for every song that plays',
		minResponse: 5,
		maxResponse: 10,
		template: '<%= song.room.metadata.current_song.metadata.song %>, is an awesome song!',
		fn: function(bot, data) {
			var reply = getResponse(data, this.template);
			if(reply.isError) {
				bot.logger('Generic Song Handler Template Error', reply.details);	
			} else {
				bot.logger('Scheduling Generic Song Handler', data);
				scheduleResponse(this.minResponse, this.maxResponse, function() {
					if(reply.text !== '') {
						bot.say(reply.text);
					}
				});	
			}
		}
	}
];

exports.handlers = [
	{
		name: 'Chuck Norris',
		description: 'Responds with Chuck Norris joke. If the user who last spoke has a 2 word user name it will replace Chuck Norris with the user\'s name',
		randomness: 3,
		minResponse: 5,
		maxResponse: 12,
		match: '^.*$',
		template: 'NOT USED',
		fn: function(bot, data) {
			var nameParts, firstname, lastname;
			if(!shouldReply(this.randomness)) {
				return;
			}

			if(!data.speak.text.match(new RegExp(this.match, 'i'))) {
				return;
			}
			
			nameParts = data.speak.name.split(' ');
			if(nameParts.length > 1) {
				firstname = nameParts[0];
				lastname = nameParts[1];
			}
			bot.logger('Scheduling Chuck Norris Joke', data);	
			scheduleResponse(this.minResponse, this.maxResponse, function() {
				sayChuckJoke(bot, firstname, lastname);
			});

		}
	},
	{
		name: 'TWSS',
		description: 'Responds with "thats what she said" if it seems like it would make sense.',
		randomness: 3,
		minResponse: 1,
		match: '^.*$',
		maxResponse: 5,
		template: 'LOL <%= speak.name %> thats what she said',
		fn: function(bot, data) {
			var reply;
			if(!shouldReply(this.randomness)) {
				return;	
			}

			if(data.speak.text.match(new RegExp(this.match, 'i')) && twss.is(data.speak.text)) {
				reply = getResponse(data, this.template);
				if(reply.isError) {
					bot.logger('TWSS Template Error', reply.details);	
				} else {
					bot.logger('Scheduling TWSS', data);
					scheduleResponse(this.minResponse, this.maxResponse, function() {
						if(reply.text !== '') {
							bot.say(reply.text);
						}
					});	
				}
			}
		}
	},
	{
	
		name: 'Register Upvote',
		description: 'Registers user for upvote. Random is ignored',
		randomness: 3,
		minResponse: 1,
		match: '^magic word$',
		maxResponse: 5,
		template: '<%= speak.name %> has been registered',
		fn: function(bot, data) {
			var reply;
			if(data.speak.text.match(new RegExp(this.match, 'i'))) {
				bot.users[data.speak.userid] = data.speak.name;	
				reply = getResponse(data, this.template);
				if(reply.isError) {
					bot.logger('Register Upvote Template Error', reply.details);	
				} else {
					bot.logger('Scheduling Register Upvote response', data);
					scheduleResponse(this.minResponse, this.maxResponse, function() {
						if(reply.text !== '') {
							bot.say(reply.text);
						}
					});	
				}
			}
		}
	},
	{
	
		name: 'Generic Handler',
		description: 'If pattern is matched it will randomly respond.',
		randomness: 3,
		minResponse: 1,
		match: '^friday$',
		maxResponse: 5,
		template: '<%= name %> I love that song!',
		fn: function(bot, data) {
			var reply;
			if(this.randomness > 2 && !shouldReply(this.randomness)){
				return;	
			}
			if(data.speak.text.match(new RegExp(this.match, 'i'))) {
				reply = getResponse(data, this.template);
				if(reply.isError) {
					bot.logger('Generic Speech Handler Template Error', reply.details);	
				} else {
					bot.logger('Generic Speech Handler Scheduled', data);
					scheduleResponse(this.minResponse, this.maxResponse, function() {
						if(reply.text !== '') {
							bot.say(reply.text);
						}
					});	
				}
			}
		}
	}


];
