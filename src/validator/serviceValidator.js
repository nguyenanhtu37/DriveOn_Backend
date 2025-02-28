export const validateAddService = (serviceData) => {
    const errors = [];
    // Validate name
    if (!serviceData.name) {
      errors.push("Service name is required");
    } else if (typeof serviceData.name !== 'string') {
      errors.push("Service name must be a string");
    }
    // Validate description
    if (!serviceData.description) {
      errors.push("Service description is required");
    } else if (typeof serviceData.description !== 'string') {
      errors.push("Service description must be a string");
    }
    // Validate image
    if (!serviceData.image) {
      errors.push("Service image is required");
    } else if (typeof serviceData.image !== 'string') {
      errors.push("Service image must be a string");
    } else {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlRegex.test(serviceData.image)) {
        errors.push("Service image URL is not valid");
      }
    }
  
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
  };

  export const validateUpdateService = (serviceData) => {
    const errors = [];
      // Validate name
    if (serviceData.name !== undefined) {
      if (typeof serviceData.name !== 'string') {
        errors.push("Service name must be a string");
      }
    }
      // Validate description
    if (serviceData.description !== undefined) {
      if (typeof serviceData.description !== 'string') {
        errors.push("Service description must be a string");
      }
    }
      // Validate image
    if (serviceData.image !== undefined) {
      if (typeof serviceData.image !== 'string') {
        errors.push("Service image must be a string");
      } else {
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        if (!urlRegex.test(serviceData.image)) {
          errors.push("Service image URL is not valid");
        }
      }
    }
  
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
  };