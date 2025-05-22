import express from "express";
import * as searchController from "../controller/searchController.js";
const router = express.Router();

router.get("/", searchController.searchByKeyword);

router.get("/filter", searchController.searchWithFilter);

export default router;
