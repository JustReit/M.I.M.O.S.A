import json
import os
import shutil
import sqlite3
from collections import Counter

# Define the path for the combined database
COMBINED_DATABASE = 'data/combined_data.db'


def create_combined_db():
    # Connect to the combined database
    conn_combined = sqlite3.connect(COMBINED_DATABASE)
    conn_combined.row_factory = sqlite3.Row

    # Create items table in the combined database
    conn_combined.execute('''
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                link TEXT,
                image TEXT,
                quantity INTEGER,
                tags TEXT 
            )
        ''')


    # Create settings table in the combined database
    conn_combined.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lightMode TEXT DEFAULT 'light'
            )
        ''')

    # Commit the changes
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
    cursor.execute('INSERT INTO items (name, link, image, quantity, tags) VALUES (?, ?, ?, ?, ?)',
                   [item['name'], item['link'], item['image'], item['quantity'], item['tags']])
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
            'UPDATE items SET name = ?, link = ?, image = ?, quantity = ?, tags = ? WHERE id = ?',
            [data['name'], data['link'], data['image'], data['quantity'], data['tags'],
             id])
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        print(e)
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



def read_settings():
    conn = create_combined_db()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM settings')
        settings = cursor.fetchone()
        if settings is None:
            print("No settings found in the database.")
            return {}
        else:
            # Convert the settings row to a dictionary
            settings_dict = dict(zip([column[0] for column in cursor.description], settings))
            # Deserialize the colors field if it exists
            return settings_dict
    except sqlite3.Error as e:
        print(f"SQLite error while reading settings: {e}")
        return {}
    finally:
        conn.close()


# Function to update settings in the database
def update_settings(settings):
    try:

        conn = create_combined_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM settings')  # Clear existing settings
        cursor.execute('''
            INSERT INTO settings (lightMode)
            VALUES (?)
        ''', [settings['lightMode']])
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


create_combined_db()