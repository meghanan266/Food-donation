import hashlib
from datetime import date

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# Database connection
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",  # Replace with your MySQL username
        password="Ginger@007",  # Replace with your MySQL password
        database="FoodBridgeDb"
    )


# Login endpoint
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json  # Get data from the request body
        email = data.get('email')
        password = data.get('password')

        # Validate input
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        # Query the database
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM User WHERE Email = %s AND Password = %s", (email,password))
        user = cursor.fetchone()

        if user:
            return jsonify({"message": "Login successful", "user": user}), 200
        else:
            return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

# Signup endpoint
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()  # Get data from the request body
        print("Received Data:", data)
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone_number = data.get('phone_number')
        # Validate input
        if not name or not email or not password:
            return jsonify({"error": "Name, email, and password are required"}), 400

        # Insert user into the database
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO User (Name, Phone_Number, Email, Password) VALUES (%s, %s, %s, %s)",
            (name, phone_number, email, password)
        )

        user_id = cursor.lastrowid

        # Insert default reward entry for the user
        cursor.execute("""
                   INSERT INTO Reward_System (User_Id, Points_Accumulated, Tier_Id)
                   VALUES (%s, 0, 1)
               """, (user_id,))

        connection.commit()

        # Get the inserted user's ID
        user_id = cursor.lastrowid

        return jsonify({"message": "Signup successful", "User_Id": user_id}), 201

    except mysql.connector.IntegrityError as e:
        return jsonify({"error": "Email already exists"}), 409
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route('/api/food-posts', methods=['GET'])
def get_non_expired_food_posts():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Fetch all food posts where the expiration date is greater than or equal to today
        today = date.today()
        query = """
        SELECT Food_Post_Id, Type_Name, Quantity, Expiration_Date, Description, Status 
        FROM Food_Post
        JOIN Food_Type ON Food_Post.Food_Type_Id = Food_Type.Type_Id
        WHERE Expiration_Date >= %s AND Status = 'Available'
        """
        cursor.execute(query, (today,))
        food_posts = cursor.fetchall()

        # Convert Expiration_Date to ISO 8601 string
        for post in food_posts:
            post['Expiration_Date'] = post['Expiration_Date'].isoformat()

        return jsonify(food_posts), 200
    except Exception as e:
        import traceback
        print("Error:", traceback.format_exc())
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route('/api/place-order', methods=['POST'])
def place_order():
    try:
        data = request.get_json()
        food_post_id = data.get('Food_Post_Id')
        recipient_id = data.get('Recipient_Id')
        pickup_location = data.get('Pickup_Location')
        pickup_time = data.get('Pickup_Time')
        special_instructions = data.get('Special_Instructions')

        if not all([food_post_id, recipient_id, pickup_location, pickup_time]):
            return jsonify({"error": "Missing required fields"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Call the PlaceOrder procedure
        cursor.callproc('PlaceOrder', [food_post_id, recipient_id, pickup_location, pickup_time, special_instructions])

        # Fetch Donor_Id and Points_Received from Food_Post
        cursor.execute("""
            SELECT Donor_Id, Quantity,
                   CASE WHEN Quantity > 50 THEN Quantity + 10 ELSE Quantity END AS Points
            FROM Food_Post
            WHERE Food_Post_Id = %s
        """, (food_post_id,))
        result = cursor.fetchone()
        donor_id = result['Donor_Id']
        points = result['Points']

        # Update Reward_System for the donor
        cursor.execute("""
            UPDATE Reward_System
            SET Points_Accumulated = Points_Accumulated + %s
            WHERE User_Id = %s
        """, (points, donor_id))

        connection.commit()
        return jsonify({"message": "Order placed successfully"}), 201

    except mysql.connector.Error as e:
        import traceback
        print("Database Error:", traceback.format_exc())
        return jsonify({"error": "Database Error", "details": str(e)}), 500

    except Exception as e:
        import traceback
        print("Error:", traceback.format_exc())
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()


@app.route('/api/my-orders/<int:user_id>', methods=['GET'])
def get_user_orders(user_id):
    try:
        # Connect to the database
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Fetch detailed order information for the given user
        cursor.execute("""
            SELECT 
                dr.Donation_Id,
                fp.Description AS Food_Description,
                fp.Quantity AS Food_Quantity,
                fp.Expiration_Date AS Food_Expiration_Date,
                dr.Donation_Accepted_Date,
                pd.Pickup_Location,
                pd.Pickup_Time,
                pd.Special_Instructions
            FROM Donation_Record dr
            JOIN Food_Post fp ON dr.Food_Post_Id = fp.Food_Post_Id
            LEFT JOIN Pickup_Detail pd ON dr.Donation_Id = pd.Donation_Id
            WHERE dr.Recipient_Id = %s
            ORDER BY dr.Donation_Accepted_Date DESC
        """, (user_id,))

        # Fetch all results
        orders = cursor.fetchall()

        # Return the orders in JSON format
        return jsonify(orders), 200

    except Exception as e:
        import traceback
        print("Error:", traceback.format_exc())
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()



@app.route('/api/donate', methods=['POST'])
def donate():
    try:
        data = request.get_json()
        food_type_id = data.get('Food_Type_Id')
        donor_id = data.get('Donor_Id')
        quantity = data.get('Quantity')
        expiration_date = data.get('Expiration_Date')
        description = data.get('Description')
        status = data.get('Status')

        if not all([food_type_id, donor_id, quantity, expiration_date, description]):
            return jsonify({"error": "Missing required fields"}), 400

        connection = get_db_connection()
        cursor = connection.cursor()
        today = date.today()

        cursor.execute(
            """
            INSERT INTO Food_Post (Food_Type_Id, Donor_Id, Quantity, Expiration_Date, Description, Status)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (food_type_id, donor_id, quantity, expiration_date, description, status)
        )
        connection.commit()

        return jsonify({"message": "Donation successfully added"}), 201

    except Exception as e:
        import traceback
        print("Error:", traceback.format_exc())
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


if __name__ == '__main__':
    app.run(debug=True)