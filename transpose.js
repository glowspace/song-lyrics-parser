// Chromatic scale starting from C using flats only.
const FLAT_SCALE = [
    'C',
    'Db',
    'D',
    'Eb',
    'E',
    'F',
    'Gb',
    'G',
    'Ab',
    'A',
    'B',
    'H'
];

// Chromatic scale starting from C using sharps only.
const SHARP_SCALE = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'H'
];

function transposedNote(note, semitones, options = {
    sharpness: 0,
    forceB: false,
    useAmericanNotation: false
}) {
    if (semitones == 0) {
        return note;
    }

    let scale = options.sharpness == -1 ? FLAT_SCALE : SHARP_SCALE;
    let note_i = FLAT_SCALE.indexOf(note);
    if (note_i === -1) {
        note_i = SHARP_SCALE.indexOf(note);
    }

    let new_i = (note_i + semitones + 12) % 12;
    let new_note = scale[new_i];

    if (options.useAmericanNotation) {
        new_note = new_note.replace('B', 'Bb').replace('H', 'B');
    } else if (options.forceB) {
        new_note = new_note.replace('A#', 'B');
    }

    return new_note;
}

// // -1: flat, 0: undefined, 1: sharp
// function getNoteSharpness(note) {
//     let score = 0;

//     if (FLAT_SCALE.indexOf(note) >= 0) {
//         score -= 1;
//     }

//     if (SHARP_SCALE.indexOf(note) >= 0) {
//         score +=1;
//     } 

//     return score;
// }

const transposedChord = (chord, semitones, options) => ({
    ...chord,
    base: chord.base ? transposedNote(chord.base, semitones, options) : undefined,
    bass: chord.bass ? transposedNote(chord.bass, semitones, options) : undefined
})

export default transposedChord