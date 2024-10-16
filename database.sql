-- CREATE treks table
CREATE TABLE treks(id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, duration VARCHAR(45) NOT NULL, difficulty VARCHAR(45) NOT NULL, realPrice INT NOT NULL, discountedPrice INT NOT NULL, image BYTEA);
-- create trekdetails table
CREATE TABLE trekdetails(id SERIAL PRIMARY KEY, banner BYTEA NOT NULL, name VARCHAR(255) NOT NULL, head
ing TEXT NOT NULL, details JSONB NOT NULL, overview TEXT NOT NULL, highlight TEXT NOT NULL, itinerary JSONB NOT NULL);



-- 
CREATE TABLE treks(id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, duration VARCHAR(45) NOT NULL, difficulty VARCHAR(45) NOT NULL, realPrice INT NOT NULL, discountedPrice INT NOT NULL, image BYTEA NOT NULL, banner BYTEA NOT NULL, mainImage BYTEA NOT NULL, heading TEXT NOT NULL, details JSONB NOT NULL, overview TEXT NOT NULL, highlig
ht TEXT NOT NULL, itinerary JSONB NOT NULL);