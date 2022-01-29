Armawebtron
===========

A rewrite of Armagetron / Retrocycles. The Armawebtron game itself can run 
entirely in a web browser. Also supports network play, albeit slightly buggy,
currently via a real Armawebtron Node.JS-based server.

It supports much of the same core functionality as Armagetron, such as rubber,
finite cycle trails lengths, holes, zones, and custom maps. As such, many
game modes are playable without too much hassle. Some are even included and
selectable as presets.

Oh, and since it runs in a browser and offers very basic touchscreen capability,
it will run on a mobile device, provided it has a halfway modern browser.
More work is planned to improve in this area.

Unfortunately, due to limitations of what browsers allow, Armawebtron within
a web browser can NOT directly connect to an Armagetron server.

However, Armawebtron currently has support for Electron, and hopefully will 
support more similar solutions in the future as well. In addition to providing 
a means to have a downloadable application, it also offers the ability to browse,
connect, chat, and play in Armagetron servers natively.

And back in the good ol' web browser, there is a semi-functional bridge available
which does, to some extent, allow you to indirectly connect and play in an Armagetron
server. But it is unreliable, and currently will only connect to the most
popular server at the time, or nothing at all if nothing is populated.
No guarantees it will function correctly, if at all.

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
   - This can never be "fixed" but the effect has been mitigated quite a bit in sensors.
* Network support is quite buggy


### Maybe

* FPS drops as I play? Or maybe graphical stutters?


## Todo

<!--
* Mindistance stabbing
-->
* Full support for fortress, sumo, capture the flag
* Shooting
* Better bots
   + Camping detection
   + Ability to trace cycles, killing enemies
      - Needs Better sensors?
* Access levels, Global ID
* Proper language file.


### Wishlist

* functional support for ShapePolygons (ZonesV2 in ArmagetronAd 0.4)
* peer-to-peer servers directly within a web browser
* mobile application, with the ability to connect to Armagetron servers
* ability to play back aarecs?
* proper objects and ramps

