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
            return jsonify({"message": "Login successful", "id": user['User_Id']}), 200
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
        pickup_time = data.get('Pickup_Time')
        special_instructions = data.get('Special_Instructions')

        if not all([food_post_id, recipient_id, pickup_time]):
            return jsonify({"error": "Missing required fields"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Call the PlaceOrder procedure
        cursor.callproc('PlaceOrder', [food_post_id, recipient_id, pickup_time, special_instructions])

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

@app.route('/api/admin/signup', methods=['POST'])
def admin_signup():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not all([name, email, password]):
            return jsonify({"error": "Missing required fields"}), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO Admin (Name, Email, Password) VALUES (%s, %s, %s)
        """, (name, email, password))
        connection.commit()

        return jsonify({"message": "Admin signup successful", "Admin_Id": cursor.lastrowid}), 201

    except mysql.connector.IntegrityError:
        return jsonify({"error": "Admin with this email already exists"}), 409
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not all([email, password]):
            return jsonify({"error": "Missing required fields"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT * FROM Admin WHERE Email = %s AND Password = %s
        """, (email, password))
        admin = cursor.fetchone()

        if admin:
            return jsonify({"message": "Admin login successful", "id": admin['Admin_Id'], "isAdmin": "true"}), 200
        else:
            return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/volunteers', methods=['GET'])
def get_volunteers():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Volunteer")
        volunteers = cursor.fetchall()
        return jsonify(volunteers), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()


@app.route('/api/volunteers', methods=['POST'])
def add_volunteer():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        phone_number = data.get('phone_number')
        availability = data.get('availability')

        if not all([name, email, phone_number, availability]):
            return jsonify({"error": "Missing required fields"}), 400

        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("""
            INSERT INTO Volunteer (Name, Email, Phone_Number, Availability)
            VALUES (%s, %s, %s, %s)
        """, (name, email, phone_number, availability))
        connection.commit()

        return jsonify({"message": "Volunteer added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()


@app.route('/api/volunteers/<int:volunteer_id>', methods=['PUT'])
def update_volunteer(volunteer_id):
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        phone_number = data.get('phone_number')
        availability = data.get('availability')

        if not all([name, email, phone_number, availability]):
            return jsonify({"error": "Missing required fields"}), 400

        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("""
            UPDATE Volunteer
            SET Name = %s, Email = %s, Phone_Number = %s, Availability = %s
            WHERE Volunteer_Id = %s
        """, (name, email, phone_number, availability, volunteer_id))
        connection.commit()

        return jsonify({"message": "Volunteer updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()


@app.route('/api/volunteers/<int:volunteer_id>', methods=['DELETE'])
def delete_volunteer(volunteer_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("DELETE FROM Volunteer WHERE Volunteer_Id = %s", (volunteer_id,))
        connection.commit()
        return jsonify({"message": "Volunteer deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()


# Add a new campaign
@app.route('/api/campaigns', methods=['POST'])
def add_campaign():
    connection = None
    cursor = None
    try:
        data = request.json
        name = data.get('name')
        goal = data.get('goal')
        description = data.get('description')
        admin_id = data.get('admin_id')  # Admin adding the campaign
        volunteer_ids = data.get('volunteers', [])  # List of volunteer IDs

        if not all([name, goal, description, admin_id]):
            return jsonify({"error": "Missing required fields"}), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        # Insert campaign details with Admin_Id
        cursor.execute(
            "INSERT INTO Campaign (Name, Goal, Description, Admin_Id) VALUES (%s, %s, %s, %s)",
            (name, goal, description, admin_id)
        )
        campaign_id = cursor.lastrowid
        print("done")
        # Link volunteers to the campaign
        for volunteer_id in volunteer_ids:
            cursor.execute(
                "INSERT INTO Campaign_Volunteer (Campaign_Id, Volunteer_Id) VALUES (%s, %s)",
                (campaign_id, volunteer_id)
            )

        connection.commit()
        return jsonify({"message": "Campaign added successfully", "Campaign_Id": campaign_id}), 201

    except Exception as e:
        import traceback
        print("Error adding campaign:", traceback.format_exc())
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

# Fetch all campaigns (for non-admin users)
@app.route('/api/campaigns', methods=['GET'])
def get_all_campaigns():
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        query = """
        SELECT c.Campaign_Id, c.Name, c.Goal, c.Description, c.Date,
               GROUP_CONCAT(v.Name) AS Volunteer_Names
        FROM Campaign c
        LEFT JOIN Campaign_Volunteer cv ON c.Campaign_Id = cv.Campaign_Id
        LEFT JOIN Volunteer v ON cv.Volunteer_Id = v.Volunteer_Id
        GROUP BY c.Campaign_Id
        """
        cursor.execute(query)
        campaigns = cursor.fetchall()

        for campaign in campaigns:
            if campaign['Volunteer_Names']:
                campaign['Volunteer_Names'] = campaign['Volunteer_Names'].split(',')

        return jsonify(campaigns), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

@app.route('/api/admin/campaigns/<int:admin_id>', methods=['GET'])
def get_campaigns_by_admin(admin_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
        SELECT c.Campaign_Id, c.Name, c.Goal, c.Description,
               GROUP_CONCAT(v.Name) AS Volunteer_Names,
               GROUP_CONCAT(v.Volunteer_Id) AS Volunteer_Ids
        FROM Campaign c
        LEFT JOIN Campaign_Volunteer cv ON c.Campaign_Id = cv.Campaign_Id
        LEFT JOIN Volunteer v ON cv.Volunteer_Id = v.Volunteer_Id
        WHERE c.Admin_Id = %s
        GROUP BY c.Campaign_Id
        """
        cursor.execute(query, (admin_id,))
        campaigns = cursor.fetchall()

        # Process volunteers into lists
        for campaign in campaigns:
            if campaign['Volunteer_Ids']:
                campaign['Volunteer_Ids'] = [
                    int(vid) for vid in campaign['Volunteer_Ids'].split(',')
                ]
            else:
                campaign['Volunteer_Ids'] = []
            campaign['Volunteer_Names'] = (
                campaign['Volunteer_Names'].split(',') if campaign['Volunteer_Names'] else []
            )

        return jsonify(campaigns), 200

    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


# Update a campaign
@app.route('/api/campaigns/<int:campaign_id>', methods=['PUT'])
def update_campaign(campaign_id):
    connection = None
    cursor = None
    try:
        data = request.json
        name = data.get('name')
        goal = data.get('goal')
        description = data.get('description')
        date = data.get('date')  # New date field
        volunteer_ids = data.get('volunteers', [])  # List of volunteer IDs

        # Validate required fields
        if not all([name, goal, description, date]):
            return jsonify({"error": "Missing required fields"}), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        # Update campaign details
        cursor.execute(
            """
            UPDATE Campaign 
            SET Name = %s, Goal = %s, Description = %s, Date = %s 
            WHERE Campaign_Id = %s
            """,
            (name, goal, description, date, campaign_id)
        )

        # Update campaign volunteers
        cursor.execute("DELETE FROM Campaign_Volunteer WHERE Campaign_Id = %s", (campaign_id,))
        for volunteer_id in volunteer_ids:
            cursor.execute(
                "INSERT INTO Campaign_Volunteer (Campaign_Id, Volunteer_Id) VALUES (%s, %s)",
                (campaign_id, volunteer_id)
            )

        connection.commit()
        return jsonify({"message": "Campaign updated successfully"}), 200

    except Exception as e:
        import traceback
        print("Error updating campaign:", traceback.format_exc())
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


# Delete a campaign
@app.route('/api/campaigns/<int:campaign_id>', methods=['DELETE'])
def delete_campaign(campaign_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Delete the campaign and associated volunteers
        cursor.execute("DELETE FROM Campaign_Volunteer WHERE Campaign_Id = %s", (campaign_id,))
        cursor.execute("DELETE FROM Campaign WHERE Campaign_Id = %s", (campaign_id,))

        connection.commit()
        return jsonify({"message": "Campaign deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/users', methods=['GET'])
def get_all_users():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT User_Id, Name, Email, Phone_Number FROM User")
        users = cursor.fetchall()

        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("DELETE FROM User WHERE User_Id = %s", (user_id,))
        connection.commit()

        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()

@app.route('/api/food-types', methods=['GET'])
def get_food_types():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM Food_Type")
        food_types = cursor.fetchall()

        return jsonify(food_types), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()


@app.route('/api/food-types', methods=['POST'])
def add_food_type():
    try:
        data = request.json
        type_name = data.get('Type_Name')

        if not type_name:
            return jsonify({"error": "Food type name is required"}), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("INSERT INTO Food_Type (Type_Name) VALUES (%s)", (type_name,))
        connection.commit()

        return jsonify({"message": "Food type added successfully"}), 201
    except mysql.connector.IntegrityError:
        return jsonify({"error": "Food type already exists"}), 409
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()


@app.route('/api/food-types/<int:type_id>', methods=['PUT'])
def update_food_type(type_id):
    try:
        data = request.json
        type_name = data.get('Type_Name')

        if not type_name:
            return jsonify({"error": "Food type name is required"}), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("UPDATE Food_Type SET Type_Name = %s WHERE Type_Id = %s", (type_name, type_id))
        connection.commit()

        return jsonify({"message": "Food type updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()


@app.route('/api/food-types/<int:type_id>', methods=['DELETE'])
def delete_food_type(type_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("DELETE FROM Food_Type WHERE Type_Id = %s", (type_id,))
        connection.commit()

        return jsonify({"message": "Food type deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()


@app.route('/api/rewards/<int:user_id>', methods=['GET'])
def get_user_rewards(user_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Fetch the user's rewards
        cursor.execute("""
            SELECT rs.Points_Accumulated, rt.Tier_Name, rt.Min_Points, rt.Max_Points
            FROM Reward_System rs
            JOIN Reward_Tiers rt ON rs.Tier_Id = rt.Tier_Id
            WHERE rs.User_Id = %s
        """, (user_id,))
        reward = cursor.fetchone()

        if not reward:
            return jsonify({"error": "Reward data not found"}), 404

        # Fetch next tier (if any)
        cursor.execute("""
            SELECT Tier_Name, Min_Points
            FROM Reward_Tiers
            WHERE Min_Points > %s
            ORDER BY Min_Points ASC
            LIMIT 1
        """, (reward['Points_Accumulated'],))
        next_tier = cursor.fetchone()

        reward['Next_Tier'] = next_tier  # Add next tier information
        return jsonify(reward), 200

    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()

@app.route('/api/feedback', methods=['POST'])
def add_feedback():
    try:
        data = request.json
        donation_id = data.get('donationId')
        rating = data.get('rating')
        comments = data.get('comments')

        if not all([donation_id, rating]):
            return jsonify({"error": "Donation ID and Rating are required"}), 400

        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO Feedback (Donation_Id, Rating, Comments)
            VALUES (%s, %s, %s)
            """,
            (donation_id, rating, comments)
        )
        connection.commit()
        return jsonify({"message": "Feedback added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection.is_connected():
            connection.close()


if __name__ == '__main__':
    app.run(debug=True)