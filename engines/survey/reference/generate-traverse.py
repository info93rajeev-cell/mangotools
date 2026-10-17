"""Offline MPFR evidence only; --check verifies frozen cases without writing files."""
import contextlib
import hashlib
import io
import json
import runpy
import struct
import sys
from pathlib import Path
import gmpy2 as g

root = Path(__file__).resolve().parents[3]
model = root / 'engines/numeric/reference/generate-geometry.py'
g.get_context().round = g.RoundToNearest
with contextlib.redirect_stdout(io.StringIO()):
    oracle = runpy.run_path(str(model))
step, bits = oracle['step'], oracle['bits']


def geometry(name, *args):
    return struct.unpack('>d', bytes.fromhex(oracle['pinned_bits'](name, args)))[0]


def compute(case):
    n, e, p = 0., 0., 0.
    coordinates = [dict(case['start'])]
    legs = []
    for leg in case['legs']:
        latitude = step('mul', leg['distanceM'], geometry('cosDegrees', leg['azimuthDeg']))
        departure = step('mul', leg['distanceM'], geometry('sinDegrees', leg['azimuthDeg']))
        legs.append(dict(leg, latitudeM=latitude, departureM=departure))
        previous = coordinates[-1]
        coordinates.append(dict(northingM=step('add', previous['northingM'], latitude),
                                eastingM=step('add', previous['eastingM'], departure)))
        n, e, p = step('add', n, latitude), step('add', e, departure), step('add', p, leg['distanceM'])
    norm = geometry('hypot2', n, e)
    closure = dict(northingMisclosureM=n, eastingMisclosureM=e, linearMisclosureM=norm,
                   perimeterM=p, relativePrecision=step('truediv', norm, p) if norm else 0,
                   closureRatioDenominator=step('truediv', p, norm) if norm else None,
                   closureStatus='finite' if norm else 'zero-misclosure')
    return dict(type='closed-loop', legs=legs, coordinates=coordinates, closure=closure)


def angle(dms):
    d, m, s = dms
    return g.mpq(d) + g.mpq(m, 60) + g.mpq(s, 3600)


def mathematical(case, precision):
    g.get_context().precision = precision
    n, e = (g.mpfr(g.mpq(v)) for v in case['start'])
    coordinates = [[str(n), str(e)]]
    components = []
    fn, fe, perimeter = g.mpfr(0), g.mpfr(0), g.mpfr(0)
    for _, _, distance, dms in case['legs']:
        length = g.mpfr(g.mpq(distance))
        radians = g.mpfr(angle(dms)) * g.const_pi() / 180
        latitude, departure = length * g.cos(radians), length * g.sin(radians)
        components.append([str(latitude), str(departure)])
        n, e = n + latitude, e + departure
        coordinates.append([str(n), str(e)])
        fn, fe, perimeter = fn + latitude, fe + departure, perimeter + length
    norm = g.sqrt(fn * fn + fe * fe)
    return dict(componentsNE=components, coordinatesNE=coordinates,
                closure=dict(northingMisclosureM=str(fn), eastingMisclosureM=str(fe),
                             linearMisclosureM=str(norm), perimeterM=str(perimeter),
                             relativePrecision=str(norm / perimeter),
                             closureRatioDenominator=str(perimeter / norm)))


def nearest(value):
    if isinstance(value, dict):
        return {key: nearest(item) for key, item in value.items()}
    if isinstance(value, list):
        return list(map(nearest, value))
    return bits(float(g.mpfr(value)))


def freeze(case):
    reference = mathematical(case, 512)
    assert nearest(reference) == nearest(mathematical(case, 1024)), case['id']
    legs = [dict(zip(('from', 'to', 'distanceM', 'azimuthDeg'),
                     (source, target, float(g.mpq(distance)), float(angle(dms)))))
            for source, target, distance, dms in case['legs']]
    input_value = dict(start=dict(zip(('northingM', 'eastingM'), map(float, case['start']))), legs=legs)
    return dict(id=case['id'], input=input_value,
                inputBits=dict(start=[bits(v) for v in input_value['start'].values()],
                               legs=[[bits(l['distanceM']), bits(l['azimuthDeg'])] for l in legs]),
                mathematicalReference=reference, binary64Reference=compute(input_value),
                provenance=dict(mpfr=g.mpfr_version(), gmpy2=g.version(),
                                mathematicalBits=[512, 1024], modelBits=2048,
                                rounding='nearest, ties to even; binary64 after each model operation',
                                modelSha256=hashlib.sha256(model.read_bytes().replace(b'\r\n', b'\n')).hexdigest()))


cases = json.loads((Path(__file__).parent / 'cases.json').read_text(encoding='utf8'))
assert [case['id'] for case in cases] == [
    'ssgec-lab-p18', 'gate-ge2025-q52', 'unsw-loop-example2-raw-bearings'
], 'Exactly the three founder-approved professional cases are required'
results = [freeze(case) for case in cases]
if '--check' in sys.argv:
    for case, result in zip(cases, results):
        assert result == case['frozen'], case['id']
    print(f'PASS: {len(results)} frozen professional cases; exact references and 512/1024-bit cross-check')
else:
    print(json.dumps(results, indent=2))
