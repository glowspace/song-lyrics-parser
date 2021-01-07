// requires Node 14 and higher
import parseChordSign from './chord_sign.js'
import transposedChord from './transpose.js'


console.log(transposedChord(parseChordSign('C#7maj'), 2))