import Favorite from '../models/favorite.js';

const addFavoriteGarage = async (userId, garageId) => {
    try {
        const newFavorite = new Favorite({
            user: userId,
            garage: garageId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await newFavorite.save();
        return newFavorite;
    } catch (err) {
        throw new Error(err.message);
    }
};

export { addFavoriteGarage };