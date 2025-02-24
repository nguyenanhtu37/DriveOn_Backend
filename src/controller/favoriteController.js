import * as favoriteService from '../service/favoriteService.js';
import Garage from '../models/garage.js';
import Favorite
    from "../models/favorite.js";

export const addFavoriteGarage = async (req, res) => {
    try {
        const { garageId } = req.params;
        const userId = req.user.id;

        // Thêm garage vào danh sách yêu thích
        await favoriteService.addFavoriteGarage(userId, garageId);

        // Lấy thông tin garage để hiển thị tên
        const garage = await Garage.findById(garageId).select("name");

        res.status(201).json({
            message: `Favorite garage ${garage.name} added successfully!`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const viewFavoriteGarages = async (req, res) => {
    try {
        const userId = req.user.id;
        const favoriteGarages = await favoriteService.getFavoriteGarages(userId);
        res.status(200).json(favoriteGarages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
export const removeFavoriteGarage = async (req, res) => {
    try {
        const { garageId } = req.params;
        const userId = req.user.id;

        // Check if the favorite garage exists
        const favorite = await Favorite.findOne({ user: userId, garage: garageId });
        if (!favorite) {
            return res.status(404).json({ message: "Favorite garage not found!" });
        }

        // Remove the favorite garage
        await favoriteService.removeFavoriteGarage(userId, garageId);
        res.status(200).json({ message: "Favorite garage removed successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};