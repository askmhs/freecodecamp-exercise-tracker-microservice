const mongoose = require("mongoose");
const express = require("express");
const strftime = require("strftime");
const moment = require("moment");

const app = express();

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    }
});

const exerciseSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

const User = mongoose.model("users", userSchema);
const Exercise = mongoose.model("exercises", exerciseSchema);

app.post("/", async (req, res) => {
    const result = await User.create({ username: req.body.username });
    res.json(result);
});

app.get("/", async (req, res) => {
    const result = await User.find();
    res.json(result);
});

app.post("/:id/exercises", async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
        res.status(500).json("Invalid user!");
    }

    const exercise = await Exercise.create({ user: id, ...req.body });
    res.json({
        _id: user._id,
        username: user.username,
        date: moment(exercise.date).format('ddd MMM DD YYYY'),
        duration: Number(req.body.duration),
        description: req.body.description
    });
});

app.get("/:id/logs", async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);

    console.log(req.originalUrl, req.params.id)

    if (!user) {
        res.status(500).json("Invalid user!");
    }

    let { from, to, limit } = req.query;
    from = moment(from, 'YYYY-MM-DD').isValid() ? moment(from, 'YYYY-MM-DD') : 0;
    to = moment(to, 'YYYY-MM-DD').isValid() ? moment(to, 'YYYY-MM-DD') : moment().add(1000000000000);

    const exercises = await Exercise.find({ user: id })
        .where('date')
        .gte(from)
        .lte(to)
        .limit(+limit)
        .select("description date duration -_id");

    res.json({
        _id: user._id,
        username: user.username,
        count: exercises.length,
        log: exercises.map(o => ({
            description: o.description,
            duration: o.duration,
            date: moment(o.date).format('ddd MMM DD YYYY')
        }))
    });
});

module.exports = app;