"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUrgencyLevel = exports.isValidRepairType = exports.isValidBookingStatus = exports.isValidUserRole = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = void 0;
class ValidationError extends Error {
    field;
    code;
    constructor(message, field, code = 'VALIDATION_ERROR') {
        super(message);
        this.field = field;
        this.code = code;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    constructor(resource, id) {
        super(`${resource}${id ? ` with id ${id}` : ''} not found`);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
const isValidUserRole = (role) => {
    return ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'CUSTOMER'].includes(role);
};
exports.isValidUserRole = isValidUserRole;
const isValidBookingStatus = (status) => {
    return ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status);
};
exports.isValidBookingStatus = isValidBookingStatus;
const isValidRepairType = (type) => {
    return [
        'SCREEN_REPAIR', 'BATTERY_REPLACEMENT', 'WATER_DAMAGE', 'SOFTWARE_ISSUE',
        'HARDWARE_REPAIR', 'DATA_RECOVERY', 'SPEAKER_REPAIR', 'CAMERA_REPAIR',
        'CHARGING_PORT', 'BUTTON_REPAIR'
    ].includes(type);
};
exports.isValidRepairType = isValidRepairType;
const isValidUrgencyLevel = (level) => {
    return ['STANDARD', 'URGENT', 'EMERGENCY'].includes(level);
};
exports.isValidUrgencyLevel = isValidUrgencyLevel;
//# sourceMappingURL=shared.js.map