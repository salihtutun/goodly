import struct, zlib

def create_png(width, height, color_rgb, filename):
    raw = b''
    for y in range(height):
        raw += b'\x00'
        for x in range(width):
            raw += bytes(color_rgb) + b'\xff'
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', zlib.compress(raw))
    png += chunk(b'IEND', b'')
    with open(filename, 'wb') as f:
        f.write(png)

create_png(192, 192, (45, 62, 50), 'frontend/public/logo192.png')
create_png(1200, 630, (45, 62, 50), 'frontend/public/og-image.png')
print('Done')
