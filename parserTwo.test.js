const LyricsParser = require('./parserTwo');

function test_parser(fname, expr) {
  const p = new LyricsParser(expr)
  const res = p[fname]()
  if (p.error)
    return null
  return res
}

test('part_id', () => {
  expect(test_parser('part_id', '1.').str).toBe('1')
  expect(test_parser('part_id', 'R2:').str).toBe('R2')
  expect(test_parser('part_id', '@předehra:').str).toBe('předehra')
  expect(test_parser('part_id', '(@mezihra:)').str).toBe('mezihra')
  expect(test_parser('part_id', '45.')).toBe(null)
});

test('chord_sign', () => {
  expect(test_parser('chord_sign', '[Cmaj]').str).toBe('Cmaj')
  expect(test_parser('chord_sign', '[(C/E)]').str).toBe('C/E')
  expect(test_parser('chord_sign', '[C)')).toBe(null)
});