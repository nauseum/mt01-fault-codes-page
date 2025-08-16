import http.server
import socketserver
import os

# Set the port number you want to use
PORT = 8000

# Get the directory where the script is located
# This ensures it serves files from the correct folder
web_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(web_dir)

# This is a simple handler that serves files from the current directory
Handler = http.server.SimpleHTTPRequestHandler

# Create and start the server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("\n========================================")
    print(f"  Local web server started.")
    print(f"  Serving files from: {web_dir}")
    print("----------------------------------------")
    print(f"  Open your browser and go to:")
    print(f"  => http://localhost:{PORT}")
    print("========================================")
    print("\nPress Ctrl+C to stop the server.")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer is stopping...")
        httpd.shutdown()