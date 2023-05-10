const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
const xml2js = require('xml2js');
const { parseStringPromise } = require('xml2js');
const axios = require('axios');
const bodyParser = require('body-parser');

// Connection URL and database name
const uri = 'mongodb+srv://robert_herbert:Passw0rd123@cluster0.c9mxcr3.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri, { useNewUrlParser: true });


// Connect to MongoDB
async function connect() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error(err);
    }
}
connect();

app.listen(port);
console.log('Server started at http://localhost:' + port);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Open the Menu
//Menu shows us POST or PUT buttons that will take us to one of those two forms
app.get('/menu', function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    fs.readFile('./menu.html', 'utf8', (err, contents) => {
        if(err) {
            console.log('Form file Read Error', err);
            res.write("<p>Form file Read Error");
        } else {
            console.log('Form loaded\n');
            res.write(contents + "<br>");
        }
        res.end();
    });
});

// GET All tickets

app.get("/rest/list/", function(req, res){
    //establish the new connection with the mongodb
    const client = new MongoClient(uri);

    async function run() {
        try {
            const database = client.db("tickets");
            const ticketDb = database.collection("Ticket Collection");
        
            const query = {}; //this means that all tickets are selected
        
            //tickets is an array that holds all tickets that are of type JSON
            const tickets = await ticketDb.find(query).toArray(); 
            //if array is 0 there's no tickets
            if (tickets.length === 0) {
                res.status(404).send("Tickets do not exist!");
            } else {
                console.log(tickets);
                //return the tickets
                res.json(tickets);
            }
        } catch (err) {
            console.log(err);
            res.status(500).send("Error!");
        }finally {
            // Ensures that the client will close when you finish/error
            await client.close();
        }
    }
    run().catch(console.dir);
});

// GET ticket by id

app.get("/rest/ticket/:ticketId", function(req, res) {
    const client = new MongoClient(uri);
    //search key is what we are looking for in the database JSON
    //it needs to match the field "ticketID" and to match the value of that field
    const searchKey = "ticketID: '" + req.params.ticketId + "'";
    console.log("Looking for: " + searchKey);

    async function run() {
        try {
            const database = client.db("tickets");
            const ticketDb = database.collection("Ticket Collection");
    
            const query = { ticketID: req.params.ticketId };
    
            //find the ticket and store it in "ticket"
            const ticket = await ticketDb.findOne(query);
            //checking if ticket exists
            if (ticket === null) { //it's null when it doesn't exist
                res.status(404).send("Ticket does not exist!");
            } else {
                console.log(ticket);
                //return the ticket
                res.json(ticket);
            }
        } catch (err) {
            console.log(err);
            res.status(500).send("Error!")
        } finally {
            // Ensures that the client will close when you finish/error
            await client.close();
        }
    }
    run().catch(console.dir);
});

// A DELETE request
app.delete("/rest/ticket/:ticketId", function(req, res) {
    const client = new MongoClient(uri);
    //search key is what we are looking for in the database JSON
    //it needs to match the field "ticketID" and to match the value of that field
    const searchKey = "ticketID: '" + req.params.ticketId + "'";
    console.log("Looking for: " + searchKey);

    async function run() {
        try {
            const database = client.db("tickets");
            const ticketDb = database.collection("Ticket Collection");
    
            const query = { ticketID: req.params.ticketId };
    
            //find the ticket and delete it
            const deleteTicket = await ticketDb.deleteOne(query);
            //checking if we deleted the ticket
            if (deleteTicket.deletedCount === 0) {
                res.status(404).send("Ticket does not exist!");
            } else {
                console.log(deleteTicket);
                res.status(200).send(`Ticket with ticketID: ${req.params.ticketId} has been deleted!`);
            }
        } catch (err) {
            console.log(err);
            res.status(500).send("Error!")
        } finally {
            // Ensures that the client will close when you finish/error
            await client.close();
        }
    }
    run().catch(console.dir);
});

