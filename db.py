import json
import os
import shutil
import sqlite3
from collections import Counter

# Define the path for the combined database
COMBINED_DATABASE = 'data/combined_data.db'


def create_combined_db():
    # Ensure the 'data' directory exists
    if not os.path.exists(os.path.dirname(COMBINED_DATABASE)):
        os.makedirs(os.path.dirname(COMBINED_DATABASE))  # Connect to the combined database

    conn_combined = sqlite3.connect(COMBINED_DATABASE)
    conn_combined.row_factory = sqlite3.Row

    # Create items table in the combined database
    conn_combined.execute('''
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                link TEXT,
                image TEXT,
                position TEXT,
                quantity INTEGER,
                ip TEXT,
                tags TEXT 
            )
        ''')

    # Create esp table in the combined database
    conn_combined.execute('''
            CREATE TABLE IF NOT EXISTS esp (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                esp_ip TEXT,
                rows INTEGER,
                cols INTEGER,
                start_top TEXT,
                start_left TEXT,
                orientation TEXT,
                serpentine TEXT
            )
        ''')

    # Create settings table in the combined database
    conn_combined.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brightness INTEGER DEFAULT 100,
                timeout INTEGER DEFAULT 5,
                lightMode TEXT DEFAULT 'light',
                colors TEXT DEFAULT '[#00ff00, #00ff00]',
                language TEXT DEFAULT 'en'
            )
        ''')

    # Commit the changes
    conn_combined.commit()

    # Check and add new columns if they don't exist
    cursor = conn_combined.cursor()

    # Check for the existence of 'colors' column
    cursor.execute("PRAGMA table_info(settings)")
    columns = [column[1] for column in cursor.fetchall()]
    if 'colors' not in columns:
        cursor.execute("ALTER TABLE settings ADD COLUMN colors TEXT DEFAULT '[#00ff00, #00ff00]'")
        conn_combined.commit()
    if 'language' not in columns:
        cursor.execute("ALTER TABLE settings ADD COLUMN language TEXT DEFAULT 'en'")
        conn_combined.commit()

    return conn_combined


# Function to read the data from the database
def read_items():
    conn = create_combined_db()
    items = conn.execute('SELECT * FROM items').fetchall()
    conn.close()
    return [dict(item) for item in items]


def write_item(item):
    conn = create_combined_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO items (name, link, image, position, quantity, ip, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
                   [item['name'], item['link'], item['image'], item['position'], item['quantity'], item['ip'],
                    item['tags']])
    lastId = cursor.lastrowid
    conn.commit()
    conn.close()
    return lastId


def update_item_image(item_id, new_image_url):
    conn = create_combined_db()
    try:
        cursor = conn.cursor()
        # Update the image of the item with the specified item_id
        cursor.execute('UPDATE items SET image = ? WHERE id = ?', [new_image_url['image'], item_id])
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        print(e)
    finally:
        conn.close()


# Function to update data in the database
def update_item(id, data):
    conn = create_combined_db()

    try:

        conn.execute(
            'UPDATE items SET name = ?, link = ?, image = ?, position = ?, quantity = ?, ip = ?, tags = ? WHERE id = ?',
            [data['name'], data['link'], data['image'], data['position'], data['quantity'], data['ip'], data['tags'],
             id])
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
    finally:
        conn.close()


def update_item_quantity(id, data):
    conn = create_combined_db()
    try:

        conn.execute(
            'UPDATE items SET  quantity = ? WHERE id = ?',
            [data['quantity'], id])
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        print(e)
    finally:
        conn.close()


def get_item(id):
    conn = create_combined_db()
    item = conn.execute('SELECT * FROM items WHERE id = ?', [id]).fetchone()
    conn.close()
    return dict(item) if item else None


def delete_item(id):
    conn = create_combined_db()
    conn.execute('DELETE FROM items WHERE id = ?', [id])
    conn.commit()
    conn.close()


# Function to write ESP settings to the database
def write_esp_settings(esp_settings):
    required_fields = ['name', 'esp_ip', 'rows', 'cols', 'startTop', 'startLeft','orientation', 'serpentine']
    if not all(field in esp_settings for field in required_fields):
        print("Missing required fields in esp_settings")
        return None

    conn = create_combined_db()
    try:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO esp (name, esp_ip, rows, cols, start_top, start_left,orientation, serpentine ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                esp_settings['name'],
                esp_settings['esp_ip'],
                esp_settings['rows'],
                esp_settings['cols'],
                esp_settings['startTop'],
                esp_settings['startLeft'],
                esp_settings['orientation'],
                esp_settings['serpentine']
            ])
        lastId = cursor.lastrowid
        conn.commit()
    except Exception as e:
        print(f"Database error: {e}")
        conn.rollback()
        lastId = None
    finally:
        conn.close()

    return lastId


# Function to update ESP settings in the database
def update_esp_settings(id, esp_settings):
    conn = create_combined_db()
    try:
        conn.execute(
            'UPDATE esp SET name = ?, esp_ip = ?, rows = ?, cols = ?, start_top = ?, start_left = ?,orientation = ?, serpentine = ? WHERE id = ?',
            [
                esp_settings['name'],
                esp_settings['esp_ip'],
                esp_settings['rows'],
                esp_settings['cols'],
                esp_settings['startTop'],
                esp_settings['startLeft'],
                esp_settings['orientation'],
                esp_settings['serpentine'],
                id
            ])
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()

    finally:
        conn.close()


# Function to get ESP settings from the database by ID
def get_esp_settings(id):
    conn = create_combined_db()
    esp_settings = conn.execute('SELECT * FROM esp WHERE id = ?', [id]).fetchone()
    conn.close()
    if esp_settings:
        return dict(esp_settings)
    else:
        return None  # Return None if no matching settings are found


def read_esp():
    conn = create_combined_db()
    esps = conn.execute('SELECT * FROM esp').fetchall()
    conn.close()
    return [dict(esp) for esp in esps]


# Function to delete ESP settings from the database by ID
def delete_esp_settings(id):
    conn = create_combined_db()
    try:
        conn.execute('DELETE FROM esp WHERE id = ?', [id])
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
    finally:
        conn.close()


def get_esp_settings_by_id(id):
    conn = create_combined_db()  # Get a database connection
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM esp WHERE id = ?', (id,))
        row = cursor.fetchone()

        if row is None:
            return None  # No record found for the given IP

        # Convert the row to a dictionary
        esp_settings = {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

        return esp_settings

    except Exception as e:
        print(f"Database error: {e}")
        return None

    finally:
        conn.close()


def get_esp_settings_by_ip(ip):
    conn = create_combined_db()  # Get a database connection
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM esp WHERE esp_ip = ?', (ip,))
        row = cursor.fetchone()

        if row is None:
            return None  # No record found for the given IP

        # Convert the row to a dictionary
        esp_settings = {col[0]: row[idx] for idx, col in enumerate(cursor.description)}
        return esp_settings

    except Exception as e:
        print(f"Database error: {e}")
        return None

    finally:
        conn.close()


def get_ip_by_name(esp_name):
    conn = create_combined_db()
    esp = conn.execute('SELECT esp_ip FROM esp WHERE name = ?', (esp_name,)).fetchone()
    conn.close()
    return esp['esp_ip'] if esp else None


# Function to read settings from the database
def read_settings():
    conn = create_combined_db()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM settings')
        settings = cursor.fetchone()
        if settings is None:
            print("No settings found in the database.")
            return {
                'brightness': 100,
                'timeout': 5,
                'lightMode': 'light',
                'colors': ['#ffff00', '#00ffff'],
                'language': 'en'
            }
        else:
            # Convert the settings row to a dictionary
            settings_dict = dict(zip([column[0] for column in cursor.description], settings))
            # Deserialize the colors field if it exists
            if 'colors' in settings_dict:
                settings_dict['colors'] = json.loads(settings_dict['colors'])

            else:
                print("No 'colors' field found in the settings.")
            return settings_dict
    except sqlite3.Error as e:
        print(f"SQLite error while reading settings: {e}")
        return {}
    finally:
        conn.close()


# Function to update settings in the database
def update_settings(settings):
    try:
        # Serialize the colors list to a JSON string
        settings['colors'] = json.dumps(settings['colors'])
        conn = create_combined_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM settings')  # Clear existing settings
        cursor.execute('''
            INSERT INTO settings (brightness, timeout, lightMode, colors, language)
            VALUES (?, ?, ?, ?, ?)
        ''', [settings['brightness'], settings['timeout'], settings['lightMode'], settings['colors'], settings['language']])
        conn.commit()
    except sqlite3.Error as e:
        print(f"SQLite error while updating settings: {e}")
    finally:
        conn.close()


def get_all_tags():
    conn = create_combined_db()
    cursor = conn.cursor()

    try:
        # Fetch all distinct tags from the items table
        cursor.execute('SELECT tags FROM items')
        raw_tags = [tag['tags'] for tag in cursor.fetchall() if tag['tags']]

        # Parse the JSON strings representing lists
        tags = [tag for raw_tag in raw_tags for tag in json.loads(raw_tag)]
        # Count the occurrences of each tag
        tag_counts = Counter(tags)
        unique_tags_with_count = [{'tag': tag, 'count': count} for tag, count in tag_counts.items()]
        unique_tags_with_count.sort(key=lambda x: x['count'], reverse=True)
        return unique_tags_with_count
    finally:
        conn.close()


# Migration only needed if you are coming from an older version.

DATABASE = 'data.db'
DATABASE_ESP = 'esp.db'
DATABASE_SETTING = 'settings.db'


def get_db_connection(database_name):
    """Function to get a database connection."""
    conn = sqlite3.connect(database_name)
    conn.row_factory = sqlite3.Row
    return conn


def migrate_items():
    """Migrate items from data.db to combined_data.db."""
    conn_data = get_db_connection(DATABASE)
    conn_combined = sqlite3.connect(COMBINED_DATABASE)

    # Fetch all items from the source database
    items = conn_data.execute('SELECT * FROM items').fetchall()

    # Check if 'tags' column exists in the source database
    column_names = [description[0] for description in conn_data.execute('PRAGMA table_info(items)').fetchall()]
    has_tags_column = 'tags' in column_names

    for item in items:
        # Extract the first 6 columns
        columns_to_insert = [
            item['name'], item['link'], item['image'],
            item['position'], item['quantity'], item['ip']
        ]

        # Add 'tags' column if it exists, otherwise, add an empty string
        if has_tags_column:
            columns_to_insert.append(item['tags'])
        else:
            columns_to_insert.append("")

        # Insert data into the destination database
        conn_combined.execute(
            'INSERT INTO items (name, link, image, position, quantity, ip, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
            columns_to_insert
        )

    # Commit changes and close connections
    conn_combined.commit()
    conn_data.close()
    conn_combined.close()


def migrate_esp_settings():
    """Migrate ESP settings from esp.db to combined_data.db."""
    conn_esp = get_db_connection(DATABASE_ESP)
    esp_settings_list = conn_esp.execute('SELECT * FROM esp').fetchall()
    conn_combined = sqlite3.connect(COMBINED_DATABASE)
    for esp_settings in esp_settings_list:
        conn_combined.execute(
            'INSERT INTO esp (name, esp_ip, rows, cols, start_top, start_left, serpentine_direction) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [esp_settings['name'], esp_settings['esp_ip'], esp_settings['rows'], esp_settings['cols'],
             esp_settings['start_top'], esp_settings['start_left'], esp_settings['serpentine']]
        )

    conn_combined.commit()
    conn_esp.close()
    conn_combined.close()


def migrate_settings():
    """Migrate general settings from settings.db to combined_data.db."""
    conn_settings = get_db_connection(DATABASE_SETTING)
    settings = conn_settings.execute('SELECT * FROM settings').fetchone()

    conn_combined = sqlite3.connect(COMBINED_DATABASE)
    conn_combined.execute(
        'INSERT INTO settings (brightness, timeout, lightMode) VALUES (?, ?, ?)',
        [settings['brightness'], settings['timeout'], settings['lightMode']]
    )

    conn_combined.commit()
    conn_settings.close()
    conn_combined.close()


def is_database_empty(database_name, table_name):
    """Check if a table in a database is empty."""
    conn = get_db_connection(database_name)
    cursor = conn.cursor()
    cursor.execute(f'SELECT COUNT(*) FROM {table_name}')
    count = cursor.fetchone()[0]
    conn.close()
    return count


def should_perform_migration(database_path, table_name):
    """Check if migration should be performed for a specific database and table."""

    # Check if the individual database exists
    if os.path.exists(database_path):
        # Check if the combined database is not empty for the specified table
        return not is_database_empty(COMBINED_DATABASE, table_name)
    return False


def perform_migration():
    """Perform migration."""
    create_combined_db()
    # Check and migrate items
    if should_perform_migration(DATABASE, 'items'):
        migrate_items()
        print("Items migration successful.")
    # Check and migrate ESP settings
    if should_perform_migration(DATABASE_ESP, 'esp'):
        migrate_esp_settings()
        print("ESP settings migration successful.")
    # Check and migrate general settings
    if should_perform_migration(DATABASE_SETTING, 'settings'):
        migrate_settings()
        print("General settings migration successful.")

    # Call the function to perform the check and move
    move_db_to_data_dir()


def move_db_to_data_dir():
    main_dir_db = 'combined_data.db'  # The original path in the main directory
    data_dir_db = 'data/combined_data.db'  # The new path inside the data directory

    # Check if the database exists in the main directory
    if os.path.exists(main_dir_db):
        # Ensure the data directory exists, create if it doesn't
        if not os.path.exists('data'):
            os.makedirs('data')

        # Move the database to the data directory
        shutil.move(main_dir_db, data_dir_db)
        print(f"Database moved to {data_dir_db}")


# Perform migration
perform_migration()
