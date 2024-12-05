CREATE DATABASE IF NOT EXISTS FoodBridgeDb;
USE FoodBridgeDb;

CREATE TABLE User (
    User_Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Phone_Number VARCHAR(15) UNIQUE NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Registration_Date DATETIME NOT NULL DEFAULT current_timestamp,
    Password VARCHAR(100) NOT NULL
);

CREATE TABLE Admin (
    Admin_Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(100) NOT NULL
);

CREATE TABLE Reward_Tiers (
    Tier_Id INT PRIMARY KEY,           
    Tier_Name VARCHAR(50) UNIQUE NOT NULL,      
    Min_Points INT NOT NULL,           
    Max_Points INT NOT NULL         
);

INSERT INTO Reward_Tiers (Tier_Id, Tier_Name, Min_Points, Max_Points)
VALUES
(1, 'Bronze', 0, 99),
(2, 'Silver', 100, 499),
(3, 'Gold', 500, 999),
(4, 'Platinum', 1000, 99999);

CREATE TABLE Reward_System (
    Reward_Id INT PRIMARY KEY AUTO_INCREMENT,
    User_Id INT NOT NULL,
    Points_Accumulated INT DEFAULT 0,
    Tier_Id INT NOT NULL,
    FOREIGN KEY (User_Id) REFERENCES User(User_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Tier_Id) REFERENCES Reward_Tiers(Tier_Id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE Food_Type (
    Type_Id INT PRIMARY KEY AUTO_INCREMENT,
    Type_Name VARCHAR(50) UNIQUE NOT NULL 
);

INSERT INTO Food_Type (Type_Name) VALUES ('Fruits'), ('Vegetables'), ('Canned Goods'), ('Grains');


CREATE TABLE Food_Post (
    Food_Post_Id INT PRIMARY KEY AUTO_INCREMENT,
    Food_Type_Id INT NOT NULL,
    Donor_Id INT NOT NULL,
    Quantity INT NOT NULL,
    Expiration_Date DATE NOT NULL,
    Description TEXT NOT NULL,
    Status ENUM('Available', 'Ordered', 'Expired') DEFAULT 'Available',
    Donation_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Food_Type_Id) REFERENCES Food_Type(Type_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Donor_Id) REFERENCES User(User_Id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Campaign (
    Campaign_Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Goal INT NOT NULL, -- Target quantity or donations
    Description TEXT NOT NULL,
    Admin_Id INT NOT NULL,
    FOREIGN KEY (Admin_Id) REFERENCES Admin(Admin_Id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE Donation_Record (
    Donation_Id INT PRIMARY KEY AUTO_INCREMENT,
    Food_Post_Id INT NOT NULL, -- Links to the Food_Post being donated
    Recipient_Id INT NOT NULL, -- User receiving the donation
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Campaign_Id INT, -- Optional link to campaigns
    Donation_Accepted_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Food_Post_Id) REFERENCES Food_Post(Food_Post_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Recipient_Id) REFERENCES User(User_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Campaign_Id) REFERENCES Campaign(Campaign_Id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE Volunteer (
    Volunteer_Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Availability DATE NOT NULL,
    Phone_Number VARCHAR(15) UNIQUE NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL
);


CREATE TABLE Feedback (
    Feedback_Id INT PRIMARY KEY AUTO_INCREMENT,
    Donation_Id INT NOT NULL, -- Links feedback to a specific donation
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5), -- Rating from 1 to 5
    Comments TEXT,
    Date_Submitted DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Donation_Id) REFERENCES Donation_Record(Donation_Id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE Pickup_Detail (
    Pickup_Id INT PRIMARY KEY AUTO_INCREMENT,
    Donation_Id INT NOT NULL, -- Links to the donation being picked up
    Pickup_Time DATETIME NOT NULL,
    Special_Instructions TEXT,
    FOREIGN KEY (Donation_Id) REFERENCES Donation_Record(Donation_Id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Campaign_Volunteer (
    Campaign_Id INT NOT NULL,
    Volunteer_Id INT NOT NULL,
    PRIMARY KEY (Campaign_Id, Volunteer_Id),
    FOREIGN KEY (Campaign_Id) REFERENCES Campaign(Campaign_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Volunteer_Id) REFERENCES Volunteer(Volunteer_Id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Trigger for Updating Tier Levels
DELIMITER $$
CREATE TRIGGER Update_Tier_Level
AFTER UPDATE ON Reward_System
FOR EACH ROW
BEGIN
    DECLARE New_Tier_Id INT;

    -- Determine the new tier based on points
    SELECT Tier_Id
    INTO New_Tier_Id
    FROM Reward_Tiers
    WHERE NEW.Points_Accumulated BETWEEN Min_Points AND Max_Points;

    -- Update the tier level only if it has changed
    IF New_Tier_Id != NEW.Tier_Id THEN
        -- Use a separate UPDATE statement outside the trigger logic
        SET @skip_trigger := TRUE; -- Prevent recursive updates
        UPDATE Reward_System
        SET Tier_Id = New_Tier_Id
        WHERE Reward_Id = NEW.Reward_Id;
        SET @skip_trigger := FALSE;
    END IF;
END $$
DELIMITER ;




DELIMITER $$
CREATE FUNCTION CalculatePoints(quantity INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE points INT;
    SET points = quantity;
    IF quantity > 50 THEN
        SET points = points + 10;
    END IF;
    RETURN points;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE PlaceOrder(
    IN p_food_post_id INT,
    IN p_recipient_id INT,
    IN p_pickup_time DATETIME,
    IN p_special_instructions TEXT
)
BEGIN
    DECLARE v_quantity INT;
    DECLARE v_donor_id INT;
    DECLARE v_points INT;

    -- Validate Food_Post_Id and fetch details
    SELECT Donor_Id, Quantity INTO v_donor_id, v_quantity
    FROM Food_Post
    WHERE Food_Post_Id = p_food_post_id;

    -- Calculate points using the function
    SET v_points = CalculatePoints(v_quantity);

    -- Insert into Donation_Record
    INSERT INTO Donation_Record (Food_Post_Id, Recipient_Id, Quantity, Donation_Accepted_Date)
    VALUES (p_food_post_id, p_recipient_id, v_quantity, NOW());

    -- Update Food_Post status
    UPDATE Food_Post
    SET Status = 'Ordered', Donation_Date = NOW()
    WHERE Food_Post_Id = p_food_post_id;

    -- Update Reward_System for the donor
    UPDATE Reward_System
    SET Points_Accumulated = Points_Accumulated + v_points
    WHERE User_Id = v_donor_id;

    -- Insert into Pickup_Detail
    INSERT INTO Pickup_Detail (Donation_Id, Pickup_Time, Special_Instructions)
    SELECT LAST_INSERT_ID(), p_pickup_time, p_special_instructions;
END $$
DELIMITER ;

CREATE EVENT Expire_Food_Posts
ON SCHEDULE EVERY 1 DAY
DO
    UPDATE Food_Post
    SET Status = 'Expired'
    WHERE Expiration_Date < CURRENT_DATE() AND Status = 'Available';


