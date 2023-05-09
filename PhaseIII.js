const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const app = express();
const xml2js = require('xml2js');
const { parseStringPromise } = require('xml2js');
const axios = require('axios');
const PORT = process.env.PORT || 3000;

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

// Middleware to parse request body as JSON
app.use(bodyParser.json());

// Middleware for parsing XML data
app.use(express.text({ type: 'application/xml' }));

// Serve static files from the "public" directory
app.use(express.static('public'));



// Route to serve the HTML form for adding a new ticket
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


// Define a route for retrieving a ticket by id as an XML document
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

// Define PUT - /rest/xml/ticket/:id endpoint
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


// Endpoint to get all tickets
app.get('/rest/list', async (req, res) => {
    const tickets = client.db('Phase-ll').collection('CMPS415');
    const result = await tickets.find().toArray();
    res.send(result);
});
// Define a route for retrieving a ticket by id
app.get('/rest/ticket/:id', async (req, res) => {
    const ticketId = parseFloat(req.params.id); // Parse id as double
    const tickets = client.db('Phase-ll').collection('CMPS415');

    // Use findOne() method to find a document by id
    const ticket = await tickets.findOne({ id: ticketId });

    if (ticket) {
        console.log(`Retrieved ticket with id ${ticketId}`);
        res.send(ticket);
    } else {
        console.log(`Ticket with id ${ticketId} not found`);
        res.status(404).send(`Ticket with id ${ticketId} not found`);
    }
});



// // Define a route for creating a new ticket
app.post('/rest/ticket', async (req, res) => {
    // Confirm that req.body.body is an object
    if (typeof req.body.body === 'object' && !Array.isArray(req.body.body)) {
        const { type, subject, description, priority, status, recipient, submitter, assignee_id, followers_ids } = req.body.body;

        // Check if required fields are present and not null
        if (type && subject && description && priority && status && recipient && submitter && assignee_id && followers_ids) {
        const ticket = {
            id: Date.now(), // Assign a unique id
            created_at: new Date(), // Set created_at field
            updated_at: new Date(), // Set updated_at field
            type, // Set type field
            subject, // Set subject field
            description, // Set description field
            priority, // Set priority field
            status, // Set status field
            recipient, // Set recipient field
            submitter, // Set submitter field
            assignee_id, // Set assignee_id field
            followers_ids, // Set followers_ids field
        };

        // Confirm that ticket is an object
        if (typeof ticket === 'object' && !Array.isArray(ticket)) {
            const tickets = client.db('Phase-ll').collection('CMPS415');
            await tickets.insertOne(ticket);
            console.log(`Created ticket with id ${ticket.id}`);

            // Create a response object with all the fields from the ticket object
            const response = { ...ticket };

            res.send(response);
        } else {
            console.log('Ticket data is not a valid object');
            res.status(400).send('Ticket data is not a valid object');
        }
        } else {
        console.log('Required fields are missing in the request body');
        res.status(400).send('Required fields are missing in the request body');
        }
    } else {
        console.log('Request body is not a valid object');
        res.status(400).send('Request body is not a valid object');
    }
}); 




//Define a route to update a ticket
app.put('/rest/ticket/:id', async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const updatedTicket = req.body;
        delete updatedTicket._id; // Remove _id field from updated ticket data
        const tickets = client.db('Phase-ll').collection('CMPS415');
        const result = await tickets.updateOne({ id: ticketId }, { $set: updatedTicket });
        console.log(`Updated ticket with id ${ticketId}`);
        res.send(result);
    } catch (err) {
        console.error('Failed to update ticket:', err);
        res.status(500).send('Failed to update ticket');
    }
});

// Define a route for deleting a ticket by id
app.delete('/rest/ticket/:id', async (req, res) => {
    const ticketId = parseInt(req.params.id); // Parse id as integer
    const tickets = client.db('Phase-ll').collection('CMPS415');

    // Use deleteOne() method to delete a document by id
    const result = await tickets.deleteOne({ id: ticketId });

    if (result.deletedCount === 1) {
        console.log(`Deleted ticket with id ${ticketId}`);
        res.send(`Deleted ticket with id ${ticketId}`);
    } else {
        console.log(`Ticket with id ${ticketId} not found`);
        res.status(404).send(`Ticket with id ${ticketId} not found`);
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});