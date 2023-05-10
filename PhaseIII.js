const MongoClient = require('mongodb').MongoClient;

// Connection to the mongodb
const uri = "mongodb+srv://robert_herbert:Passw0rd123@cluster0.c9mxcr3.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
async function connect() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error(err);
    }
}
connect();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
var fs = require("fs");
const xml2js = require('xml2js');
const { parseStringPromise } = require('xml2js');
const axios = require('axios');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(express.text({ type: 'application/xml' }));
app.use(express.static('public'));

//Open the Menu
app.get('/', function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    fs.readFile('./menu.html', 'utf8', (err, contents) => {
        if(err) {
                console.log('Form file Read Error', err);
                res.write("<p>Form file Read Error");
        } else {
                console.log('Form loaded\n');
                res.write(contents + "<br>");
        }
        res.end;
    });
});

// GET TICKET BY ID AS XML
app.get('/rest/xml/ticket/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;

        // Call the existing /rest/ticket/id endpoint to get ticket information as JSON
        const response = await axios.get(`http://localhost:${PORT}/rest/ticket/${ticketId}`);
        const ticket = response.data;

        // Convert ticket information from JSON to XML
        const xmlBuilder = new xml2js.Builder();
        const xml = xmlBuilder.buildObject(ticket);

        // Set response header to indicate XML content
        res.set('Content-Type', 'application/xml');

        // Send the XML document as response
        res.send(xml);
    } catch (error) {
        // Handle errors
        res.status(500).send('Internal Server Error');
    }
});

// DELETE A TICKET BY ID
app.delete('/rest/ticket/:id', async (req, res) => {
    const ticketId = parseInt(req.params.id); 
    const tickets = database.collection("Ticket Collection");

    // Delete by id
    const result = await tickets.deleteSingle({ id: ticketId });

    if (result.deletedCount === 1) {
        console.log(`Deleted ticket ${ticketId}`);
        res.send(`Deleted ticket ${ticketId}`);
    } else {
        console.log(`Ticket with id ${ticketId} not found`);
        res.status(404).send(`Ticket with id ${ticketId} not found`);
    }
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

app.put('/rest/xml/ticket/:id', async (req, res) => {
    try {
        const xml = req.body;
        const json = await parseStringPromise(xml, { explicitArray: false });
        const ticketId = req.params.id;

        // Make request to /rest/ticket/:id endpoint with ticket information in JSON format
        const response = await axios.put(`http://localhost:3000/rest/ticket/${ticketId}`, json);

        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// GET ALL TICKETS
app.get('/rest/list', async (req, res) => {
    const client = new MongoClient(uri);

    const database = client.db("tickets");
    const ticketDb = database.collection('Ticket Collection');
    const query = {}; //this means that all tickets are selected
    const tickets = await ticketDb.find(query).toArray();
    res.send(tickets);
});
// Define a route for retrieving a ticket by id
app.get('/rest/ticket/:id', async (req, res) => {
    const ticketId = parseFloat(req.params.id); // Parse id as double
    const tickets = database.collection('Ticket Collection');

    // find by id
    const ticket = await tickets.singleTicket({ id: ticketId });

    if (ticket) {
        console.log(`Retrieved ticket with id ${ticketId}`);
        res.send(ticket);
    } else {
        console.log(`Ticket ${ticketId} does not exist`);
        res.status(404).send(`Ticket ${ticketId} not found`);
    }
});

// A POST request
app.get('/postform', (req, res) => {
    fs.readFile('./post.html', 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read file:', err);
            res.status(500).send('Failed to read file');
        } else {
            res.send(data);
        }
    });
});

app.post('/rest/ticket', async (req, res) => {
    if (typeof req.body.body === 'object' && !Array.isArray(req.body.body)) {
        const { type, subject, description, priority, status, recipient, submitter, assignee_id, followers_ids } = req.body.body;

        // Check for null fields
        if (type && subject && description && priority && status && recipient && submitter && assignee_id && followers_ids) {
            const ticket = {
            id: Date.now(), 
            created_at: new Date(), 
            updated_at: new Date(), 
            type,
            subject, 
            description, 
            priority, 
            status, 
            recipient,
            submitter, 
            assignee_id, 
            followers_ids, 
        };

            // Check that the ticket is an object
            if (typeof ticket === 'object' && !Array.isArray(ticket)) {
                const tickets = database.collection("Ticket Collection");
                await tickets.insertOne(ticket);
                console.log(`Created ticket with id ${ticket.id}`);

                // Create a response object with ticket object fields
                const response = { ...ticket };

                res.send(response);
            } else {
                console.log('Ticket data is not a valid object');
                res.status(400).send('Ticket data is not a valid object');
            }
        } else {
        console.log('Required fields are missing');
        res.status(400).send('Required fields are missing');
        }
    } else {
        console.log('Request body is not a valid object');
        res.status(400).send('Request body is not a valid object');
    }
}); 

//UPDATE A TICKET
app.put('/rest/ticket/:id', async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const updatedTicket = req.body;
        delete updatedTicket._id;
        const tickets = database.collection("Ticket Collection");
        const result = await tickets.updateOne({ id: ticketId }, { $set: updatedTicket });
        console.log(`Updated ticket with id ${ticketId}`);
        res.send(result);
    } catch (err) {
        console.error('Failed to update ticket:', err);
        res.status(500).send('Failed to update ticket');
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});