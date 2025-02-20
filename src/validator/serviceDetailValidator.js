export const validateAddServiceDetail = (serviceDetailData) => {
    const errors = [];
  
    // Validate service
    if (!serviceDetailData.service) {
      errors.push("Service is required");
    } else if (!serviceDetailData.service.match(/^[0-9a-fA-F]{24}$/)) {
      errors.push("Service ID is not valid");
    }
  
    // Validate garage
    if (!serviceDetailData.garage) {
      errors.push("Garage is required");
    } else if (!serviceDetailData.garage.match(/^[0-9a-fA-F]{24}$/)) {
      errors.push("Garage ID is not valid");
    }
  
    // Validate name
    if (!serviceDetailData.name) {
      errors.push("Service detail name is required");
    } else if (typeof serviceDetailData.name !== 'string') {
      errors.push("Service detail name must be a string");
    }
  
    // Validate description
    if (!serviceDetailData.description) {
      errors.push("Service detail description is required");
    } else if (typeof serviceDetailData.description !== 'string') {
      errors.push("Service detail description must be a string");
    }
  
    // Validate images
    if (!Array.isArray(serviceDetailData.images)) {
      errors.push("Service detail images must be an array");
    } else {
      serviceDetailData.images.forEach((image) => {
        if (typeof image !== 'string') {
          errors.push("Each image URL must be a string");
        }
      });
    }
  
    // Validate price
    if (serviceDetailData.price !== undefined && typeof serviceDetailData.price !== 'number') {
      errors.push("Service detail price must be a number");
    }
  
    // Validate duration
    if (serviceDetailData.duration !== undefined && typeof serviceDetailData.duration !== 'string') {
      errors.push("Service detail duration must be a string");
    }
  
    // Validate warranty
    if (serviceDetailData.warranty !== undefined && typeof serviceDetailData.warranty !== 'string') {
      errors.push("Service detail warranty must be a string");
    }
  
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
  };

export const validateUpdateServiceDetail = (serviceDetailData) => {
    const errors = [];
  
    // Validate name
    if (serviceDetailData.name !== undefined) {
      if (typeof serviceDetailData.name !== 'string') {
        errors.push("Service detail name must be a string");
      }
    }
  
    // Validate description
    if (serviceDetailData.description !== undefined) {
      if (typeof serviceDetailData.description !== 'string') {
        errors.push("Service detail description must be a string");
      }
    }
  
    // Validate images
    if (serviceDetailData.images !== undefined) {
      if (!Array.isArray(serviceDetailData.images)) {
        errors.push("Service detail images must be an array");
      } else {
        serviceDetailData.images.forEach((image) => {
          if (typeof image !== 'string') {
            errors.push("Each image URL must be a string");
          }
        });
      }
    }
  
    // Validate price
    if (serviceDetailData.price !== undefined && typeof serviceDetailData.price !== 'number') {
      errors.push("Service detail price must be a number");
    }
  
    // Validate duration
    if (serviceDetailData.duration !== undefined && typeof serviceDetailData.duration !== 'string') {
      errors.push("Service detail duration must be a string");
    }
  
    // Validate warranty
    if (serviceDetailData.warranty !== undefined && typeof serviceDetailData.warranty !== 'string') {
      errors.push("Service detail warranty must be a string");
    }
  
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
  };