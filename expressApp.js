const express = require("express");

const app = express();
app.use(express.json());

// All student records are stored in an in-memory JavaScript array.
let students = [
    {
        id: 201,
        rollNumber: "CSE2401",
        name: "Aarav Sharma",
        branch: "CSE",
        semester: 3,
        email: "aarav@example.com"
    },
    {
        id: 202,
        rollNumber: "ECE2402",
        name: "Diya Verma",
        branch: "ECE",
        semester: 3,
        email: "diya@example.com"
    },
    {
        id: 203,
        rollNumber: "CSE2403",
        name: "Kabir Singh",
        branch: "CSE",
        semester: 3,
        email: "kabir@example.com"
    }
];

const requiredFields = ["rollNumber", "name", "branch", "semester", "email"];

// Validate the complete student object for POST and PUT.
function validateStudent(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return "Request body must be a JSON object.";
    }

    for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
            return `Missing required field: ${field}`;
        }
    }

    if (typeof data.rollNumber !== "string" || data.rollNumber.trim() === "") {
        return "rollNumber must be a non-empty string.";
    }

    if (typeof data.name !== "string" || data.name.trim() === "") {
        return "name must be a non-empty string.";
    }

    if (typeof data.branch !== "string" || data.branch.trim() === "") {
        return "branch must be a non-empty string.";
    }

    if (typeof data.semester !== "number" ||
        !Number.isInteger(data.semester) ||
        data.semester <= 0) {
        return "semester must be a positive integer.";
    }

    if (typeof data.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        return "email must be a valid email address.";
    }

    return null;
}

// Generate a unique numeric ID for every new student.
function getNextId() {
    if (students.length === 0) {
        return 1;
    }

    return Math.max(...students.map(student => student.id)) + 1;
}

// 1. GET all student records
app.get("/api/students", (req, res) => {
    return res.status(200).json(students);
});

// 6. FILTER students by branch
// Keep this route BEFORE /api/students/:id.
app.get("/api/students/filter", (req, res) => {
    const branch = req.query.branch;

    if (typeof branch !== "string" || branch.trim() === "") {
        return res.status(400).json({
            message: "Please provide a branch query parameter."
        });
    }

    const filteredStudents = students.filter(student =>
        student.branch.toLowerCase() === branch.trim().toLowerCase()
    );

    // Return [] with HTTP 200 when no student matches.
    return res.status(200).json(filteredStudents);
});

// 2. POST a new student record
app.post("/api/students", (req, res) => {
    const error = validateStudent(req.body);

    if (error) {
        return res.status(400).json({ message: error });
    }

    const rollNumberExists = students.some(student =>
        student.rollNumber.toLowerCase() === req.body.rollNumber.trim().toLowerCase()
    );

    if (rollNumberExists) {
        return res.status(400).json({
            message: "A student with this rollNumber already exists."
        });
    }

    const newStudent = {
        id: getNextId(),
        rollNumber: req.body.rollNumber.trim(),
        name: req.body.name.trim(),
        branch: req.body.branch.trim(),
        semester: req.body.semester,
        email: req.body.email.trim()
    };

    students.push(newStudent);

    return res.status(201).json(newStudent);
});

// 3. GET one student by generated numeric ID
app.get("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Student ID must be a positive number." });
    }

    const student = students.find(item => item.id === id);

    if (!student) {
        return res.status(404).json({ message: "Student not found." });
    }

    return res.status(200).json(student);
});

// 4. PUT / update a student record
app.put("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Student ID must be a positive number." });
    }

    const index = students.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Student not found." });
    }

    const error = validateStudent(req.body);

    if (error) {
        return res.status(400).json({ message: error });
    }

    const duplicateRollNumber = students.some(student =>
        student.id !== id &&
        student.rollNumber.toLowerCase() === req.body.rollNumber.trim().toLowerCase()
    );

    if (duplicateRollNumber) {
        return res.status(400).json({
            message: "Another student with this rollNumber already exists."
        });
    }

    students[index] = {
        id: id,
        rollNumber: req.body.rollNumber.trim(),
        name: req.body.name.trim(),
        branch: req.body.branch.trim(),
        semester: req.body.semester,
        email: req.body.email.trim()
    };

    return res.status(200).json(students[index]);
});

// 5. DELETE a student record
app.delete("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Student ID must be a positive number." });
    }

    const index = students.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Student not found." });
    }

    students.splice(index, 1);

    return res.status(200).json({
        message: "Student record deleted successfully."
    });
});

// Handle unknown API routes.
app.use((req, res) => {
    return res.status(404).json({ message: "API endpoint not found." });
});

// Handle invalid JSON and unexpected errors.
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ message: "Invalid JSON request body." });
    }

    return res.status(500).json({ message: "Internal server error." });
});

module.exports = app;
