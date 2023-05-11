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

// Middleware 
// Parse body as Json
app.use(bodyParser.json());
// Parsing XML
app.use(express.text({ type: 'application/xml' }));
// Serve static files from public
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

// POST form page
app.get('/postform', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    fs.readFile('./post.html', 'utf8', (err, contents) => {
        if (err) {
            console.error('Failed to read file:', err);
            res.write("<p>Form file Read Error");
        } else {
            res.send(contents);
        }
    });
});

// POST endpoint
app.post('/rest/ticket/postTicket', async (req, res) => {
    if (typeof req.body.body === 'object' && !Array.isArray(req.body.body)) {
    const {created_at, type, subject, description, priority, status, recipient, submitter, assignee_id, followers_ids } = req.body.body;

        // Check for null fields
        if (created_at && type && subject && description && priority && recipient && submitter && assignee_id && followers_ids) {
            const ticket = {
                id: Date.now(),
                created_at,
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
            if (typeof ticket === 'object' && ticket !== null) {
                // check below
                const ticketDb = client.db('FinalProject').collection('Phase3');
                await ticketDb.insertOne(ticket);
                console.log(`Created ticket ${ticket.id}`);
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

// GET TICKET BY ID AS XML
app.get('/rest/xml/ticket/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        // Call endpoint for ticket info as JSON
        const response = await axios.get(`http://localhost:${PORT}/rest/ticket/${ticketId}`);
        const ticket = response.data;
        const xmlBuilder = new xml2js.Builder();
        const xml = xmlBuilder.buildObject(ticket);
        res.set('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// PUT endpoint
app.put('/rest/xml/ticket/:id', async (req, res) => {
    try {
        const xml = req.body;
        const json = await parseStringPromise(xml, { explicitArray: false });
        const ticketId = req.params.id;
        // Call endpoint for ticket info as JSON
        const response = await axios.put(`http://localhost:3000/rest/ticket/${ticketId}`, json);
        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
}); 

//UPDATE A TICKET
app.put('/rest/ticket/:id', async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const updatedTicket = req.body; 
        delete updatedTicket._id;
        // check below
        const ticketDb = client.db('FinalProject').collection('Phase3');
        const result = await ticketDb.updateOne({ id: ticketId }, { $set: updatedTicket });
        console.log(`Updated ticket ${ticketId}`);
        res.send(result);
    } catch (err) {
        console.error('Failed to update ticket:', err);
        res.status(500).send('Failed to update ticket');
    }
});

// GET ticket by id
app.get('/rest/ticket/:id', async (req, res) => {
    const ticketId = parseFloat(req.params.id); 
    // check below
    const ticketDb = client.db('FinalProject').collection('Phase3');
    const ticket = await ticketDb.findOne({ id: ticketId });
    if (ticket) {
        console.log(`Retrieved ticket with id ${ticketId}`);
        res.send(ticket);
    } else {
        console.log(`Ticket with id ${ticketId} not found`);
        res.status(404).send(`Ticket with id ${ticketId} not found`);
    }
});



// GET ALL TICKETS
app.get('/rest/list', async (req, res) => {
    // check below
    const ticketDb = client.db('FinalProject').collection('Phase3');
    const result = await ticketDb.find().toArray();
    res.send(result);
});

// DELETE A TICKET BY ID
app.delete('/rest/ticket/:id', async (req, res) => {
    const ticketId = parseInt(req.params.id); 
    // check below   
    const ticketDb = client.db('FinalProject').collection('Phase3');
    const result = await ticketDb.deleteOne({ id: ticketId });
    if (result.deletedCount === 1) {
        console.log(`Ticket ${ticketId} deleted`);
        res.send(`Ticket ${ticketId} deleted`);
    } else {
        console.log(`Ticket ${ticketId} not found`);
        res.status(404).send(`Ticket ${ticketId} not found`);
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});