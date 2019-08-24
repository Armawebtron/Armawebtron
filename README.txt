Definitely:
* Sound is choppy
* Balls don't bounce at the correct angles
* Minimap doesn't scale in resolution well (fix would be using SVG instead of Canvas)
* Minimap has some performance negatives, similar as below
* The more turns, the more walls that have to be calculated, meaning lower FPS.
 > This can never be "fixed" but the effect has been mitigated quite a bit in sensors.

Maybe:
* FPS drops as I play? Or maybe graphical stutters?


Todo: 
* Mindistance stabbing
* Teams
* Fortress, Sumo
* Capture the flag
* Complete support for styball
* Shooting
* Better bots
 > Camping detection
 > Ability to trace cycles, killing enemies
   - Needs Better sensors?
* Access levels, Global ID
* Proper language file.


Wishlist:
* functional support for ShapePolygons (ZonesV2 in ArmagetronAd 0.4)
* Maps should check against a DTD.
* Compatibility with ArmagetronAd servers 
 > This won't natively happen, at least not unless I can find a way to have full UDP support with Armagetron Advanced servers and am able to learn enough about the Armagetron network code to be able to work with it.
* Or perhaps allowing ArmagetronAd clients to connect to the nodejs server. See above.