// A POST request
app.get('/postform', function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    fs.readFile('./post.html', 'utf8', (err, contents) => {
        if(err) {
            console.log('Form file Read Error', err);
            res.write("<p>Form file Read Error");
        } else {
            console.log('Form loaded\n');
            res.write(contents + "<br>");
        }
        res.end();
    });
});

app.post("/rest/ticket/postTicket", function(req, res) {
    const client = new MongoClient(uri);

    async function run() {
        try {
            const database = client.db("tickets");
            const ticketDb = database.collection("Ticket Collection");

            const ticketID = req.body.ticketID;
            const created_at = req.body.created_at;
            const updated_at = req.body.updated_at;
            const type = req.body.type;
            const subject = req.body.subject;
            const description = req.body.description;
            const priority = req.body.priority;
            const status = req.body.status;
            const recipient = req.body.recipient;
            const submitter = req.body.submitter;
            const assignee_id = req.body.assignee_id;
            const follower_ids = req.body.follower_ids;
            const tags = req.body.tags;

            //creating the ticket of type JSON
            const ticket = {
                ticketID: ticketID,
                created_at: created_at,
                updated_at: updated_at,
                type: type,
                subject: subject,
                description: description,
                priority: priority,
                status: status,
                recipient: recipient,
                submitter: submitter,
                assignee_id: assignee_id,
                follower_ids: follower_ids,
                tags: tags
            };

            //here we don't handle much errors because all fields are pre-filled so if a mistake has been made
            //the ticket should be deleted and then added again
            const addTicket = await ticketDb.insertOne(ticket);
            console.log(addTicket);
            res.json(ticket);
        } catch (err) {
            console.log(err);
            res.status(500).send("Error!")
        } finally {
            // Ensures that the client will close when you finish/error
            await client.close();
        }
    }
    run().catch(console.dir);
});

// A PUT request
app.get('/putform', function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    fs.readFile('./put.html', 'utf8', (err, contents) => {
        if(err) {
            console.log('Form file Read Error', err);
            res.write("<p>Form file Read Error");
        } else {
            console.log('Form loaded\n');
            res.write(contents + "<br>");
        }
        res.end();
    });
});

app.post("/rest/ticket/updateTicket", function(req, res) {
    console.log("yes");
    const client = new MongoClient(uri);

    async function run() {
        try {
            const database = client.db("tickets");
            const ticketDb = database.collection("Ticket Collection");

            const ticketID = req.body.ticketID;
            const created_at = req.body.created_at;
            const updated_at = req.body.updated_at;
            const type = req.body.type;
            const subject = req.body.subject;
            const description = req.body.description;
            const priority = req.body.priority;
            const status = req.body.status;
            const recipient = req.body.recipient;
            const submitter = req.body.submitter;
            const assignee_id = req.body.assignee_id;
            const follower_ids = req.body.follower_ids;
            const tags = req.body.tags;

            //creating the ticket of type JSON
            const ticket = {
                ticketID: ticketID,
                created_at: created_at,
                updated_at: updated_at,
                type: type,
                subject: subject,
                description: description,
                priority: priority,
                status: status,
                recipient: recipient,
                submitter: submitter,
                assignee_id: assignee_id,
                follower_ids: follower_ids,
                tags: tags
            };

            //Here we put the ticketID into the field and then fill out rest of the fields
            //Then findOneAndUpdate searches for that ticketID  and if found -> $set updates the whole ticket
            //if not we throw an error
            const updateTicket = await ticketDb.findOneAndUpdate({ ticketID: ticketID }, { $set: ticket });
            if (!updateTicket) {
                res.status(404).send("Ticket does not exist!");
            } else {
                console.log(updateTicket);
                res.json(ticket);
                res.status(200).send(`Ticket with ticketID: ${ticketID} has been updated!`);
            }
        } catch (err) {
            console.log(err);
            res.status(500).send("Error!")
        } finally {
            // Ensures that the client will close when you finish/error
            await client.close();
        }
    }
    run().catch(console.dir);
});