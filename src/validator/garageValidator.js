export const validateGarageRegistration = (garageData) => {
    const errors = [];
    // Validate required fields
    const requiredFields = ['name', 'address', 'phone', 'email', 'openTime', 'closeTime', 'operating_days'];
    for (const field of requiredFields) {
        if (!garageData[field]) {
            errors.push(`${field} is required`);
        }
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (garageData.email && !emailRegex.test(garageData.email)) {
        errors.push('Invalid email format');
    }
    // Validate phone number (10-11 digits)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (garageData.phone && !phoneRegex.test(garageData.phone)) {
        errors.push('Phone number must be 10-11 digits');
    }
    // Validate operating days format
    if (garageData.operating_days && !Array.isArray(garageData.operating_days)) {
        errors.push('operating_days must be an array');
    }
    // Validate time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (garageData.openTime && !timeRegex.test(garageData.openTime)) {
        errors.push('Open time format should be HH:mm');
    }
    if (garageData.closeTime && !timeRegex.test(garageData.closeTime)) {
        errors.push('Close time format should be HH:mm');
    }
    // Validate images arrays
    const imageArrays = ['facadeImages', 'interiorImages', 'documentImages'];
    for (const imageField of imageArrays) {
        if (garageData[imageField] && !Array.isArray(garageData[imageField])) {
            errors.push(`${imageField} must be an array`);
        }
    }
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
};