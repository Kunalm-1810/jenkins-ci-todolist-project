const Task = require("../models/task");
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const task = await new Task(req.body).save();
        res.send(task);
    } catch (error) {
        console.error("GET /tasks error:", error);
        res.status(500).send({ message: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const tasks = await Task.find();
        res.send(tasks);
    } catch (error) {
        console.error("GET /tasks error:", error);
        res.status(500).send({ message: error.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id },
            req.body
        );
        res.send(task);
    } catch (error) {
        console.error("GET /tasks error:", error);
        res.status(500).send({ message: error.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        res.send(task);
    } catch (error) {
        console.error("GET /tasks error:", error);
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;
