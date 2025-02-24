import Favorite from '../models/favorite.js';

export const addFavoriteGarage = async (userId, garageId) => {
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
export const getFavoriteGarages = async (userId) => {
    try {
        const favorites = await Favorite.find({ user: userId }).populate('garage', 'name address phone');
        return favorites.map(favorite => favorite.garage);
    } catch (err) {
        throw new Error(err.message);
    }
};

