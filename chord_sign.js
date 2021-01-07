function parseChordSign(text) {
    const matches_brackets = text.match(/\(([^\)]+)\)/)
    if (matches_brackets) {
        text = matches_brackets[1]
    }

    const reg_basenote = /([A-H])(\#|b|is|es|s)?/
    const reg_variant = /(mi|m|dim|\+)?/
    const reg_ext = /([^\/]*)/ // everything but '/'
    const reg_bass =  /(\/([A-H47])(\#|b|is|es|s)?)?/

    const regex = new RegExp(
        reg_basenote.source +
        reg_variant.source +
        reg_ext.source +
        reg_bass.source
    );

    const matches = text.match(regex);
    if (matches === null) {
        return null // empty chord object
    }

    let chord = {
        baseNote: matches[1],
        baseNoteAcc: matches[2],
        variant: matches[3],
        extension: matches[4],
        bassNote: matches[6],
        bassNoteAcc: matches[7],
        optional: matches_brackets !== null
    }

    // /7 and /4 chords
    if (/\d$/.test(chord.bassNote)) {
        chord.extension = chord.extension + '/' + chord.bassNote
        chord.bassNote = undefined
    }

    // handle 'maj' irregular exception
    if (chord.variant === 'm' && chord.extension.indexOf('aj') === 0) {
        chord.variant = undefined
        chord.extension = 'm' + chord.extension
    }

    // handle 'sus' irregular exception 
    // - case Asus4 e.g. is not As + us4, but A + sus4
    if (chord.baseNoteAcc === 's' && chord.extension.indexOf('us') === 0) {
        chord.baseNoteAcc = undefined
        chord.extension = 's' + chord.extension
    }

    // todo: refactor to not explicitly use accidentals

    const normalizeAccidental = note => note ?
        note.replace('is', '#').replace('es', 'b').replace('s', 'b')
        : undefined


    chord.baseNoteAcc = normalizeAccidental(chord.baseNoteAcc)
    chord.bassNoteAcc = normalizeAccidental(chord.bassNoteAcc)

    return {
        base: chord.baseNote + chord.baseNoteAcc,
        variant: chord.variant,
        extension: chord.extension,
        bass: chord.bassNote + chord.bassNoteAcc,
        optional: chord.optional
    }
}

export default parseChordSign