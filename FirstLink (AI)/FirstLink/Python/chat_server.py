"""
chat_server.py
----------------------------------------------------------------------
Backend for the Mentor <-> Mentee chat feature.

EXPECTED FOLDER LAYOUT (matches your project root):

    root/
        Index/
        Pages/
        CSS/
        Assets/
        Javascript/
        python/
            chat_server.py   <-- this file lives here

SETUP
    pip install flask

RUN
    python chat_server.py

Then open http://127.0.0.1:5000/ in your browser. The server both
serves your existing site (Index, Pages, CSS, Assets, Javascript) AND
exposes the chat API the frontend talks to (Javascript/chat.js).

STORAGE
    A SQLite file called chat.db is created automatically next to this
    script the first time you run it. Nothing else to configure.

NOTE ON LOGIN / IDENTITY
    This server doesn't know or care how Authetication.js logs someone
    in. It only expects every chat API call to include a plain
    username string (and, for mentors/mentees, a role). The frontend
    (Javascript/chat.js) is the piece responsible for figuring out
    "who is currently logged in" -- see the getCurrentUser() function
    there and adjust it to match how Authetication.js actually stores
    the logged-in user (localStorage key, cookie, session, etc.).
----------------------------------------------------------------------
"""

import os
import sqlite3
from datetime import datetime

from flask import Flask, abort, g, jsonify, request, send_from_directory

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PYTHON_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(PYTHON_DIR)  # project root, one level above /python
DB_PATH = os.path.join(PYTHON_DIR, "chat.db")

# Folders in the project root that are safe to serve as static files.
STATIC_FOLDERS = {"Index", "Pages", "CSS", "Assets", "Javascript"}

app = Flask(__name__)


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create tables (and a small demo mentor/mentee pairing) if needed."""
    db = sqlite3.connect(DB_PATH)
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS mentor_mentees (
            mentor_username TEXT NOT NULL,
            mentee_username TEXT NOT NULL,
            PRIMARY KEY (mentor_username, mentee_username)
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT NOT NULL,
            receiver TEXT NOT NULL,
            sender_role TEXT NOT NULL CHECK (sender_role IN ('mentor', 'mentee')),
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL
        );
        """
    )

    # Seed a demo pairing matching the placeholder names already in
    # MentorsPage.html (John Doe, Sarah, Mike) so the chat works the
    # moment you run this. Edit/replace freely once you wire this up
    # to your real user accounts.
    existing = db.execute("SELECT COUNT(*) FROM mentor_mentees").fetchone()[0]
    if existing == 0:
        db.executemany(
            "INSERT INTO mentor_mentees (mentor_username, mentee_username) VALUES (?, ?)",
            [
                ("mentor1", "John Doe"),
                ("mentor1", "Sarah"),
                ("mentor1", "Mike"),
            ],
        )
    db.commit()
    db.close()


# ---------------------------------------------------------------------------
# Chat API
# ---------------------------------------------------------------------------
@app.route("/api/mentees/<mentor_username>")
def get_mentees(mentor_username):
    """Student list for a mentor's sidebar."""
    db = get_db()
    rows = db.execute(
        "SELECT mentee_username FROM mentor_mentees WHERE mentor_username = ?",
        (mentor_username,),
    ).fetchall()
    return jsonify([row["mentee_username"] for row in rows])


@app.route("/api/mentors/<mentee_username>")
def get_mentors(mentee_username):
    """Which mentor(s) a mentee should be able to chat with."""
    db = get_db()
    rows = db.execute(
        "SELECT mentor_username FROM mentor_mentees WHERE mentee_username = ?",
        (mentee_username,),
    ).fetchall()
    return jsonify([row["mentor_username"] for row in rows])


@app.route("/api/messages")
def get_messages():
    """Full conversation between two users, oldest first."""
    user_a = request.args.get("user_a")
    user_b = request.args.get("user_b")
    if not user_a or not user_b:
        return jsonify({"error": "user_a and user_b query params are required"}), 400

    db = get_db()
    rows = db.execute(
        """
        SELECT sender, receiver, sender_role, content, timestamp
        FROM messages
        WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
        ORDER BY id ASC
        """,
        (user_a, user_b, user_b, user_a),
    ).fetchall()
    return jsonify([dict(row) for row in rows])


@app.route("/api/messages", methods=["POST"])
def post_message():
    data = request.get_json(silent=True) or {}
    sender = data.get("sender")
    receiver = data.get("receiver")
    sender_role = data.get("sender_role")
    content = (data.get("content") or "").strip()

    if not all([sender, receiver, sender_role, content]):
        return jsonify(
            {"error": "sender, receiver, sender_role and content are all required"}
        ), 400
    if sender_role not in ("mentor", "mentee"):
        return jsonify({"error": "sender_role must be 'mentor' or 'mentee'"}), 400

    db = get_db()
    timestamp = datetime.utcnow().isoformat()
    db.execute(
        "INSERT INTO messages (sender, receiver, sender_role, content, timestamp) "
        "VALUES (?, ?, ?, ?, ?)",
        (sender, receiver, sender_role, content, timestamp),
    )
    db.commit()
    return jsonify({"status": "sent", "timestamp": timestamp}), 201


# ---------------------------------------------------------------------------
# Static file serving, so the whole site can run from this one server
# ---------------------------------------------------------------------------
@app.route("/<folder>/<path:filepath>")
def serve_project_file(folder, filepath):
    if folder not in STATIC_FOLDERS:
        abort(404)
    return send_from_directory(os.path.join(ROOT_DIR, folder), filepath)


@app.route("/")
def serve_home():
    # Adjust "index.html" if your entry file inside Index/ is named
    # something else.
    return send_from_directory(os.path.join(ROOT_DIR, "Index"), "index.html")


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
