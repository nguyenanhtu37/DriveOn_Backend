const Garage = require('../models/garage');

const createGarage = async (garageData, managerId) => {
    const garage = new Garage({
        ...garageData,
        manager: managerId
    });
    await garage.save();
    return garage;
};

module.exports = { createGarage };