import mimetypes
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

mimetypes.add_type('text/javascript', '.mjs')
ThreadingHTTPServer(('localhost', 3000), partial(SimpleHTTPRequestHandler, directory='out')).serve_forever()
