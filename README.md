Armawebtron
===========

A rewrite of Armagetron / Retrocycles. The Armawebtron game itself can run 
entirely in a web browser. Many game modes are compatible with not too much hassle.
Also supports network play, albeit slightly buggy, currently via a real
Armawebtron Node.JS-based server.

Unfortunately, due to limitations of what browsers allow, Armawebtron within
a web browser can NOT directly connect to an Armagetron server.

However, Armawebtron currently has support for Electron, and hopefully will 
support more similar solutions in the future as well. In addition to providing 
a means to have a downloadable application, it also offers the ability to browse,
connect, chat, and play in Armagetron servers natively.

The Node.JS server also offers partial compatibility with Armagetron clients.
However, that functionality in particular is very buggy and needs a
lot of work to be playable.



## Issues

### Definitely

* Sound is choppy
* Balls jump away from the wall and glitch on rounded corners
* Minimap doesn't scale in resolution well (fix would be using SVG instead of Canvas)
* Minimap has some performance negatives, similar as below
* The more turns, the more walls that have to be calculated, meaning lower FPS.
 > This can never be "fixed" but the effect has been mitigated quite a bit in sensors.
* Network support is quite buggy


### Maybe

* FPS drops as I play? Or maybe graphical stutters?


## Todo

* Mindistance stabbing
* Fortress, Sumo
* Capture the flag
* Shooting
* Better bots
 > Camping detection
 > Ability to trace cycles, killing enemies
   - Needs Better sensors?
* Access levels, Global ID
* Proper language file.


### Wishlist

* functional support for ShapePolygons (ZonesV2 in ArmagetronAd 0.4)
* peer-to-peer servers directly within a web browser
* mobile application, with the ability to connect to Armagetron servers

