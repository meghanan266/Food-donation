CREATE DATABASE IF NOT EXISTS FoodBridgeDb;
USE FoodBridgeDb;

CREATE TABLE User (
    User_Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Phone_Number VARCHAR(15) UNIQUE NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Registration_Date DATE NOT NULL DEFAULT current_timestamp,
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
    Tier_Id INT,
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
	FOREIGN KEY (Food_Type_Id) REFERENCES Food_Type(Type_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Donor_Id) REFERENCES User(User_Id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO Food_Post (Food_Type_Id, Donor_Id, Quantity, Expiration_Date, Description)
VALUES 
(1, 1, 10, '2024-12-01', 'Fresh Apples'),
(2, 2, 20, '2024-12-05', 'Carrots'),
(3, 3, 50, '2024-11-30', 'Canned Beans');


CREATE TABLE Donation_Record (
    Donation_Id INT PRIMARY KEY AUTO_INCREMENT,
    Food_Post_Id INT NOT NULL, -- Links to the Food_Post being donated
    Recipient_Id INT NOT NULL, -- User receiving the donation
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Donation_Date DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Points_Received INT DEFAULT 0, -- Points awarded for this donation
    Campaign_Id INT, -- Optional link to campaigns
   FOREIGN KEY (Food_Item_Id) REFERENCES Food_Post(Food_Post_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Recipient_Id) REFERENCES User(User_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Campaign_Id) REFERENCES Campaign(Campaign_Id) ON DELETE SET NULL ON UPDATE CASCADE
);


CREATE TABLE Donation_Request (
    Request_Id INT PRIMARY KEY AUTO_INCREMENT,
    User_Id INT NOT NULL,
    Type_Id INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Deadline DATE NOT NULL,
    FOREIGN KEY (User_Id) REFERENCES User(User_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Type_Id) REFERENCES Food_Type(Type_Id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO Donation_Request (User_Id, Type_Id, Quantity, Deadline)
VALUES 
(2, 1, 5, '2024-12-10'),
(1, 3, 10, '2024-11-28');

CREATE TABLE Campaign (
    Campaign_Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Date DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Goal INT NOT NULL, -- Target quantity or donations
    Description TEXT NOT NULL
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
    Date_Submitted DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Donation_Id) REFERENCES Donation_Record(Donation_Id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE Pickup_Detail (
    Pickup_Id INT PRIMARY KEY AUTO_INCREMENT,
    Donation_Id INT NOT NULL, -- Links to the donation being picked up
    Pickup_Location VARCHAR(255) NOT NULL,
    Pickup_Time DATETIME NOT NULL,
    Special_Instructions TEXT,
    FOREIGN KEY (Donation_Id) REFERENCES Donation_Record(Donation_Id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE Admin (
    Admin_Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(100) NOT NULL
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

    -- Update the tier level
    UPDATE Reward_System
    SET Tier_Id = New_Tier_Id
    WHERE Reward_Id = NEW.Reward_Id;
END $$
DELIMITER ;

-- Trigger to Calculate Points and Update Donation_Record
DELIMITER $$
CREATE TRIGGER Calculate_Points
AFTER INSERT ON Donation_Record
FOR EACH ROW
BEGIN
    DECLARE Points INT;

    -- Calculate points based on the donated quantity
    SET Points = NEW.Quantity;

    -- Add bonus points for donations over 50 units
    IF NEW.Quantity > 50 THEN
        SET Points = Points + 10; -- Example bonus rule
    END IF;

    -- Update Points_Received in the Donation_Record table
    UPDATE Donation_Record
    SET Points_Received = Points
    WHERE Donation_Id = NEW.Donation_Id;

    -- Update Points_Accumulated in the Reward_System table
    UPDATE Reward_System
    SET Points_Accumulated = Points_Accumulated + Points
    WHERE User_Id = (
        SELECT Donor_Id
        FROM Food_Post
        WHERE Food_Post_Id = NEW.Food_Item_Id
    );
END $$
DELIMITER ;


