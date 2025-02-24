import * as favoriteService from '../service/favoriteService.js';
import Garage from '../models/garage.js';

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
