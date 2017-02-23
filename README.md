# MidiFlip

Transform MIDI songs to create mathematical remixes.
Inspired by Andrew Huang's [#MidiFlip "challenge"](https://youtu.be/4IAZY7JdSHU).

MidiFlip can be used to simply flip notes around,
inverting all the pitches,
but it also gives you raw control over the notes in a simple way so you can make arbitrary remappings.

[Try MidiFlip online.](http://1j01.github.io/midiflip/)
You can batch convert files and download the results as a zip file.
(The files are not uploaded to a server.)

The web interface supports everything the CLI does (and more at the moment).


## Limitations

* You can only look at and change a single note at a time with the current API.
It would be good to be able to look at the original song as a whole in order to
transpose notes back to reasonable ranges like [Automatic MIDI Inverter](https://midi-inverter.herokuapp.com/) does,
or do fancier stuff like finding the scale used and mapping it to another.

* MidiFlip doesn't deal with time at all,
so it doesn't let you reverse a MIDI or change the duration of notes or the tempo.
That would be a bit more complicated than just updating pitches.
But updating pitches wasn't that hard, so...

* MidiFlip doesn't handle pitch bending and portamenti like [AutoMIDIFlip](http://automidiflip.com/) does.


## CLI Installation

Install [Node.js](https://nodejs.org/) if you haven't already.
Then open a terminal/command prompt and run `npm install midiflip -g`

You should now have access to the `midiflip` command.


## CLI Usage

Go to where you have some MIDI files stored,
such as your music folder,
i.e. on Windows
`cd %UserProfile%\Music`
and on probably most other operating systems, just
`cd ~/Music`

### Flip a single file:
`midiflip -i "midis/Danger.mid" -o "transformed/Danger.mid"`

### Flip a bunch of files:
`midiflip -i "midis/**/*.mid" -o "transformed/"`

This uses [glob](https://www.npmjs.com/package/glob).
`**` means zero or more (sub)directories,
so this will match e.g. `midis/1.mid` as well as `midis/Avgvst/FreeRide.mid`.
It will output the transformed files to the given output directory,
creating matching subdirectories,
but stripping off anything before the first `*`,
so you'll get e.g. `transformed/Avgvst/FreeRide.mid`
rather than `transformed/midis/Avgvst/FreeRide.mid`


### Purposefully mess with percussion

Add `-p` or `--percussion` to apply the same transformation to the percussion channel as to other notes,
which doesn't make the semantic sense that applying it to pitch does.


## License (MIT)

Copyright 2017 Isaiah Odhner

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

