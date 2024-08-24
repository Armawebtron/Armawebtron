Armawebtron-next
================

This is a rewrite of Armawebtron since I'm not entirely happy with where the
previous Armawebtron effort is at for many reasons. Right now, this is a heavy
work-in-progress and is pre-alpha level, so don't expect much.




Building
========

We currently require OpenFL, Away3D, and FeathersUI.

The following targets are supported:

HTML5
-----
Targets browsers supporting ES5 by default, but this can be customized.

```
openfl build html5
```

Hashlink
--------
Provides near-native performance. This is where I test 99% of the time.

```
openfl build hl
```

Native
------
Creates a large binary (~30MB on Linux) with the OpenFL libraries rolled into it.

```
openfl build cpp
```
Takes longer to build dependencies the first time


Android
-------
Not tested yet, but I intend to support this.


Other?
------
Other targets may work, but are untested.

