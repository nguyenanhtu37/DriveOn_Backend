export const validateAddVehicle = (vehicleData) => {
    const errors = [];
    // Validate carBrand
    if (!vehicleData.carBrand) {
      errors.push("Car brand is required");
    }
    // Validate carName
    if (!vehicleData.carName) {
      errors.push("Car name is required");
    } else if (typeof vehicleData.carName !== 'string') {
      errors.push("Car name must be a string");
    }
    // Validate carYear
    if (!vehicleData.carYear) {
      errors.push("Car year is required");
    } else if (typeof vehicleData.carYear !== 'string') {
      errors.push("Car year must be a string");
    }
    // Validate carColor
    if (!vehicleData.carColor) {
      errors.push("Car color is required");
    } else if (typeof vehicleData.carColor !== 'string') {
      errors.push("Car color must be a string");
    }
    // Validate carPlate
    if (!vehicleData.carPlate) {
      errors.push("Car plate is required");
    } else if (typeof vehicleData.carPlate !== 'string') {
      errors.push("Car plate must be a string");
    }
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
    return true;
  };

  export const validateUpdateVehicle = (vehicleData) => {
    const errors = [];
    // Validate carBrand
    if (vehicleData.carBrand !== undefined && !vehicleData.carBrand) {
      errors.push("Car brand is required");
    }
    // Validate carName
    if (vehicleData.carName !== undefined) {
      if (typeof vehicleData.carName !== 'string') {
        errors.push("Car name must be a string");
      }
    }
    // Validate carYear
    if (vehicleData.carYear !== undefined) {
      if (typeof vehicleData.carYear !== 'string') {
        errors.push("Car year must be a string");
      }
    }
    // Validate carColor
    if (vehicleData.carColor !== undefined) {
      if (typeof vehicleData.carColor !== 'string') {
        errors.push("Car color must be a string");
      }
    }
    // Validate carPlate
    if (vehicleData.carPlate !== undefined) {
      if (typeof vehicleData.carPlate !== 'string') {
        errors.push("Car plate must be a string");
      }
    }
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
    return true;
  };