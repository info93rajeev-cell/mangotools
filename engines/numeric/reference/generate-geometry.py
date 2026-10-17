"""Offline MPFR oracle only. Requires external gmpy2; prints static reference JSON."""
import json
import math
import operator
import struct
import gmpy2 as g

def bits(value):
    return struct.pack('>d', value).hex()

def exact(value):
    numerator, denominator = value.as_integer_ratio()
    return g.mpfr(numerator) / denominator

angles = {0.0, 0.025, 30.0, 45.0, 60.0, 120.0, 225.0, 315.0,
          math.nextafter(360.0, 0.0), 2**-1022, 2**-26, 2**-1074, 29 * 2**-1074}
for cardinal in (0.0, 90.0, 180.0, 270.0):
    angles.add(cardinal)
    for direction in (-math.inf, math.inf):
        adjacent = math.nextafter(cardinal, direction)
        if 0 <= adjacent < 360:
            angles.add(adjacent)
for boundary in (45.0, 135.0, 225.0, 315.0, 2**-26):
    angles.update((boundary, math.nextafter(boundary, 0.0), math.nextafter(boundary, math.inf)))
pairs = [(0.0, 0.0), (-0.0, 3.0), (-3.0, 0.0), (3.0, 4.0), (4.0, 3.0),
         (-3.0, -4.0), (1e8, 1e8), (1e8, 2**-1074), (1e-300, 1e-300)]
for exponent in (-1074, -1073, -1022, -1000, -500, -1, 0, 26):
    value = 2.0**exponent
    pairs.extend(((value, value), (value, value / 2)))
cases = [(name, [angle]) for angle in sorted(angles)
         for name in ('degreesToRadians', 'sinDegrees', 'cosDegrees')]
cases += [('hypot2', list(pair)) for pair in pairs]

def reference(name, args):
    if name == 'hypot2':
        return g.sqrt(exact(args[0])**2 + exact(args[1])**2)
    radians = exact(args[0]) * g.const_pi() / 180
    if name == 'degreesToRadians':
        return radians
    cardinals = {0: (0, 1), 90: (1, 0), 180: (0, -1), 270: (-1, 0)}
    if args[0] in cardinals:
        return g.mpfr(cardinals[args[0]][name == 'cosDegrees'])
    return g.sin(radians) if name == 'sinDegrees' else g.cos(radians)

def step(operation, a, b):
    # Independent MPFR exact-operation -> binary64 rounding, not native trig or candidate code.
    return float(getattr(operator, operation)(exact(a), exact(b)))

def split_product(value):
    real = exact(value) * exact(0.017453292519943295)
    head = float(real)
    return head, float(real - exact(head))

def pinned_bits(name, args):
    # Formal fixed-order model, separate from the mathematical reference above.
    g.get_context().precision = 2048
    if name == 'hypot2':
        maximum, minimum = max(map(abs, args)), min(map(abs, args))
        if minimum == 0:
            return bits(maximum)
        ratio = step('truediv', minimum, maximum)
        square = step('add', 1, step('mul', ratio, ratio))
        root = 1.5
        for _ in range(8):
            root = step('mul', 0.5, step('add', root, step('truediv', square, root)))
        return bits(step('mul', maximum, root))
    degree = args[0]
    if name == 'degreesToRadians':
        if degree < 2**-26:
            return bits(step('mul', degree, 0.017453292519943295))
        head, error = split_product(degree)
        return bits(step('add', head, step('add', error, step('mul', degree, 2.9486522708701687e-19))))
    quadrant = min(range(5), key=lambda q: abs(exact(degree) - q * 90))
    remainder = float(exact(degree) - quadrant * 90)
    sine, cosine = step('mul', remainder, 0.017453292519943295), 1.0
    if abs(remainder) >= 2**-26:
        head, error = split_product(remainder)
        tail = step('add', error, step('mul', remainder, 2.9486522708701687e-19))
        square = step('mul', head, head)
        polynomials = []
        for offset, count in ((3, 8), (2, 9)):
            coefficients = [float(g.mpfr((-1)**(i + 1)) / g.factorial(2 * i + offset)) for i in range(count)]
            value = coefficients[-1]
            for coefficient in coefficients[-2::-1]:
                value = step('add', coefficient, step('mul', square, value))
            polynomials.append(value)
        sine = step('add', head, step('mul', step('mul', head, square), polynomials[0]))
        cosine = step('add', 1, step('mul', square, polynomials[1]))
        sine, cosine = (step('add', sine, step('mul', cosine, tail)),
                        step('sub', cosine, step('mul', sine, tail)))
    sine, cosine = ((sine, cosine), (cosine, -sine), (-sine, -cosine), (-cosine, sine))[quadrant % 4]
    result = sine if name == 'sinDegrees' else cosine
    return bits(0.0 if result == 0 else result)

rows = []
for index, (name, args) in enumerate(cases):
    g.get_context().precision = 512
    value = reference(name, args)
    rounded = float(value)
    g.get_context().precision = 1024
    assert bits(float(reference(name, args))) == bits(rounded)
    rows.append({'id': str(index), 'name': name, 'args': args,
                 'inputBits': [bits(arg) for arg in args],
                 'reference': str(value), 'nearestBits': bits(rounded),
                 'algorithmBits': pinned_bits(name, args)})
print(json.dumps({'source': 'MPFR exact binary64 input; no candidate imports',
                  'oracle': g.mpfr_version(), 'gmpy2': g.version(),
                  'precision': 512, 'crossCheck': 1024, 'vectors': rows}, indent=2))
