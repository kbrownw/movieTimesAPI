require("dotenv").config();
var express = require("express");
var router = express.Router();
const fetch = require("node-fetch");

const options = {
  method: "GET",
  headers: {
    "X-RapidAPI-Key": process.env.FLIXSTER_API_KEY,
    "X-RapidAPI-Host": "flixster.p.rapidapi.com",
  },
};

//  Move list cache

let theaterListCache = {};

/* GET home page. */

router.get("/", async function (req, res) {
  const zip = req.query.zipCode;
  const currentDate = new Date();

  let url =
    "https://flixster.p.rapidapi.com/theaters/list?zipCode=" +
    zip +
    "&radius=50";

  if (process.env.NODE_ENV === "dev") {
    console.log("Using local data");
    url = "http://localhost:8080/theaters/list/" + zip + ".json";
  }

  if (theaterListCache[zip]) {
    const cachedTime = theaterListCache[zip].date;
    const expireTime = cachedTime.setDate(cachedTime.getDate() + 7);
    const expired = cachedTime.getTime() > expireTime;

    if (!expired) {
      console.log("Using theater list cache.");
      return res.json(theaterListCache[zip].data);
    } else {
      console.log("Deleted stale record " + zip);
      delete theaterListCache[zip];
    }
  }
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    theaterListCache[zip] = {};
    theaterListCache[zip]["date"] = currentDate;
    theaterListCache[zip]["data"] = result;
    console.log("Using API block data.");
    res.json(result);
  } catch (error) {
    console.error(error);
    res.json({ error: "No match found." });
  }
});

router.get("/showtimes", async function (req, res) {
  const theater = req.query.id;
  let url = "https://flixster.p.rapidapi.com/theaters/detail?id=" + theater;
  console.log(theater);

  if (process.env.NODE_ENV === "dev") {
    console.log("Using local data for showtimes.");
    url = "http://localhost:8080/theaters/detail/" + theater + ".json";
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.json({ error: error.message });
  }
});

module.exports = router;
