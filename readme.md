#Turntable Bot Server (NOT SECURE DO NOT USE IN PRODUCTION!)

This was hacked together on a friday night for use in our office. Again this was hacked together quickly to get people in the office "gorilla status" and see who could come up with the most clever response. It seems to be pretty solid. We use it alot and there havent been any noticable bugs. 

## Installation
clone
npm install
node app.js


##It is a turntable bot server which has the following features:

* speech handlers
* song handlers
* thats what she said handlers
* autobop for registered users

### Speech Handlers

Speech handlers wait for someone to say something in a room that matches a regex. Then you can provide a underscore templated reply. The underscore template can execute any JavaScript Code. 

### Song Handlers

Reply with a templated response when a song changes. 

### TWSS handler

Replys with "thats what she said"

### Autobop (upvote songs)

Users can register for auto upvotes when song changes. A "magic" word must be spoken into the room to register. 


