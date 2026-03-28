from flask import Flask
from flask_cors import CORS

# Import the search blueprint from your new file
from routes.search_routes import search_bp

app = Flask(__name__)

# Setup CORS. supports_credentials=True is ready for Login later!
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

# Register the blueprint
app.register_blueprint(search_bp)

if __name__ == '__main__':
    app.run(port=5001, debug=True)